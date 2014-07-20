var tap = require('tap'),
    plan = tap.plan,
    test = tap.test,
    parser = require('../index');

/*
### 26
# Testing 0-value handling
my $conf26 = Config::General->new(
 -String => <<TEST,
<foo 0>
  0
</foo>
TEST
);
my %h26 = $conf26->getall;
my %expected_h26 = (
  foo => { 0 => { 0 => undef } },
);
is_deeply(\%h26, \%expected_h26, "testing 0-values in block names");

*/

var input = "<foo 0>\n0\n</foo>";
var conf26 = new parser.parser( { String: input } );
var h26 = conf26.getall();
var expected_h26 = { foo: { '0': { '0': undefined } } };

test( "Test null-value handling", function(t) {
  t.plan(1);
  t.isDeeply(h26,expected_h26, "testing null-values in block names");
  t.end();
});
