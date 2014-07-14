var console = require('console')
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
    get:          function(receiver, name) {
//      if( name == 'inspect')
//        console.log( 'asked for inspect on '+receiver )

      if( name == 'data' ) {
        if( 'data' in obj.data )
          return obj.data['data'];
        else
          return obj.data;
      }

      if( name in obj.data ) {
        return obj.data[name]
      } else if( name in obj ) {
        return obj[name];
      } else if( obj.parent !== undefined ) {
        // this is an objInt not an mparse
        if( name in obj.parent.data )
          return obj.parent.data[name]
        else
          return undefined;
      } else {
        return undefined;
      }
    },
    set:          function(receiver, name, val) {
      obj.data[name] = val;
      return true;
    },
    enumerate:    function() {
      var result = [];
      for (name in obj) { result.push(name); };
      return result;
    },
    keys: function() { return Object.keys(obj) }
  };
}

module.exports.handlerMakerMparse = handlerMakerMparse;
