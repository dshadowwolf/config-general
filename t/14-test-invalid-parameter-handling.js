var tap = require('tap'),
    plan = tap.plan,
    test = tap.test,
    parser = require('../index');


var opts = [
    {
      p: { ConfigHash: "StringNotHash" },
      t: "ConfigHash HASH required"
    },
    {
      p: {String: {}},
      t: "String STRING required"
    },
    {
      p: {ConfigFile: {}},
      t: "ConfigFile STRING required"
    },
    {
      p: {ConfigFile: "NoFile"},
      t: "ConfigFile STRING File must exist and be readable"
    }
];

test("Testing invalid parameter calls", function(t) {
  t.plan(4);

  opts.forEach( function(e,i,a) {
    t.throws( function() { var c = new parser.parser(e.p) },undefined,e.t);
  });

  t.end();
});

/*
### 27
# testing invalid parameter calls, expected to fail
foreach my $C (@pt) {
  eval {
    my $cfg = new Config::General(%{$C->{p}});
  };
  ok ($@, "check parameter failure handling $C->{t}");
}
*/
