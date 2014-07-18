var tap = require('tap'),
    plan = tap.plan,
    test = tap.test,
    parser = require('../index');

var conf19 = new parser.parser("cfg.19");
var h19 = conf19.getall();
var works = 1;

Object.keys(h19).forEach( function(e,i,a) {
  if( /\s/.test(e) )
    works = 0;
});

test("testing various option/value assignment notations", function(t) {
  t.plan(1);
  t.ok(works, "Testing various option/value assignment notations");
  t.end();
});
