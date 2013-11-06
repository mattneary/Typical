var T = function(a, b, f) {
  var typed = function(x) {
    if( !a(x) ) throw new Error("Argument type mismatch.");
    var resp = f(x);
    if( !b(resp) ) throw new Error("Return type mismatch.");
    return resp;
  };
  typed.type = [a, b];
  return typed;
};
var isArray = function(a) {
  return function(as) {
    return as.filter(function(x) { return !a(x) }).length == 0;
   };
};
var isDuckTyped = function(ks, ts) {
  return function(o) {
    return ks.filter(function(k, i) {
      return !ts[i](o[k]);
    }).length == 0;
  };
};
var isNumber = function(x) { return typeof x == 'number' };
var isString = function(x) { return typeof x == 'string' };
var isBoolean = function(x) { return typeof x == 'boolean' };
var infer = function(x) {
  if( x.type ) {
    return function(y) {
      return x.type[0] == y.type[0] && x.type[1] == y.type[1];
    };
  } else {
    return (typeof x == 'object' ? 
             (x.map ? 
	       isArray(infer(x[0])) : 
	       isDuckTyped(Object.keys(x), 
	         Object.keys(x).map(function(k) { return infer(x[k]) }))) :
	     (typeof x == 'number' ? isNumber : 
	       (typeof x == 'string' ? isString :
	         isBoolean)));
  }
};
var forall = function(typer) {
  var typed = function(a) {
    var A = infer(a);
    return typer(A)(a);
  };
  return typed;
};

T.forall = forall;
T.infer = infer;

module.exports = T;

