# DH 闲不下来品牌资源

`logo.jpg` 是产品源图，来源于发布目录，SHA-256 为
`726ee78d1a0d4f8979358ca2cae128fcf74aa73b5a24fe3d211e0c05b13da1ea`。

资源由 `scripts/generate-brand-assets.sh` 从源图按固定裁剪参数生成：

- 裁剪：`520x520+250+245`
- 主图：`branding/app-icon.png`（1024x1024）
- Web：`favicon.png`（256x256）
- Linux、Windows、托盘：512x512 PNG；Windows 另生成多尺寸 ICO
- macOS：`icon/macos/icon.icns`，包含 16、32、64、128、256、512、1024 像素层

生成脚本会先校验源图哈希，避免误用其他素材。`Assets.car` 不再作为安装包输入，macOS 使用同一份 `icon.icns`，从而避免旧资源残留。
