# Typical
Typical serves to add strict typing to JavaScript functions. Types can
either be provided as annotations or a function can be defined with types
from the get-go. The following two code samples are equivalent.

```javascript
f = T(Number, Number, function(x) { return x+1 })
```

```javascript
f = function(x) { return x+1 }
T.annotate(f, Number, Number)
```

## Getting Started
### Types
Types are provided as class constructors, like `Number`, `String`, or 
`MyClass` and derived types can be formed by passing Arrays or Hashes of
these types. For example, `[String]` or `{name:String, age:Number}`.

### Function Types
You will, at times, wish to have a function accept another function as
argument. In this case, you will need a means of defining a function's type.
The function `T.Type` constructs a function type-class. For example,
the following forms the type of a function from `Number` to `String`.

```javascript
stringify = T.Type(Number, String)
```

### Annotations
Type annotations require that a module be defined. To do this, call `T.module`
on the global namespace, i.e., `GLOBAL`.

```javascript
T.module(GLOBAL)
```

## Examples
```javascript
T.module(GLOBAL)
search = function(c, ds) { 
  return ds.filter(function(d) { 
    return d.first == c.first && d.last == c.last 
  })
}
Name = {first: String, last: String}
T.annotate(search, Name, [Name], [Name])
```

```javascript
T.module(GLOBAL)
join = function(xs, ys, f) {
  return xs.map(function(x, y) {
    return f(x, y)
  })
}
T.annotate(join, [Number], [Number], T.Type(Number, Number, Number), [Number])
sum = T(Number, Number, Number, function(x, y) { return x + y })
zipSum = function(xs, ys) { return join(xs, ys, sum) }
T.annotate(zipSum, [Number], [Number], [Number])
```
