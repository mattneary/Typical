// if in browser, use a provided `render` function
try {
  T = require('../typical')
  var Assert = require('./assert')

  assert = Assert.init();
  run = Assert.run;
  assert = assert;
} catch(err) {
  // no require necessary in browser
  run = function(){};
  assert = render;
}


// tests
map = T(function(f, xs) { return xs.map(f) }, T([Number, Number]), [Number], [Number])
f = T(function(x) { return x+1 }, Number, Number)
assert("inline typing", map(f, [1,2,3]), [2,3,4])

map2 = function(f, xs) { return xs.map(f) }
T(map2, T([Number, Number]), [Number], [Number])
assert("type annotations and on the fly lambda typing", map2(function(x){return x+1}, [1,2,3]), [2,3,4])

circleTest = T(function(x) { return 0; }, [T.Circular], Number)
assert("recursive types", circleTest([[]]), 0)

Cartesian = T([Number, Number])
assert("function type as wrapper", Cartesian(function(x){return x})(1), 1)

assert("partial application", map(f)([1,2,3]), [2,3,4])

function sStringify(nNum) {
  return nNum+"";
}
assert("hungarian notation parsing", T.Hungarian(sStringify)(0), 0)

Person = T.Data(String, Number)
assert("data constructors", Person("Matt", 27), ["Matt", 27])

assert("arg number fixing", ["1", "2", "3"].map(T(parseInt, String, Number)), [1,2,3])

assert("rest params", T.Rest(Math.max, Number, Number)(1,2,3), 3)

assert("leading and rest params", T.Rest(function(a) {
  return a+arguments.length
}, String, Number, String)("count: ", 1, 2), "count: 3")

NumOrStr = T.Enum(T.Data("Num", Number), T.Data("Str", String))
assert("enumerable types", T([NumOrStr, Number])(function(x){return 1})(T.Data("Num")(1)), 1)

msg = T.Match([NumOrStr, Number, Number],
              [String, Number], T(function(x, y) { return parseInt(x)+y }, String, Number, Number),
              [Number, Number], T(function(x, y) { return x+y }, Number, Number, Number))
T(msg, NumOrStr, Number, Number)	      
assert("pattern matching of sum types for polymorphism", msg(T.Data("Str")("1"), 1), 2)

Street = T.Enum(T.Data("Home", Number, T.Circular), T.Data("Empty", T.void))
assert("inline data labeling", T([Street, Number])(function(){
  return 1
})(T.Data("Home")(27, T.Data("Empty")())), 1)

LinkedList = T.Enum(T.Data("Node", Number, T.Circular), T.Data("Empty", T.void))
function lisp(x) {
  if( x.length == 0 ) return T.Data("Empty")()
  return T.Data("Node")(x[0], lisp(x.slice(1)))
}
T(lisp, [Number], LinkedList)
assert("linked list", lisp([1,2,3]), [1,[2,[3,[]]]])

run();

