var tap = require('tap'),
    plan = tap.plan,
    test = tap.test,
    parser = require('../index');


var conf16 = new parser.parser({ConfigFile: 'cfg.16', InterPolateVars: true, StrictVars: false });
var h16 = conf16.getall();

var base_home = process.env.HOME;
process.env.HOME = '/home/theunexistent';
var env = '/home/theunexistent';

var config16a = new parser.parser({ConfigFile: 'cfg.16a',
                                   InterPolateVars: true,
                                   InterPolateEnv: true,
                                   StrictVars: false});
var h16a = config16a.getall();

test("test variable interpolation", function(t) {
  t.plan(2);
  t.ok( h16.etc.log === "/usr/log/logfile" &&
        h16.etc.users.home === "/usr/home/max" &&
        h16.dir.teri.bl !== undefined, "Testing variable interpolation");
  t.ok( h16a.etc.log === env+'/log/logfile', "Testing environment variable interpolation" );
  t.end();
});

process.env.HOME = base_home;
