var console = require('console'),
    util = require('util');

function symbol_table(p,n) {
  this.symbols = [];
  this.scopes = [];
  this._state = {};
  this._state.parent = undefined;
  this._state.name = "";

  if( p !== undefined && n !== undefined ) {
    this._state.parent = p;
    this._state.name = n;

    for( var k in Object.keys(p.symbols) ) {
      var key = Object.keys(p.symbols)[k];
      this.symbols[key] = p.symbols[key];
    }
  }
}

symbol_table.prototype.new_scope = function( scope_name ) {
  var nscope = new symbol_table( this, scope_name );
  this.scopes[scope_name] = nscope;
  return nscope;
};

symbol_table.prototype.exit_scope = function() {
  return this._state.parent;
};

symbol_table.prototype.get_value = function( sym ) {
  return (this.symbols[sym] !== undefined)?this.symbols[sym]:"";
};

symbol_table.prototype.set_value = function( name, value ) {
  this.symbols[name] = value;
};

symbol_table.prototype.get_scope = function( name ) {
  return (this.scopes[name] !== undefined)?this.scopes[name]:undefined;
};

module.exports = symbol_table;
