var tap = require('tap'),
    plan = tap.plan,
    test = tap.test,
    parser = require('../index');

var conf23 = new parser.parser( { String: "<<include sub1>>",
                                  IncludeDirectories: true } );
var h23 = conf23.getall();
var expected_h23 = {
    fruit: 'mango',
    sub1_seen: 'yup',
    sub1b_seen: 'yup',
    test: 'value',
    test2: 'value2',
    test3: 'value3' };

test("test including directories", function(t) {
  t.plan(1);
  t.isDeeply(h23,expected_h23, "including a directory with IncludeDirectories");
  t.end();
});
