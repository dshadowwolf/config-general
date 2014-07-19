var fs = require('fs'),
    path = require('path'),
    glob = require('glob'),
    console = require('console');

function isGlob(name) {
  var t = glob.sync(name);

  // glob.sync() will return a single-value array
  // if handed a non-glob filename. If we get an
  // array of length greater than one, it's a glob.
  // if we get any other result but the first item
  // in the result isn't what we asked for, then
  // we were handed a glob.
  if( t.length > 1 ||
      t[0] != name )
    return true;

  return false;
}

module.exports.isGlob = isGlob;

function isDir(name) {
  if( !isGlob(name) &&
      fs.existsSync(name) &&
      fs.statSync(name).isDirectory() )
    return true;

  return false;
}

module.exports.isDirectory = isDir;

function getDir(name) {
  var temp;
  if( isDir(name) ) {
    if( name.slice(-1) != '/' )
      temp = name + '/*';
    else if( name.slice(-1) != '*' ) // why would someone do this ?
      temp = name;
    else
      temp = name + '*';
  }

  return glob.sync(temp);
}

module.exports.getDirectory = getDir;

function isAbsolute(pathname) {
  if( path.resolve(pathname) == pathname )
    return true;

  return false;
}

function getDirectoryList(base,others) {
  var rt = [];
  var work = path.dirname(base);

  others.forEach( function(e,i,o) {
    rt.push( path.dirname(work + e) );
  });

  return rt;
}

module.exports.genDirList = getDirectoryList;

function getDirectories(names) {
  var rets = [];

  if( Array.isArray(names) ) {
    names.forEach( function(e,i,o) {
      rets = rets.concat( getDir(e) );
    });
  } else
    throw new Error('Input to file utilities -> getDirectories must be an array');

  return rets;
}

module.exports.getDirectories = getDirectories;

function getRelativePaths(base,dirlist) {
  var rets = [];
  var work = [];

  if( dirlist !== undefined) {
    if( Array.isArray(dirlist) )
      work = getDirectoryList(base,dirlist);
    else
      throw new Error('Directory List must be an array');
  } else
    work = [path.dirname(base)];

  work.forEach( function( e, i, a ) {
    rets.push(e);
  });

  return rets;
}

module.exports.getRelative = getRelativePaths;
