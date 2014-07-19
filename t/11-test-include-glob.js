var tap = require('tap'),
    plan = tap.plan,
    test = tap.test,
    parser = require('../index');
/*
 * my $conf24 = Config::General->new(
  -String => "<<include t/sub1/cfg.sub[123]{c,d,e}>>",
  -IncludeGlob => 1
);
my %h24 = $conf24->getall;
my %expected_h24 = (
  test => 'value',
  test2 => 'value2',
  test3 => 'value3'
);

 */
var conf24 = new parser.parser( { String: "<<include sub1/cfg.sub[123]{c,d,e}>>",
                                  IncludeGlob: true } );
var h24 = conf24.getall();
var expected_h24 = {
    test: 'value',
    test2: 'value2',
    test3: 'value3' };

test("test including directories", function(t) {
  t.plan(1);
  t.isDeeply(h24,expected_h24, "including a directory with IncludeDirectories");
  t.end();
});
