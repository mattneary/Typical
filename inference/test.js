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
module.exports = {
  assert: assert,
  render: render,
  assert_fail: assert_fail
};
