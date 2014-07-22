config-general
==============

A port to NodeJS of the Perl module Config::General

Please note that this code, while hopefully fully functional and bug-free,
should be considered a late beta.

Example:
	
	var cg = require('config-general');
	
	var config = cg.parser( { ConfigFile: <filename> } );
	var config_data = config.getall();

Yes, it really can be that simple. In fact, if you want to use the defaults
for all the options, you can even write the above as:
	
	var config = cg.parser(<filename>);

For more information about available options and the format of the file
itself, please see the documentation of Perl's Config::General and its
two sub-modules, Config::General::Extended and Config::General::Interpolated.

I have done a lot of work to make as many features of the Perl module
available to users of this NodeJS module. Two features that are missing are
the ability to 'tie' to a backing-store (Config::General's '-Tie' parameter)
and the functional interface. The "AUTOLOAD methods" feature of
Config::General is emulated, to a degree, via the use of ES6 (Harmony)
Proxies. To use that feature, you must start your process with either the
'--harmony-proxies' or '--harmony' flag.

Please leave information about any missing features or founds bugs on the
bug-tracker provided by Github for the project.
