var T = require('./typical');
var test = require('./test');
assert = test.assert;
assert_fail = test.assert_fail;
render = test.render;

assert_fail("Prevent type mismatch in argument.", function() {
  return T(Number, Number, function(x) { return x; })("1");
});
assert("Verify a typed function call.", function() {
  return T(Number, Number, function(x) { return x; })(1);
});
assert("Verify more complex type signatures.", function() {
  return T([Number], Number, function(x) { return x[0]; })([1]);
});

var id = T.forall(function(A, a) {
  // A -> A forall A
  return T(A, A, function(x) {
    return x;
  })(a);
});
assert("Verify a dependently-typed function (1).", function() {
  return id(12);
});
assert("Verify a dependently-typed function (2).", function() {
  return id("abc");
});
assert("Verify a dependently-typed function. (3)", function() {
  return id({a:false});
});
assert("Verify a dependently-typed function (4).", function() {
  return id([1,2,3]);
});

var retype = T.forall(function(A, a) {
  // A -> A, A should equal String -> Number, otherwise
  // there will be a type error.
  return T(A, A, function(x) { 
    return T(String, Number, function(x) { return x; }); 
  })(a);
});
assert_fail("Prevent dependent function type mismatch.", function() {
  return retype(T(Number, Number, function(x) { return x; })); 
});
assert("Verify dependent function type.", function() {
  return retype(T(String, Number, function(x) { return x; })); 
});
assert("Form a checker from a type (1).", function() {
  return T(T.type(Number), Number, function(x) { return x; })(1);
});
assert_fail("Form a checker from a type (2).", function() {
  return T(T.type(Number), Number, function(x) { return x; })("abc");
});
assert("Verify a tuple.", function() {
  return T([Number, String], Number, function(xy) { return xy[0]; })([1,"abc"]);
});
assert_fail("Prevent tuple type mismatch.", function() {
  return T([Number, String], Number, function(xy) { return xy[0];})([1,2]);
});

var Or = function(obj) {
  return T.forall(function(atoc, f) {
    return T.forall(function(btoc, g) {
        // NB: this is an impure body meant to
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
var first = T([Number], Number, function(xs) { return xs[0]; });
assert("Type-check list function.", function() {
  return first([1,2,3]);
});
var aObj = T({a:Number}, Number, function(o) { return o.a;  });
assert("Type-check object function.", function() {
  return aObj({a:1});
});
assert("Delegate function based on type of sum (1).", function() {
  return Or({a:1})(first)(aObj);
});
assert("Delegate function based on type of sum (2).", function() {
  return Or([1,2])(first)(aObj);
});

assert("Verify higher-order-function type.", function() {
  var id = T(Number, Number, function(x) { return x; });
  return T(T(Number, Number), Number, function(f) { return f(1); })(id);
});
assert_fail("Prevent higher-order-function type mismatch.", function() {
  var id = T(Number, String, function(x) { return x+""; });
  return T(T(Number, Number), Number, function(f) { return f(1); })(id);
});
assert("Multiple argument type checking.", function() {
  var sum = T(Number, T(Number, Number), function(x) {
    return T(Number, Number, function(y) {
      return x+y;
    });
  });
  return sum(1)(2);
});
assert("Multiple argument, higher order type checking.", function() {
  var render = T(Number, String, function(x) { return x+""; });
  var join = T([Number], String, function(x) { return x.join(""); });
  var stringify = T(T(Number, String), T(T([Number], String), String), function(r) {
    return T(T([Number], String), String, function(j) {
      return r(1);
    });
  });
  return stringify(render)(join);
});

render();

