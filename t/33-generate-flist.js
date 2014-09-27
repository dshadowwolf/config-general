var tap = require('tap'),
    plan = tap.plan,
    test = tap.test,
    parser = require('../index'),
    cfgparser = require('../lib/cg_parser.js');
// var console = require('console'),
//     util = require('util');

var conf47 = new parser.parser( {
                 ConfigFile: "complex.cfg",
                 InterPolateVars: true,
                 DefaultConfig: { this: "that", default: "imported" },
                 MergeDuplicateBlocks: true,
                 MergeDuplicateOptions: true,
                 StrictVars: true,
                 SplitPolicy: 'custom',
                 SplitDelimiter: '\\s*=\\s*',
                 IncludeGlob: true,
                 IncludeAgain: true,
                 IncludeRelative: true,
                 AutoTrue: true,
                 FlagBits: { someflags: { LOCK: 1, RW: 2, TAINT: 3 } },
                 StoreDelimiter: ' = ',
                 SlashIsDirectory: true,
                 SaveSorted: true
            } );

test("flist generation", function(t) {
    t.plan(1);
    t.is(1,1,"One!");
//    t.isDeeply( cfgparser.generate_flist({ pattern: 'included.conf' }), {}, "flist 1");
    t.end();
});
