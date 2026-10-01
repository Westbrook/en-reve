#!/bin/sh
# Select the private runtime without replacing system or Codex bundled binaries.
set -eu
root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
case "${EN_TEST_NODE_LINE:-current}" in
  current) node_bin="$root/.toolchains/bin" ;;
  lts) node_bin="$root/.toolchains/lts-bin" ;;
  *) echo 'EN_TEST_NODE_LINE must be current or lts' >&2; exit 1 ;;
esac
if [ ! -x "$node_bin/node" ]; then echo 'Run tooling/test-pipeline/setup-runtimes.py first' >&2; exit 1; fi
export PATH="$node_bin:$root/.toolchains/bin:$root/.toolchains/cpython-3.14.7/bin:$PATH"
exec "$@"
