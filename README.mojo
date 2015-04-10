* Munin Mojo

** Web frontend

*** Questions...

    All in the same command "munin", or "munin-web"?

    Split into "munin-mojo" and "munin-minion"?

*** Web server

    Runs mojolicious and minion, handles requests graphs, pages and static files.

    Shares a connection to the backend.

#+BEGIN_SRC perl
my $minion = Minion->new(File => 'sandbox/var/lib/queue.db');
#+END_SRC

    Anything more intensive than file serving and page rendering is
    sent to the backend worker for processing.

**** graphs

     Request for RRD graphs are sent to the minion.

**** worker status

     Some introspection could be done.  Connect to the backend queue
     and look at what it is doing.  Show graph jobs currently
     processing, completed and failed?

*** Workers

    Generates graphs on demand.  Runs minion, and picks up tasks from
    the queue.

** Backend

*** Update

*** Notification

**** Limits

     Notifies other systems whenever a data source passes a defined
     limit. OK, Warning and Critical limits are defined as ranges, and
     whenever a data source value crosses one, a limit message is
     sent.

     Optional: Handling "Unknown".

     Today: Events are passed through a template, and sent to an
     executable.  Keep, and document better.

**** Export

     Sends a copy of all data to $elsewhere on some format.

     Example: Graphite.  Elasticsearch.

** Example implementation

*** Web frontend

    Reads the current sqlite db once, on startup.

    Serves files and templates.  Hands off image generation to the
    graph worker.

*** Graph worker

    Generates graphs on demand.
