var tap = require('tap'),
    plan = tap.plan,
    test = tap.test,
    parser = require('../lib/cg_parser');
var console = require('console');

test("Basic flist generation", function(t) {
    t.plan(1);
    var conf = new parser( { ConfigFile: "cfg.33" } );
    t.isDeeply( conf.generate_flist({ pattern: 'included.conf' }), ["included.conf"], "basic flist");
    t.end();
});

test("Auto-Relative flist generation", function(t) {
    t.plan(1);
    var conf = new parser( {
        ConfigFile:             "../t/cfg.33",
        IncludeRelative:        true,
    });
    t.isDeeply( conf.generate_flist({ pattern: 'included.conf' }), ["../t/included.conf"], "Auto-Relative flist");
    t.end();
});

test("ConfigPath Relative flist generation", function(t) {
    t.plan(1);
    var conf = new parser( {
        ConfigFile:             "../t/cfg.33",
        ConfigPath:             [ "../t2/", "/etc" ],
        IncludeRelative:        true,
    });
    t.isDeeply( conf.generate_flist({ pattern: 'included.conf' }),
                ["../t/included.conf", "../t2/included.conf", "/etc/included.conf"],
                "ConfigPath Relative flist");
    t.end();
});
