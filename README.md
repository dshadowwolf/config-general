config-general
==============

A port to NodeJS of the Perl module Config::General

This code is currently in Alpha and only as functional as the testing has
pushed me to make it. For the unit-tests to actually function, you have to
enable 'harmony' features - ie: node --harmony.

Please do not attempt to use this code in a production environment at this
time - it is not completely tested and has at least one known bug that is
being worked on at this time.

To run the tests:
make sure tap is installed (ie: npm install tap)
run: 
  (if you don't have tap installed globally)
node node_modules/tap/bin/tap.js --harmony t/*.js
  (if you do have tap installed globally)
tap --harmony t/*.js
