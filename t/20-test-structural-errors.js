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
  for( var i = 40; i <= 43; i++ ) {
    t.throws( function() { var conf = new parser.parser( { ConfigFile: "t/cfg."+i } ); }, undefined, ""+i+": Structural error checks");
  }
  t.end();
});
