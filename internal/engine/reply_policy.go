package engine

import (
	"regexp"
	"strconv"
)

// priceCharacters 保留商品价格文本中的数字和小数点，供 Go 侧边界计算复用。
var priceCharacters = regexp.MustCompile(`[^\d.]`)

// parsePrice 将业务价格文本转换为有限浮点值；格式异常时返回零。
func parsePrice(value string) float64 {
	// cleaned 是去除货币符号后的候选金额文本。
	cleaned := priceCharacters.ReplaceAllString(value, "")
	if cleaned == "" {
		return 0
	}
	// parsed、err 是金额解析结果及格式错误。
	parsed, err := strconv.ParseFloat(cleaned, 64)
	if err != nil {
		return 0
	}
	return parsed
}
