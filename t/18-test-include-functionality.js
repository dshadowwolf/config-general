var tap = require('tap'),
    plan = tap.plan,
    test = tap.test,
    parser = require('../index');

var conf36 = new parser.parser( { ConfigFile: 'dual-include.conf',
                                  IncludeAgain: true } );
var h36 = conf36.getall();
var expected_h36 = {
  'bit': {
    'one': {
      'honk': 'bonk'
    },
    'two': {
      'honk': 'bonk'
    }
  }
};

var conf37 = new parser.parser( {ConfigFile: 'dual-include.conf',
                                 IncludeAgain: false} );
var h37 = conf37.getall();
var expected_h37 = {
  'bit': {
    'one': {
      'honk': 'bonk'
    },
    'two': {}
  }
};

var conf38 = new parser.parser( { ConfigFile: 'apache-include.conf',
                                  IncludeAgain: true,
                                  UseApacheInclude: true } );
var h38 = conf38.getall();
var expected_h38 = {
  'bit': {
    'one': {
      'honk': 'bonk'
    },
    'two': {
      'honk': 'bonk'
    }
  }
};

test("Test include functionality and the IncludeAgain parameter", function(t) {
  t.plan(3);
  t.isDeeply( h36,expected_h36, "Included Twice" );
  t.isDeeply( h37,expected_h37, "Included once-only");
  t.isDeeply( h38,expected_h38, "Apache-style include");
  t.end();
});
