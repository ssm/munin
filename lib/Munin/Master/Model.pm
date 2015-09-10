package Munin::Master::Model;
use Mojo::Base -base;
use Scalar::Util 'weaken';

sub new {
    my $class = shift;
    my $app = shift;
    my $self = { app => $app };
    weaken $self->{app};
    return bless $self, $class;
}

sub nav_groups {
    my $self = shift;

    my $query = << 'FOO';
SELECT
 g.name AS NAME,
 u.path AS URL,
 '' AS R_PATH
FROM
 grp g INNER JOIN
 url u ON u.id = g.id AND u.type = 'group'
WHERE g.p_id IS NULL
ORDER BY g.name ASC
FOO

    my $sth = $self->{app}->db->prepare_cached($query);
    $sth->execute();
    my $rootgroups = $sth->fetchall_arrayref( {} );
    return $rootgroups;
}

1;
