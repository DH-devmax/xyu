#!/usr/bin/env bash
set -Eeuo pipefail

# script_directory 是回滚脚本的实际所在目录，不依赖调用者的当前目录。
script_directory="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# repo_root 是包含本脚本的产品 Git 根目录。
repo_root="$(git -C "$script_directory" rev-parse --show-toplevel)"
# script_path 用于把最近一次修改本脚本的提交锁定为品牌阶段终点。
script_path="artifacts/v2-brand/rollback-brand-migration.sh"
# baseline_commit 是品牌阶段开始前已通过工程治理门禁的提交。
baseline_commit="2bb0cd20a016fe9e3104f860ae0b7568bb0fb508"
# phase_tip 是本脚本最近一次被品牌、闭包或 Wiki 门禁提交修改的位置，避免误回滚未来阶段。
phase_tip="$(git -C "$repo_root" log --format=%H -n 1 -- "$script_path")"

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

if [[ -z "$phase_tip" ]]; then
  printf 'rollback: 未找到品牌阶段终点\n' >&2
  exit 1
fi
if ! git -C "$repo_root" merge-base --is-ancestor "$baseline_commit" "$phase_tip"; then
  printf 'rollback: 工程治理基线不在品牌阶段历史中: %s\n' "$baseline_commit" >&2
  exit 1
fi
if [[ "$(git -C "$repo_root" rev-parse HEAD)" != "$phase_tip" ]]; then
  printf 'rollback: 当前 HEAD 不是已锁定的品牌阶段终点: %s\n' "$phase_tip" >&2
  exit 1
fi

case "${1:-}" in
  --check)
    assert_clean
    commit_count="$(git -C "$repo_root" rev-list --first-parent --count "$baseline_commit..$phase_tip")"
    printf 'rollback-check: 通过，工作树干净，阶段终点 %s 可通过 %s 个提交回滚到 %s\n' \
      "$phase_tip" "$commit_count" "$baseline_commit"
    ;;
  --apply)
    assert_clean
    # rev-list 默认按最新到最旧排序，符合逐层撤销提交的顺序。
    commit_list="$(git -C "$repo_root" rev-list --first-parent "$baseline_commit..$phase_tip")"
    if [[ -z "$commit_list" ]]; then
      printf 'rollback: 品牌阶段没有可回滚提交\n' >&2
      exit 1
    fi
    rollback_abort() {
      git -C "$repo_root" revert --abort >/dev/null 2>&1 || true
      printf 'rollback: 撤销过程失败，已尝试恢复执行前状态\n' >&2
    }
    trap rollback_abort ERR
    # commit_list 只包含 Git 生成的十六进制提交 ID，按空白拆分传给 revert。
    # shellcheck disable=SC2086
    git -C "$repo_root" revert --no-commit $commit_list
    expected_tree="$(git -C "$repo_root" rev-parse "$baseline_commit^{tree}")"
    actual_tree="$(git -C "$repo_root" write-tree)"
    if [[ "$actual_tree" != "$expected_tree" ]]; then
      printf 'rollback: 回滚后 tree 不等于基线: %s != %s\n' "$actual_tree" "$expected_tree" >&2
      exit 1
    fi
    git -C "$repo_root" commit -m '回滚：恢复品牌迁移前工程治理基线'
    trap - ERR
    printf 'rollback: 已创建聚合 revert commit，阶段 %s -> 基线 %s\n' "$phase_tip" "$baseline_commit"
    ;;
  *)
    usage >&2
    exit 2
    ;;
esac
