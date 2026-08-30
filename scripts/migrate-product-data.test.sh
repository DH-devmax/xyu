#!/usr/bin/env bash
set -Eeuo pipefail

# migrate-product-data.test.sh 使用临时加密 SQLite 数据验证复制、解密、失败原子性、只读保留和回滚。
REPO_ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd -P)"
ROOT="$(mktemp -d)"
trap 'chmod -R u+w "$ROOT" 2>/dev/null || true; rm -rf "$ROOT"' EXIT
SOURCE="$ROOT/legacy data"
BAD_SOURCE="$ROOT/legacy wrong key"
BAD_DESTINATION="$ROOT/rejected destination"
DESTINATION="$ROOT/current data"
ROLLBACK_DIR="$ROOT/rollback evidence"
VALIDATOR="${MIGRATION_VALIDATOR:-$ROOT/xianyu-server}"
DATA_KEY="brand-migration-fixture-key"
mkdir -p "$SOURCE/data" "$SOURCE/uploads"

if [[ -z "${MIGRATION_VALIDATOR:-}" ]]; then
  go build -o "$VALIDATOR" "$REPO_ROOT/cmd/server"
fi
printf '%s\n' "$DATA_KEY" > "$SOURCE/data-key"
(
  unset DATABASE_URL XIANYU_DATA_KEY DH_XIANYU_AGENTPANEL_DATA_KEY XIANYU_LOG_DIR DH_XIANYU_AGENTPANEL_LOG_DIR
  "$VALIDATOR" \
    -verify-data \
    -workdir "$SOURCE" \
    -db "$SOURCE/data/xianyu_data.db" \
    -data-key-file "$SOURCE/data-key" >/dev/null
)

# encrypted_value 使用固定测试密钥、nonce 和正式 AAD 生成，不把伪明文当作解密成功证据。
encrypted_value="$(node -e '
  const crypto = require("node:crypto");
  const key = crypto.createHash("sha256").update(process.argv[1]).digest();
  const nonce = Buffer.alloc(12, 7);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, nonce);
  cipher.setAAD(Buffer.from("system-setting\0ai_api_key"));
  const ciphertext = Buffer.concat([cipher.update("fixture-secret"), cipher.final()]);
  const sealed = Buffer.concat([nonce, ciphertext, cipher.getAuthTag()]);
  process.stdout.write("enc:v1:" + sealed.toString("base64").replace(/=+$/, ""));
' "$DATA_KEY")"
sqlite3 "$SOURCE/data/xianyu_data.db" "UPDATE system_settings SET value='$encrypted_value' WHERE key='ai_api_key';"
printf 'fixture\n' > "$SOURCE/uploads/example.txt"
printf 'legacy\n' > "$SOURCE/settings.env"

# 错误密钥必须在切换前失败，且不能留下目标目录。
cp -a "$SOURCE" "$BAD_SOURCE"
printf 'wrong-brand-migration-key\n' > "$BAD_SOURCE/data-key"
if "$REPO_ROOT/scripts/migrate-product-data.sh" \
  --source "$BAD_SOURCE" \
  --destination "$BAD_DESTINATION" \
  --validator "$VALIDATOR" \
  --rollback-dir "$ROOT/rejected rollback" >"$ROOT/rejected.out" 2>&1; then
  echo '错误密钥迁移不应成功' >&2
  exit 1
fi
test ! -e "$BAD_DESTINATION"
test -w "$BAD_SOURCE/settings.env"
grep -q '敏感字段解密失败' "$ROOT/rejected.out"

"$REPO_ROOT/scripts/migrate-product-data.sh" \
  --source "$SOURCE" \
  --destination "$DESTINATION" \
  --validator "$VALIDATOR" \
  --rollback-dir "$ROLLBACK_DIR"

test -f "$DESTINATION/data/xianyu_data.db"
test "$(sqlite3 "$DESTINATION/data/xianyu_data.db" 'PRAGMA integrity_check;')" = ok
test "$(awk -F= '$1 == "status" {print $2}' "$ROLLBACK_DIR/migration.env")" = ok
test "$(awk -F= '$1 == "database_decryption" {print $2}' "$ROLLBACK_DIR/migration.env")" = ok
test ! -w "$SOURCE/settings.env"
test -x "$ROLLBACK_DIR/rollback.sh"

# 修改新目录后执行回滚，旧只读副本应恢复为完整数据。
printf 'changed\n' > "$DESTINATION/settings.env"
"$ROLLBACK_DIR/rollback.sh" > "$ROOT/rollback.out"
test "$(cat "$DESTINATION/settings.env")" = legacy
grep -q '^rollback_status=ok$' "$ROOT/rollback.out"
echo 'product-data-migration: 通过（哈希、解密、失败原子性、只读副本、回滚）'
