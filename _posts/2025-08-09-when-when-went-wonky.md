---
layout: post
title: When 'when' went wonky
description: A surprising edge case in Kotlin's exhaustiveness checking.
excerpt_separator: <!--end-excerpt-->
permalink: /blog/kotlin-when
---

Using Kotlin's [`sealed` modifier](https://kotlinlang.org/docs/sealed-classes.html#declare-a-sealed-class-or-interface), you can define something like an [algebraic data type](https://en.wikipedia.org/wiki/Algebraic_data_type):

```kotlin
sealed interface TaskStatus {
    object Pending : TaskStatus
    class Complete(val result: Int) : TaskStatus
    class Failed(val error: String) : TaskStatus
}
```

A `when` statement lets us handle each case:

```kotlin
fun printTaskStatus(taskStatus: TaskStatus) {
    when(taskStatus) {
        TaskStatus.Pending -> println("Task is pending")
        is TaskStatus.Complete -> println("Task complete with result: ${taskStatus.result}")
        is TaskStatus.Failed -> println("Task failed with error: ${taskStatus.error}")
    }
}
```
Notice there's no `else` branch.
Because `TaskStatus` is `sealed`, the compiler knows all its possible subtypes at compile time.
Since we've covered them all, no `else` branch is necessary.

That's good, because when we add a new subtype...

```diff
 // Represents the status of an asynchronous task.
 sealed interface TaskStatus {
     object Pending : TaskStatus
+    object Skipped : TaskStatus
     class Complete(val result: Int) : TaskStatus
     class Failed(val error: String) : TaskStatus
 }
```

...the compiler will helpfully remind us to update our `when` statement:

```
error: 'when' expression must be exhaustive. Add the 'Skipped' branch or an 'else' branch.
    when(taskStatus) {
    ^^^^
```

The main appeal here is that we get to model state in a type-safe manner while the compiler enforces exhaustiveness.
This pattern is common in functional languages (Haskell) and languages with heavy functional inspiration (Rust).

But something strange can happen if we try to construct an instance of TaskStatus at runtime using Java reflection.
Imagine invoking some Java serialization library that uses reflection under the hood:

```kotlin
val status = json.read<TaskStatus>("""{"status": "Pending"}""")
printTaskStatus(status)
```

Compilation passes, but we fail at runtime:

```
% kotlinc -include-runtime -d example.jar example.kt
% java -jar example.jar
Exception in thread "main" kotlin.NoWhenBranchMatchedException
        at ExampleKt.printTaskStatus(example.kt:15)
        at ExampleKt.main(example.kt:33)
        at ExampleKt.main(example.kt)
```

What gives? Isn't the compiler supposed to prevent this runtime error from happening?

At runtime, we decide whether to take the `TaskStatus.Pending` branch by evaluating `status == TaskStatus.Pending`, or equivalently, `status.equals(TaskStatus.Pending)`. On the JVM, this invokes `Object.equals`, which implements referential equality.

Normally that would be fine. Kotlin objects are represented by singletons, so every `TaskStatus.Pending` refers to the same instance. But this guarantee is upheld by the Kotlin compiler, and it doesn't extend to called Java code. And indeed using Java reflection, we can create additional instances of `TaskStatus.Pending`:

```kotlin
val constructor = TaskStatus.Pending::class.java.getDeclaredConstructor()
constructor.isAccessible = true

val status1 = TaskStatus.Pending
val status2 = constructor.newInstance() as TaskStatus.Pending

println("${status1 == status2}")  // false
println("${status1 === status2}") // false
```

Two distinct `Pending` instances now exist, and `when` falls through, leading to the runtime error.

So we have our bug: Kotlin thinks the `when` statement is exhaustive because it assumes only one instance of `TaskStatus.Pending` can exist at runtime. Our serialization library breaks that assumption by creating a new instance using reflection.

How can we fix this? The simplest way is to match on type:

```diff
 fun printTaskStatus(taskStatus: TaskStatus) {
     when(taskStatus) {
-        TaskStatus.Pending -> println("Task is pending")
+        is TaskStatus.Pending -> println("Task is pending")
         is TaskStatus.Complete -> println("Task complete with result: ${taskStatus.result}")
         is TaskStatus.Failed -> println("Task failed with error: ${taskStatus.error}")
     }
 }
```

Now *any* instance of `Pending` will trigger the appropriate branch.
But we can easily forget to write `is`. A better solution would be to override `Pending.equals`:

```kotlin
public sealed interface TaskStatus {
    object Pending : TaskStatus {
        override fun equals(other: Any?) =
            other != null && other is Pending

        // Should override hashCode() as well.
    }
    class Complete(val result: Int) : TaskStatus
    class Failed(val error: String) : TaskStatus
}
```

Now, `Pending.equals` implements structural equality. All instances compare equal.
Our original snippet behaves as expected, even if we use reflection to create additional instances of `Pending`.

In fact, if we apply the [`data` modifier](https://kotlinlang.org/docs/object-declarations.html#data-objects) to an object, the compiler will generate appropriate `equals()` (and `hashCode()`) methods automatically, avoiding this strange situation entirely. This gotcha is even called out in the documentation:

> The `equals()` function for a `data object` ensures that all objects that have the type of your `data object` are considered equal.
> In most cases, you will only have a single instance of your `data object` at runtime, since a `data object` declares a singleton.
> However, in the edge case where another object of the same type is generated at runtime (for example, by using platform reflection with `java.lang.reflect` or a JVM serialization library that uses this API under the hood), this ensures that the objects are treated as being equal.

I bring up this example not because I think it points to some flaw in Kotlin, but rather because it illustrates a trade-off.
One reason Kotlin is attractive is because it can provide strong guarantees (exhaustiveness checking, null safety) and remain compatible with the Java ecosystem.
As a developer, I get to take advantage of Kotlin's features without giving up access to my favorite Java libraries, which can be really important in an enterprise context.

But things get *weird* at the border; called Java code is under no obligation to honor Kotlin's guarantees, and that can lead to surprising results.
