var T = require('./typical')(this);

// inline typing
var map = T(T.Type(Number, Number), [Number], [Number], function(f, xs) { return xs.map(f); });
var f = T(Number, Number, function(x) { return x+1; });

console.log(map(f, [1,2,3]));

// annotation separation
var map2 = function(f, xs) { return xs.map(f); };
var f2 = function(x) { return x+1; };
T.annotate("map2", T.Type(Number, Number), [Number], [Number]);
T.annotate("f2", Number, Number);

console.log(map2(f2, [1,2,3]));
