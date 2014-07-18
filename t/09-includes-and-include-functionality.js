var tap = require('tap'),
    plan = tap.plan,
    test = tap.test,
    parser = require('../index');

var conf20 = new parser.parser( { ConfigFile: 'cfg.20.a',
                                  MergeDuplicateOptions: true } );
var h20 = conf20.getall();
var c20files = conf20.files();
var expected = [ 'cfg.20.a', 'cfg.20.b', 'cfg.20.c' ];

var conf21 = new parser.parser( { ConfigFile: 'sub1/sub2/sub3/cfg.sub3',
                                  MergeDuplicateOptions: true } );

var conf22 = new parser.parser( { ConfigFile: 'sub1/sub2/sub3/cfg.sub3',
                                  MergeDuplicateOptions: true,
                                  IncludeRelative: true } );

var h22 = conf22.getall();
var expected_h22 = { 'sub3_seen': 'yup',
                     'sub2_seen': 'yup',
                     'sub2b_seen': 'yup',
                     'sub1b_seen': 'yup',
                     'sub1_seen': 'yup',
                     'fruit': 'mango'
                   };

test("testings include and related functionality", function(t) {
  t.plan(3);
  t.isDeeply(c20files,expected,"testing files() method");
  t.ok(conf21.getall().fruit == 'apple', "prevented from loading relative cfgs without IncludeRelative");
  t.isDeeply(h22,expected_h22, "loaded relative to include files works fine");
  t.end();
});
