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
	       isDuckTyped(Object.keys(x), Object.keys(x).map(function(k) { return infer(x[k]) }))) :
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

var test = (function() {
  var tests = [];
  var error;
  var assert = function(f, should_fail) {
    var codes = should_fail ? ["F", "."] : [".", "F"];
    try {
      var checked = f();
      tests.push(codes[0]);
      if( codes[0] == 'F' ) {
        error = "Test should have failed.";
      }
    } catch(err) {
      tests.push(codes[1]);
      if( codes[1] == 'F' ) {
	error = err;
      }
    }
  };
  var assert_fail = function(x) { return assert(x, true); };
  var render = function() {
    console.log(tests.join(''));
    if( error ) {
      throw error;
    }
  };
  return {
    assert: assert,
    render: render,
    assert_fail: assert_fail
  };
}());
assert = test.assert;
render = test.render;
assert_fail = test.assert_fail;

var id = T.forall(function(A) {
  // A -> A forall A
  return T(A, A, function(x) {
    return x;
  });
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

var retype = T.forall(function(A) {
  // A -> A, fail when A != [String -> Number]
  return T(A, A, function(x) { 
    return T(String, Number, function(x) { return x }) 
  });
});
assert_fail(function() {
  return retype(T(Number, Number, function(x) { return x; })); 
});
assert(function() {
  return retype(T(String, Number, function(x) { return x; })); 
});

render();

