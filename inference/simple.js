var T = function(a, b, f) {
  if( f == undefined ) return T.infer(T(a, b, function(){}));
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
var isArray = function(a) {
  return function(as) {
    if( typeof as != 'object' ) return false;
    if( !as.filter ) return false;
    return as.filter(function(x) { return !a(x) }).length == 0 || x == null;
   };
};
var isTuple = function(ts) {
  return function(as) {
    if( typeof as != 'object' ) return false;
    if( !as.filter ) return false;
    return as.filter(function(x, i) { return !ts[i](x) }).length == 0 || x == null;
  };
};
var isDuckTyped = function(ks, ts) {
  return function(o) {
    return ks.filter(function(k, i) {
      return !ts[i](o[k]);
    }).length == 0 || x == null;
  };
};
var isNumber = function(x) { return typeof x == 'number' || x == null };
var isString = function(x) { return typeof x == 'string' || x == null };
var isBoolean = function(x) { return typeof x == 'boolean' || x == null };
var isType = function(x) { 
  return x.isType || x == Number || x == String || x == Boolean ||
         (typeof x == 'object' &&  
	   (x instanceof Array && x.filter(function(x){
	     return !isType(x);
	   }).length == 0) ||
	   Object.keys(x).filter(function(k) {
	     return !isType(x[k])
	   }).length == 0);
};
var checker = function(x) {
  if( x == null ) return true;
  if( x == T ) return isType;
  if( typeof x == 'function' ) {
    if( x == Number ) return isNumber;
    else if( x == String ) return isString;
    else if( x == Boolean ) return isBoolean;
    else return x; 
  } else if( typeof x == 'object' ) {
    if( x.map && x.length == 1 ) return isArray(checker(x[0]));
    if( x.map && x.length > 1 ) return isTuple(x.map(checker));
    else return isDuckTyped(Object.keys(x), Object.keys(x).map(function(k) {
      return checker(x[k])
    }));
  } else if( x == null ) {
    return function() { return x == null || x == undefined; };
  } else {
    throw new Error("Type signature could not be parsed.");
  }
};
var funTypesEqual = function(a, b) {
  if( a.type && b.type ) {
    return funTypesEqual(a.type[0], b.type[0]) && funTypesEqual(a.type[1], b.type[1]);
  }
  // TODO: find if two types are equal, will require naming probably
  return a.toString() == b.toString();
};
var infer = function(x) {
  if( x.type ) {
    var inferred = function(y) {
      return funTypesEqual(x, y); 
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
T.type = checker;

module.exports = T;

