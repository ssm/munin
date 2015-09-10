package Munin::Master::Controller::HTML::Tests;
use base qw(Test::Class);
use Test::More;

sub class : Test(1) {
    use_ok(Munin::Master::Controller::HTML);
}

1;
