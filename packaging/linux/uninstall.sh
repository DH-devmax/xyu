#!/usr/bin/env bash
set -Eeuo pipefail

APP_NAME="dh-xianyu-agentpanel"
LEGACY_APP_NAME="ydisks-xianyu-helper"
SERVICE_NAME="$APP_NAME.service"
LEGACY_SERVICE_NAME="$LEGACY_APP_NAME.service"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "请使用 root 运行：sudo $0" >&2
  exit 1
fi

systemctl disable --now "$SERVICE_NAME" >/dev/null 2>&1 || true
systemctl disable --now "$LEGACY_SERVICE_NAME" >/dev/null 2>&1 || true
rm -f "/etc/systemd/system/$SERVICE_NAME"
rm -f "/etc/systemd/system/$LEGACY_SERVICE_NAME"
systemctl daemon-reload
rm -rf "/opt/$APP_NAME"
rm -f "/usr/share/icons/hicolor/512x512/apps/$APP_NAME.png"
echo "程序和服务已移除；数据仍保留在 /var/lib/$APP_NAME 和 /var/lib/$LEGACY_APP_NAME。"
