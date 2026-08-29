#!/usr/bin/env bash
set -Eeuo pipefail

# repo_root 是从脚本位置解析的产品根目录，避免从其他目录运行时检查错误工作树。
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

if [[ -n "$(git status --porcelain)" ]]; then
  printf '主分支 preflight 要求开始时工作树干净。\n' >&2
  exit 1
fi

node scripts/check-product-manifest.mjs
make check
npm run typecheck --prefix frontend
npm test --prefix frontend
npm run api:check --prefix frontend
npm run build --prefix frontend

if [[ -n "$(git status --porcelain)" ]]; then
  printf 'preflight 产生了未提交差异，请先更新生成物。\n' >&2
  git status --short >&2
  exit 1
fi

printf 'preflight-main: 通过\n'
