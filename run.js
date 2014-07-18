var console = require('console'),
    util = require('util'),
    tap = require('tap'),
    plan = tap.plan,
    test = tap.test,
    fs = require('fs'),
    parser = require('./index');

plan(14);

test("basic tests", function(t) {
    t.plan(12);

  function test_func() { conf = new parser.parser(cfg); }
    for( var num = 2; num < 8; num++ ) {
	var cfg = "t/cfg."+num;
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


var t8conf1 = new parser.parser("t/cfg.8");
var base_data = t8conf1.getall();
t8conf1.save_file("t/cfg.out");
var t8conf2 = new parser.parser("t/cfg.out");
var data_copy = t8conf2.getall();

test("saving configs and heredoc processing", function(t) {
  t.plan(2);
  t.isDeeply(base_data,data_copy,"Writing Config Hash to disk and compare with original");
  t.like(data_copy.nocomment, /this should appear/, "C-comments not processed in here-doc" );
  t.end();
});

var conf;
var res, res1;
test("test creating parser and getting parse results", function(t) {
  conf  = new parser.parser( { 'ExtendedAccess':true, 'ConfigFile': 't/test.rc'} );
  t.plan(1);
  t.ok( conf , "Creating a new object from config file" );
  t.end();
});

test(function(t) {
  var conf2 = new parser.parser( { 'ExtendedAccess': true,
                                   'ConfigFile': "t/test.rc",
                                   'AllowMultiOptions': "yes" } );
  t.plan(1);
  t.ok( conf2 !== undefined && 'function' != typeof conf2,
       "Creating a new object using the hash parameter way");
  t.end();
});

conf = new parser.parser( { 'ExtendedAccess': true,
                            'ConfigFile': 't/test.rc' } );
test("extended functionality", function(t) {
var domain = conf.obj("domain");
var addr = domain.obj("bar.de");
var keys = conf.keys("domain");
  t.plan(3);
  t.ok( domain !== undefined, "Creating a new object from a block" );
  t.ok( addr !== undefined, "Creating a new object from a sub-block" );
  t.ok( keys !== undefined && keys.length > -1, "Getting values from the object" );
  t.end();
});

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

test("test various OO methods", function(t) {
  t.plan(1);
  t.ok( a !== undefined , "Using keys() and values()" );
  t.end();
});

/*
 * Perl offers some nifty features that I was unable to replicate.
 * Instead I've had to use a javascript style of system where the
 * accesses are through a function - with the same constraints as
 * the Perl version when calling with a parameter. When called with
 * no parameter, you will get the actual value.
 *
 * Example of the Perl:
 *   my $conf3 = new Config::General(
 *      -ExtendedAccess => 1,
 *      -ConfigHash     => { name => "Moser", prename => "Hannes"}
 *   );
 *   my $n = $conf3->name;
 *   my $p = $conf3->prename;
 *   $conf3->name("Meier");
 *   $conf3->prename("Max");
 *   $conf3->save_file("t/test.cfg");
 * In Javascript the 'my $n' line would be:
 *   var n = conf3.name()
 */
var t15cbase = { 'name': 'Meier', 'prename': 'Max' };

var conf3 = new parser.parser( { 'ExtendedAccess': true,
                                 'ConfigHash': { 'name': "Moser", 'prename': "Hannes" } } );

var n = conf3.name();
var p = conf3.prename();
conf3.name("Meier");
conf3.prename("Max");
conf3.save_file("t/test.cfg");


test("Testing the extended \"accessor\" method in place of the perl-only \"AUTOLOAD\" methods", function(t) {
  t.plan(2);
  t.ok( n == "Moser" && p == "Hannes", "using the accessor to get the value works" );
  t.isDeeply( conf3.getall(), t15cbase, "using the accessor to set the value works" );
  t.end();
});



var conf16 = new parser.parser({ConfigFile: 't/cfg.16', InterPolateVars: true, StrictVars: false });
var h16 = conf16.getall();

test("test variable interpolation", function(t) {
  t.plan(1);
  t.ok( h16.etc.log === "/usr/log/logfile" &&
        h16.etc.users.home === "/usr/home/max" &&
        h16.dir.teri.bl !== undefined, "Testing variable interpolation");
  t.end();
});

var base_home = process.env.HOME;
process.env.HOME = '/home/theunexistent';
var env = '/home/theunexistent';

var config16a = new parser.parser({ConfigFile: 't/cfg.16a',
                                   InterPolateVars: true,
                                   InterPolateEnv: true,
                                   StrictVars: false});
var h16a = config16a.getall();
test("Testing environment variable interpolation", function(t) {
  t.plan(1);
  t.ok( h16a.etc.log === env+'/log/logfile', "Testing environment variable interpolation" );
  t.end();
});
process.env.HOME = base_home;

var conf17 = new parser.parser( { ConfigFile: 't/cfg.17',
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
test( "Testing value pre-setting using a hash", function(t) {
  t.plan(1);
  t.ok( h17.home === '/home/users' &&
        h17.foo.quux === 'quux', "Testing value pre-setting using a hash" );
  t.end();
});

// apparently we are not, despite requests to the contrary,
// actually getting a new object each time.
var conf18 = new parser.parser( { ConfigFile: 't/cfg.17',
                                  DefaultConfig: 'home = /exports/home\nlogs = /var/backlog',
                                  MergeDuplicateOptions: true,
                                  MergeDuplicateBlocks: true,
                                  InterPolateVars: false,
                                  InterPolateEnv: false } );
var h18 = conf18.getall();
test("testing value pre-setting using a string", function(t) {
  t.plan(1);
  t.ok( h18.home === "/home/users", "Testing value pre-setting using a string");
  t.end();
});

var conf19 = new parser.parser("t/cfg.19");
var h19 = conf19.getall();
var works = 1;

Object.keys(h19).forEach( function(e,i,a) {
  if( /\s/.test(e) )
    works = 0;
});

test("testing various option/value assignment notations", function(t) {
  t.plan(1);
  t.ok(works, "Testing various option/value assignment notations");
  t.end();
});

var conf20 = new parser.parser( { ConfigFile: 't/cfg.20.a',
                                  MergeDuplicateOptions: true } );
var h20 = conf20.getall();
var c20files = conf20.files();
var expected = [ 't/cfg.20.a', 't/cfg.20.b', 't/cfg.20.c' ];

test("testing files() method", function(t) {
  t.plan(1);
  t.isDeeply(c20files,expected,"testing files() method");
  t.end();
});

var conf21 = new parser.parser( { ConfigFile: 't/sub1/sub2/sub3/cfg.sub3',
                                  MergeDuplicateOptions: true } );

var conf22 = new parser.parser( { ConfigFile: 't/sub1/sub2/sub3/cfg.sub3',
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

test("testing improved IncludeRelative option", function(t) {
  t.plan(2);
  t.ok(conf21.getall().fruit == 'apple', "prevented from loading relative cfgs without IncludeRelative");
  t.isDeeply(h22,expected_h22, "loaded relative to include files works fine");
  t.end();
});




/*
### 23
# Now try with -IncludeRelative
# this should fail
my $conf22 = Config::General->new(
    -file => "t/sub1/sub2/sub3/cfg.sub3",
    -MergeDuplicateOptions => 1,
    -IncludeRelative       => 1,
);
my %h22 = $conf22->getall;
my %expected_h22 = (
    'sub3_seen'  => 'yup',
    'sub2_seen'  => 'yup',
    'sub2b_seen' => 'yup',
    'sub1_seen'  => 'yup',
    'sub1b_seen' => 'yup',
    'fruit'      => 'mango',
);
is_deeply(\%h22, \%expected_h22, "loaded relative to included files");


### 24
# Testing IncludeDirectories option
my $conf23 = Config::General->new(
  -String => "<<include t/sub1>>",
  -IncludeDirectories => 1
);
my %h23 = $conf23->getall;
my %expected_h23 = (
  fruit => 'mango',
  sub1_seen => 'yup',
  sub1b_seen => 'yup',
  test => 'value',
  test2 => 'value2',
  test3 => 'value3'
);
is_deeply(\%h23, \%expected_h23, "including a directory with -IncludeDirectories");


### 24
# Testing IncludeGlob option
my $conf24 = Config::General->new(
  -String => "<<include t/sub1/cfg.sub[123]{c,d,e}>>",
  -IncludeGlob => 1
);
my %h24 = $conf24->getall;
my %expected_h24 = (
  test => 'value',
  test2 => 'value2',
  test3 => 'value3'
);
is_deeply(\%h24, \%expected_h24, "including multiple files via glob pattern with -IncludeGlob");


### 25
# Testing block and block name quoting
my $conf25 = Config::General->new(
  -String => <<TEST,
<block "/">
  opt1 val1
</block>
<"block2 /">
  opt2 val2
</"block2 /">
<"block 3" "/">
  opt3 val3
</"block 3">
<block4 />
  opt4 val4
</block4>
TEST
  -SlashIsDirectory => 1
);
my %h25 = $conf25->getall;
my %expected_h25 = (
  block => { '/' => { opt1 => 'val1' } },
  'block2 /' => { opt2 => 'val2' },
  'block 3' => { '/' => { opt3 => 'val3' } },
  block4 => { '/' => { opt4 => 'val4' } }
);
is_deeply(\%h25, \%expected_h25, "block and block name quoting");


### 26
# Testing 0-value handling
my $conf26 = Config::General->new(
 -String => <<TEST,
<foo 0>
  0
</foo>
TEST
);
my %h26 = $conf26->getall;
my %expected_h26 = (
  foo => { 0 => { 0 => undef } },
);
is_deeply(\%h26, \%expected_h26, "testing 0-values in block names");



#
# look if invalid input gets rejected right
#

### 27
# testing invalid parameter calls, expected to fail
my @pt = (
	  {
	   p => {-ConfigHash => "StringNotHash"},
	   t => "-ConfigHash HASH required"
	  },
	  {
	   p => {-String => {}},
	   t => "-String STRING required"
	  },
	  {
	   p => {-ConfigFile => {}},
	   t => "-ConfigFile STRING required"
	   },
	  {
	   p => {-ConfigFile => "NoFile"},
	   t => "-ConfigFile STRING File must exist and be readable"
	   }
);
foreach my $C (@pt) {
  eval {
    my $cfg = new Config::General(%{$C->{p}});
  };
  ok ($@, "check parameter failure handling $C->{t}");
}



### 32
# check Flagbits
my $cfg28 = new Config::General(
  -String => "Mode = CLEAR | UNSECURE",
  -FlagBits => {
    Mode => {
      CLEAR    => 1,
      STRONG   => 1,
      UNSECURE => "32bit"
    }
 } );
my %cfg28 = $cfg28->getall();
is_deeply(\%cfg28,
{
 'Mode' => {
 'STRONG' => undef,
 'UNSECURE' => '32bit',
 'CLEAR' => 1
}}, "Checking -Flagbits resolving");



### 33
# checking functional interface
eval {
  my %conf = Config::General::ParseConfig(-ConfigFile => "t/test.rc");
  Config::General::SaveConfig("t/test.rc.out", \%conf);
  my %next = Config::General::ParseConfig(-ConfigFile => "t/test.rc.out");
  my @a = sort keys %conf;
  my @b = sort keys %next;
  if (@a != @b) {
    die "Re-parsed result differs from original";
  }
};
ok(! $@, "Testing functional interface $@");



### 34
# testing -AutoTrue
my $cfg34 = new Config::General(-AutoTrue => 1, -ConfigFile => "t/cfg.34");
my %cfg34 = $cfg34->getall();
my %expect34 = (
		'a' => {
			'var6' => 0,
			'var3' => 1,
			'var1' => 1,
			'var4' => 0,
			'var2' => 1,
			'var5' => 0
		       },
		'b' => {
			'var6' => 0,
			'var3' => 1,
			'var1' => 1,
			'var4' => 0,
			'var2' => 1,
			'var5' => 0
		       }
	       );
is_deeply(\%cfg34, \%expect34, "Using -AutoTrue");



### 35
# testing -SplitPolicy
my %conf35 = Config::General::ParseConfig(
  -String =>
   qq(var1 :: alpha
      var2 :: beta
      var3 =  gamma  # use wrong delimiter by purpose),
  -SplitPolicy => 'custom',
  -SplitDelimiter => '\s*::\s*'
);
my %expect35 = (
		'var3 =  gamma' => undef,
		'var1' => 'alpha',
		'var2' => 'beta'
	      );
is_deeply(\%conf35, \%expect35, "Using -SplitPolicy and custom -SplitDelimiter");



### Include both
my $conf36 = Config::General->new( -ConfigFile => "t/dual-include.conf",
                                 -IncludeAgain => 1 );
my %C36 = $conf36->getall;
is_deeply( \%C36, { bit => { one => { honk=>'bonk' },
                           two => { honk=>'bonk' }
                }        }, "Included twice" );


### Include once
{
    my @expected_warning;
    local $SIG{__WARN__} = sub { push @expected_warning, @_};

    my $conf37 = Config::General->new( "t/dual-include.conf" );
    my %C37 = $conf37->getall;
    is_deeply( \%C37, { bit => { one => { honk=>'bonk' },
				 two => {}
			}        }, "Included once-only" );

    is( @expected_warning, 1, "1 Expected warning" );
    like( $expected_warning[0], qr/File .* already loaded.  Use -IncludeAgain to load it again./ms, "Warns about a file already being loaded" );
}


### apache-style Include
my $conf38 = Config::General->new( -ConfigFile => "t/apache-include.conf",
                              -IncludeAgain => 1,
                              -UseApacheInclude => 1 );
my %C38 = $conf38->getall;
is_deeply( \%C38, { bit => { one => { honk=>'bonk' },
                           two => { honk=>'bonk' }
                }        }, "Apache-style include" );

#### 39 verifies bug rt#27225
# testing variable scope.
# a variable shall resolve to the value defined in the current
# scope, not a previous outer scope.
my $conf39 = new Config::General(-ConfigFile => "t/cfg.39", -InterPolateVars => 1, -StrictVars => 0);
my %conf39 = $conf39->getall();
isnt($conf39{outer}->{b1}->{inner}->{ivar},
     $conf39{outer}->{b2}->{inner}->{ivar},
     "Variable scope test");

### 40 - 42 verify if structural error checks are working
foreach my $pos (40 .. 43) {
  eval {
    my $conf = new Config::General(-ConfigFile => "t/cfg.$pos");
  };
  ok($@ =~ /^Config::General/, "$pos: Structural error checks");
}

my $conf44;
eval {
   $conf44 = new Config::General(-String => [ 'foo bar' ]);
};
ok(! $@, "-String arrayref");
is_deeply({ $conf44->getall }, { foo => 'bar' }, "-String arrayref contents");



# verifies bug rt#35122
my $conf45 = new Config::General(-ConfigFile => "t/cfg.45", -InterPolateVars => 1, -StrictVars => 0);
my %conf45 = $conf45->getall();
my $expect45 = {
		'block1' => {
			     'param5' => 'value3',
			     'param4' => 'value1',
			     'param2' => 'value3'
			    },
		'block2' => {
			     'param7' => 'value2',
			     'param6' => 'value1'
			    },
		'param2' => 'value2',
		'param1' => 'value1'
	       };
is_deeply($expect45, \%conf45, "Variable precedence");

# verifies bug rt#35766
my $conf46 = new Config::General(-ConfigFile => "t/cfg.46", -InterPolateVars => 1, -StrictVars => 0);
my %conf46 = $conf46->getall();
my $expect46 = {
		 'blah' => 'blubber',
		 'test' => 'bar \'variable $blah should be kept\' and \'$foo too\'',
		 'foo' => 'bar'
		};
is_deeply($expect46, \%conf46, "Variables inside single quotes");





# complexity test
# check the combination of various features
my $conf47 = new Config::General(
				 -ConfigFile => "t/complex.cfg",
				 -InterPolateVars => 1,
				 -DefaultConfig => { this => "that", default => "imported" },
				 -MergeDuplicateBlocks => 1,
				 -MergeDuplicateOptions => 1,
				 -StrictVars => 1,
				 -SplitPolicy => 'custom',
				 -SplitDelimiter => '\s*=\s*',
				 -IncludeGlob => 1,
				 -IncludeAgain => 1,
				 -IncludeRelative => 1,
				 -AutoTrue => 1,
				 -FlagBits => { someflags => { LOCK => 1, RW => 2, TAINT => 3 } },
				 -StoreDelimiter => ' = ',
				 -SlashIsDirectory => 1,
				 -SaveSorted => 1
				);
my %conf47 = $conf47->getall();
my $expect47 = {
          'var3' => 'blah',
          'z1' => {
                    'blak' => '11111',
                    'nando' => '9999'
                  },
          'a' => {
                   'b' => {
                            'm' => {
                                     '9323' => {
                                                 'g' => '000',
                                                 'long' => 'another long line'
                                               }
                                   },
                            'x' => '9323',
                            'z' => 'rewe'
                          }
                 },
          'onflag' => 1,
          'var2' => 'zeppelin',
          'ignore' => '$set', # escaped $ should get to plain $, not \\$!
          'quote' => 'this should be \'kept: $set\' and not be \'$set!\'',
          'x5' => {
                    'klack' => '11111'
                  },
          'set' => 'blah',
          'line' => 'along line',
          'this' => 'that',
          'imported' => 'got that from imported config',
		'someflags' => {
                           'RW' => 2,
                           'LOCK' => 1,
                           'TAINT' => 3
                         },
          'var1' => 'zero',
          'offflag' => 0,
          'cmd' => 'mart@gw.intx.foo:22',
          'default' => 'imported',
          'host' => 'gw.intx.foo',
          'nando' => '11111',
          'auch �tzendes' => 'muss gehen',
          'Directory' => {
                           '/' => {
                                    'mode' => '755'
                                  }
                         },
          'hansa' => {
                       'z1' => {
                                 'blak' => '11111',
                                 'nando' => '9999'
                               },
                       'Directory' => {
                                        '/' => {
                                                 'mode' => '755'
                                               }
                                      },
                       'block' => {
                                    '0' => {
                                             'value' => 0
                                           }
                                  },
                       'x5' => {
                                 'klack' => '11111'
                               },
                       'Files' => {
                                    '~/*.pl' => {
                                                  'Options' => '+Indexes'
                                                }
                                  },
                       'nando' => '11111'
                     },
          'block' => {
                       '0' => {
                                'value' => 0
                              }
                     },
          'Files' => {
                       '~/*.pl' => {
                                     'Options' => '+Indexes'
                                   }
                     },
          'a [[weird]] heredoc' => 'has to
  work
  too!'
};
#scip
is_deeply($expect47, \%conf47, "complexity test");

# check if sorted save works
$conf47->save_file("t/complex.out", \%conf47);
open T, "<t/complex.out";
my $got47 = join '', <T>;
close T;
my $sorted = qq(
imported = got that from imported config
line = along line
nando = 11111
offflag = 0
onflag = 1);
if ($got47 =~ /\Q$sorted\E/) {
  pass("Testing sorted save");
}
else {
  fail("Testing sorted save");
}



tie my %hash48, "Tie::IxHash";
my $ostr48 =
"zeppelin   1
beach   2
anathem   3
mercury   4\n";
my $cfg48 = new Config::General(
    -String => $ostr48,
    -Tie => "Tie::IxHash"
   );
%hash48 = $cfg48->getall();
my $str48 = $cfg48->save_string(\%hash48);
is( $str48, $ostr48, "tied hash test");



# check for undef and -w
{
my $ostr49 = "foo\n";
local $^W = 1;
my $cfg49 =  new Config::General( -String => $ostr49 );
my %hash49 = $cfg49->getall();
ok( exists $hash49{foo}, "value for undefined key found");
is( $hash49{foo}, undef, "value returned as expected - undef");

# repeat with interpolation turned on
$cfg49 =  new Config::General( -String => $ostr49, -InterPolateVars => 1 );
%hash49 = $cfg49->getall();
ok( exists $hash49{foo}, "value for undefined key found");
is( $hash49{foo}, undef, "value returned as expected - undef");
$^W = 0;
}


# verifies bug fix rt#54580
# Test handling of values containing *many* single-quoted strings
# when -InterPolateVars option is set
my $dupcount50 = 2000;
my $ostr50;
foreach my $counter ( reverse 1 .. $dupcount50 ) {
  $ostr50 .= " 'luck${counter}'";
}
$ostr50 =~ s{\A }{};
my $cfgsrc50 = 'test_single_many ' . $ostr50;
$cfg50 =  new Config::General( -String => $cfgsrc50, -InterPolateVars => 1 );
%hash50 = $cfg50->getall();
is($hash50{test_single_many}, $ostr50, "value with single-quote strings is as expected" );


# check for escaped chars
my $cfg51  =  new Config::General( -ConfigFile => "t/cfg.51" );
my %hash51 = $cfg51->getall();
is($hash51{dollar},    '$foo',                 "keep escaped dollar character");
is($hash51{backslash}, 'contains \ backslash', "keep escaped backslash character");
is($hash51{prize},     '18 $',                 "keep un-escaped dollar character");
is($hash51{hostparam}, q("'wsh.dir'"),         "keep escaped quote character");
is($hash51{bgcolor},   '#fff',                 "keep escaped number sign");

# now save it to a file and re-read it in and see if everything remains escaped
$cfg51->save_file("t/cfg.51.out");
$cfg51  =  new Config::General( -ConfigFile => "t/cfg.51.out", -InterPolateVars => 1 );
my %hash51new = $cfg51->getall();
is_deeply(\%hash51, \%hash51new, "compare saved config containing escaped chars");


# check if forced single value arrays remain
my $cfg52  = new Config::General( -String => "habeas = [ corpus ]", -ForceArray => 1);
my %hash52 = $cfg52->getall();
my @array52 = qw(corpus);
is_deeply($hash52{habeas}, \@array52, "check -ForceArray single value arrays");
$cfg52->save_file("t/cfg.52.out");
$cfg52 = new Config::General( -ConfigFile => "t/cfg.52.out", -ForceArray => 1);
my %hash52new = $cfg52->getall();
is_deeply(\%hash52new, \%hash52, "check -ForceArray single value arrays during save()");

my $cfg53 = new Config::General(-AllowSingleQuoteInterpolation => 1, -String => "got = 1\nhave = '\$got'", -InterPolateVars => 1 );
my %hash53 = $cfg53->getall();
is($hash53{have}, "'1'", "check -AllowSingleQuoteInterpolation");


# Make sure no warnings were seen during the test.
ok( !@WARNINGS_FOUND, "No unexpected warnings seen" );

# check if disabling escape chars does work
my $cfg54 = new Config::General(-NoEscape => 1, -String => qq(val = \\\$notavar:\\blah\n));
my %hash54 = $cfg54->getall();
is($hash54{val}, qq(\\\$notavar:\\blah), "check -NoEscape");

# check for line continuation followed by empty line (rt.cpan.org#39814)
my $cfg55 = new Config::General( -ConfigFile => "t/cfg.55" );
my %hash55 = $cfg55->getall();
is($hash55{b}, "nochop", "check continuation followed by empty line");
*/
