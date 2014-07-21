var tap = require('tap'),
    plan = tap.plan,
    test = tap.test,
    parser = require('../index');

/*
#### 39 verifies bug rt#27225
# testing variable scope.
# a variable shall resolve to the value defined in the current
# scope, not a previous outer scope.
my $conf39 = new Config::General(-ConfigFile => "t/cfg.39", -InterPolateVars => 1, -StrictVars => 0);
my %conf39 = $conf39->getall();
isnt($conf39{outer}->{b1}->{inner}->{ivar},
     $conf39{outer}->{b2}->{inner}->{ivar},
     "Variable scope test");
*/

var conf39 = new parser.parser({ConfigFile: 'cfg.39', InterPolateVars: true, StrictVars: false});
var h39 = conf39.getall();
test("testing variable scope", function(t) {
  t.plan(1);
  t.isNot(h39.outer.b1.inner.ivar,h39.outer.b2.inner.ivar,"Variable scope test");
  t.end();
});
