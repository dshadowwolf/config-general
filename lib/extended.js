function extended(obj) {
  obj.keys = function(name) {
    var r = [];
    if( name !== undefined )
      if( !this.is_array(name) &&
          'object' == typeof this.data[name] ) {
        return Object.keys(this.data[name]);
      } else if( this.is_array(name) ) {
        for( var i = 0; i < this.data[name].length; i++ )
          r.push(i);
        return r;
      } else {
        return [];
      }

    if( this.is_array(name) ) {
      for( var x = 0; x < this.data.length; x++ )
        r.push(x);
      return r;
    } else if( 'object' == typeof this.data ) {
      return Object.keys(this.data);
    } else
      return [];
  };

  obj.is_hash = function(name) {
    return ('object' == typeof this.data[name] &&
            !Array.isArray(this.data[name]) &&
            this.data[name] !== undefined );
  };

  obj.is_array = function(name) {
    return (Array.isArray(this.data[name]) &&
            this.data[name] !== undefined );
  };

  // I have the check for 'function' just to be pedantic
  obj.is_scalar = function(name) {
    return ('object' != typeof this.data[name] &&
            'function' != typeof this.data[name] );
  };

  obj.exists = function(name) {
    return (name in this.data);
  };

  obj.value = function(name) {
    if( this.exists(name) ) {
      if( !this.is_scalar(name) )
        return this.obj(name);
      else
        return this.data[name];
    }
    return undefined;
  };

  obj.hash = function(name) {
    if( this.is_hash(name) )
      return this.data[name];
    else
      throw new TypeError('key '+name+' is not a hash!');
  };

  obj.array = function(name) {
    if( this.is_array(name) )
      return this.data[name];
    else
      throw new TypeError('key '+name+' is not an array!');
  };

  obj.scalar = function(name) {
    if( this.is_scalar(name) )
      return String(this.data.name);
    else
      return String(name);
  };

  obj.delete = function(name) {
    if( name in this.data )
      delete this.data[name];
    else
      throw new Error('delete called for non-existant key');
  };

  obj.find = function(nodelist) {
    var my_copy = nodelist;

    var node = my_copy.shift();

    if( !this.exists(node) )
      return undefined;

    if( my_copy.length > 0 )
      return this.obj(node).find(my_copy);
    else
      return this.obj(node);
  };
}

module.exports.extended = extended;
