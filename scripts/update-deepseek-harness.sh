#!/usr/bin/env bash
set -Eeuo pipefail

# repo_root 是 subtree 命令必须运行的产品 Git 根目录。
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# requested_ref 是经人工审查后准备同步的 Harness tag 或完整 commit。
requested_ref="${1:-dsh-v0.1.2-alpha.1}"
cd "$repo_root"

if [[ -n "$(git status --porcelain)" ]]; then
  printf 'Harness 更新要求工作树干净。\n' >&2
  exit 1
fi

git subtree pull \
  --prefix=brain/vendor/deepseek-harness \
  https://github.com/deepseek-ai/deepseek-harness.git \
  "$requested_ref" \
  --squash \
  -m "依赖：更新 DeepSeek Harness 至 ${requested_ref}"

if ! grep -q 'createProcessDeepSeekHarness, DeepSeekHarness' \
  brain/vendor/deepseek-harness/packages/sdk/client/src/index.ts; then
  git apply --directory=brain/vendor/deepseek-harness brain/vendor-patches/sdk-native-launch.patch
fi

printf '请更新 product/manifest.json 的 Harness tag/commit，然后运行 make brain-check 和 make supply-chain-generate。\n'
