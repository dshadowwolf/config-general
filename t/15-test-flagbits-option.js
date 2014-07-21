var tap = require('tap'),
    plan = tap.plan,
    test = tap.test,
    parser = require('../index');

/*
### 32
# check Flagbits
my $cfg28 = new Config::General(
  -String => "Mode = CLEAR | UNSECURE",
  -FlagBits => {
    Mode => {
      CLEAR    => 1,
      STRONG   => 1,
      UNSECURE => "32bit"
    }
 } );
my %cfg28 = $cfg28->getall();
is_deeply(\%cfg28,
{
 'Mode' => {
 'STRONG' => undef,
 'UNSECURE' => '32bit',
 'CLEAR' => 1
}}, "Checking -Flagbits resolving");
*/

var input = "Mode = CLEAR | UNSECURE";
var flags = {
  Mode: {
    CLEAR: 1,
    STRONG: 1,
    UNSECURE: "32bit"
  }
};

var conf27 = new parser.parser( { String: input, FlagBits: flags } );
var h27 = conf27.getall();
var expected_h27 = { Mode: { STRONG: undefined, UNSECURE: '32bit', CLEAR: 1 } };

test( "Check FlagBits", function(t) {
  t.plan(1);
  t.isDeeply(h27,expected_h27, "Checking FlagBits resolving");
  t.end();
});
