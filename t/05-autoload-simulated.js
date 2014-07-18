var tap = require('tap'),
    plan = tap.plan,
    test = tap.test,
    parser = require('../index');

var t15cbase = { 'name': 'Meier', 'prename': 'Max' };

var conf3 = new parser.parser( { 'ExtendedAccess': true,
                                 'ConfigHash': { 'name': "Moser", 'prename': "Hannes" } } );

var n = conf3.name();
var p = conf3.prename();
conf3.name("Meier");
conf3.prename("Max");
conf3.save_file("test.cfg");


test("Testing the extended \"accessor\" method in place of the perl-only \"AUTOLOAD\" methods", function(t) {
  t.plan(2);
  t.ok( n == "Moser" && p == "Hannes", "using the accessor to get the value works" );
  t.isDeeply( conf3.getall(), t15cbase, "using the accessor to set the value works" );
  t.end();
});
