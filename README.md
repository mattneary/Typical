# Typical
Typical provides strict typing to JavaScript functions. Here's a quick 
example:

```javascript
fact = T(function(x) { return x == 0 ? 1 : x*fact(x-1) }, Number, Number)
```

The argument and return types of the function `fact` will now be checked,
and if not numeric, will throw an error. Here's what an error looks
like:

```sh
Error: Expected argument at index 0 of anonymous to be of type Number.
```

An additional benefit of typed functions is that they get partial application
for free. For example:

```javascript
sum = T(function(a, b) { return a + b }, Number, Number, Number)
plus3 = sum(3)
```

Supported types include `Number`, `String`, `Boolean`, object types, sum 
and product types which we will discuss further later, list and 
key-value types, and function types.

The primary motivation for Typical is to bring type-checking to the dynamic
language of JavaScript. Why? Type checking removes the possibility of an entire
class of bugs, and, additionally, provides the coder with a more clear view
of the problem which his function solves. The type system of Typical is
ambitious, aiming to mirror Haskell in some regards, and is still a work in
progress.

## Getting Started
### Types
Types are provided as class constructors, like `Number`, `String`, or 
`MyClass` or as data types and algebraic types can either be formed by passing 
multiple types to a data-type constructor, e.g., `T.Data(Number, String)`,
or by making sum types of the form `a | b` with `T.Enum(a, b, ...)`. Recursive
types can be defined using `T.Circular` and functions without return values
can be defined using `T.void`. Here's how derived types can be used:

```javascript
fold = T(function(f, xs) {
  return xs.reduce(f)
}, T([Number, Number, Number]), [Number], Number)
```

### Algebraic Types
Typical supports product and sum types, by means of `T.Data` and `T.Enum`,
respectively. A sum type is a sort of type union, allowing any of its
addend types, which are constructed with `T.Data`, to be considered of its type. 
A product type joins the data held by multiple types into a single package. 
Additionally, a data constructor can be defined inline with an enumerable type. 
For example:

```javascript
Node = T.Enum(T.Data("Node", Number, T.Circular), T.Data("Empty", T.void))
function lisp(x) {
  if( x.length == 0 ) return T.Data("Empty")(null)
  return T.Data("Node")(x[0], lisp(x.slice(1)))
}
T(lisp, [Number], Node)
```

Note the ability of the data type to be defined recursively upon the entire
type. This is a foundation for the creation of arbitrary data structures. A
data type is a contructor used to couple data. All sum types (made by `T.Enum`)
must consist exclusively of data types. Data types are built and used in one
of the two ways which follow.

```javascript
Person = T.Data(Number, String)
Person(1, "Matt")
```

```javascript
T.Data("Person", Number, String)
T.Data("Person")(1, "Matt")
```

When it comes time to extract data from these algebraic types, pattern matching
can be used.

### Pattern Matching
When aiming to make a polymorphic function which will extract the data from
a sum type, the `T.Match` function can be used. The following is an example of
method delegation.

```javascript
num = T.Match([NumOrStr, Number, Number],
              [String, Number], function(x, y) { return parseInt(x)+y },
              [Number, Number], function(x, y) { return x+y })
```	      


### Function Types
You will, inevitably, wish to have a function accept another function as
argument. In this case, you will need a means of defining a function's type.
The function `T` constructs a function type-class when passed an array. For example,
the following forms the type of a function from `Number` to `String`.

```javascript
Stringify = T([Number, String])
```

This type can then be used both as a constructor of typed functions and as
a type for function signatures.
