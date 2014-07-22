var tap = require('tap'),
    plan = tap.plan,
    test = tap.test,
    parser = require('../index');


var ostr49 = "foo\n";
var cfg49 = new parser.parser( { String: ostr49 } );
var hash49 = cfg49.getall();

test("Test for handling of undefined values", function(t) {
  t.plan(2);
  t.ok( 'foo' in hash49, "value for undefined key found" );
  t.is( hash49.foo, undefined, "value returned as expected - undefined");
  t.end();
});
