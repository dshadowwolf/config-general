var tap = require('tap'),
    plan = tap.plan,
    test = tap.test,
    parser = require('../index');

var dupcount50 = 2000;
var ostr50 = "";

for( var i = dupcount50; i > 0; i-- ) {
  ostr50 = ostr50.concat(" 'luck"+i+"'");
}
ostr50 = ostr50.trimLeft();
var cfgsrc50 = 'test_single_many '+ostr50;
var cfg50 = new parser.parser( { String: cfgsrc50, InterPolateVars: true } );
var hash50 = cfg50.getall();

test("test a value consisting of a lot of single-quoted strings", function(t) {
  t.plan(1);
  t.is( hash50.test_single_many, ostr50, "value with single-quote strings is as expected" );
  t.end();
});
