var tap = require('tap'),
    plan = tap.plan,
    test = tap.test,
    parser = require('../index');

/*
# verifies bug rt#35766
my $conf46 = new Config::General(-ConfigFile => "t/cfg.46", -InterPolateVars => 1, -StrictVars => 0);
my %conf46 = $conf46->getall();
my $expect46 = {
		 'blah' => 'blubber',
		 'test' => 'bar \'variable $blah should be kept\' and \'$foo too\'',
		 'foo' => 'bar'
		};
is_deeply($expect46, \%conf46, "Variables inside single quotes");
*/

var conf46 = new parser.parser( { ConfigFile: 'cfg.46', InterPolateVars: true, StrictVars: false } );
var h46 = conf46.getall();
var expect46 =  {
    'blah': 'blubber',
    'test': 'bar \'variable $blah should be kept\' and \'$foo too\'',
    'foo': 'bar'
};

test("testing variable precedence", function(t) {
  t.plan(1);
  t.isDeeply( h46, expect46, "Variable precedence");
  t.end();
});
