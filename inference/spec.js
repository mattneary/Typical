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

var Or = function(obj) {
  return T.forall(function(atoc, f) {
    return T.forall(function(btoc, g) {
        // NB: this is an impure body mean to
	// illustrate both effects of a sum type.
	if( atoc.type[0](obj) ) {
	  return f(obj);
	} else if( btoc.type[0](obj) ) {
	  return g(obj);
	} else {
	  throw new Error("Type does not match either of enum.");
	}
    });
  });
};
var first = T([Number], Number, function(xs) { return xs[0] });
assert(function() {
  return first([1,2,3]);
});
var aObj = T({a:Number}, Number, function(o) { return o.a  });
assert(function() {
  return aObj({a:1});
});
assert(function() {
  return Or({a:1})(first)(aObj);
});
assert(function() {
  return Or([1,2])(first)(aObj);
});

assert(function() {
  var id = T(Number, Number, function(x) {return x});
  return T(T(Number, Number), Number, function(f) { return f(1) })(id);
});
assert_fail(function() {
  var id = T(Number, String, function(x) {return x+""});
  return T(T(Number, Number), Number, function(f) { return f(1) })(id);
});
assert(function() {
  var sum = T(Number, T(Number, Number), function(x) {
    return T(Number, Number, function(y) {
      return x+y;
    });
  });
  return sum(1)(2);
});
assert(function() {
  var render = T(Number, String, function(x) { return x+"" });
  var join = T([Number], String, function(x) { return x.join("") });
  var stringify = T(T(Number, String), T(T([Number], String), String), function(r) {
    return T(T([Number], String), String, function(j) {
      return r(1);
    });
  });
  return stringify(render)(join);
});

render();

