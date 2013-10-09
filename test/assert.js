// deep equality
var eq = function(a, b) {
  if( typeof a == 'object' ) {
    if( typeof b != 'object' ) return false;
    for( var k in a ) if( !eq(b[k], a[k]) ) return false;
    for( var k in b ) if( !eq(b[k], a[k]) ) return false;
    return true;
  } else {
    return a == b;
  }
};

module.exports = function(render) {
  return function(name, val, check) {
    if( eq(val, check) ) render("PASSED", name);
    else render("*FAIL*", name)
  };
};
