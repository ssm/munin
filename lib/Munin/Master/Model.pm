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

sub nav_problems {
    my $self = shift;

    my $query = << 'EOQ';
SELECT
 SUM(critical) AS NCRITICALS,
 SUM(warning) AS NWARNINGS,
 SUM(unknown) AS NUNKNOWNS
FROM ds;
EOQ

    my $sth = $self->{app}->db->prepare_cached($query);
    $sth->execute();
    my ($thing) = $sth->fetchall_arrayref( {} );
    return $thing;
}

sub nav_categories {
    my $self = shift;

    my $query = << 'EOT';
SELECT DISTINCT category
FROM service_categories
ORDER BY category ASC
EOT

    my $sth = $self->{app}->db->prepare_cached($query);
    $sth->execute();

    my $globalcats = [];
    while ( my ($_category) = $sth->fetchrow_array ) {
        my %urls = map { ( "URL$_" => "$_category-$_.html" ) } @{$self->{app}->config->{timeperiods}};
        push @$globalcats,
            {
            R_PATH => '',
            NAME   => $_category,
            %urls,
            };
    }
    return $globalcats;
}

sub top_groups {
    my $self = shift;

    my $top_groups_query = <<'EOQ';
SELECT grp.id
FROM grp
WHERE grp.p_id IS NULL
EOQ

    my $sth = $self->{app}->db->prepare_cached($top_groups_query);
    $sth->execute();
    return $sth->fetchall_arrayref({});
}

sub group {
    my $self = shift;
    my $group_id = shift;

    my $query = << 'EOQ';
WITH RECURSIVE subgroup_of(id) AS (
 VALUES(?) UNION SELECT grp.id from grp, subgroup_of
 WHERE grp.p_id = subgroup_of.id
)
SELECT grp.name, grp.id, grp.p_id, node.id, node.name
FROM
 grp LEFT JOIN
 node ON node.grp_id = grp.id
WHERE grp.id IN subgroup_of;
EOQ
    my $sth = $self->{app}->db->prepare_cached($query);
    $sth->bind_param(1, $group_id);
    $sth->execute();
    return $sth->fetchall_arrayref( {} );
}

sub categories {
    my $self = shift;
    return {};
}

sub problems {
    my $self = shift;

    my $query = << 'EOQ';
SELECT
 nu.path AS NODEURL,
 n.name AS NODENAME,
 su.path AS URL,
 su.path AS URLX,
 s.name AS LABEL,
 d.critical AS STATE_CRITICAL,
 d.warning AS STATE_WARNING,
 d.unknown AS STATE_UNKNOWN
FROM
 ds d
 LEFT OUTER JOIN service s ON s.id = d.service_id
 LEFT OUTER JOIN url su ON su.id = s.id and su.type = 'service'
 LEFT OUTER JOIN node n ON n.id = s.node_id
 LEFT OUTER JOIN url nu ON nu.id = n.id and nu.type = 'node'
WHERE
 d.critical = 1 OR
 d.warning = 1 OR
 d.unknown = 1
EOQ

    my $sth = $self->{app}->db->prepare_cached($query);
    $sth->execute();
    my $result = $sth->fetchall_arrayref( {} );
    return $result;
}

1;
