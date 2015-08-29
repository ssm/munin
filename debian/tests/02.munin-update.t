#!/bin/sh

test_description="munin run (cron strategy)"

. ./sharness.sh

setup() {
    temp_conf_file=$(mktemp /etc/munin/munin-conf.d/autopkgtest.XXXXXXXX.conf)
    chmod 0644 $temp_conf_file
    trap "rm $temp_conf_file" EXIT

    cat >> $temp_conf_file <<EOF
graph_strategy cron
html_strategy  cron

[test.example.com]
address ::1
EOF
}

test_expect_success "setup" "
  setup
"

test_expect_success "munin-update" "
  su - munin -c /usr/share/munin/munin-update
"

test_expect_success "rrd files created" "
  find /var/lib/munin/example.com -type f -name 'test.example.com*.rrd'
"

test_done
