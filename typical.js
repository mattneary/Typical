// T is a typed function constructor. The first argument is a 
// function and the rest are a type annotation, with the final 
// argument being the return type. A passed function is both 
// returned in a typed form and, if possible, mutated in the 
// environment.
var T = function(fun/*, annotation*/) {
  // form a namespace based around globals
  T.init();

  // if an array was passed, treat this as a type constructor rather
  // than a typed *function* constructor. That is to say, if this call
  // was not meant to manipulate a function, simply return a function's
  // type which can be used elsewhere.
  if( typeof arguments[0] == 'object' && arguments.length == 1 ) {
    return T.Type.apply({}, arguments[0]);
  }

  // find function name by value
  var name = Object.keys(root).filter(function(k){ return root[k]==fun })[0];

  fun['typical_name'] = name || fun.name || 'anonymous';

  // if could not find in scope, build and return a function.
  if( !name ) {
    return T.build.apply({}, toArray(arguments).slice(1).concat(fun));
  }

  // if the function was found in the scope, mutate it.  
  root[name] = T.build.apply({}, toArray(arguments).slice(1).concat(fun));
};

T.build = function(/* types, fun */) {
  // form a strictly typed function

  // parse out the function, the argument types, and
  // the return value, forming argument type checkers.
  var args = toArray(arguments),
      fun = last(args),
      lead = args.slice(0,-1),
      types = lead.slice(0,-1).map(argTypeChecker(fun['typical_name'], lead)),
      retType = last(lead);
  // form a wrapper of the base function which will check
  // argument types, then fire, and then check the return
  // type.
  var f = function(/* args */) {
    var _args = toArray(arguments);

    // if insufficient arguments were passed, partially
    // apply them.
    if( arguments.length < types.length ) {
      return f.bind.apply(f, [{}].concat(_args));
    }

    if( arguments.length > types.length ) {
      if( !typeRecurses(lead[lead.length-1]) ) {
        // NB: we do not throw an error for excessive arguments,
        //     given the throw-away arguments commonly passed to 
        //     callbacks by built-in functions. we simply ignore them.
        _args = _args.slice(0, types.length);
      } else {
        // if we are allowing subsequent args to serve as
	// rest args, they need to be type-checked.
	var last = types[types.length-1];
	types = _args.map(function(_, i) {
	  if( types[i] ) return types[i];
	  var dup = copy(last);
	  dup.message = dup.message.replace(/index [0-9]+/, "index "+i);
	  return dup;
	});
      }
    }

    var args = _args;
    var errors = mapcat(function(isValid) {
      var arg = args[0];
      args = args.slice(1);
      return isValid(arg) ? [] : [isValid.message];
    }, types);    

    if (!isEmpty(errors)) {
      console.log(_args)
      throw new Error(errors.join(", "));
    }

    // verify return value type
    var resp = fun.apply({}, _args);
    if( !argTypeChecker(fun['typical_name'], lead)(retType)(resp) ) {
      throw new Error("Expected return value of " + fun.typical_name + " to be of type "+getType(retType).name+".")
    }

    // return response if all checks pass
    return resp;
  };

  // mark the function as strictly typed with a signature for
  // its use as argument to other typed functions.
  f['typed'] = true;
  f['type'] = {
    ret: retType,
    args: lead.slice(0,-1)
  };
  f['signature'] = T.render(lead);
  f['name'] = fun['typical_name'];

  // return the wrapper function
  return f;
};  

T.Vararg = function(fun, type, retType) {
  // forms a typed function accepting arguments of `type`
  // until it receives `null`.
  var argType = T.Or(type, T.void);
  var Nary = T([argType, T.Or(retType, T.Root)])
  var Stack = T([[argType], T.Or(retType, Nary)])
  var middle = Stack(function(xs) {
    return Nary(function(y) {
      var args = [].slice.call(arguments);
      var front = args.slice(0,-1);
      return args[args.length-1]==null ? fun.apply({}, xs.concat(front)) : middle(xs.concat(args)) 
    })
  })
  return Nary(function() {
    var args = [].slice.call(arguments);
    var front = [].slice.call(arguments).slice(0,-1);
    return args[args.length-1]==null ? fun.apply({}, front) : middle([].concat(args))
  })
};

T.Rest = function(fun/*, types*/) {
  // accepts a function and a type signature, with
  // the final type extended to apply to all subsequent
  // arguments. this is built on top of the standard
  // type system, not a special feature.
  var types = toArray(arguments).slice(1).slice(0,-1);
  var retType = last(toArray(arguments));
  return function() {
    var head = toArray(arguments).slice(0, types.length-1);
    var rest = toArray(arguments).slice(types.length-1);
    var type = types[types.length-1];
    return T.Vararg(fun.bind.apply(fun, [{}].concat(head)), type, retType).apply({}, rest.concat([null]));
  };
};

T.Hungarian = function(fun) {
  // applying typing to a function based on the
  // hungarian naming scheme.
  var argnames = function(func) {
    var comments = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
    var fnStr = func.toString().replace(comments, '');
    var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(/([^\s,]+)/g);
    if(result === null)  result = [];
    return result;
  };
  var parsePrefix = function(name, base) {
    base = base || name;
    if( name.match(/^arr/) ) return [parsePrefx(name.substr(3), base)];
    if( name.match(/^n/) ) return Number;
    if( name.match(/^s/) ) return String;
    if( name.match(/^b/) ) return Boolean;
    throw new Error("Hungarian notation could not be parsed: "+base);
  };
  return T.apply({}, [fun].concat(argnames(fun).map(parsePrefix).concat([parsePrefix(fun.name)])));
};

var datas = {};
T.Data = function() {
  // form a product type. a constructor of this data-type
  // will be returned.
  if( typeof arguments[0] == 'string' ) {
    if( arguments.length == 1 ) return datas[arguments[0]];
    else {
      datas[arguments[0]] = T.Data.apply({}, toArray(arguments).slice(1));
      var read = datas[arguments[0]];
      read.name = arguments[0];
      return read;
    }
  }

  var parts = toArray(arguments);
  function Data() {
    var data = toArray(arguments);
    data.__proto__ = Data.prototype;
    return data;
  };
  var cons = function() {
    var resp = Data.apply({}, arguments);
    for( var k in parts ) {
      var type = getType(parts[k], cons.root);
      if( !type.fun(arguments[k]) ) throw new Error("Data constructor expected argument at index "+k+" to be of type "+type.name+".");      
    }
    resp.__proto__ = cons.prototype;
    return resp;
  };
  cons.__proto__ = T.Data.prototype;
  cons.types = parts;
  return cons;
};

T.Enum = function() {
  // form a sum type. note that product types passed
  // will be given the context of the enumerable for
  // recursive types.
  var parts = toArray(arguments);
  for( var k in parts ) {
    if( !(parts[k] instanceof T.Data) ) throw new Error("Enumerable types must be data constructors.");
  }
  var cons = function(data) {
    // type-check
    T([T.Or.apply({}, parts)].concat([T.void]))(function(){})(data);

    // instantiate an instance
    if( !(this instanceof cons) ) return new cons(data);

    var resp = [data];
    resp.__proto__ = cons.prototype;
    return resp;
  };
  cons.__proto__ = T.Enum.prototype;
  cons.types = parts;
  for( var k in parts ) {
    if( parts[k] instanceof T.Data ) {
      parts[k].rooted = true;
      parts[k].root = cons;
    }
  }

  return cons;
};

T.Match = function(algebraic) {  
  // form a pattern-matching function definition, with
  // the first argument being a function type signature
  // and subsequent pairs of arguments being an argument
  // type signature and a function for handling it.

  // for example, you may use this to delegate the
  // possibilities of a sum type.
  
  var args = toArray(arguments).slice(1);
  var unbox = function(item, index) {
    if( algebraic[index] instanceof T.Enum ) return item[0]
    else return item;
  };
  var verify = function(type, item, index) {    
    return getType(type).fun(unbox(item, index));
  };
  var attempt = function(type, fun, args) {
    if( args.length != type.length ) return false;
    var index = 0;
    for( var k in type ) {
      if( !verify(type[k], args[k], index) ) return false;
      index += 1;
    }
    return { resp: fun.apply({}, args.map(unbox)) };
  };
  return function() {
    for( var i = 0; i < args.length; i += 2 ) {
      var type = args[i];
      var fun = args[i+1];
      var resp = attempt(type, fun, toArray(arguments));
      if( resp ) {
        resp = resp.resp;
	var retType = getType(last(algebraic));
	if( !retType.fun(resp) ) {
	  throw new Error("Expected return type of pattern to be "+retType.name+".");
	}
        return resp;
      }
    }
    throw new Error("Pattern could not be matched.");
  };
};

T.render = function(types) {
  // render a signature given the types
  var argNames = types.slice(0, types.length-1).map(getType).map(function(x) { return x.name });
  return "(" + argNames.join(", ")+") -> "+getType(last(types)).name;
};

T.checker = function(message, fun) {
  // a basic function for forming message-linked functions
  // which will be used as type-checkers.
  var f = function(/* args */) {
    return fun.apply(fun, arguments);
  };

  f['message'] = message;
  return f;
};

// flag type values. void signals a lack of return value,
// and Circular is used in recursive type definitions.
T.void = {};
T.Circular = {};
T.Root = {};

T.Type = function(args) {
  // define a function type by means of T.Type(ret, arg1, ...) with
  // each argument being a type such as Number.
  if( !(this instanceof T.Type) ) return new T.Type(toArray(arguments));  

  // make a function which will wrap in type-checking another function,
  // and which holds onto the provided type signature.
  var fun = function(toWrap) {
    return T.apply({}, [toWrap].concat(args));
  };
  fun.ret = last(args);
  fun.args = args.slice(0, -1);   

  // make function inherit from T.Type
  fun.__proto__ = T.Type.prototype;
  return fun;
};

T.Or = function(args) {
  // form an algebraic type combining all of the provided types
  if( !(this instanceof T.Or) ) return new T.Or(toArray(arguments));
  this.types = args;
};

var root;
T.init = function() {
  // initialize Typical to have a root scope on
  // which all functions will be defined.

  // if a root element has been set, return
  if( root ) return;

  // attempt browser globals, fallback to node
  try {
    root = window;       
  } catch(err) {
    // a strict set of required globals
    root = GLOBAL; 
  } 
};

var argTypeChecker = function(fun, signature) {
  return function(type, argNum) {
    // form a checker function based on the provided type.
    var checker = getType(type, undefined, signature);

    // define an error to display in the case of a type error.
    var msg = ["Expected argument at index ",
		argNum,
		" of ",
		fun,
		" to be of type ",
		checker.name,
		"."].join("");

    // return a checker.	       
    return T.checker(msg, checker.fun);
  };
};
var getType = function(type, typeRoot, signature) {
  // forms a checker for a given type, maintaining
  // an idea of root type and function to which it
  // belongs when recursing.

  // maintain a link to the root type for Circular
  // references.
  var isRoot = false;
  if( !typeRoot ) {
    if( type instanceof T.Data && type.root ) {
      typeRoot = type.root;
    } else {
      isRoot = true;
      typeRoot = type;
    }
  }

  if( type instanceof T.Type ) {
    // a function type definition was passed 
    return {
      name: '(' + type.args.map(function(x) { 
        return getType(x, typeRoot, signature); 
      }).map(function(x) {
       return x.name;
      }).join(", ") + ') -> ' + getType(type.ret, typeRoot, signature).name,
      fun: function(x) {
        // check that the function is typed and that the return type matches
	if( !x.typed || !typeMatch(type.ret, x.type.ret)) return false;

        var passed = true;
	for( var k in type.args ) {
          if( !typeMatch(type.args[k], x.type.args[k]) ) return false;
	}
	return true;
      }
    };
  } else if( type instanceof T.Or ) {
    // check against an algebraic type of possible
    // types for the argument
    return {
      name: "("+type.types.map(function(x) {
        return getType(x, typeRoot, signature).name
      }).join(" | ")+")",
      fun: function(x) {
        for( var k in type.types ) {
          if( getType(type.types[k], typeRoot, signature).fun(x) ) return true;
	}
        return false;
      }
    };
  } else if( type instanceof T.Enum ) {
    return {
      name: "("+type.types.map(function(x) {
        return getType(x, typeRoot, signature).name
      }).join(" | ")+")",
      fun: function(x) {
        for( var k in type.types ) {
          if( getType(type.types[k], typeRoot, signature).fun(x) ) return true;
	}
        return x instanceof type;  
      }
    }
  } else if( type instanceof T.Data ) {
    return {
      name: "<Data: "+type.types.map(function(x){return getType(x, typeRoot, signature).name}).join(", ")+">",
      fun: function(x) {
        if( typeof x != 'object' || !existy(x) ) return false;
	// accept data constructed with the data-constructor
	if( x instanceof type ) return true;
	return false;
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
  } else if( type == T.Circular || (type == typeRoot && !isRoot) ) {
    return {
      name: '<Circular>',
      fun: function(x) {
        return getType(typeRoot, undefined, signature).fun(x);
      }
    };
  } else if( type == T.Root ) {
    return {
      name: '<Root>',
      fun: function(x) {
        return getType(T(signature), typeRoot, signature).fun(x);
      }
    };
  }  else if( typeof type == 'function' ) {
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
      name: "["+getType(type[0], typeRoot, signature).name+"]",
      fun: function(xs) {
        if( typeof xs != 'object' || !existy(xs) || !xs.map ) return false;
	return xs.map(getType(type[0], typeRoot, signature).fun).reduce(function(a,b) {
	  return a && b;
	}, true);
      }
    };
  } else if( typeof type == 'object' ) {    
    // an object was passed. objects are duck-typed.

    // render the key-pair types for use in the signature
    var valTypes = Object.keys(type).map(function(k) {
      var t = getType(type[k], typeRoot, signature);
      t.pair = [k, getType(type[k], typeRoot, signature).name].join(" => ");
      return t;
    });

    return {
      name: "{ "+valTypes.map(function(x){ return x.pair; }).join(", ")+" }",
      fun: function(xs) {
        if( typeof xs != 'object' || xs.map ) return false;
	var passed = true;
	for( var k in xs ) {
	  passed = passed && getType(type[k], typeRoot, signature).fun(xs[k]);
	}
	return passed;
      }
    };
  }
};
var typeMatch = function(a, b, aRoot, bRoot) {
  // Checks whether two types are equivalent, for the
  // sake of verifying function arguments.
  var isRoot = false;
  if( !aRoot || !bRoot ) {
    isRoot = true;
    aRoot = a;
    bRoot = b;
  }
  if( a == T.Circular || b == T.Circular ) {
    // compare the types to which circular references point
    if( a == T.Circular && b == T.Circular ) return typeMatch(aRoot, bRoot);
    else if( a == T.Circular ) return typeMatch(aRoot, b, aRoot, bRoot);
    else return typeMatch(a, bRoot, aRoot, bRoot);
  } else if( b instanceof T.Or || a instanceof T.Or ) {
    // compare the addends of a sum type
    if( a instanceof T.Or ) {
      for( var k in a.types ) {
	if( typeMatch(a.types[k], b) ) return true;
      }
      return false;
    } else if( b instanceof T.Or ) {
      for( var k in b.types ) {
	if( typeMatch(b.types[k], a) ) return true;
      }
      return false;
    }    
  } else if( typeof a == 'object' ) {
    var passed = true;
    for( var k in a ) {
      passed = passed && typeMatch(a[k], b[k], aRoot, bRoot);
    }
    for( var k in b ) {
      passed = passed && typeMatch(a[k], b[k], aRoot, bRoot);
    }
    return passed;
  } else {
    return a == b;
  }
};
var typeRecurses = function(type) {
  if( type == T.Root ) return true;
  if( type == T.Circular ) return true;
  if( type instanceof T.Or ) {
    for( var k in type.types ) {
      if( typeRecurses(type.types[k]) ) return true;
    }
    return false;
  }
  return false;
};

// function dependencies
var existy = function(x) {
  return typeof x != "undefined" && x != null;
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
var copy = function(obj) {
  var a;
  if( typeof obj == 'function' ) {
    a = function(){return obj.apply({}, arguments)};
  } else {
    a = {};
  }
  for( var k in obj ) a[k] = obj[k];
  a.__proto__ = obj.__proto__;
  return a;
};

// export the Typical function if in node
try {
  module.exports = T; 
} catch(err) {
  // no need to export in browser
}
