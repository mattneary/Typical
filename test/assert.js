// deep equality
var eq = function(a, b) {
  if( typeof a == 'object' ) {
    if( typeof b != 'object' ) return false;
    for( var k in a ) if( !eq(a[k], b[k]) ) return false;
    for( var k in b ) if( !eq(b[k], a[k]) ) return false;
    return true;
  } else {
    return a == b;
  }
};

var buffer = [];
var cache = function(name, val, check) {
  buffer.push({ name: name, val: val, check: check });
};
var header = function(title) {
  console.log(title + "\n" + title.split('').map(function() {return '='}).join('')+'\n')
};
var willRender = false;
module.exports = {
  init: function(render) {
    willRender = !render;
    return function(name, val, check) {
      if( willRender ) {
	cache(name, val, check);
      } else {
        render(eq(val, check) ? "PASSED" : "*FAIL*", name);
      }
    };
  },
  run: function() {
    if( !willRender ) return;
    var status = "";
    header("Running " + buffer.length + " tests.");
    buffer.forEach(function(assertion) {
      var val = assertion.val, name = assertion.name, check = assertion.check;
      if( eq(val, check) ) status += "."
      else {
        status += "F"; 
	console.log("Test Failed: " + name + "\n");
      }
    });
    console.log(status)
    var passed = status.match(/\./g).length,
        failed = buffer.length - passed;
    console.log(passed + " tests passed, " + failed + " tests failed.")
  }
};
