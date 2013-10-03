# Typical
Typical serves to add strict typing to JavaScript functions. Types can
either be provided as annotations or a function can be defined with types
from the get-go. The following two code samples are equivalent.

```javascript
f = function(x) { return x+1 }
T(f, Number, Number)
```
```javascript
f = T(function(x) { return x+1 }, Number, Number)
```

## Getting Started
### Types
Types are provided as class constructors, like `Number`, `String`, or 
`MyClass` and derived types can be formed by passing Arrays or Hashes of
these types. For example, `[String]` or `{name:String, age:Number}`.

### Function Types
You will, at times, wish to have a function accept another function as
argument. In this case, you will need a means of defining a function's type.
The function `T` constructs a function type-class when passed an array. For example,
the following forms the type of a function from `Number` to `String`.

```javascript
stringify = T([Number, String])
```

## Examples
```javascript
search = function(c, ds) { 
  return ds.filter(function(d) { 
    return d.first == c.first && d.last == c.last 
  })
}
Name = {first: String, last: String}
T(search, Name, [Name], [Name])
```

```javascript
join = function(xs, ys, f) {
  return xs.map(function(x, y) {
    return f(x, y)
  })
}
T(join, [Number], [Number], T([Number, Number, Number]), [Number])
sum = T(function(x, y) { return x + y }, Number, Number, Number)
zipSum = function(xs, ys) { return join(xs, ys, sum) }
T(zipSum, [Number], [Number], [Number])
```
