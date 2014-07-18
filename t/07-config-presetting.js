var tap = require('tap'),
    plan = tap.plan,
    test = tap.test,
    parser = require('../index');

var conf17 = new parser.parser( { ConfigFile: 'cfg.17',
                                  DefaultConfig: { home: '/exports/home',
                                                   logs: '/var/backlog',
                                                   foo: {
                                                     bar: 'quux'
                                                   }
                                                 },
                                  InterPolateVars: true,
                                  MergeDuplicateOptions: true,
                                  MergeDuplicateBlocks: true });

var h17 = conf17.getall();

// apparently we are not, despite requests to the contrary,
// actually getting a new object each time.
var conf18 = new parser.parser( { ConfigFile: 'cfg.17',
                                  DefaultConfig: 'home = /exports/home\nlogs = /var/backlog',
                                  MergeDuplicateOptions: true,
                                  MergeDuplicateBlocks: true,
                                  InterPolateVars: false,
                                  InterPolateEnv: false } );
var h18 = conf18.getall();

test( "Testing value pre-setting", function(t) {
  t.plan(2);
  t.ok( h17.home === '/home/users' &&
        h17.foo.quux === 'quux', "Testing value pre-setting using a hash" );
  t.ok( h18.home === "/home/users", "Testing value pre-setting using a string");
  t.end();
});
