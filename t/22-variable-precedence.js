var tap = require('tap'),
    plan = tap.plan,
    test = tap.test,
    parser = require('../index');

/*
# verifies bug rt#35122
my $conf45 = new Config::General(-ConfigFile => "t/cfg.45", -InterPolateVars => 1, -StrictVars => 0);
my %conf45 = $conf45->getall();
my $expect45 = {
		'block1' => {
			     'param5' => 'value3',
			     'param4' => 'value1',
			     'param2' => 'value3'
			    },
		'block2' => {
			     'param7' => 'value2',
			     'param6' => 'value1'
			    },
		'param2' => 'value2',
		'param1' => 'value1'
	       };
is_deeply($expect45, \%conf45, "Variable precedence");
*/

var conf45 = new parser.parser( { ConfigFile: 'cfg.45', InterPolateVars: true, StrictVars: false } );
var h45 = conf45.getall();
var expect45 =  {
		'block1': {
			     'param5': 'value3',
			     'param4': 'value1',
			     'param2': 'value3'
			    },
		'block2': {
			     'param7': 'value2',
			     'param6': 'value1'
			    },
		'param2': 'value2',
		'param1': 'value1'
	       };

test("testing variable precedence", function(t) {
  t.plan(1);
  t.isDeeply( h45, expect45, "Variable precedence");
  t.end();
});
