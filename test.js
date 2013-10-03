T = require('./typical')

// typed function definition
map = T.build(T([Number, Number]), [Number], [Number], function(f, xs) { return xs.map(f) })
f = T.build(Number, Number, function(x) { return x+1 })

console.log(map(f, [1,2,3]))

// type definition separation -- Haskell style
map2 = function(f, xs) { return xs.map(f) }
T(map2, T([Number, Number]), [Number], [Number])
f2 = function(x) { return x+1 }
T(f2, Number, Number)

console.log(map2(f2, [1,2,3]))
