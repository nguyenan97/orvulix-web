#!/bin/sh
set -eu
branch=$(git symbolic-ref --quiet --short HEAD) || {
  echo 'Workflow: detached HEAD is forbidden; use develop or feature/*.' >&2
  exit 1
}
case "$branch" in
  develop|feature/?*) ;;
  *) echo "Workflow: cannot commit on $branch; use develop or feature/*." >&2; exit 1 ;;
esac
