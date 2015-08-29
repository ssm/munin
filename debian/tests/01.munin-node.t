#!/bin/sh

test_description="munin-node service"

. ./sharness.sh

check_port() {
    while ! nc -z localhost 4949; do
        a=$(expr $a + 1)
        if [ $a = 10 ]; then
            return 1
        fi
        sleep 1;
    done
}

test_expect_success "munin node port listening" "
  check_port
"

test_done
