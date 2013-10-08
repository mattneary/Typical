var assert;
try {
  T = require('./typical')
  assert = console.log.bind(console);
} catch(err) {
  // no require necessary in browser
  assert = render;
}

map = T(function(f, xs) { return xs.map(f) }, T([Number, Number]), [Number], [Number])
f = T(function(x) { return x+1 }, Number, Number)
assert("inline typing", map(f, [1,2,3]))

map2 = function(f, xs) { return xs.map(f) }
T(map2, T([Number, Number]), [Number], [Number])
f2 = function(x) { return x+1 }
T(f2, Number, Number)
assert("type annotations", map2(f2, [1,2,3]))

circleTest = T(function(x) { return 0; }, [T.Circular], Number)
assert("recursive types", circleTest([[]]))

algebraic = T(function(x) { return typeof x == 'number' ? x : parseInt(x); }, T.Or(Number, String), Number)
assert("polymorphic functions", algebraic("3")+algebraic(3))

Linked = [T.Or(Number, T.Circular)]
linkedList = T(function(x) {
  if( x.length == 0 ) return []
  return [x[0], linkedList(x.slice(1))]
}, [Number], Linked)
assert("linked list", linkedList([1,2,3]))
console.log(linkedList.signature)

Cartesian = T([Number, Number])
assert("function type as wrapper", Cartesian(function(x){return x})(1))

Nary = T([Number, T.Or(Number, T.Root)])
var sum = Nary(function(x) {
  return Nary(function(y){return y == 0 ? x : sum(x+y)})
})
assert("n-ary adder", sum(1)(2)(3)(0))

assert("partial application", map(f)([1,2,3]))

function sStringify(nNum) {
  return nNum+"";
}
assert("hungarian notation parsing", T.Hungarian(sStringify)(0))

Person = T.Data(String, Number)
assert("data constructors", Person("Matt", 27))

assert("arg number fixing", ["1", "2", "3"].map(T(parseInt, String, Number)))
