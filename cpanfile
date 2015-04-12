# CPAN requirements for munin

requires 'perl',             '5.10.0';
requires 'Log::Dispatch',    '2.41';
requires 'Net::SSLeay',      '1.65';
requires 'Params::Validate', '1.13';

feature 'master', 'munin master' => sub {
    requires 'Alien::RRDtool',            '0';
    requires 'DBD::SQLite',               '1.42';
    requires 'File::Copy::Recursive',     '0.38';
    requires 'DBI',                       '1.631';
    requires 'HTML::Template',            '2.95';
    requires 'HTML::Template::Pro',       '0';
    requires 'List::MoreUtils',           '0.33';
    requires 'HTTP::Server::Simple::CGI', '0';
    requires 'XML::Dumper',               '0';
    requires 'URI',                       '1.64';
    requires 'IO::Socket::INET6',         '2.69';
};

feature 'node', 'munin node and plugins' => sub {
    requires 'Net::Server::Daemonize', '0.06';
    requires 'Net::Server::Fork',      '0';
    requires 'Net::SNMP',              '6.0.1';
    requires 'LWP::UserAgent',         '6.06';
};

on 'test' => sub {
    requires 'DBD::Pg',             '0';
    requires 'File::ReadBackwards', '0';
    requires 'File::Slurp',         '9999.19';
    requires 'IO::Scalar',          '0';
    requires 'Net::DNS',            '0';
    requires 'Net::IP',             '0';
    requires 'Test::Deep',          '0';
    requires 'Test::Differences',   '0.62';
    requires 'Test::LongString',    '0';
    requires 'Test::MockModule',    '0';
    requires 'Test::MockObject',    '0';
    requires 'XML::LibXML',         '0';
    requires 'XML::Parser',         '0';
};

on 'develop' => sub {
    requires 'Test::Perl::Critic', '0';
};
