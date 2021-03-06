function copyHash(orig) {
  var rv;

  if( 'object' == typeof orig &&
      !Array.isArray(orig) ) {
    rv = {};
    Object.keys(orig).forEach( function( el, ind, ar ) {
      switch( typeof orig[el] ) {
        case 'object':
        if( Array.isArray(orig[el]) )
          rv[el] = copyArray(orig[el]);
        else
          rv[el] = copyHash(orig[el]);
        break;
        default:
        rv[el] = orig[el];
      }
      if( orig[el].hasOwnProperty('subobjaretags') )
        Object.defineProperty(rv[el], "subobjaretags", {
          value: true,
          enumerable: false,
          configuraable: true,
          writable: false
        });
    });
  }

  return rv;
}

function copyArray(orig) {
  var rv;

  if( Array.isArray(orig) ) {
    rv = [];
    orig.forEach( function( el, ind, arr ) {
      rv.push(el);
    });
  }

  return rv;
}

function copy(orig) {
  return (Array.isArray(orig)?copyArray(orig):(('object' == typeof orig)?copyHash(orig):undefined));
}

module.exports.copy = copy;
