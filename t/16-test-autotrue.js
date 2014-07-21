var tap = require('tap'),
    plan = tap.plan,
    test = tap.test,
    parser = require('../index');

/*
### 34
# testing -AutoTrue
my $cfg34 = new Config::General(-AutoTrue => 1, -ConfigFile => "t/cfg.34");
my %cfg34 = $cfg34->getall();
my %expect34 = (
		'a' => {
			'var6' => 0,
			'var3' => 1,
			'var1' => 1,
			'var4' => 0,
			'var2' => 1,
			'var5' => 0
		       },
		'b' => {
			'var6' => 0,
			'var3' => 1,
			'var1' => 1,
			'var4' => 0,
			'var2' => 1,
			'var5' => 0
		       }
	       );
is_deeply(\%cfg34, \%expect34, "Using -AutoTrue");
*/

var conf34 = new parser.parser( { AutoTrue: true, ConfigFile: 'cfg.34'} );
var h34 = conf34.getall();
var expected_h34 = {
		'a' : {
			'var6' : false,
			'var3' : true,
			'var1' : true,
			'var4' : false,
			'var2' : true,
			'var5' : false
		       },
		'b' : {
			'var6' : false,
			'var3' : true,
			'var1' : true,
			'var4' : false,
			'var2' : true,
			'var5' : false
		       }
	       };

test( "Test AutoTrue", function(t) {
  t.plan(1);
  t.isDeeply(h34,expected_h34, "testing autotrue");
  t.end();
});
