// T is a typed function constructor. The leading arguments
// serve as the type annotation, similar to Haskell arrow definitions.
// The last argument is then the function body.
var root;

// the primary function, for constructing typed functions
var T = function(fun/*, annotation*/) {
  // form a namespace based around globals
  T.init();

  // if an array was passed, treat this as a type constructor rather
  // than a typed *function* constructor.
  if( typeof arguments[0] == 'object' && arguments.length == 1 ) {
    return T.Type.apply({}, arguments[0]);
  }

  // find function name by value
  var name = Object.keys(root).filter(function(k){ return root[k]==fun })[0];

  // if could not find in scope, build and return a function.
  if( !name ) {
    return T.build.apply({}, toArray(arguments).slice(1).concat(fun));
  }

  // replace found function variable with a typed form
  root[name] = T.build.apply({}, toArray(arguments).slice(1).concat(fun));
};

T.build = function(/* types, fun */) {
  // form a strictly typed function
  var args = toArray(arguments),
      fun = last(args),
      lead = args.slice(0,-1),
      types = lead.slice(0,-1).map(argTypeChecker),
      retType = last(lead);

  var f = function(/* args */) {
    var args = toArray(arguments);
    var errors = mapcat(function(isValid) {
      var arg = args[0];
      args = args.slice(1);
      return isValid(arg) ? [] : [isValid.message];
    }, types);

    if (!isEmpty(errors))
      throw new Error(errors.join(", "));

    // verify return value type
    var resp = fun.apply({}, arguments);
    if( !argTypeChecker(retType)(resp) ) {
      throw new Error("Expected return value to be of type "+getType(retType).name+".")
    }

    // return response if all checks pass
    return resp;
  };

  f['typed'] = true;
  f['type'] = {
    ret: retType,
    args: lead.slice(0,-1) 
  };
  return f;
};  

T.checker = function(message, fun) {
  var f = function(/* args */) {
    return fun.apply(fun, arguments);
  };

  f['message'] = message;
  return f;
};

T.void = void 0;

T.Type = function(args) {
  // define a function type by means of T.Type(ret, arg1, ...) with
  // each argument being a type such as Number.
  if( !(this instanceof T.Type) ) return new T.Type(toArray(arguments));
  this.ret = last(args);
  this.args = args.slice(0, -1);    
};

T.init = function() {
  // if a root element has been set, return
  if( root ) return;

  // attempt browser globals, fallback to node
  try {
    root = window;
  } catch(err) {
    root = GLOBAL;
  }
};

// function dependencies
var existy = function(x) {
  return typeof x != "undefined";
};
var toArray = function(x) {
  var a = [];
  for( var i = 0; i < x.length; i++ )
    a.push(x[i]);
  return a;
};
var isEmpty = function(x) {
  return x.length == 0;
};
var last = function(x) {
  return x[x.length-1];
};
var mapcat = function(f, xs) {
  return xs.map(f).reduce(function(a, b) {
    return a.concat(b);
  }, []);
};
var argTypeChecker = function (type, argNum) {
  // form a checker function based on the provided type.
  var checker = getType(type);

  // define an error to display in the case of a type error.
  var msg = ["Expected argument at index ",
	      argNum,
	      " to be of type ",
	      checker.name,
	      "."].join("");

  // return a checker.	       
  return T.checker(msg, checker.fun);
};
var getType = function(type) {
  if( type instanceof T.Type ) {
    // a function type definition was passed 
    return {
      name: '(' + type.args.map(getType).map(function(x){return x.name}).join(", ") + ') -> ' + getType(type.ret).name,
      fun: function(x) {
	var goodRet = type.ret == x.type.ret;
	var goodArgs = type.args.map(function(t, i) {
	    return t == x.type.args[i];
	}).reduce(function(a, b) {
	  return a && b;	  
	});	  
	return x.typed && goodRet && goodArgs;
      }
    };
  } else if( type == T.void ) {
    // the void response type was passed
    return {
      name: "void",
      fun: function(x) {
	return !existy(x);
      }
    };
  } else if( typeof type == 'function' ) {
    // a constructor was passed
    if( type == Number ) {
      return {
	name: "Number",
	fun: function(x) { return typeof x == 'number' }
      };
    } else if( type == String ) {
      return {
	name: "String",
	fun: function(x) { return typeof x == 'string' }
      };
    } else if( type == Boolean ) {
      return {
	name: "Boolean",
	fun: function(x) { return typeof x == 'boolean' }
      }
    } else {
      // arbitrary constructor type checker
      return {
	name: type.name,
	fun: function(x) { return x instanceof type; }
      };	
    }
  } else if( typeof type == 'object' && type.map ) {
    // an array was passed
    return {
      name: "["+getType(type[0]).name+"]",
      fun: function(xs) {
	return xs.map(getType(type[0]).fun).reduce(function(a,b) {
	  return a && b;
	});
      }
    };
  } else if( typeof type == 'object' ) {    
    // an object was passed. objects are duck-typed.
    var valTypes = Object.keys(type).map(function(k) {
      var t = getType(type[k]);
      t.pair = [k, getType(type[k]).name].join(" => ");
      return t;
    });
    return {
      name: "{ "+valTypes.map(function(x){ return x.pair; }).join(", ")+" }",
      fun: function(xs) {
	var passed = !xs.map;
	for( var k in xs ) {
	  passed = passed && getType(type[k]).fun(xs[k]);
	}
	return passed;
      }
    };
  }
};

module.exports = T; 
