var tap = require('tap'),
    plan = tap.plan,
    test = tap.test,
    parser = require('../index');

var cfg53 = new parser.parser( { String: "got = 1\nhave = '$got'", InterPolateVars: true, AllowSingleQuoteInterpolation: true } );
var hash53 = cfg53.getall();

test("test AllowSingleQuoteInterpolation", function(t) {
  t.plan(1);
  t.is(hash53.have,"'1'", "check AllowSingleQuoteInterpolation" );
  t.end();
});
