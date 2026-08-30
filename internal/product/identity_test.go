package product

import "testing"

// TestEnvironmentValuePrefersNewPrefix 验证升级配置优先读取新产品前缀。
func TestEnvironmentValuePrefersNewPrefix(t *testing.T) {
	t.Setenv("XIANYU_DATA_KEY", "legacy")
	t.Setenv("DH_XIANYU_AGENTPANEL_DATA_KEY", "current")
	// got 是新前缀优先读取到的配置值。
	if got := EnvironmentValue("XIANYU_DATA_KEY", "fallback"); got != "current" {
		t.Fatalf("环境变量优先级错误: %q", got)
	}
}

// TestApplyEnvironmentAliasesKeepsLegacyReadersWorking 验证旧业务读取点可继续获得新前缀配置。
func TestApplyEnvironmentAliasesKeepsLegacyReadersWorking(t *testing.T) {
	t.Setenv("DH_XIANYU_AGENTPANEL_UPLOAD_DIR", "/tmp/dh-uploads")
	t.Setenv("XIANYU_UPLOAD_DIR", "")
	ApplyEnvironmentAliases()
	// got 是旧读取点最终看到的兼容目录。
	if got := EnvironmentValue("XIANYU_UPLOAD_DIR", ""); got != "/tmp/dh-uploads" {
		t.Fatalf("新前缀未映射到旧读取点: %q", got)
	}
}

// TestIdentityConstantsStayStable 验证安装器和服务依赖的身份常量不可意外漂移。
func TestIdentityConstantsStayStable(t *testing.T) {
	if DisplayName != "DH闲不下来" || Slug != "dh-xianyu-agentpanel" || WindowsServiceName != "DhXianyuAgentPanel" {
		t.Fatalf("产品身份常量异常: %q %q %q", DisplayName, Slug, WindowsServiceName)
	}
}
