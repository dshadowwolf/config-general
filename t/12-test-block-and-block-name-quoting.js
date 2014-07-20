var tap = require('tap'),
    plan = tap.plan,
    test = tap.test,
    parser = require('../index');
/*
 * ### 25
# Testing block and block name quoting
my $conf25 = Config::General->new(
  -String => <<TEST,
<block "/">
  opt1 val1
</block>
<"block2 /">
  opt2 val2
</"block2 /">
<"block 3" "/">
  opt3 val3
</"block 3">
<block4 />
  opt4 val4
</block4>
TEST
  -SlashIsDirectory => 1
);
my %h25 = $conf25->getall;
my %expected_h25 = (
  block => { '/' => { opt1 => 'val1' } },
  'block2 /' => { opt2 => 'val2' },
  'block 3' => { '/' => { opt3 => 'val3' } },
  block4 => { '/' => { opt4 => 'val4' } }
);
is_deeply(\%h25, \%expected_h25, "block and block name quoting");

 */

var base_string = '<block "/">\n  opt1 val1\n</block>\n<"block2 /">\n  opt2 val2\n</"block2 /">\n<"block 3" "/">\n  opt3 val3\n</"block 3">\n<block4 />\n  opt4 val4\n</block4>';
var conf25 = new parser.parser( { String: base_string, SlashIsDirectory: true } );
var h25 = conf25.getall();
var expected_h25 = {
  block: { '/': { opt1: 'val1' } },
  'block2 /': { opt2: 'val2' },
  'block 3': { '/': { opt3: 'val3' } },
  block4: { '/': { opt4: 'val4' } }
};

test("test block and block name quoting", function(t) {
  t.plan(1);
  t.isDeeply(h25,expected_h25,"block and block name quoting");
  t.end();
});
