var tap = require('tap'),
    plan = tap.plan,
    test = tap.test,
    parser = require('../index');

/*
### 35
# testing -SplitPolicy
my %conf35 = Config::General::ParseConfig(
  -String =>
   qq(var1 :: alpha
      var2 :: beta
      var3 =  gamma  # use wrong delimiter by purpose),
  -SplitPolicy => 'custom',
  -SplitDelimiter => '\s*::\s*'
);
my %expect35 = (
		'var3 =  gamma' => undef,
		'var1' => 'alpha',
		'var2' => 'beta'
	      );
is_deeply(\%conf35, \%expect35, "Using -SplitPolicy and custom -SplitDelimiter");
*/

var conf35 = new parser.parser( { String: "var1 :: alpha\nvar2 :: beta\nvar3 = gamma", SplitPolicy: 'custom', SplitDelimiter: '\s*::\s*' } );
var h35 = conf35.getall();
var expected_h35 = {
    'var3 = gamma': undefined,
    'var1' : 'alpha',
    'var2' : 'beta'
};

test( "Test SplitPolicy", function(t) {
  t.plan(1);
  t.isDeeply(h35,expected_h35, "testing SplitPolicy");
  t.end();
});
