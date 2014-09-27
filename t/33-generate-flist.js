var tap = require('tap'),
    plan = tap.plan,
    test = tap.test,
    parser = require('../index'),
    parser = require('../lib/cg_parser');
//var foo = new cfgparser({});
//console.warn( foo ) ;
//console.warn(cfgparser.generate_flist( { pattern: 'included.conf'} ) );
// var console = require('console'),
//     util = require('util');


test("Basic flist generation", function(t) {
    t.plan(1);
    var conf = new parser( { ConfigFile: "cfg.33" } );
    t.isDeeply( conf.generate_flist({ pattern: 'included.conf' }), ["included.conf"], "basic flist");
    t.end();
});

test("Complex flist generation", function(t) {
    t.plan(1);
    var conf = new parser( {
        ConfigFile:             "../t/cfg.33",
        ConfigPath:             [ "../t/" ],
        IncludeDirectories:     true,
        IncludeRelative:        true,
        IncludeGlob:            true,
        MergeDuplicateBlocks:   true,
        InterPolateVars:        true
    });
    t.isDeeply( conf.generate_flist({ pattern: 'included.conf' }), ["../t/included.conf"], "complex flist");
    t.end();
});
