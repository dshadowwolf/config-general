var tap = require('tap'),
    plan = tap.plan,
    test = tap.test,
    parser = require('../index');

/*
# check for line continuation followed by empty line (rt.cpan.org#39814)
my $cfg55 = new Config::General( -ConfigFile => "t/cfg.55" );
my %hash55 = $cfg55->getall();
is($hash55{b}, "nochop", "check continuation followed by empty line");
*/
var cfg55 = new parser.parser( { ConfigFile: 'cfg.55' } );
var hash55 = cfg55.getall();

test("check for line continuation followed by empty line", function(t) {
  t.plan(1);
  t.is(hash55.b,"nochop", "check continuation followed by empty line" );
  t.end();
});
