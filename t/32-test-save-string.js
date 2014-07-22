var tap = require('tap'),
    plan = tap.plan,
    test = tap.test,
    parser = require('../index'),
    fu = require('../lib/file-utils');

var conf56 = new parser.parser("cfg.8");
conf56.save_file("cfg.out");
var base = fu.getFile('cfg.out');
var data = conf56.save_string();

test("test save_string", function(t) {
  t.plan(1);
  t.is(data, base, "saved data is equal to save_string data" );
  t.end();
});
