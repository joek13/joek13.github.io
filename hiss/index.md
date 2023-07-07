---
layout: post
title: Hiss
description: My WIP hobby programming language implemented in Haskell.
image: /img/hiss.png
---

<img class="profile right" alt="Poorly-drawn Hiss logo" src="/img/hiss.png" width="150">

<a href="/hiss">Hiss</a> is my WIP hobby programming language implemented in Haskell.
It is named in honor of a copperhead snake that was recently discovered in my bedroom (read: basement of parents' house).

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
- [Strongly typed](https://en.wikipedia.org/wiki/Strong_and_weak_typing) using a [Hindley-Milner](https://en.wikipedia.org/wiki/Hindley%E2%80%93Milner_type_system)-like type system
- Essentially a proper superset of the [lambda calculus](https://en.wikipedia.org/wiki/Lambda_calculus)

It supports some cool features from functional programming:
- [Partial function application](https://en.wikipedia.org/wiki/Partial_application)
- [Lexically scoped closures](https://en.wikipedia.org/wiki/Closure_(computer_programming))
- [First-class functions](https://en.wikipedia.org/wiki/First-class_function)

The hiss compiler `hissc` is written in Haskell and [open-sourced on GitHub](https://github.com/joek13/hiss).
`hissc` is still in progress, but it already includes:
- Hiss lexer and parser
- Semantic passes to detect use of undeclared identifiers, value cycles (e.g., declarations like `a = b`, `b = c`, `c = a`)
- A naive, untested tree-walking interpreter and an associated [REPL](https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop)

Planned features include:
- Type system (currently in progress)
- Machine code generation via a LLVM backend
- An online Hiss playground