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

Additionally, function types can be defined separately and then applied 
to a function. This method is appropriate for recursive function types.
The inability of JavaScript variable declarations to reference
themselves led `T.Root` to be implemented, a type which will refer to the 
parent function type. Note, also, that Typical utilizes an 
[Isorecursive](http://en.wikipedia.org/wiki/Recursive_data_type#Isorecursive_types) 
approach to types. That is to say that the type when not *unrolled* is
seen as distinct from the unrolled type. This idea may give you a better 
understanding of the use of keywords `T.Root`, and later, `T.Circular`.

```javascript
Nary = T([Number, T.Or(Number, T.Root)])
sum = Nary(function(x) {
  return // ...
})
```

Types can be primitives, constructed objects, lists, duck-typed objects 
(dictionaries), functions, or algebraic types. Additionally, types can
be recursive by means of the `T.Circular` type, similar to `T.Root`. 
Recursive types are built as follows.

```javascript
Linked = [T.Or(Number, T.Circular)]
```

Note that all functions will be partially applied if receiving less than
the expected number of arguments.

## Getting Started
### Types
Types are provided as class constructors, like `Number`, `String`, or 
`MyClass` and algebraic types can be formed by passing Arrays or Hashes of
these types, for example, `[String]` or `{name:String, age:Number}`,
by making sum types of the form `a | b` with `T.Or(a, b, ...)`. There 
are also special types `T.Circular` and `T.Root` for use in recursive types 
and recursive function types, respectively.

### Function Types
You will, at times, wish to have a function accept another function as
argument. In this case, you will need a means of defining a function's type.
The function `T` constructs a function type-class when passed an array. For example,
the following forms the type of a function from `Number` to `String`.

```javascript
Stringify = T([Number, String])
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

```javascript
linkedList = function(x) {
  if( x.length == 0 ) return []
  return [x[0], linkedList(x.slice(1))]
}
T(linkedList, [Number], [T.Or(Number, T.Circular)])
```

```javascript
NaryAdder = T([Number, T.Or(Number, T.Root)])
sum = NaryAdder(function(x) {
  return NaryAdder(function(y){return y == 0 ? x : sum(x+y);})
})
```
