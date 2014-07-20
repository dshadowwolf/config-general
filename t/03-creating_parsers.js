var tap = require('tap'),
    plan = tap.plan,
    test = tap.test,
    parser = require('../index');

test("test creating parser and getting parse results", function(t) {
  var conf  = new parser.parser( { 'ExtendedAccess':true, 'ConfigFile': 'test.rc'} );
  t.plan(2);
  t.ok( conf !== undefined , "Creating a new object from config file" );

  var conf2 = new parser.parser( { 'ExtendedAccess': true,
                                   'ConfigFile': "test.rc",
                                   'AllowMultiOptions': true } );
  t.ok( conf2 !== undefined && 'function' != typeof conf2,
       "Creating a new object using the hash parameter way");
  t.end();
});
