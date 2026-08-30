#!/usr/bin/env bash
set -Eeuo pipefail

# migrate-product-data.test.sh 使用临时 SQLite 数据验证复制、只读保留和可执行回滚。
ROOT="$(mktemp -d)"
trap 'chmod -R u+w "$ROOT"; rm -rf "$ROOT"' EXIT
SOURCE="$ROOT/legacy"
DESTINATION="$ROOT/current"
ROLLBACK_DIR="$ROOT/rollback"
mkdir -p "$SOURCE/data" "$SOURCE/uploads"
sqlite3 "$SOURCE/data/xianyu_data.db" "CREATE TABLE fixture (id INTEGER PRIMARY KEY, value TEXT); INSERT INTO fixture(value) VALUES ('baseline');"
printf 'fixture\n' > "$SOURCE/uploads/example.txt"
printf 'legacy\n' > "$SOURCE/settings.env"

scripts/migrate-product-data.sh \
  --source "$SOURCE" \
  --destination "$DESTINATION" \
  --rollback-dir "$ROLLBACK_DIR"

test -f "$DESTINATION/data/xianyu_data.db"
test "$(sqlite3 "$DESTINATION/data/xianyu_data.db" 'PRAGMA integrity_check;')" = ok
test "$(awk -F= '$1 == "status" {print $2}' "$ROLLBACK_DIR/migration.env")" = ok
test ! -w "$SOURCE/settings.env"
test -x "$ROLLBACK_DIR/rollback.sh"

# 修改新目录后执行回滚，旧只读副本应恢复为完整数据。
printf 'changed\n' > "$DESTINATION/settings.env"
"$ROLLBACK_DIR/rollback.sh" > "$ROOT/rollback.out"
test "$(cat "$DESTINATION/settings.env")" = legacy
grep -q '^rollback_status=ok$' "$ROOT/rollback.out"
echo 'product-data-migration: 通过'
