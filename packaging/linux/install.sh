#!/usr/bin/env bash
set -Eeuo pipefail

APP_NAME="dh-xianyu-agentpanel"
LEGACY_APP_NAME="ydisks-xianyu-helper"
INSTALL_DIR="/opt/$APP_NAME"
DATA_DIR="/var/lib/$APP_NAME"
CONFIG_DIR="/etc/$APP_NAME"
LOG_DIR="/var/log/$APP_NAME"
SERVICE_NAME="$APP_NAME.service"
LEGACY_SERVICE_NAME="$LEGACY_APP_NAME.service"
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "请使用 root 运行：sudo $0" >&2
  exit 1
fi

if ! command -v systemctl >/dev/null 2>&1; then
  echo "当前系统没有 systemd，安装脚本暂不支持。" >&2
  exit 1
fi

SERVER_SOURCE="${DH_XIANYU_AGENTPANEL_SERVER_SOURCE:-${XIANYU_SERVER_SOURCE:-$SCRIPT_DIR/xianyu-server}}"
BROWSER_SOURCE="${DH_XIANYU_AGENTPANEL_BROWSER_INSTALL_SOURCE:-${XIANYU_BROWSER_INSTALL_SOURCE:-$SCRIPT_DIR/browser-install}}"
RUNTIME_SOURCE="${DH_XIANYU_AGENTPANEL_PLAYWRIGHT_RUNTIME_SOURCE:-${XIANYU_PLAYWRIGHT_RUNTIME_SOURCE:-$SCRIPT_DIR/playwright-runtime}}"
BRAIN_SOURCE="${DH_XIANYU_AGENTPANEL_BRAIN_SOURCE:-$SCRIPT_DIR/brain}"
ICON_SOURCE="${DH_XIANYU_AGENTPANEL_ICON_SOURCE:-${XIANYU_ICON_SOURCE:-$SCRIPT_DIR/icon.png}}"
MIGRATION_SOURCE="${DH_XIANYU_AGENTPANEL_MIGRATION_SOURCE:-$SCRIPT_DIR/migrate-product-data.sh}"
if [[ ! -x "$SERVER_SOURCE" ]]; then
  echo "找不到 xianyu-server：$SERVER_SOURCE" >&2
  exit 1
fi
if [[ ! -x "$BROWSER_SOURCE" ]]; then
  echo "找不到 browser-install：$BROWSER_SOURCE" >&2
  exit 1
fi
case "$(uname -m)" in
  x86_64|amd64) RUNTIME_ARCH="amd64" ;;
  aarch64|arm64) RUNTIME_ARCH="arm64" ;;
  *) echo "不支持的 Linux 架构：$(uname -m)" >&2; exit 1 ;;
esac
if [[ ! -d "$RUNTIME_SOURCE/$RUNTIME_ARCH/playwright-driver" ]] || \
   [[ ! -d "$RUNTIME_SOURCE/$RUNTIME_ARCH/playwright-browsers" ]]; then
  echo "找不到 $RUNTIME_ARCH 架构的 Playwright runtime：$RUNTIME_SOURCE/$RUNTIME_ARCH" >&2
  exit 1
fi
if [[ ! -f "$BRAIN_SOURCE/runtime/runtime.json" ]] || \
   [[ ! -f "$BRAIN_SOURCE/runtime/node-carrier" ]] || \
   [[ ! -f "$BRAIN_SOURCE/runtime/node/package.json" ]] || \
   [[ ! -f "$BRAIN_SOURCE/runtime/node/node_modules/@deepseek-ai/dsh/lib/bin.js" ]] || \
   [[ ! -f "$BRAIN_SOURCE/runtime/node/node_modules/@deepseek-ai/dsh-sdk-client/lib/index.js" ]] || \
   [[ ! -f "$BRAIN_SOURCE/gateway/index.mjs" ]] || \
   [[ ! -f "$BRAIN_SOURCE/profile/customer-service.patch.yml" ]] || \
   [[ ! -f "$BRAIN_SOURCE/runtime/result-tool.mjs" ]]; then
  echo "找不到完整的 Brain runtime 载荷：$BRAIN_SOURCE" >&2
  exit 1
fi
if [[ ! -f "$ICON_SOURCE" ]]; then
  echo "找不到应用图标：$ICON_SOURCE" >&2
  exit 1
fi
if [[ ! -x "$MIGRATION_SOURCE" ]]; then
  echo "找不到数据迁移脚本：$MIGRATION_SOURCE" >&2
  exit 1
fi

if ! getent group "$APP_NAME" >/dev/null; then
  groupadd --system "$APP_NAME"
fi
if ! id "$APP_NAME" >/dev/null 2>&1; then
  useradd --system --gid "$APP_NAME" --home-dir "$DATA_DIR" --no-create-home --shell /usr/sbin/nologin "$APP_NAME"
fi

systemctl stop "$SERVICE_NAME" >/dev/null 2>&1 || true
systemctl stop "$LEGACY_SERVICE_NAME" >/dev/null 2>&1 || true

# 新安装目录为空时迁移旧版本数据；迁移脚本会校验哈希并生成可执行回滚记录。
if [[ -d "/var/lib/$LEGACY_APP_NAME" && ! -e "$DATA_DIR" ]]; then
  "$MIGRATION_SOURCE" \
    --source "/var/lib/$LEGACY_APP_NAME" \
    --destination "$DATA_DIR" \
    --rollback-dir "/var/lib/${APP_NAME}-rollback" \
    --record "/var/lib/${APP_NAME}-rollback/migration.env"
fi
if [[ ! -f "$CONFIG_DIR/config.env" && -f "/etc/$LEGACY_APP_NAME/config.env" ]]; then
  install -d -m 0750 "$CONFIG_DIR"
  install -m 0600 "/etc/$LEGACY_APP_NAME/config.env" "$CONFIG_DIR/config.env"
fi
install -d -m 0755 "$INSTALL_DIR"
install -d -o "$APP_NAME" -g "$APP_NAME" -m 0750 "$DATA_DIR"
install -d -o "$APP_NAME" -g "$APP_NAME" -m 0750 "$LOG_DIR"
rm -rf "$INSTALL_DIR/playwright-runtime"
install -d -m 0755 "$INSTALL_DIR/playwright-runtime"
cp -R "$RUNTIME_SOURCE/." "$INSTALL_DIR/playwright-runtime/"
chmod -R a+rX "$INSTALL_DIR/playwright-runtime"
rm -rf "$INSTALL_DIR/brain"
install -d -m 0755 "$INSTALL_DIR/brain"
cp -R "$BRAIN_SOURCE/." "$INSTALL_DIR/brain/"
chmod -R a+rX "$INSTALL_DIR/brain"
install -d -m 0750 "$CONFIG_DIR"
install -m 0755 "$SERVER_SOURCE" "$INSTALL_DIR/xianyu-server"
install -m 0755 "$BROWSER_SOURCE" "$INSTALL_DIR/browser-install"
install -D -m 0644 "$ICON_SOURCE" "/usr/share/icons/hicolor/512x512/apps/$APP_NAME.png"
install -m 0644 "$SCRIPT_DIR/dh-xianyu-agentpanel.service" "/etc/systemd/system/$SERVICE_NAME"

if [[ ! -f "$CONFIG_DIR/config.env" ]]; then
  umask 077
  if command -v openssl >/dev/null 2>&1; then
    data_key="$(openssl rand -base64 48 2>/dev/null | tr -d '\n')"
  else
    data_key="$(head -c 48 /dev/urandom | base64 | tr -d '\n')"
  fi
  {
    printf 'DH_XIANYU_AGENTPANEL_DATA_KEY=%s\n' "$data_key"
    printf 'DH_XIANYU_AGENTPANEL_LOG_DIR=%s\n' "$LOG_DIR"
    printf 'LOG_FORMAT=json\n'
  } > "$CONFIG_DIR/config.env"
fi

chown -R "$APP_NAME:$APP_NAME" "$DATA_DIR"
chmod 0600 "$CONFIG_DIR/config.env"

if [[ "${DH_XIANYU_AGENTPANEL_SKIP_BROWSER_DEPS:-${XIANYU_SKIP_BROWSER_DEPS:-0}}" != "1" ]]; then
  "$INSTALL_DIR/browser-install" \
    -driver-dir "$INSTALL_DIR/playwright-runtime/$RUNTIME_ARCH/playwright-driver" \
    -deps-only
fi

systemctl daemon-reload
systemctl enable --now "$SERVICE_NAME"
systemctl --no-pager --full status "$SERVICE_NAME" || true
echo "DH闲不下来安装完成：systemctl status $SERVICE_NAME"
