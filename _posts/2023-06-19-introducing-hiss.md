---
layout: post
title: "Introducing Hiss"
description: "My hobby functional programming language written in Haskell."
permalink: /blog/introducing-hiss
---

Since graduating in May, I have spent some of my free time working on a hobby functional programming language called [Hiss](/hiss),
named in honor of the copperhead snake discovered in the basement of my parents' house shortly before I moved in.

```
// computes k mod n
mod(n, k) = if k < n
            then k
            else mod(n, k-n)

// partial function application
mod2 = mod(2)

// computes stopping time of n
collatz(n, steps) = if n == 1
                    then steps
                    else if mod2(n) == 0
                         then collatz(n/2, steps + 1)
                         else collatz(3*n + 1, steps + 1)

// should output 111
main() = collatz(27, 0)
```