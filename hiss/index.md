---
layout: post
title: Hiss
description: My WIP hobby programming language implemented in Haskell.
image: /img/hiss.png
---

<img class="profile right" alt="Poorly-drawn Hiss logo" src="/img/hiss.png" width="150">

<a href="/hiss">Hiss</a> is my WIP hobby programming language implemented in Haskell.
It is named in honor of a copperhead snake discovered in the basement of my parents' house, which was then serving as my bedroom.

I'm building Hiss to learn more about Haskell, functional programming in general, and in particular, the implementation of functional languages.
(So here's your disclaimer: it's neither well-tested nor stable and will almost certainly never be recommended for production use.)

Here is a sample Hiss program that computes the [Collatz stopping time](https://en.wikipedia.org/wiki/Collatz_conjecture) of 27:
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

The Hiss compiler `hissc` is written in Haskell and [open-sourced on GitHub](https://github.com/joek13/hiss).
`hissc` is still in progress, but it already includes:
- Hiss lexer and parser
- Semantic passes, including:
     - A name-checking pass that rejects use of undeclared identifiers
     - A dependency-checking pass that rejects value cycles (e.g., code like `a = b, b = c, c = a`)
     - A type-checking pass
- A naive, untested tree-walking interpreter and an associated [REPL](https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop)

In-progress features:
- [hissvm](https://github.com/joek13/hissvm), a bytecode virtual machine written in Zig.

Planned features include:
- Code generation 
- An online Hiss playground
