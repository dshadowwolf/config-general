var tap = require('tap'),
    plan = tap.plan,
    test = tap.test,
    parser = require('../index');

/*
my $conf44;
eval {
   $conf44 = new Config::General(-String => [ 'foo bar' ]);
};
ok(! $@, "-String arrayref");
is_deeply({ $conf44->getall }, { foo => 'bar' }, "-String arrayref contents");
*/

var conf44 = new parser.parser( { String: [ 'foo bar' ] } );
var h44 = conf44.getall();

test("verify if structural error checks are working", function(t) {
  t.plan(2);
  t.ok( h44, "String arrayref");
  t.isDeeply( h44, { foo: 'bar' }, "String arrayref contents");
  t.end();
});
