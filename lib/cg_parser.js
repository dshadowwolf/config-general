/*
 * Still needs more work to be fully compliant with
 * Perl's Config::General module, but it now has includes
 * and variables. In fact, I've gone beyond Config::General
 * and allow de-referencing of values in arrays that are in
 * the config data.
 *
 * Variable handling is not as versatile as Config::Generals
 * yet, nor do all the rules around them match. That will be
 * fixed.
 */

var fs = require('fs'),
    console = require('console'),
    util = require('util'),
    glob = require('glob'),
    tokens = require('./token_source.js'),
    mu = require('./my-utils'),
    process = require('process');

function cfgparser() {
  /*
   * possible variables for extra data that
   * implementing the API will require.
  this.options = {};
  this.known_keys = [];
   */
  this.symbols = [];
  this.blocks = [];
  this.curblock = {};
  this.bns = [];
  this.cbn = "";
  this.end_run = false;
  this.token_source = new tokens();
  this.end_cb = null;
  this.lower_case = false;
  this.var_base = /\$(\{)?([\w\d_\-\+:,]+)(\})?(?:\[(\d+)\])?/g;

  var self = this;

  this.token_source.on('includereq', function(data) {
    var fn;
    if( self.var_base.test(data.toString()) )
      fn = self.get_var_value(data);
    else
      fn = data.toString;

    var flist = glob.sync(fn);
    flist.forEach( function( elem, index, arr ) {
      var p = new cfgparser();
      p.open(elem);
      p.parse( function(d) {
        if( self.curblock[self.cbn] == undefined )
          self.curblock[self.cbn] = [];

        self.curblock[self.cbn].push( d );
      });
    });
  });

  this.token_source.on('tagopen', function(data) {
    if( self.curblock != {} ) {
      self.blocks.push( self.curblock );
      self.bns.push(self.cbn);
      self.curblock = {};
    }
    var nam;
    var sn;

    var t = new RegExp(self.var_base);
    if( t.test(data.name) )
      nam = self.get_var_value(data.name);
    else
      nam = data.name;

    nam = self.lower_case?nam.toLowerCase():nam;

    if( data.specname != undefined ) {
      if( t.test(data.specname) )
        sn = self.get_var_value(data.specname);
      else
        sn = data.specname;
    }

    self.cbn = nam;
    if( sn != undefined ) {
      sn = self.lower_case?sn.toLowerCase():sn;
      self.curblock['sn'] = sn;
    }
  } );

  this.token_source.on('tagclose', function(data) {
    var t = new RegExp(self.var_base);
    if( t.test(data) )
      data = self.get_var_value(data);

    data = self.lower_case?data.toLowerCase():data;

    if( self.cbn.toLowerCase() != data.toLowerCase() )
      throw new Error("mis-nested blocks - found close tag for "+data+" when we needed to find "+self.cbn );

    var t, tp;
    if( self.blocks.length > 0 ) {
      t = self.blocks.pop();
      tp = self.bns.pop();
    } else {
      t = {};
      tp = "";
    }

    if( self.curblock['sn'] != undefined ) {
      var nbn = self.curblock['sn'];
      self.curblock['sn'] = undefined;
      delete self.curblock['sn'];
      var nb = self.curblock;
      if( t[self.cbn] == undefined )
        t[self.cbn] = {}

      if( !t[self.cbn].hasOwnProperty("subobjaretags") )
        Object.defineProperty(t[self.cbn],"subobjaretags", {
          value: true,
          enumerable: false,
          configurable: true,
          writable: false
        });

      if( t[self.cbn] != undefined ) {
        t[self.cbn][nbn] = nb;
      } else {
        t[self.cbn] = JSON.parse( '{ \"'+nbn+'\":'+ JSON.stringify(nb) + ' }');
      }
    } else {
      if( t[self.cbn] != undefined ) {
        t[self.cbn] = [t[self.cbn]].push(self.curblock);
      } else {
        t[self.cbn] = self.curblock;
      }
    }
    self.curblock = t;
    self.cbn = tp;
  } );

  this.token_source.on('keyvalue', function(data) {
    if( data['name'] == 'include' ) {
      var flist = glob.sync(data['value']);
      flist.forEach( function( elem, ind, arr ) {
        var p = new cfgparser();
        p.open(elem);
        p.parse( function(d) {
          self.curblock[elem] = d;
        });
      });
    } else {
      var dat;
      var nam;
      var t = new RegExp(self.var_base);

      if( /^\[(.+)\]$/.test(data['value']) ) {
        if( t.test(data['value'].trim()) ) {
          dat = self.interpolate(data['value']);
        } else
          dat = data['value'];

        dat = dat.match(/^\[(.*)\]$/)[1].split(',').map( function(d) { return d.trim(); } );
      } else if( /^\[\s*\]$/.test(data['value']) ) {
        dat = [];
      } else {
        var nr = new RegExp(self.var_base);
        var isv = nr.test(data['value']);
        if( isv ) {
          dat = self.interpolate( data['value'] );
        } else {
          dat = data['value'];
        }
      }

      nam = self.lower_case?data['name'].toLowerCase():data['name'];
      if( self.curblock[nam] == undefined )
        self.curblock[nam] = [];

      self.symbols[nam] = dat;
      self.curblock[nam].push( dat );
    }
  } );
  this.token_source.on('end', function() {
    self.end_run = true;
    self.curblock = self.replace_single_value_arrays();
    self.end_cb( self.curblock );
  } );

}

cfgparser.prototype.get_var_value = function(variable) {
  var varre = /\$(\{)?([\w\d_\-\+:,]+)(\})?(?:\[(\d+)\])?/;
  var match = variable.match(varre);
  var sym;

  if( this.symbols[match[2]] != undefined )
    sym = this.symbols[match[2]];
  else if( match[2].toUpperCase() in process.env )
    sym = process.env[match[2].toUpperCase()]
  else
    throw new Error('Use of unitialized variable ('+variable+')');

  if( match[4] != undefined ) {
    var ind = parseInt(match[4], 10);
    if( !Array.isArray(sym) )
      throw new Error('Attempt to dereference something not an array ('+variable+')');
    if( ind > sym.length )
      throw new Error('Array subscript out of bounds ('+variable+')');
    else
      return sym[ind];
  }
  return sym;
};

cfgparser.prototype.interpolate = function(value) {
  var resre = /^\$(\{)?([\w\d_\-\+:,]+)(\})?(?:\[(\d+)\])?$/;
  var varre = /\$(\{)?([\w\d_\-\+:,]+)(\})?(?:\[(\d+)\])?/;
  if( resre.test(value) )
    return this.get_var_value(value)

  if( varre.test(value) ) {
    return value.replace( varre,
           function( match, p1, p2, p3, p4, p5, offset, str ) {
             var rv = p1;
             var qc = 0;
             var st= str.slice(0,offset+1);
             st.replace( /(:?[^\\\']\'){1}/g, function(d) { qc++; });

             if( qc == 1 || (qc >= 2 && qc % 2) ) {
               return match;
             }
             if( this.symbols[p3] == undefined )
               throw new Error('Use of uninitialized variable ($'+p3+')' );

             if( p5 != undefined ) {
               var t = parseInt( p5, 10 );
               if( Array.isArray( this.symbols[p3] ) ) {
                 if( t < this.symbols[p3].length ) {
                   rv = rv.concat( this.symbols[p3][t] );
                 } else {
                   throw new Error('Array subscript out of bounds ($'+p3+'['+p5+'])');
                 }
               } else {
                 throw new Error('Attempt to dereference something that is not an array ($'+p3+')');
               }
             } else {
               if( typeof this.symbols[p3] != 'string' )
                 rv = rv.concat( JSON.stringify(this.symbols[p3]) );
               else
                 rv = rv.concat( this.symbols[p3] );
             }
             return rv;
           });
  }
};

cfgparser.prototype.replace_single_value_arrays = function(d) {
  var w = (d==undefined)?this.curblock:d;

  for( var k in Object.keys( w ) ) {
    var key = Object.keys(w)[k];
    var val = w[key];

    if( w[key].length == 1 )
      w[key] = w[key][0];

    if( JSON.stringify(w[key]).charAt(0) == '{' &&
        JSON.stringify(w[key]) != '{}' )
      w[key] = this.replace_single_value_arrays(w[key]);

    if( Array.isArray(w[key]) ) {
      var self = this;
      w[key].map( function(d) {
        if( typeof d == 'object' )
          return self.replace_single_value_arrays(d);
        else
          return d;
      });
    }

  }
  return w;
};

cfgparser.prototype.open = function(filename) {
  try {
    this.token_source.open(filename);
  } catch(e) {
    throw e;
  }
};

cfgparser.prototype.setLowerCaseNames = function( bool ) {
  this.lower_case = bool;
};

cfgparser.prototype.parse = function( cb ) {
  var self = this;
  self.end_cb = cb;

  while( !self.end_run ) {
    self.token_source.next();
  }
};

cfgparser.prototype.set_option = function(name,value) {
  switch(name) {
    case "ConfigHash":
    // import this into the this.curblock the easy way
    this.curblock = mu.copy(value);
    break;
    default:
    //silently ignore options we don't have implemented yet
    return;
  }
}
/*
cfgparser.prototype.set_option = function(name,value) {
  // check to see if the option is one that needs
  // to go to the tokenizer because it will have
  // an effect either during the loading or tokenizing
};
*/
module.exports = cfgparser;
