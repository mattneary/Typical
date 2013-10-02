var T = require('./typical');

var map = T(T.Type(Number, Number), [Number], [Number], function(f, xs) { return xs.map(f); });
var f = T(Number, Number, function(x) { return x+1; });

console.log(map(f, [1,2,3]));
