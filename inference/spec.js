var T = require('./simple');
var test = require('./test');
assert = test.assert;
assert_fail = test.assert_fail;
render = test.render;

assert_fail(function() {
  return T(Number, Number, function(x) { return x })("1");
});
assert(function() {
  return T(Number, Number, function(x) { return x })(1);
});
assert(function() {
  return T([Number], Number, function(x) { return x[0] })([1]);
});

var id = T.forall(function(A, a) {
  // A -> A forall A
  return T(A, A, function(x) {
    return x;
  })(a);
});
assert(function() {
  return id(12);
});
assert(function() {
  return id("abc");
});
assert(function() {
  return id({a:false});
});
assert(function() {
  return id([1,2,3]);
});

var retype = T.forall(function(A, a) {
  // A -> A, fail when A != [String -> Number]
  return T(A, A, function(x) { 
    return T(String, Number, function(x) { return x }) 
  })(a);
});
assert_fail(function() {
  return retype(T(Number, Number, function(x) { return x; })); 
});
assert(function() {
  return retype(T(String, Number, function(x) { return x; })); 
});
assert(function() {
  return T(T.type(Number), Number, function(x) { return x; })(1);
});
assert_fail(function() {
  return T(T.type(Number), Number, function(x) { return x; })("abc");
});
assert(function() {
  return T([Number, String], Number, function(xy) { return xy[0] })([1,"abc"]);
});
assert_fail(function() {
  return T([Number, String], Number, function(xy) { return xy[0] })([1,2]);
});

var Or = T.forall(function(atoc, f) {
  return T.forall(function(btoc, g) {
    return function(x) {
      // TODO: true polymorphism needed for pureness
      if( atoc.type[0](x) ) {
	return f(x);
      } else if( btoc.type[0](x) ) {
	return g(x);
      } else {
        throw new Error("Type does not match either of enum.");
      }
    };
  });
});
var first = T([Number], Number, function(xs) { return xs[0] });
assert(function() {
  return first([1,2,3]);
});
var aObj = T({a:Number}, Number, function(o) { return o.a  });
assert(function() {
  return aObj({a:1});
});
assert(function() {
  return Or(first)(aObj)({a:1});
});
assert(function() {
  return Or(first)(aObj)([1,2]);
});

var Enum = function(A, B) {
  var left = T(A, [A, B], function(a) { return [a, null] });
  var right = T(B, [A, B], function(b) { return [null, b] });
  return Or(left)(right);
};
assert(function() {
  return Enum(Number, String)(1);
});

render();

