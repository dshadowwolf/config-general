var console = require('console'),
    mp = require('./parser_wrap');


function handlerMakerMparse(obj) {
  return {
    // Fundamental traps
    getOwnPropertyDescriptor: function(name) {
      var desc = Object.getOwnPropertyDescriptor(obj, name);
      // a trapping proxy's properties must always be configurable
      if (desc !== undefined) { desc.configurable = true; }
      return desc;
    },
    getPropertyDescriptor:  function(name) {
      var desc = Object.getPropertyDescriptor(obj, name); // not in ES5
      // a trapping proxy's properties must always be configurable
      if (desc !== undefined) { desc.configurable = true; }
      return desc;
    },
    getOwnPropertyNames: function() {
      return Object.getOwnPropertyNames(obj);
    },
    getPropertyNames: function() {
      return Object.getPropertyNames(obj);                // not in ES5
    },
    defineProperty: function(name, desc) {
      Object.defineProperty(obj, name, desc);
    },
    delete:       function(name) { return delete obj[name]; },
    fix:          function() {
      if (Object.isFrozen(obj)) {
        return Object.getOwnPropertyNames(obj).map(function(name) {
          return Object.getOwnPropertyDescriptor(obj, name);
        });
      }
      // As long as obj is not frozen, the proxy won't allow itself to be fixed
      return undefined; // will cause a TypeError to be thrown
    },

    // derived traps
    has:          function(name) { return (name in obj||name in obj.data); },
    hasOwn:       function(name) { return Object.prototype.hasOwnProperty.call(obj, name); },
/*    toString: function() {
      console.log( require('util').inspect(this))
    },*/
    get:          function(receiver, name) {
//      if( name == 'inspect')
//        console.log( 'asked for inspect on '+receiver )

      if( name == 'data' ) {
        if( 'data' in obj.data )
          return obj.data.data;
        else if( obj.data )
          return obj.data;
        else
          return undefined;
      }

      if( name in obj &&
        obj instanceof mp.parser )
        return obj[name];

      if( obj.data !== undefined &&
          name in obj.data ) {
        return function() {
          var t, temp;
          if( arguments.length > 0 ) {
            t = arguments[0];

            if( Array.isArray(t) )
              temp = t[0];
            else if( 'object' == typeof t )
              temp = t[Object.keys(t)[0]];
            else if( 'function' == typeof t)
              temp = t(name);
            else
              temp = t;
          } else {
            if( 'object' == typeof obj.data[name] ||
                Array.isArray(obj.data[name]) )
              return Proxy.create(handlerMakerMparse(obj.data[name]));
            else
              return obj.data[name];
          }
          obj.data[name] = temp;
          return obj.data[name];
        };
      } else if( name in obj )
        return function() {
          var t, temp;
          if( arguments.length > 0 ) {
            t = arguments[0];

            if( Array.isArray(t) )
              temp = t[0];
            else if( 'object' == typeof t )
              temp = t[Object.keys(t)[0]];
            else if( 'function' == typeof t)
              temp = t(name);
            else
              temp = t;
          } else {
            if( 'object' == typeof obj[name] ||
                Array.isArray(obj[name]) )
              return Proxy.create(handlerMakerMparse(obj[name]));
            else
              return obj[name];
          }

          obj[name] = temp;
          return obj[name];
        };
    },
    set:          function(receiver, name, val) {
      if( name in obj.data )
        obj.data[name] = val;
      else if( name in obj )
        obj[name] = val;
      else // assume they are setting a data member that doesn't exit yet
        obj.data[name] = val;

      return true;
    },
    enumerate:    function() {
      var result = [];
      for (var name in obj) { result.push(name); }
      return result;
    },
    keys: function() { return Object.keys(obj); }
  };
}

module.exports.handlerMakerMparse = handlerMakerMparse;
