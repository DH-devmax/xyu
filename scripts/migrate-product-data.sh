#!/usr/bin/env bash
set -Eeuo pipefail

# migrate-product-data.sh 在停止旧服务后复制用户数据，并留下可执行的回滚记录。

usage() {
  cat >&2 <<'USAGE'
用法：migrate-product-data.sh --source DIR --destination DIR [--rollback-dir DIR] [--record FILE]
USAGE
}

SOURCE=""
DESTINATION=""
ROLLBACK_DIR=""
RECORD_FILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --source) SOURCE="$2"; shift 2 ;;
    --destination) DESTINATION="$2"; shift 2 ;;
    --rollback-dir) ROLLBACK_DIR="$2"; shift 2 ;;
    --record) RECORD_FILE="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "未知参数：$1" >&2; usage; exit 2 ;;
  esac
done

if [[ -z "$SOURCE" || -z "$DESTINATION" ]]; then
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

SOURCE="$(CDPATH= cd -- "$SOURCE" && pwd -P)"
DEST_PARENT="$(dirname -- "$DESTINATION")"
mkdir -p "$DEST_PARENT"
DESTINATION="$(CDPATH= cd -- "$DEST_PARENT" && pwd -P)/$(basename -- "$DESTINATION")"
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
    relative="$(printf '%s\n' "$file" | sed "s#^$root/##")"
    digest="$(hash_file "$file")"
    printf '%s  %s\n' "$digest" "$relative" >> "$digest_input"
  done < <(find "$root" -type f -print | LC_ALL=C sort)
  hash_file "$digest_input"
  rm -f "$digest_input"
}

verify_sqlite() {
  local database="$1"
  if [[ ! -f "$database" ]]; then
    printf 'not_present'
    return 0
  fi
  if ! command -v sqlite3 >/dev/null 2>&1; then
    printf 'deferred_to_server'
    return 0
  fi
  if [[ "$(sqlite3 "$database" 'PRAGMA integrity_check;' | tr -d '\r')" != "ok" ]]; then
    echo "SQLite 数据库完整性校验失败：$database" >&2
    return 1
  fi
  printf 'ok'
}

SOURCE_HASH="$(hash_tree "$SOURCE")"
STAGING="$(printf '%s.staging-%s' "$DESTINATION" "$$")"
mkdir -p "$ROLLBACK_DIR"
cleanup_on_error() {
  local exit_code=$?
  if [[ "$exit_code" -ne 0 ]]; then
    rm -rf "$STAGING"
    echo "数据迁移失败，未切换目标目录；旧数据保持原状：$SOURCE" >&2
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

DATABASE_CHECK="$(verify_sqlite "$STAGING/data/xianyu_data.db")"
mv "$STAGING" "$DESTINATION"
DESTINATION_HASH="$(hash_tree "$DESTINATION")"
if [[ "$SOURCE_HASH" != "$DESTINATION_HASH" ]]; then
  echo "切换后哈希不一致：source=$SOURCE_HASH destination=$DESTINATION_HASH" >&2
  exit 1
fi

# 旧目录作为回滚证据保留，但不再允许新服务写入，避免两个版本分叉。
find "$SOURCE" -type f -exec chmod a-w {} +
find "$SOURCE" -type d -exec chmod a-w {} +

ROLLBACK_SCRIPT="$ROLLBACK_DIR/rollback.sh"
cat > "$ROLLBACK_SCRIPT" <<EOF
#!/usr/bin/env bash
set -Eeuo pipefail
SOURCE='$SOURCE'
DESTINATION='$DESTINATION'
if [[ ! -d "\$SOURCE" || ! -d "\$DESTINATION" ]]; then
  echo "回滚目录不存在：source=\$SOURCE destination=\$DESTINATION" >&2
  exit 1
fi
hash_tree() {
  local root="\$1" file relative digest input
  input="\$(mktemp)"
  while IFS= read -r file; do
    relative="\$(printf '%s\n' "\$file" | sed "s#^\$root/##")"
    if command -v sha256sum >/dev/null 2>&1; then digest="\$(sha256sum "\$file" | awk '{print \$1}')"; else digest="\$(shasum -a 256 "\$file" | awk '{print \$1}')"; fi
    printf '%s  %s\n' "\$digest" "\$relative" >> "\$input"
  done < <(find "\$root" -type f -print | LC_ALL=C sort)
  if command -v sha256sum >/dev/null 2>&1; then sha256sum "\$input" | awk '{print \$1}'; else shasum -a 256 "\$input" | awk '{print \$1}'; fi
  rm -f "\$input"
}
before="\$(hash_tree "\$SOURCE")"
chmod -R u+w "\$SOURCE"
backup="\$(printf '%s.v2-before-rollback-%s' "\$DESTINATION" "\$(date -u +%Y%m%dT%H%M%SZ)")"
mv "\$DESTINATION" "\$backup"
mkdir -p "\$DESTINATION"
cp -a "\$SOURCE/." "\$DESTINATION/"
after="\$(hash_tree "\$DESTINATION")"
[[ "\$before" == "\$after" ]]
printf 'rollback_status=ok\nbackup=%s\nsource_hash=%s\ndestination_hash=%s\n' "\$backup" "\$before" "\$after"
EOF
chmod 0700 "$ROLLBACK_SCRIPT"

cat > "$RECORD_FILE" <<EOF
status=ok
source=$SOURCE
destination=$DESTINATION
source_hash=$SOURCE_HASH
staging_hash=$STAGING_HASH
destination_hash=$DESTINATION_HASH
database_integrity=$DATABASE_CHECK
legacy_readonly=true
rollback_script=$ROLLBACK_SCRIPT
completed_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)
EOF
chmod 0600 "$RECORD_FILE"

trap - EXIT
echo "数据迁移完成：$SOURCE -> $DESTINATION"
echo "回滚脚本：$ROLLBACK_SCRIPT"
echo "校验记录：$RECORD_FILE"
