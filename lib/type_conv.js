module.exports.makeBool = (function(val) {
  var base = String(val);

  if( /^\s*(true|yes|1|on)\s*$/.test(base.toLowerCase()))
    return true;
  else if( /^\s*(false|off|no|0)\s*$/.test(base.toLowerCase()) )
    return false;

  throw new TypeError( "don't know how to convert "+val+" to a boolean");
});
