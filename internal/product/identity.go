// Package product 提供 DH 闲不下来各平台共用的产品身份和兼容迁移常量。
package product

import (
	"os"
	"strings"
)

const (
	// DisplayName 是用户可见的产品名称。
	DisplayName = "DH闲不下来"
	// Slug 是安装包、服务目录和发布产物使用的稳定短标识。
	Slug = "dh-xianyu-agentpanel"
	// EnvironmentPrefix 是新版本环境变量使用的统一前缀。
	EnvironmentPrefix = "DH_XIANYU_AGENTPANEL_"
	// WindowsServiceName 是 Windows 服务控制器注册的稳定名称。
	WindowsServiceName = "DhXianyuAgentPanel"
	// LinuxServiceName 是 Linux systemd unit 的稳定名称（不含 .service 后缀）。
	LinuxServiceName = "dh-xianyu-agentpanel"
	// MacOSBundleID 是 macOS 应用和 pkg 的稳定 Bundle ID。
	MacOSBundleID = "com.dhdevmax.xianyu-agentpanel"
	// MacOSServerLabel 是 macOS 后台服务 LaunchAgent 的稳定标识。
	MacOSServerLabel = MacOSBundleID + ".server"
	// MacOSTrayLabel 是 macOS 托盘 LaunchAgent 的稳定标识。
	MacOSTrayLabel = MacOSBundleID + ".tray"
	// DesktopDataDirName 是 macOS/Windows 用户配置目录下的产品目录名。
	DesktopDataDirName = "DhXianyuAgentPanel"
	// LegacyDesktopDataDirName 是 v1 桌面端使用的数据目录名。
	LegacyDesktopDataDirName = "YdisksXianyuHelper"
	// LegacyLinuxDataDirName 是 v1 Linux 安装使用的数据目录名。
	LegacyLinuxDataDirName = "ydisks-xianyu-helper"
	// LegacyWindowsServiceName 是 v1 Windows 服务名。
	LegacyWindowsServiceName = "YdisksXianyuHelper"
	// LegacyMacOSBundleID 是 v1 macOS Bundle ID。
	LegacyMacOSBundleID = "com.ydisks.xianyu-helper"
)

// LegacyEnvironmentName 将旧 XIANYU_* 环境变量映射为新产品前缀下的名称。
func LegacyEnvironmentName(name string) string {
	name = strings.TrimSpace(name)
	if !strings.HasPrefix(name, "XIANYU_") {
		return name
	}
	return EnvironmentPrefix + strings.TrimPrefix(name, "XIANYU_")
}

// EnvironmentValue 按新前缀优先、旧名称兼容的顺序读取环境变量。
func EnvironmentValue(legacyName, fallback string) string {
	// currentValue 是新前缀环境变量中的配置值。
	if currentValue := strings.TrimSpace(os.Getenv(LegacyEnvironmentName(legacyName))); currentValue != "" {
		return currentValue
	}
	// legacyValue 是旧前缀环境变量中的兼容配置值。
	if legacyValue := strings.TrimSpace(os.Getenv(legacyName)); legacyValue != "" {
		return legacyValue
	}
	return fallback
}

// ApplyEnvironmentAliases 把新前缀配置映射到仍由业务组件读取的旧变量，保证升级时配置持续生效。
func ApplyEnvironmentAliases() {
	// legacyName 是仍由业务组件读取的旧环境变量名。
	for _, legacyName := range []string{
		"XIANYU_DATA_KEY",
		"XIANYU_ADMIN_PASSWORD",
		"XIANYU_UPLOAD_DIR",
		"XIANYU_LOG_DIR",
		"XIANYU_SERVICE_URL",
		"XIANYU_SERVICE_NAME",
		"XIANYU_SKIP_BROWSER_DEPS",
		"XIANYU_SERVER_SOURCE",
		"XIANYU_BROWSER_INSTALL_SOURCE",
		"XIANYU_PLAYWRIGHT_RUNTIME_SOURCE",
		"XIANYU_ICON_SOURCE",
	} {
		if strings.TrimSpace(os.Getenv(legacyName)) != "" {
			continue
		}
		// mappedValue 是新前缀环境变量中待映射的配置值。
		if mappedValue := strings.TrimSpace(os.Getenv(LegacyEnvironmentName(legacyName))); mappedValue != "" {
			_ = os.Setenv(legacyName, mappedValue)
		}
	}
}
