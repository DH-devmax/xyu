#!/usr/bin/env bash
set -Eeuo pipefail

# script_directory 是回滚脚本的实际所在目录，不受调用者当前工作目录影响。
script_directory="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# repo_root 从脚本所在位置向上解析产品 Git 根目录。
repo_root="$(git -C "$script_directory" rev-parse --show-toplevel)"
# script_path 是回滚脚本在仓库中的相对路径，用于解析首次引入它的治理提交。
script_path="artifacts/v2-governance/rollback-engineering-governance.sh"
# target_commit 是新增本脚本的单一治理提交，避免在提交前写入循环变化的哈希。
target_commit="$(git -C "$repo_root" log --diff-filter=A --format=%H -n 1 -- "$script_path")"

# usage 输出稳定的回滚脚本参数说明。
usage() {
  printf '用法: %s --check|--apply\n' "$0"
}

# assert_clean 防止 revert 覆盖用户尚未提交的工作树变更。
assert_clean() {
  if [[ -n "$(git -C "$repo_root" status --porcelain --untracked-files=all)" ]]; then
    printf 'rollback: 工作树存在未提交变更\n' >&2
    exit 1
  fi
}

if [[ -z "$target_commit" ]]; then
  printf 'rollback: 未找到引入本脚本的治理提交\n' >&2
  exit 1
fi
if ! git -C "$repo_root" merge-base --is-ancestor "$target_commit" HEAD; then
  printf 'rollback: 治理提交不在当前历史中: %s\n' "$target_commit" >&2
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
