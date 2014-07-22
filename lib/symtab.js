var console = require('console'),
    util = require('util');

function symbol_table(p,n) {
  this.symbols = [];
  this.scopes = {};
  this._state = {};
  this._state.parent = undefined;
  this._state.name = "";

  if( n !== undefined )
    this._state.name = n;

  if( p !== undefined ) {
    this._state.parent = p;
    this._state.name = n;

    var self = this;
    Object.keys(p.symbols).forEach( function( e, i, a ) {
      self.symbols[e] = p.symbols[e];
    });
  }
}

symbol_table.prototype.has_scope = function( name ) {
  return this.scopes[name] !== undefined;
};

symbol_table.prototype.new_scope = function( scope_name ) {
  this.scopes[scope_name] = new symbol_table( this, scope_name );
  return this.scopes[scope_name];
};

symbol_table.prototype.exit_scope = function() {
  if( this._state.parent !== undefined )
    return this._state.parent;
  else
    return this;
};

symbol_table.prototype.get_value = function( sym ) {
  return (this.symbols[sym] !== undefined)?this.symbols[sym]:"";
};

symbol_table.prototype.set_value = function( name, value ) {
  this.symbols[name] = value;
};

symbol_table.prototype.get_scope = function( name ) {
  return this.scopes[name];
};

module.exports = symbol_table;
