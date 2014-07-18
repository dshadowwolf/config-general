var tap = require('tap'),
    plan = tap.plan,
    test = tap.test,
    parser = require('../index');

var conf = new parser.parser( { 'ExtendedAccess': true,
                            'ConfigFile': 'test.rc' } );
var domain = conf.obj("domain");
var addr = domain.obj("bar.de");
var keys = conf.keys("domain");
var a;
if( conf.is_hash("domain") ) {
  var domains = conf.obj("domain");
  conf.keys("domain").forEach( function( el, ind, arr ) {
    var domain_obj = domains.obj(el);
    domains.keys(el).forEach( function( elem, index, array ) {
      a = domain_obj.value(elem);
    });
  });
}

test("extended functionality", function(t) {
  t.plan(4);
  t.ok( domain !== undefined, "Creating a new object from a block" );
  t.ok( addr !== undefined, "Creating a new object from a sub-block" );
  t.ok( keys !== undefined && keys.length > -1, "Getting values from the object" );
  t.ok( a !== undefined , "Using keys() and values()" );
  t.end();
});
