var tap = require('tap'),
    plan = tap.plan,
    test = tap.test,
    parser = require('../index');


var cfg51 = new parser.parser( { ConfigFile: 'cfg.51' } );
var hash51 = cfg51.getall();
cfg51.save_file('cfg.51.out');
var cfg51a = new parser.parser( { ConfigFile: 'cfg.51.out', InterPolateVars: true } );
var hash51a = cfg51a.getall();

test("test escaped characters and if they are saved properly", function(t) {
  t.plan(6);
  t.is( hash51.dollar, '$foo', "keep escaped dollar character");
  t.is( hash51.backslash, 'contains \\ backslash', "keep escaped backslash character");
  t.is(hash51.prize, '18 $', "keep un-escaped dollar character");
  t.is(hash51.hostparam, "\"'wsh.dir'\"", "keep escaped quote character");
  t.is(hash51.bgcolor, '#fff', "keep escaped number sign");
  t.isDeeply(hash51, hash51a, "compare saved config containing escaped chars");
  t.end();
});
