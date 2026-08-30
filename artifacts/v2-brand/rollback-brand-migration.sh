#!/usr/bin/env bash
set -Eeuo pipefail

# script_directory 是回滚脚本的实际所在目录，不依赖调用者的当前目录。
script_directory="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# repo_root 是包含本脚本的产品 Git 根目录。
repo_root="$(git -C "$script_directory" rev-parse --show-toplevel)"
# script_path 用于查找首次引入本回滚入口的品牌迁移提交。
script_path="artifacts/v2-brand/rollback-brand-migration.sh"
# target_commit 是应通过普通 revert 撤销的单一品牌迁移提交。
target_commit="$(git -C "$repo_root" log --diff-filter=A --format=%H -n 1 -- "$script_path")"

# usage 输出稳定的回滚脚本用法。
usage() {
  printf '用法: %s --check|--apply\n' "$0"
}

# assert_clean 保护用户尚未提交的变更，避免 revert 覆盖当前工作。
assert_clean() {
  if [[ -n "$(git -C "$repo_root" status --porcelain --untracked-files=all)" ]]; then
    printf 'rollback: 工作树存在未提交变更\n' >&2
    exit 1
  fi
}

if [[ -z "$target_commit" ]]; then
  printf 'rollback: 未找到引入本脚本的品牌迁移提交\n' >&2
  exit 1
fi
if ! git -C "$repo_root" merge-base --is-ancestor "$target_commit" HEAD; then
  printf 'rollback: 品牌迁移提交不在当前历史中: %s\n' "$target_commit" >&2
  exit 1
fi

case "${1:-}" in
  --check)
    assert_clean
    printf 'rollback-check: 通过，工作树干净且 %s 可回滚\n' "$target_commit"
    ;;
  --apply)
    assert_clean
    git -C "$repo_root" revert --no-edit "$target_commit"
    printf 'rollback: 已创建 revert commit，目标 %s\n' "$target_commit"
    ;;
  *)
    usage >&2
    exit 2
    ;;
esac
