var T = require('./simple');
var test = require('./test');
assert = test.assert;
assert_fail = test.assert_fail;
render = test.render;

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

var Or = T.forall(function(atoc) {
  return T.forall(function(btoc) {
    return function(x) {
      if( atoc[0](x) ) {
        return atoc(x);
      } else {
        return btoc(x);
      }
    };
  });
});

render();
