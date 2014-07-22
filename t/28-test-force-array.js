var tap = require('tap'),
    plan = tap.plan,
    test = tap.test,
    parser = require('../index');

var cfg52 = new parser.parser( { String: "habeas = [ corpus ]", ForceArray: true } );
var hash52 = cfg52.getall();
var array52 = [ 'corpus' ];
cfg52.save_file('cfg.52.out');
var cfg52a = new parser.parser( { ConfigFile: 'cfg.52.out', ForceArray: true } );
var hash52a = cfg52a.getall();

test("check if forced single value arrays remain", function(t) {
  t.plan(2);
  t.isDeeply(hash52.habeas,array52, "check ForceArray single value arrays" );
  t.isDeeply(hash52a,hash52, "check ForceArray single value arrays during save");
  t.end();
});
