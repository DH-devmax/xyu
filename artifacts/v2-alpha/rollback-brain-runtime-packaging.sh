#!/usr/bin/env bash
set -Eeuo pipefail

TARGET_COMMIT="6a171d08294367a2ca7cf1fa8c75d3efd2c6d483"

usage() {
  printf '用法: %s --check|--apply\n' "$0"
}

REPO_ROOT="$(git rev-parse --show-toplevel)"

assert_clean() {
  if [[ -n "$(git -C "$REPO_ROOT" status --porcelain --untracked-files=all)" ]]; then
    printf 'rollback: 工作树存在未提交变更\n' >&2
    exit 1
  fi
}

if ! git -C "$REPO_ROOT" merge-base --is-ancestor "$TARGET_COMMIT" HEAD; then
  printf 'rollback: 目标提交不在当前历史中: %s\n' "$TARGET_COMMIT" >&2
  exit 1
fi

case "${1:-}" in
  --check)
    assert_clean
    printf 'rollback-check: 通过，工作树干净且 %s 可回滚\n' "$TARGET_COMMIT"
    ;;
  --apply)
    assert_clean
    git -C "$REPO_ROOT" revert --no-edit "$TARGET_COMMIT"
    printf 'rollback: 已创建 revert commit，目标 %s\n' "$TARGET_COMMIT"
    ;;
  *)
    usage >&2
    exit 2
    ;;
esac
