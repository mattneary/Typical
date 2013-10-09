// if in browser, use a provided `render` function
try {
  T = require('../typical')
  render = console.log.bind(console);
} catch(err) {
  // no require necessary in browser
}

var assert = require('./assert')(render);

// tests
map = T(function(f, xs) { return xs.map(f) }, T([Number, Number]), [Number], [Number])
f = T(function(x) { return x+1 }, Number, Number)
assert("inline typing", map(f, [1,2,3]), [2,3,4])

map2 = function(f, xs) { return xs.map(f) }
T(map2, T([Number, Number]), [Number], [Number])
f2 = function(x) { return x+1 }
T(f2, Number, Number)
assert("type annotations", map2(f2, [1,2,3]), [2,3,4])

circleTest = T(function(x) { return 0; }, [T.Circular], Number)
assert("recursive types", circleTest([[]]), 0)

algebraic = T(function(x) { return typeof x == 'number' ? x : parseInt(x); }, T.Or(Number, String), Number)
assert("polymorphic functions", algebraic("3")+algebraic(3), 6)

Linked = [T.Or(Number, T.Circular)]
linkedList = T(function(x) {
  if( x.length == 0 ) return []
  return [x[0], linkedList(x.slice(1))]
}, [Number], Linked)
assert("linked list", linkedList([1,2,3]), [1,[2,[3,[]]]])

Cartesian = T([Number, Number])
assert("function type as wrapper", Cartesian(function(x){return x})(1), 1)

Nary = T([Number, T.Or(Number, T.Root)])
var sum = Nary(function(x) {
  return Nary(function(y){return y == 0 ? x : sum(x+y)})
})
assert("n-ary adder", sum(1)(2)(3)(0), 6)

assert("partial application", map(f)([1,2,3]), [2,3,4])

function sStringify(nNum) {
  return nNum+"";
}
assert("hungarian notation parsing", T.Hungarian(sStringify)(0), 0)

Person = T.Data(String, Number)
assert("data constructors", Person("Matt", 27), ["Matt", 27])

assert("arg number fixing", ["1", "2", "3"].map(T(parseInt, String, Number)), [1,2,3])

assert("rest params", T.Rest(Math.max, Number, Number)(1,2,3), 3)

assert("leading and rest params", T.Rest(function(a) { return a+arguments.length }, String, Number, String)("count: ", 1, 2), "count: 3")

NumOrStr = T.Enum(String, Number)
assert("enumerable types", T([NumOrStr, Number])(function(x){return 1})(NumOrStr(1)), 1)

msg = T.Match([NumOrStr, Number, Number],
              [String, Number], T(function(x, y) { return parseInt(x)+y }, String, Number, Number),
              [Number, Number], T(function(x, y) { return x+y }, Number, Number, Number))
T(msg, NumOrStr, Number, Number)	      
assert("pattern matching of sum types", msg(NumOrStr("1"), 1), 2)

Street = T.Enum(T.Data("Home", Number, T.Circular), T.void)
assert("inline data labeling", T([Street, Number])(function(){return 1})(Street(T.Data("Home")(27, Street(null)))), 1)
