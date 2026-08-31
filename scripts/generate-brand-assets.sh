#!/usr/bin/env bash
set -euo pipefail

# root_dir 是仓库根目录，脚本可从任意工作目录调用。
root_dir="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
source_file="${1:-$root_dir/branding/logo.jpg}"
expected_sha="726ee78d1a0d4f8979358ca2cae128fcf74aa73b5a24fe3d211e0c05b13da1ea"
magick_bin="${MAGICK:-$(command -v magick || command -v convert || true)}"

if [[ -z "$magick_bin" ]]; then
  echo '缺少 ImageMagick（需要 magick 或 convert）' >&2
  exit 2
fi
if [[ ! -f "$source_file" ]]; then
  echo "品牌源图不存在：$source_file" >&2
  exit 1
fi

# source_sha 是源图的内容指纹，优先使用 sha256sum 兼容 Linux，再使用 macOS shasum。
if command -v sha256sum >/dev/null 2>&1; then
  source_sha="$(sha256sum "$source_file" | awk '{print $1}')"
else
  source_sha="$(shasum -a 256 "$source_file" | awk '{print $1}')"
fi
if [[ "$source_sha" != "$expected_sha" ]]; then
  echo "品牌源图哈希不匹配：$source_sha" >&2
  exit 1
fi

work_dir="$(mktemp -d)"
trap 'rm -rf "$work_dir"' EXIT
master="$work_dir/app-icon.png"

# 固定裁剪保留中心 Dh 标志，去除原图边框与底部小字，再统一为 sRGB PNG。
"$magick_bin" "$source_file" -auto-orient -crop 520x520+250+245 +repage -resize 1024x1024 -colorspace sRGB -strip PNG32:"$master"
mkdir -p "$root_dir/branding" "$root_dir/frontend/public" "$root_dir/docs/assets" \
  "$root_dir/internal/webui/static" "$root_dir/icon/linux" "$root_dir/icon/windows" \
  "$root_dir/cmd/tray" "$root_dir/icon/macos"
cp "$master" "$root_dir/branding/app-icon.png"

# write_png 生成指定尺寸的无元数据 PNG，所有平台从同一 master 派生。
write_png() {
  local size="$1"
  local target="$2"
  "$magick_bin" "$master" -resize "${size}x${size}" -strip PNG32:"$target"
}

# Web favicon 只保留深色标志；亮度蒙版保留抗锯齿边缘并移除米白底色。
favicon_source="$work_dir/favicon-source.png"
favicon_mask="$work_dir/favicon-alpha-mask.png"
favicon_result="$work_dir/favicon-transparent.png"
write_png 256 "$favicon_source"
"$magick_bin" "$favicon_source" -alpha off -colorspace Gray -negate -level 8%,82% "$favicon_mask"
"$magick_bin" -size 256x256 xc:'#1F2428' -alpha set "$favicon_mask" \
  -compose CopyOpacity -composite "$favicon_result"
"$magick_bin" "$favicon_result" -define png:color-type=6 \
  -define png:exclude-chunks=date,time -strip PNG32:"$root_dir/branding/favicon.png"
cp "$root_dir/branding/favicon.png" "$root_dir/frontend/public/favicon.png"
cp "$root_dir/branding/favicon.png" "$root_dir/docs/assets/favicon.png"
cp "$root_dir/branding/favicon.png" "$root_dir/internal/webui/static/favicon.png"
write_png 512 "$root_dir/icon/linux/icon.png"
write_png 512 "$root_dir/icon/windows/icon.png"
write_png 512 "$root_dir/cmd/tray/icon.png"
"$magick_bin" "$master" -resize 512x512 -colorspace Gray -strip PNG32:"$root_dir/cmd/tray/icon-gray.png"

# ImageMagick 生成包含常用 Shell 尺寸的 Windows ICO。
"$magick_bin" "$master" -define icon:auto-resize=256,128,64,48,32,24,16 "$root_dir/icon/windows/icon.ico"

# iconutil 生成 macOS ICNS；没有 macOS 工具链时保留前面已生成的跨平台资源并明确失败。
iconutil_bin="${ICONUTIL:-$(command -v iconutil || true)}"
if [[ -z "$iconutil_bin" ]]; then
  echo '缺少 iconutil，无法生成 macOS icon.icns' >&2
  exit 2
fi
iconset="$work_dir/AppIcon.iconset"
mkdir -p "$iconset"
for spec in \
  'icon_16x16.png:16' 'icon_16x16@2x.png:32' \
  'icon_32x32.png:32' 'icon_32x32@2x.png:64' \
  'icon_128x128.png:128' 'icon_128x128@2x.png:256' \
  'icon_256x256.png:256' 'icon_256x256@2x.png:512' \
  'icon_512x512.png:512' 'icon_512x512@2x.png:1024'; do
  name="${spec%%:*}"
  size="${spec##*:}"
  write_png "$size" "$iconset/$name"
done
"$iconutil_bin" -c icns "$iconset" -o "$root_dir/icon/macos/icon.icns"

echo 'brand-assets: 已从 branding/logo.jpg 生成 Web、托盘、Windows 和 macOS 资源'
