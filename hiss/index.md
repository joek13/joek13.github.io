---
layout: post
title: Hiss
description: Toy programming language and bytecode compiler.
image: /img/hiss.png
---

<img class="profile right" alt="Poorly-drawn Hiss logo" src="/img/hiss.png" width="150">

Hiss is my WIP hobby programming language.
It features a bytecode compiler written in Haskell and a virtual machine written in Zig.
Hiss is named in honor of a copperhead snake discovered in the basement of my parents' house, which was then serving as my bedroom.

I'm building Hiss to learn more about compilers, interpreters, and functional programming.
(So here's your disclaimer: it's neither well-tested nor stable and will almost certainly never be recommended for production use.)

Try Hiss for yourself on the [playground](/hiss/playground). Check out its [source code on GitHub](https://github.com/joek13/hiss).

## Example

Here's a sample Hiss program that computes the [Collatz stopping time](https://en.wikipedia.org/wiki/Collatz_conjecture) of 27:

```js
// computes k mod n
mod(n, k) = if k < n
            then k
            else mod(n, k-n)

mod2 = mod(2) // partial application of mod

// returns stopping time of n
collatz(n, steps) = if n == 1
                    then steps
                    else if mod2(n) == 0
                         then collatz(n/2, steps + 1)
                         else collatz(3*n + 1, steps + 1)

main() = collatz(27, 0) // should output 111
```

Try running this program on the [playground](/hiss/playground)!

## More details

Hiss is:
- [Purely functional](https://en.wikipedia.org/wiki/Purely_functional_programming)
- [Strictly evaluated](https://en.wikipedia.org/wiki/Evaluation_strategy)
- [Strongly typed](https://en.wikipedia.org/wiki/Strong_and_weak_typing) using the [Hindley-Milner type system](https://en.wikipedia.org/wiki/Hindley%E2%80%93Milner_type_system)
- Essentially a proper superset of the [lambda calculus](https://en.wikipedia.org/wiki/Lambda_calculus)

It supports some cool features from functional programming:
- [Partial function application](https://en.wikipedia.org/wiki/Partial_application)
- [Lexically scoped closures](https://en.wikipedia.org/wiki/Closure_(computer_programming))
- [First-class functions](https://en.wikipedia.org/wiki/First-class_function)
- [Type inference](https://en.wikipedia.org/wiki/Type_inference)

Hiss is [open-sourced on GitHub](https://github.com/joek13/hiss). It has two main components:
- `hissc` – Hiss bytecode compiler, written in Haskell
- `hissvm` - Hiss bytecode interpreter, written in Zig

`hissc` and `hissvm` are still in progress, but they already include:
- Hiss lexer and parser
- Semantic passes
     - A name-checking pass that rejects undeclared identifiers
     - A dependency-checking pass that rejects value cycles (code like `a = b, b = c, c = a`)
     - A type inference and type-checking pass
- (Incomplete) code generation
- Bytecode interpreter
- An [online playground](/hiss/playground) where you can try Hiss yourself!

Planned work includes
- Completion of code generation
- Optimization passes
- User-defined types and pattern matching
- Side effects for I/O? Who knows!
