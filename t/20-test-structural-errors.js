var tap = require('tap'),
    plan = tap.plan,
    test = tap.test,
    parser = require('../index');

/*
### 40 - 42 verify if structural error checks are working
foreach my $pos (40 .. 43) {
  eval {
    my $conf = new Config::General(-ConfigFile => "t/cfg.$pos");
  };
  ok($@ =~ /^Config::General/, "$pos: Structural error checks");
}
*/

test("verify if structural error checks are working", function(t) {
  t.plan(4);
  t.throws( function() { var c = new parser.parser( { ConfigFile: 'cfg.40' } ); }, undefined, "40: Structural error checks");
  t.throws( function() { var c = new parser.parser( { ConfigFile: 'cfg.41' } ); }, undefined, "41: Structural error checks");
  t.throws( function() { var c = new parser.parser( { ConfigFile: 'cfg.42' } ); }, undefined, "42: Structural error checks");
  t.throws( function() { var c = new parser.parser( { ConfigFile: 'cfg.43' } ); }, undefined, "43: Structural error checks");
  t.end();
});
