# DH 闲不下来品牌资源

`logo.jpg` 是产品源图，来源于发布目录，SHA-256 为
`726ee78d1a0d4f8979358ca2cae128fcf74aa73b5a24fe3d211e0c05b13da1ea`。

派生资源已提交到仓库，并由 `make brand-assets-check` 校验 Web 与 Go 嵌入副本一致：

- `branding/app-icon.png`：桌面和安装器使用的 1024x1024 RGBA 图标
- `branding/favicon.png`：Web 和 Go 嵌入使用的 256x256 RGBA 透明图标
- `branding/logo.jpg`：保留的原始品牌源图，仅用于来源追溯

前端副本位于 `frontend/public/favicon.png`，构建后复制到
`internal/webui/static/favicon.png`。透明区域在深色查看器中可能显示为黑色背景，
不代表图标本身包含黑色方块。
