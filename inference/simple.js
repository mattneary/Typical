var T = function(a, b, f) {
  a = checker(a);
  b = checker(b);
  var typed = function(x) {
    if( !a(x) ) throw new Error("Argument type mismatch.");
    var resp = f(x);
    if( !b(resp) ) throw new Error("Return type mismatch.");
    return resp;
  };
  typed.type = [a, b];
  return typed;
};
T.enforce = function(a, b, f) {
  return T(a, b, f, true);
};
var isArray = function(a) {
  return function(as) {
    if( typeof as != 'object' ) return false;
    if( !as.filter ) return false;
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
var isType = function(x) { return x.isType };
var checker = function(x) {
  if( isType(x) ) return x;
  if( typeof x == 'function' ) {
    if( x == Number ) return isNumber;
    else if( x == String ) return isString;
    else if( x == Boolean ) return isBoolean;
    else return x; 
  } else if( typeof x == 'object' ) {
    if( x.map ) return isArray(checker(x[0]));
    else return isDuckTyped(Object.keys(x), Object.keys(x).map(function(k) {
      return checker(x[k])
    }));
  } else {
    throw new Error("Type signature could not be parsed.");
  }
};
var infer = function(x) {
  if( x.type ) {
    var inferred = function(y) {
      return x.type[0] == y.type[0] && x.type[1] == y.type[1];
    };
    inferred.type = x.type;
    return inferred;
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
    return typer(A, a);
  };
  return typed;
};

T.forall = forall;
T.infer = infer;

module.exports = T;

