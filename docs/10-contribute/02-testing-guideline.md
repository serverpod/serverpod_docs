# Serverpod Testing Philosophy

## Overview

At Serverpod, our core testing philosophy revolves around achieving the following goals:

- **Readable and Self-Explanatory Tests** – Tests should be easy to understand at a glance. Descriptions must clearly convey the purpose and expected outcome without needing to inspect the test's internal implementation.
- **Resilient to Refactoring** – Tests should not break due to internal refactoring. As long as the external behavior remains consistent, tests should pass regardless of code structure changes.
- **Focused on Behavior, Not Implementation** – We prioritize testing how the code behaves rather than how it is implemented. This prevents unnecessary coupling between tests and production code, fostering long-term stability.
- **Easy to Maintain and Expand** – Tests should be simple to update or extend as the product evolves. Adding new features should not require widespread changes to existing tests.
- **Effective at Catching Bugs** – The primary goal of testing is to identify and prevent bugs. Our tests are crafted to cover edge cases, ensure proper functionality, and catch potential regressions.

By adhering to the following principles, we ensure that our test suite remains a valuable and reliable asset as our codebase grows.

This document outlines Serverpod's approach to testing  code. It serves as a guide for writing effective, maintainable, and meaningful tests across all our projects.

## Key Principles

### 0. Test Independence

- **Tests should be completely independent of one another.**
- The outcome of a test must never depend on any other test running before or after it.
- The order in which tests are executed **should not matter.**
- Running a single test in isolation must produce the same result as running it alongside others.
- **Exception to the rule:** e2e and integration tests. In scenarios where an external state (like a shared database) is involved, tests may require concurrency mode 1 to prevent interference. But each test should start and end in a clean state.

### 1. Clear and Descriptive Test Descriptions

- **Test descriptions should be understandable without reading the test code.**
- If a test fails, the description alone should make it clear what went wrong.
- **Format:** Descriptions follow the "Given, When, Then" style.

**Example:**

```dart
// Given a user with insufficient permissions
// When attempting to access a restricted page
// Then a 403 Forbidden error is returned
```

### 2. Focus on Single Responsibility

- Each test should **only test one thing**.
- **Avoid** bundling multiple independent checks into a single test.
- It is acceptable to **repeat the same precondition and action** across tests to ensure each aspect is tested individually.

**Example:**

```dart
// Do - Tests are split
test('Given an empty list when a string is added then it appears at the first index', () {
  final list = [];
  list.add('hello');
  expect(list[0], 'hello');
});

test('Given an empty list when a string is added then list length increases by one', () {
  final list = [];
  list.add('hello');
  expect(list.length, 1);
});

// Don't - Multiple independent checks in one test
test('Add string to list and check index and length', () {
  final list = [];
  list.add('hello');
  expect(list[0], 'hello');
  expect(list.length, 1);
});
```

- Multiple `expect` statements are not necessarily against this rule. However, they must check values that are interdependent and only meaningful when evaluated together.

**Example:**

```dart
  test('Given a missing semicolon when validated then the entire row is highlighted', () {
    final code = 'final a = 1'; 
    final result = validateCode(code);
    
    expect(result.span.start.column, 1);
    expect(result.span.end.column, 12);
    expect(result.span.start.line, 1);
    expect(result.span.end.line, 1);
  });
```

- In this case, verifying both the start and end positions of the `SourceSpanException` is essential because they collectively describe the error location, and their correctness is interdependent.

\*Note: SourceSpanException is an object that describes a code error in a source file. See: \*[*https://api.flutter.dev/flutter/package-source\_span\_source\_span/SourceSpanException-class.html*](https://api.flutter.dev/flutter/package-source_span_source_span/SourceSpanException-class.html)&#x20;

### 3. Pure Unit Testing

- **Unit tests should avoid mocking and side effects.**
- Production code should push side effects **up the call stack**, allowing tests to cover pure methods.
- **Test the logical feature/unit** rather than a single method or class.

**Example:**

```dart
// Don't mock HTTP requests directly, test the logic that processes the response
Future<String> fetchUserData() async {
  final response = await httpClient.get(url);
  return processResponse(response);
}
```

- Test `processResponse` directly without mocking the `httpClient`.

### 4. Implementation-Agnostic Tests

- **Do not couple tests to implementation details.**
- Tests should only break if the behavior changes, not when refactoring code. This may be referred to as black box testing.
- **Unit tests must avoid knowledge of internal methods or variables.**
- The use of `@visibleForTesting` is discouraged as it exposes internal details that should remain hidden. This annotation can lead to brittle tests that break during refactoring, even if external behavior remains the same.

**Example:**

```dart
// Do - Tests against behavior
String processUserData(String rawData) {
  return rawData.toUpperCase();
}

test('Given a user name when processed then the name is capitalized', () {
  final result = processUserData('john');
  expect(result, 'JOHN');
});

// Don't - Tests against internal methods or state
class UserDataProcessor {
  String process(String rawData) {
    return _toUpperCase(rawData);
  }

  @visibleForTesting
  String toUpperCase(String input) => input.toUpperCase();
}

// Don't - Verifying internal method call
test('Given a user name when processed then toUpperCase is called', () {
  final processor = UserDataProcessor();

  when(() => processor.toUpperCase('john')).thenReturn('JOHN');

  final result = processor.process('john');

  expect(result, 'JOHN');
  verify(() => processor.toUpperCase('john')).called(1);
});
```

- In the bad example, the test verifies that an internal method (`_toUpperCase`) is called, coupling the test to the implementation. The good example validates only the output, ensuring the test focuses on behavior rather than internal details.

### 5. Immutable Test Philosophy

- **Tests should rarely be modified.**
- When functionality changes,  **add new tests** and/or **remove obsolete ones**.
- Avoid altering existing tests unless fixing bugs, e.g. invalid tests.

### 6. Simplicity Over Abstraction

- The explicit examples make it clear what is being tested and reduce the need to jump between methods. The abstracted logic example hides test behavior, making it harder to understand specific test scenarios at a glance.
- **Avoid abstraction in tests.**
- Tests should be **simple, explicit, and easy to read.**
- Logic or shared test functionality should be **copied** rather than abstracted.

**Examples:**

```dart
  // Do - Explicit test
  test('Given a number below threshold when validated then an error is collected', () {
    final result = validateNumber(3);

    expect(result.errors.first.message, 'Number must be 5 or greater.');
  });

  // Do - Explicit test for out of range value
  test('Given a number above range when validated then range error is collected', () {
    final result = validateNumber(11);

    expect(result.errors.first.message, 'Number must not exceed 10.');
  });

  // Don't - Abstracted logic into a method
  void performValidationTest(int number, String expectedErrorMessage) {
    final result = validateNumber(number);

    expect(result.errors.first.message, expectedErrorMessage);
  }

  test('Number below threshold', () {
    performValidationTest(3, 'Number must be 5 or greater.');
  });

  test('Number above range', () {
    performValidationTest(11, 'Number must not exceed 10.');
  });
```

### 7. Beneficial Abstractions - Test Builders

- One abstraction we encourage is the **test builder pattern** for constructing test input objects.
- Builders help create logical, valid objects while keeping tests simple and readable.

**Key Characteristics:**

- Builder class names follow the pattern: `ObjectNameBuilder`.
- Methods that set properties start with `with`, and return the builder instance (`this`).
- Builders always include a `build` method that returns the final constructed object.
- Constructors provide reasonable defaults for all properties to ensure valid object creation by default.

**Guidelines:**

- In tests, always set the properties that are important for the specific scenario.
- Defaults allow seamless addition of new properties without modifying existing tests.
- Using builders ensures objects are created in a realistic, lifecycle-accurate way.

**Example:**

```dart
class UserBuilder {
  String _name = 'John Doe';
  int _age = 25;

  UserBuilder withName(String name) {
    _name = name;
    return this;
  }

  UserBuilder withAge(int age) {
    _age = age;
    return this;
  }

  User build() {
    return User(name: _name, age: _age);
  }
}

// Test Example
  test('Given a user at the legal cut of when checking if they are allowed to drink then they are', () {
    final user = UserBuilder().withAge(18).build();
    final isAllowed = isLegalDrinkingAge(user);
    expect(isAllowed, isTrue);
  });
```

- **Benefits:**
  - Reduces test brittleness when refactoring.
  - Ensures tests continue to produce valid objects as the code evolves.
  - Simplifies object creation without requiring deep lifecycle knowledge.

## Final Thoughts

Consistent application of these principles leads to a robust and maintainable codebase, fostering confidence in our product's reliability and scalability.

We acknowledge that there are exceptions to the rules. But when deviating from the guidelines mentioned above you have to argue for why. You must have a reasonable argument that aligns with the core goals.
