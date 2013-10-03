T = require('./typical')

// typed function definition
map = T(function(f, xs) { return xs.map(f) }, T([Number, Number]), [Number], [Number])
f = T(function(x) { return x+1 }, Number, Number)

console.log(map(f, [1,2,3]))

// retroactive typing
map2 = function(f, xs) { return xs.map(f) }
T(map2, T([Number, Number]), [Number], [Number])
f2 = function(x) { return x+1 }
T(f2, Number, Number)

console.log(map2(f2, [1,2,3]))
