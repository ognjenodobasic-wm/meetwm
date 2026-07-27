#!/bin/sh
# PreToolUse(Bash) hook: block `git commit` when the project does not typecheck.
# Reads the hook payload on stdin; exit 2 blocks the tool call.

payload=$(cat)

case "$payload" in
  *"git commit"*) ;;
  *) exit 0 ;;
esac

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
[ -x node_modules/.bin/tsc ] || exit 0

if ! output=$(node_modules/.bin/tsc --noEmit 2>&1); then
  printf 'Commit blocked: tsc --noEmit failed.\n%s\n' "$output" >&2
  exit 2
fi

exit 0
