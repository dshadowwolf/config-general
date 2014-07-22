var tap = require('tap'),
    plan = tap.plan,
    test = tap.test,
    parser = require('../index');

/*
 * # check if disabling escape chars does work
my $cfg54 = new Config::General(-NoEscape => 1, -String => qq(val = \\\$notavar:\\blah\n));
my %hash54 = $cfg54->getall();
is($hash54{val}, qq(\\\$notavar:\\blah), "check -NoEscape");
 */
var cfg54 = new parser.parser( { NoEscape: true, String: "val = \\$notavar:\\blah\n" } );
var hash54 = cfg54.getall();

test("check if disabling escape chars does work", function(t) {
  t.plan(1);
  t.is(hash54.val,"\\$notavar:\\blah", "check NoEscape" );
  t.end();
});
