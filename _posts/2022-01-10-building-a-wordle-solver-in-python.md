---
layout: post
title: Building a WORDLE Solver in Python
description: Exploits of a coder in quarantine.
---
I spent the first days of a fresh new year like many others: in quarantine with COVID. Fortunately I had already received my vaccine and booster; my symptoms were mild. But I was still left with an abundance of downtime before classes began, and I became completely preoccupied with the *delightful* [WORDLE](https://www.powerlanguage.co.uk/wordle/).

For the uninitiated, WORDLE is an online word game similar to the guessing game [Mastermind](https://en.wikipedia.org/wiki/Mastermind_(board_game)). In WORDLE, you get six attempts at guessing a secret five-letter word. After each guess, you get feedback on which letters you have guessed correctly and in the correct position (highlighted in green), which you have guessed correctly but are misplaced (yellow), and which do not appear at all in the puzzle's solution. You can use this feedback to hone in on the correct solution.

I love WORDLE. Its origin story is [downright adorable](https://www.nytimes.com/2022/01/03/technology/wordle-word-game-creator.html). Cursory research suggests I am not WORDLE's only admirer; you can find WORDLE scores peppering your Twitter feed, and it has produced some great [technical analysis](https://matt-rickard.com/wordle-whats-the-best-starting-word/) and [spin-offs](https://qntm.org/files/wordle/index.html).

And so, for the inaugural post on my blog, I aim to contribute to the ongoing Cambrian explosion of WORDLE programming posts by building a WORDLE solver in Python.

## High-level analysis
Our strategy is to keep a list of candidate solutions—words which could possibly be the answer to a given puzzle. At each step, we pick some word (more on this later) to enter as a guess and observe the feedback. Based on the feedback, we narrow the space of viable candidate solutions.

<!-- question: is the best guess always among the remaining possibilities?
is there ever a time it makes more sense to guess a word that you know is invalid,
perhaps in the larger guess list rather than the solution list? -->

Initially, the set of candidate solutions is the [entire WORDLE wordlist](https://github.com/joek13/wordle/blob/master/words.txt)[^1]. 

Suppose we guess the word "SWORD" and see the following feedback.

<img alt="guessing 'SWORD'; the letter 'R' is green, and all the others are gray" src="/img/wordle_1.png" width="500" />

We cut any candidate solution that doesn't have R in the fourth position. We can also discard any candidate containing the letters S, W, O, or D, since they are gray.

<img alt="guessing 'SMITE'; 'E' is yellow, all others are gray" src="/img/wordle_2.png" width="500" />

Yellow letters give us information, too. We can toss out any candidate words without Es. Also, the fact that E is yellow (rather than green) means the solution *doesn't* have an E in the fifth position, so we can discard any candidate words with E in the fifth position.

### `word_consistent` predicate generator
Let's express this as a function, `word_consistent`, which accepts feedback about a guess, and returns a predicate that checks whether a given word is consistent with the feedback.

First, we introduce a type alias to make our type hints a little more readable. `PositionLetterPair` is a tuple `(int, str)` representing a letter at a given position. (So `(0, "g")` represents a G in the first position.)
```python
# type alias for pair of (int, str)
# (p, l) represents a letter l in position p
PositionLetterPair = typing.Tuple[int, str]
```

Now we define `word_consistent`, which accepts
- `green_pairs`, a list of position-letter pairs representing the green letters
- `yellow_pairs`, a list of position-letter pairs representing the yellow letters
- `gray_letters`, a `Set` of letters representing the gray letters
    -  The position of gray letters is irrelevant, so we don't bother with `PositionLetterPair`.

It returns a function, referred to internally as `pred`, which is a *predicate* on strings: it accepts `string` objects and returns a boolean value. The idea of a function that returns another function might seem a little bit strange, but we'll see later why this is quite an ergonomic way of solving this problem.

```python
def word_consistent(green_pairs: typing.List[PositionLetterPair],
                    yellow_pairs: typing.List[PositionLetterPair],
                    gray_letters: typing.Set[str]) -> typing.Callable[[str], bool]:
    """Returns a predicate testing whether a given word is consistent with observed feedback."""

    def pred(word):
        # any viable solution must:
        # - have letter l at position p for all green position-letter pairs (l, p)
        green_matches = all(word[p] == l for (p, l) in green_pairs)
        # - not have letter l at position p for any yellow position-letter pair (l, p)
        yellow_mismatches = not any(word[p] == l for (p, l) in yellow_pairs)
        # - contain letter l for all yellow position-letter pairs (l, p)
        yellow_letters = set(letter for (_, letter) in yellow_pairs)
        yellow_contains = all(l in word for l in yellow_letters)
        # - contain no gray letters l
        gray_absent = all(l not in word for l in gray_letters)

        return green_matches and yellow_mismatches and yellow_contains and gray_absent

    return pred
```

## Choosing a guess
We now need to establish a mechanism for deciding which candidate word to guess at any given point. That is, we need a **decision rule**: an algorithm for determining which action to take given our prior observations.

Intuitively, we want to always guess the word that cuts down the set of candidate solutions as much as possible. Discovering this word is not straightforward, however, because the feedback we receive on a word is a function of both our guess and the unknown solution to the puzzle. (To illustrate: you can cut down the set of candidates significantly more by guessing SMITE when the solution is SMITH than you can when the solution is FOCAL.)

Fortunately, decision rules like [minimax](https://en.wikipedia.org/wiki/Minimax) exist to make decisions in spite of this uncertainty. Minimax instructs us to guess a word that *minimizes* the *maximum* possible loss in any outcome. For any guess, it asks, "how many words would be left in the worst-case scenario?" and picks the word that minimizes this quantity.

### Generating feedback
Before we implement our minimax decision rule, we have to generate the feedback from guessing a word under a given solution. That's what `generate_feedback` does; you give it a puzzle solution and your guess, and it returns:
- the list of `PositionLetterPair`s representing to the green letters,
- the list of `PositionLetterPair`s representing to the yellow letters,
- and the set of gray letters.

```python
def generate_feedback(soln: str, guess: str) -> typing.Tuple[typing.List[PositionLetterPair], typing.List[PositionLetterPair], typing.Set[str]]:
    """Returns the feedback from guessing `guess` when the solution is `soln`.
    The feedback is returned as a tuple of (green (pos, letter) pairs, yellow (pos, letter) pairs, set of gray letters)
    """
    # sanity check
    assert len(soln) == len(guess)

    # selects all (position, letter) pairs where the letters in soln and guess are equal
    green_pairs = [(p1, soln_letter) for ((p1, soln_letter), guess_letter)
                   in zip(enumerate(soln), guess) if soln_letter == guess_letter]

    green_letters = set(letter for (_, letter) in green_pairs)

    # selects all (position, letter) pairs where the letter l from guess is
    # - in the soln word
    # - but not in the set of green letters

    yellow_pairs = [(p, guess_letter) for (p, guess_letter) in enumerate(
        guess) if guess_letter in soln and guess_letter not in green_letters]

    # all letters that are in the guess but not in the solution
    gray_letters = set(guess) - set(soln)

    return green_pairs, yellow_pairs, gray_letters
```

We can use this method to determine how many candidate words we get to slash for each possible guess under each possible solution. We also get some ergonomic payoff:
- We get to use the [unpacking operator](https://docs.python.org/3/tutorial/controlflow.html#unpacking-argument-lists) `*` to pass the result of `generate_feedback` directly as arguments to `word_consistent`.
- We get to use the predicate returned by `word_consistent` in a [`filter`](https://docs.python.org/3/library/functions.html#filter) over candidate words.

```python
def select_guess(candidates: str) -> typing.Tuple[str, int]:
    """Selects guess among candidates based on minimax decision rule.
    Returns tuple of (word, max), where word is the guess, and max is
    the maximum possible of remaining candidates after guessing `word`.
    """
    current_minimax = None
    current_minimax_word = None

    print(f"Selecting best guess from {len(candidates)} possibilities...")

    # for each possible guess...
    for guess in candidates:
        # max loss for this guess
        maximum_remaining = None
        # for each possible solution...
        for possible_soln in candidates:
            # feedback guessing `guess` when the solution is `soln`
            feedback = generate_feedback(possible_soln, guess)
            # how many words remain after incorporating this feedback
            remaining = len(list(filter(word_consistent(*feedback), candidates)))

            # is this a new maximum loss?
            if maximum_remaining is None or remaining > maximum_remaining:
                maximum_remaining = remaining

            if current_minimax is not None and maximum_remaining > current_minimax:
                # the maximum for this guess is larger than the current minimax
                # not possible that this word represents a minimax, we can break early
                break

        if current_minimax is None or maximum_remaining < current_minimax:
            current_minimax = maximum_remaining
            current_minimax_word = guess

    return current_minimax_word, current_minimax
```

The worst-case runtime complexity of selecting a guess is cubic in the size of the wordlist, since it has to loop over all candidate words
- once for each possible guess,
    - once for each possible solution,
        - and once to filter each candidate. (This is obscured by the `filter`.)

Fortunately, we rarely encounter the worst-case, and because we are searching for a "minimum of maximums", we can `break` the inner loop if the running maximum ever goes above the running minimax. Even with this optimization, selecting the first guess takes around ~1 minute, 10 seconds on my laptop.

At this point, the algorithm suffices to tell us the best starting word, according to our decision rule. We write some quick code to load the words from a text file:
```python
def load_words(wordlist_path: str = "./words.txt") -> typing.List[str]:
    """Loads wordlist from a newline-delimited file."""
    with open(wordlist_path, "r") as f:
        return [line.strip() for line in f.readlines()]
```
We then select a guess from these words:
```python
if __name__ == "__main__":
    all_words = load_words()

    possibilities = all_words
    guess, worst_case = select_guess(possibilities)
    print(f"I suggest: {guess.upper()}, which leaves {worst_case} words at worst")
```
Which outputs:
```markdown
Selecting best guess from 2315 possibilities...
I suggest: ARISE, which leaves 168 words at worst
```
This is exactly in line with the suggested starting words at [wordlesolver.com](https://www.wordlesolver.com/). (WordleSolver suggests multiple words—all of which are anagrams of ARISE.) It differs from the suggested SOARE on [Matt Rickard's blog](https://matt-rickard.com/wordle-whats-the-best-starting-word/), but Matt's article filters by average performance over all possible solutions, rather than worst-case performance, like ours does.

## Handling user input
The last thing we have to do to convert this into a fully-fledged solver is to setup an input loop. At each step, it:
1. Selects a guess from the candidates,
2. prompts the user for feedback from their WORDLE game,
3. and narrows down the candidates based on their selection.

This implementation's input method is a little bit clunky; it asks users to enter green, yellow, and gray tiles one line at a time, entering `_` for blanks.

One interesting advantage of this approach is that you don't *have* to enter the guesses suggested by the solver. If you are halfway through an existing game and you want the solver to try its best to save you, you can just enter the results of your previous guesses and let it take over.

```python
if __name__ == "__main__":
    all_words = load_words()  # load words from file

    possibilities = all_words
    while True:
        guess, worst_case = select_guess(possibilities)
        print(f"I suggest: {guess.upper()}, which leaves {worst_case} words at worst")

        input_green = input("Enter the green letters, using _ for blanks:   ")

        assert len(input_green) == 5
        green_pairs = [
            (position, letter.lower()) for (position, letter) in enumerate(input_green) if letter.isalpha()
        ]

        input_yellow = input("Enter the yellow letters, using _ for blanks:  ")

        assert len(input_yellow) == 5
        yellow_pairs = [
            (position, letter.lower()) for (position, letter) in enumerate(input_yellow) if letter.isalpha()
        ]

        input_gray = input("Enter the gray letters, using _ for blanks:    ")
        gray_letters = set(letter.lower() for letter in input_gray if letter.isalpha())

        pred = word_consistent(green_pairs, yellow_pairs, gray_letters)
        possibilities = list(filter(pred, possibilities))

        if len(possibilities) == 1:
            print("The word is:", possibilities[0].upper())
            break
        elif len(possibilities) < 1:
            print("The puzzle is impossible! Perhaps you entered results incorrectly?")
```
## Demonstration
Let's use our new solver to crack today's WORDLE:
```
Selecting best guess from 2315 possibilities...
I suggest: ARISE, which leaves 168 words at worst
Enter the green letters, using _ for blanks:   _____
Enter the yellow letters, using _ for blanks:  _r__e
Enter the gray letters, using _ for blanks:    a_is_
Selecting best guess from 100 possibilities...
I suggest: OUTER, which leaves 19 words at worst
Enter the green letters, using _ for blanks:   _u___
Enter the yellow letters, using _ for blanks:  ___er
Enter the gray letters, using _ for blanks:    o_t__
The word is: QUERY
```
<img alt="today's WORDLE solved in a cool 3 guesses" src="/img/wordle_solved.png" width="500" />

Success!!

## Source code
All of the code for this blog post can be found in the [joek13/wordle GitHub repository](https://github.com/joek13/wordle).

## References
Each of the following articles was helpful in writing this post:
- [Jack Jackson's *Cheating at Word Games*](https://blog.scubbo.org/posts/cheating-at-word-games/)
- [Christian Genco's Twitter thread](https://twitter.com/cgenco/status/1479144204043444226)
- [Matt Rickard: "Wordle: What's the Best Starting Word?"](https://matt-rickard.com/wordle-whats-the-best-starting-word/)

[^1]: As it turns out, [WORDLE has two wordlists](https://blog.scubbo.org/posts/cheating-at-word-games/#fn:1). One is a list of valid guesses, which is large. The other is a list of possible puzzle solutions. Presumably these are separated so that no WORDLE requires knowledge of some rare or obscure word to solve. Altogether, there are 2,315 possible solutions.
