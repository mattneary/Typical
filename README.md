# Typical
Typical serves to add strict typing to JavaScript functions. Types can
either be provided as annotations or a function can be defined with types
from the get-go. The following two code samples are equivalent.

```javascript
var f = T(Number, Number, function(x) { return x+1; });
```

```javascript
f = function(x) { return x+1; };
T.annotate(f, Number, Number);
```

## Types
Types are provided as class constructors, like `Number`, `String`, or 
`MyClass` and derived types can be formed by passing Arrays or Hashes of
these types. For example, `[String]` or `{name:String, age:Number}`.

## Function Types
You will, at times, wish to have a function accept another function as
argument. In this case, you will need a means of defining a function's type.
The function `T.Type` constructs a function type-class. For example,
the following forms the type of a function from `Number` to `String`.

```javascript
var stringify = T.Type(Number, String);
```
