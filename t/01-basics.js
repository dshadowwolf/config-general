var tap = require('tap'),
    plan = tap.plan,
    test = tap.test,
    fs = require('fs'),
    parser = require('../index');

test("basic tests", function(t) {
    t.plan(12);

  function test_func() { conf = new parser.parser(cfg); }
    for( var num = 2; num < 8; num++ ) {
	var cfg = "cfg."+num;
	var data = fs.readFileSync(cfg, 'utf8');
	var fst = data.split('\n')[0].trim();
	fst = fst.replace(/\#\s*/g, "");
	var conf;
	t.doesNotThrow( test_func,"config loads successfully");
      if( conf === undefined )
        conf = new parser.parser(cfg);
      t.ok( conf.getall(), fst );
    }
    t.end();
});
