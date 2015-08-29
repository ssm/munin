#!/bin/sh

test_description="munin-node service"

. ./sharness.sh

test_expect_success "munin-node running" "
  pgrep -F /run/munin/munin-node.pid >/dev/null
"

test_done
