var tap = require('tap'),
    plan = tap.plan,
    test = tap.test,
    parser = require('../index'),
    fu = require('../lib/file-utils.js');
var console = require('console'), util = require('util');

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

var h47 = conf47.getall();
var expect47 = {
          'var3': 'blah',
          'z1': {
                    'blak': '11111',
                    'nando': '9999'
                  },
          'a': {
                   'b': {
                            'm': {
                                     '9323': {
                                                 'g': '000',
                                                 'long': 'another long line'
                                               }
                                   },
                            'x': '9323',
                            'z': 'rewe'
                          }
                 },
          'onflag': true,
          'var2': 'zeppelin',
          'ignore': '$set',
          'quote': 'this should be \'kept: $set\' and not be \'$set!\'',
          'x5': {
                    'klack': '11111'
                  },
          'set': 'blah',
          'line': 'along line',
          'this': 'that',
          'imported': 'got that from imported config',
		'someflags': {
                           'RW': 2,
                           'LOCK': 1,
                           'TAINT': 3
                         },
          'var1': 'zero',
          'offflag': false,
          'cmd': 'mart@gw.intx.foo:22',
          'default': 'imported',
          'host': 'gw.intx.foo',
          'nando': '11111',
          'auch ätzendes': 'muss gehen',
          'Directory': {
                           '/': {
                                    'mode': '755'
                                  }
                         },
          'hansa': {
                       'z1': {
                                 'blak': '11111',
                                 'nando': '9999'
                               },
                       'Directory': {
                                        '/': {
                                                 'mode': '755'
                                               }
                                      },
                       'block': {
                                    '0': {
                                             'value': false
                                           }
                                  },
                       'x5': {
                                 'klack': '11111'
                               },
                       'Files': {
                                    '~/*.pl': {
                                                  'Options': '+Indexes'
                                                }
                                  },
                       'nando': '11111'
                     },
          'block': {
                       '0': {
                                'value': false
                              }
                     },
          'Files': {
                       '~/*.pl': {
                                     'Options': '+Indexes'
                                   }
                     },
          'a [[weird]] heredoc': 'has to\nwork\ntoo!'
};
conf47.save_file('complex.out');
var d = fu.getFile('complex.out');

var tr = new RegExp("imported = got that from imported config\\nline = along line\\nnando = 11111\\noffflag = false\\nonflag = true", 'mg');

var passfail = tr.test(d);

test("complexity test", function(t) {
  t.plan(2);
  t.isDeeply(h47,expect47, "complexity test");
  t.is(passfail,true,"Testing sorted save");
  t.end();
});
