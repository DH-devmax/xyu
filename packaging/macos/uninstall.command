#!/bin/sh
set -eu

PRODUCT_NAME="DH闲不下来"
EXPECTED_BUNDLE_ID="com.dhdevmax.xianyu-agentpanel"
CONSOLE_USER="$(/usr/bin/stat -f '%Su' /dev/console)"

if [ "${1:-}" != "--confirmed" ]; then
  if ! /usr/bin/osascript <<'APPLESCRIPT'
tell application "System Events"
    display dialog "卸载后将删除 DH闲不下来、后台服务、配置、数据库、Chromium 和日志。此操作不可恢复。" buttons {"取消", "卸载"} default button "取消" cancel button "取消" with title "卸载 DH闲不下来"
end tell
APPLESCRIPT
  then
    exit 0
  fi
fi

if [ "$(id -u)" -ne 0 ]; then
  exec /usr/bin/sudo "$0" --confirmed
fi

if [ "$CONSOLE_USER" != "root" ] && [ -n "$CONSOLE_USER" ]; then
  UID_VALUE="$(/usr/bin/id -u "$CONSOLE_USER")"
  HOME_DIR="$(/usr/bin/dscl . -read "/Users/$CONSOLE_USER" NFSHomeDirectory | /usr/bin/awk '{print $2}')"

  for label in \
    "com.dhdevmax.xianyu-agentpanel.server" \
    "com.dhdevmax.xianyu-agentpanel.tray" \
    "com.ydisks.xianyu-helper.server" \
    "com.ydisks.xianyu-helper.tray" \
    "com.christ.ydisks-xianyu-helper.server" \
    "com.christ.ydisks-xianyu-helper.tray"
  do
    /bin/launchctl bootout "gui/$UID_VALUE/$label" >/dev/null 2>&1 || true
  done

  # 处理用户手动启动、但没有被 LaunchAgent 管理的旧进程。
  for process_path in \
    "/Applications/DH闲不下来/DH闲不下来.app/Contents/Helpers/xianyu-server" \
    "/Applications/DH闲不下来/DH闲不下来.app/Contents/MacOS/DH闲不下来" \
    "/Applications/Ydisks闲鱼助手/Ydisks闲鱼助手.app/Contents/Helpers/xianyu-server" \
    "/Applications/Ydisks闲鱼助手/Ydisks闲鱼助手.app/Contents/MacOS/Ydisks闲鱼助手" \
    "/Applications/Ydisks Xianyu Helper.app/Contents/Helpers/xianyu-server" \
    "/Applications/Ydisks Xianyu Helper.app/Contents/MacOS/xianyu-tray" \
    "/Applications/Ydisks Xianyu Helper.localized/Ydisks Xianyu Helper.app/Contents/Helpers/xianyu-server" \
    "/Applications/Ydisks Xianyu Helper.localized/Ydisks Xianyu Helper.app/Contents/MacOS/xianyu-tray"
  do
  /usr/bin/pkill -TERM -f "$process_path" >/dev/null 2>&1 || true
  done

  /bin/rm -f \
    "$HOME_DIR/Library/LaunchAgents/com.dhdevmax.xianyu-agentpanel.server.plist" \
    "$HOME_DIR/Library/LaunchAgents/com.dhdevmax.xianyu-agentpanel.tray.plist" \
    "$HOME_DIR/Library/LaunchAgents/com.ydisks.xianyu-helper.server.plist" \
    "$HOME_DIR/Library/LaunchAgents/com.ydisks.xianyu-helper.tray.plist" \
    "$HOME_DIR/Library/LaunchAgents/com.christ.ydisks-xianyu-helper.server.plist" \
    "$HOME_DIR/Library/LaunchAgents/com.christ.ydisks-xianyu-helper.tray.plist"

  /bin/rm -rf \
    "$HOME_DIR/Library/Application Support/DhXianyuAgentPanel" \
    "$HOME_DIR/Library/Application Support/DhXianyuAgentPanel-migration" \
    "$HOME_DIR/Library/Logs/DhXianyuAgentPanel" \
    "$HOME_DIR/Library/Application Support/YdisksXianyuHelper" \
    "$HOME_DIR/Library/Logs/YdisksXianyuHelper"
fi

/bin/rm -rf \
  "/Applications/DH闲不下来" \
  "/Applications/Ydisks闲鱼助手" \
  "/Applications/Ydisks Xianyu Helper.app" \
  "/Applications/Ydisks Xianyu Helper.localized"
/usr/bin/pkgutil --forget "$EXPECTED_BUNDLE_ID" >/dev/null 2>&1 || true
/usr/bin/pkgutil --forget "com.ydisks.xianyu-helper" >/dev/null 2>&1 || true
/bin/rm -f /var/log/dh-xianyu-agentpanel-install.log /var/log/ydisks-xianyu-helper-install.log

echo "$PRODUCT_NAME 已卸载完成。"
