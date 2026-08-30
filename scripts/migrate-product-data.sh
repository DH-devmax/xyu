#!/usr/bin/env bash
set -Eeuo pipefail

# migrate-product-data.sh 在停止旧服务后复制用户数据，并留下可执行的回滚记录。

usage() {
  cat >&2 <<'USAGE'
用法：migrate-product-data.sh --source DIR --destination DIR --validator FILE [--environment-file FILE] [--rollback-dir DIR] [--record FILE]
USAGE
}

SOURCE=""
DESTINATION=""
VALIDATOR=""
ENVIRONMENT_FILE=""
ROLLBACK_DIR=""
RECORD_FILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --source) SOURCE="$2"; shift 2 ;;
    --destination) DESTINATION="$2"; shift 2 ;;
    --validator) VALIDATOR="$2"; shift 2 ;;
    --environment-file) ENVIRONMENT_FILE="$2"; shift 2 ;;
    --rollback-dir) ROLLBACK_DIR="$2"; shift 2 ;;
    --record) RECORD_FILE="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "未知参数：$1" >&2; usage; exit 2 ;;
  esac
done

if [[ -z "$SOURCE" || -z "$DESTINATION" || -z "$VALIDATOR" ]]; then
  usage
  exit 2
fi
if [[ ! -d "$SOURCE" ]]; then
  echo "迁移源目录不存在：$SOURCE" >&2
  exit 1
fi
if [[ -e "$DESTINATION" ]]; then
  echo "迁移目标已存在，为避免覆盖数据而停止：$DESTINATION" >&2
  exit 1
fi
if [[ ! -x "$VALIDATOR" ]]; then
  echo "数据验证器不存在或不可执行：$VALIDATOR" >&2
  exit 1
fi
if [[ -n "$ENVIRONMENT_FILE" && ! -r "$ENVIRONMENT_FILE" ]]; then
  echo "旧版环境文件不可读：$ENVIRONMENT_FILE" >&2
  exit 1
fi

SOURCE="$(CDPATH= cd -- "$SOURCE" && pwd -P)"
DEST_PARENT="$(dirname -- "$DESTINATION")"
mkdir -p "$DEST_PARENT"
DESTINATION="$(CDPATH= cd -- "$DEST_PARENT" && pwd -P)/$(basename -- "$DESTINATION")"
VALIDATOR="$(CDPATH= cd -- "$(dirname -- "$VALIDATOR")" && pwd -P)/$(basename -- "$VALIDATOR")"
if [[ -n "$ENVIRONMENT_FILE" ]]; then
  ENVIRONMENT_FILE="$(CDPATH= cd -- "$(dirname -- "$ENVIRONMENT_FILE")" && pwd -P)/$(basename -- "$ENVIRONMENT_FILE")"
fi
if [[ "$SOURCE" == "$DESTINATION" ]]; then
  echo "迁移源和目标不能相同" >&2
  exit 1
fi

if [[ -z "$ROLLBACK_DIR" ]]; then
  ROLLBACK_DIR="$(printf '%s.rollback-%s' "$DESTINATION" "$(date -u +%Y%m%dT%H%M%SZ)")"
fi
if [[ -z "$RECORD_FILE" ]]; then
  RECORD_FILE="$ROLLBACK_DIR/migration.env"
fi
mkdir -p "$ROLLBACK_DIR" "$(dirname -- "$RECORD_FILE")"

hash_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  else
    shasum -a 256 "$1" | awk '{print $1}'
  fi
}

hash_tree() {
  local root="$1"
  local file relative digest
  local digest_input
  digest_input="$(mktemp)"
  while IFS= read -r file; do
    relative="${file#"$root"/}"
    digest="$(hash_file "$file")"
    printf '%s  %s\n' "$digest" "$relative" >> "$digest_input"
  done < <(find "$root" -type f -print | LC_ALL=C sort)
  hash_file "$digest_input"
  rm -f "$digest_input"
}

read_environment_value() {
  local variable_name="$1"
  local environment_file="$2"
  local line value
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    line="${line#"${line%%[![:space:]]*}"}"
    if [[ -z "$line" || "$line" == \#* || "$line" != "$variable_name="* ]]; then
      continue
    fi
    value="${line#*=}"
    if [[ ${#value} -ge 2 && ( ( "${value:0:1}" == '"' && "${value: -1}" == '"' ) || ( "${value:0:1}" == "'" && "${value: -1}" == "'" ) ) ]]; then
      value="${value:1:${#value}-2}"
    fi
    printf '%s' "$value"
    return 0
  done < "$environment_file"
  return 1
}

run_database_verification() {
  local staging_root="$1"
  local database="$staging_root/data/xianyu_data.db"
  local verification_root data_key
  if [[ ! -f "$database" ]]; then
    printf 'not_present'
    return 0
  fi
  verification_root="$(mktemp -d "$ROLLBACK_DIR/.data-verification.XXXXXX")"
  cp -a "$staging_root/." "$verification_root/"
  data_key=""
  if [[ -n "$ENVIRONMENT_FILE" ]]; then
    data_key="$(read_environment_value 'DH_XIANYU_AGENTPANEL_DATA_KEY' "$ENVIRONMENT_FILE" || true)"
    if [[ -z "$data_key" ]]; then
      data_key="$(read_environment_value 'XIANYU_DATA_KEY' "$ENVIRONMENT_FILE" || true)"
    fi
  fi
  if (
    unset DATABASE_URL XIANYU_DATA_KEY DH_XIANYU_AGENTPANEL_DATA_KEY XIANYU_LOG_DIR DH_XIANYU_AGENTPANEL_LOG_DIR
    if [[ -n "$data_key" ]]; then
      export XIANYU_DATA_KEY="$data_key"
    fi
    "$VALIDATOR" \
      -verify-data \
      -workdir "$verification_root" \
      -db "$verification_root/data/xianyu_data.db" \
      -data-key-file "$verification_root/data-key"
  ) >&2; then
    :
  else
    local validator_status=$?
    rm -rf "$verification_root"
    return "$validator_status"
  fi
  rm -rf "$verification_root"
  printf 'ok'
}

SOURCE_HASH="$(hash_tree "$SOURCE")"
STAGING="$(printf '%s.staging-%s' "$DESTINATION" "$$")"
DESTINATION_CREATED=0
SOURCE_READONLY=0
cleanup_on_error() {
  local exit_code=$?
  if [[ "$exit_code" -ne 0 ]]; then
    rm -rf "$STAGING"
    find "$ROLLBACK_DIR" -maxdepth 1 -type d -name '.data-verification.*' -exec rm -rf {} + 2>/dev/null || true
    if [[ "$DESTINATION_CREATED" -eq 1 ]]; then
      rm -rf "$DESTINATION"
    fi
    if [[ "$SOURCE_READONLY" -eq 1 ]]; then
      chmod -R u+w "$SOURCE" 2>/dev/null || true
    fi
    echo "数据迁移失败，未保留新目标目录；旧数据保持可用：$SOURCE" >&2
  fi
  exit "$exit_code"
}
trap cleanup_on_error EXIT

mkdir -p "$STAGING"
cp -a "$SOURCE/." "$STAGING/"
STAGING_HASH="$(hash_tree "$STAGING")"
if [[ "$SOURCE_HASH" != "$STAGING_HASH" ]]; then
  echo "复制后哈希不一致：source=$SOURCE_HASH staging=$STAGING_HASH" >&2
  exit 1
fi

DATABASE_DECRYPTION=""
if ! DATABASE_DECRYPTION="$(run_database_verification "$STAGING")"; then
  echo "数据库迁移、完整性或解密验证失败" >&2
  exit 1
fi
if [[ "$DATABASE_DECRYPTION" != "ok" && "$DATABASE_DECRYPTION" != "not_present" ]]; then
  echo "数据库解密验证未返回成功状态：$DATABASE_DECRYPTION" >&2
  exit 1
fi
DATABASE_CHECK="$DATABASE_DECRYPTION"

mv "$STAGING" "$DESTINATION"
DESTINATION_CREATED=1
DESTINATION_HASH="$(hash_tree "$DESTINATION")"
if [[ "$SOURCE_HASH" != "$DESTINATION_HASH" ]]; then
  echo "切换后哈希不一致：source=$SOURCE_HASH destination=$DESTINATION_HASH" >&2
  exit 1
fi

ROLLBACK_SCRIPT="$ROLLBACK_DIR/rollback.sh"
printf -v QUOTED_SOURCE '%q' "$SOURCE"
printf -v QUOTED_DESTINATION '%q' "$DESTINATION"
printf -v QUOTED_EXPECTED_HASH '%q' "$SOURCE_HASH"
cat > "$ROLLBACK_SCRIPT" <<EOF
#!/usr/bin/env bash
set -Eeuo pipefail
SOURCE=$QUOTED_SOURCE
DESTINATION=$QUOTED_DESTINATION
EXPECTED_SOURCE_HASH=$QUOTED_EXPECTED_HASH
hash_tree() {
  local root="\$1" file relative digest input
  input="\$(mktemp)"
  while IFS= read -r file; do
    relative="\${file#"\$root"/}"
    if command -v sha256sum >/dev/null 2>&1; then digest="\$(sha256sum "\$file" | awk '{print \$1}')"; else digest="\$(shasum -a 256 "\$file" | awk '{print \$1}')"; fi
    printf '%s  %s\n' "\$digest" "\$relative" >> "\$input"
  done < <(find "\$root" -type f -print | LC_ALL=C sort)
  if command -v sha256sum >/dev/null 2>&1; then sha256sum "\$input" | awk '{print \$1}'; else shasum -a 256 "\$input" | awk '{print \$1}'; fi
  rm -f "\$input"
}
if [[ ! -d "\$SOURCE" || ! -d "\$DESTINATION" ]]; then
  echo "回滚目录不存在：source=\$SOURCE destination=\$DESTINATION" >&2
  exit 1
fi
before="\$(hash_tree "\$SOURCE")"
if [[ "\$before" != "\$EXPECTED_SOURCE_HASH" ]]; then
  echo "旧版只读副本已漂移：expected=\$EXPECTED_SOURCE_HASH actual=\$before" >&2
  exit 1
fi
chmod -R u+w "\$SOURCE"
backup="\$(printf '%s.v2-before-rollback-%s' "\$DESTINATION" "\$(date -u +%Y%m%dT%H%M%SZ)")"
destination_moved=0
rollback_cleanup() {
  local exit_code=\$?
  if [[ "\$exit_code" -ne 0 && "\$destination_moved" -eq 1 ]]; then
    rm -rf "\$DESTINATION"
    mv "\$backup" "\$DESTINATION"
  fi
  exit "\$exit_code"
}
trap rollback_cleanup EXIT
mv "\$DESTINATION" "\$backup"
destination_moved=1
mkdir -p "\$DESTINATION"
cp -a "\$SOURCE/." "\$DESTINATION/"
after="\$(hash_tree "\$DESTINATION")"
if [[ "\$before" != "\$after" ]]; then
  echo "回滚后哈希不一致：source=\$before destination=\$after" >&2
  exit 1
fi
trap - EXIT
printf 'rollback_status=ok\nbackup=%s\nsource_hash=%s\ndestination_hash=%s\n' "\$backup" "\$before" "\$after"
EOF
chmod 0700 "$ROLLBACK_SCRIPT"

# 旧目录作为回滚证据保留，但不再允许新服务写入，避免两个版本分叉。
find "$SOURCE" -type f -exec chmod a-w {} +
find "$SOURCE" -type d -exec chmod a-w {} +
SOURCE_READONLY=1

cat > "$RECORD_FILE" <<EOF
status=ok
source=$SOURCE
destination=$DESTINATION
source_hash=$SOURCE_HASH
staging_hash=$STAGING_HASH
destination_hash=$DESTINATION_HASH
database_integrity=$DATABASE_CHECK
database_decryption=$DATABASE_DECRYPTION
legacy_readonly=true
validator=$VALIDATOR
rollback_script=$ROLLBACK_SCRIPT
completed_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)
EOF
chmod 0600 "$RECORD_FILE"

trap - EXIT
echo "数据迁移完成：$SOURCE -> $DESTINATION"
echo "回滚脚本：$ROLLBACK_SCRIPT"
echo "校验记录：$RECORD_FILE"
