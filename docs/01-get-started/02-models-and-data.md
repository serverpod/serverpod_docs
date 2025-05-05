---
sidebar_label: 2. Models and data
---

# Models and data

Serverpod ships with a powerful data modeling system that uses easy-to-read definition files in YAML. It generates Dart classes with all the necessary code to serialize and deserialize the data and connect to the database. This allows you to define your data models for the server and the app in one place, eliminating any inconsistencies. The models give you fine-grained control over the visibility of properties and how they interact with each other.

## Create a new model

Models files can be placed anywhere in the server's `lib` directory. We will create a new model file called `recipe.spy.yaml` in the `magic_recipe_server/lib/src/recipes/` directory. We like to use the extension `.spy.yaml` to indicate that this is a _serverpod YAML_ file.

<!--SNIPSTART 02-typed-endpoint-model-->
```yaml
### Our AI generated Recipe
class: Recipe
fields:
  ### The author of the recipe
  author: String
  ### The recipe text
  text: String
  ### The date the recipe was created
  date: DateTime
  ### The ingredients the user has passed in
  ingredients: String
```
<!--SNIPEND-->

You can use most primitive Dart types here or any other models you have specified in other YAML files. You can also use typed `List`, `Map`, or `Set`. For detailed information, see [Working with models](../concepts/models)

## Generate the code

To generate the code for the model, run the `serverpod generate` command in your server directory:

```bash
$ cd magic_recipe/magic_recipe_server
$ serverpod generate
```

This will generate the code for the model and create a new file called `recipe.dart` in the `lib/src/generated` directory. It will also update the client code in `magic_recipe/magic_recipe_client` so you can use it in your Flutter app.

## Use the model in the server

Now that you have created the model, you can use it in your server code. Let's update the `lib/src/recipies/recipe_endpoint.dart` file to make the `generateRecipe` method to return a `Recipe` object instead of a string.

<!--SNIPSTART 02-typed-endpoint  {"selectedLines": ["4", "10-12", "39-48"]}-->
```dart
// ...
import 'package:magic_recipe_server/src/generated/protocol.dart';
// ...
class RecipeEndpoint extends Endpoint {
  /// Pass in a string containing the ingredients and get a recipe back.
  Future<Recipe> generateRecipe(Session session, String ingredients) async {
// ...
    final recipe = Recipe(
      author: 'Gemini',
      text: responseText,
      date: DateTime.now(),
      ingredients: ingredients,
    );

    return recipe;
  }
}
```
<!--SNIPEND-->

<details>

<summary>Click to see the full code</summary>
<p>

<!--SNIPSTART 02-typed-endpoint-->
```dart
import 'dart:async';

import 'package:google_generative_ai/google_generative_ai.dart';
import 'package:magic_recipe_server/src/generated/protocol.dart';
import 'package:serverpod/serverpod.dart';

/// This is the endpoint that will be used to generate a recipe using the
/// Google Gemini API. It extends the Endpoint class and implements the
/// generateRecipe method.
class RecipeEndpoint extends Endpoint {
  /// Pass in a string containing the ingredients and get a recipe back.
  Future<Recipe> generateRecipe(Session session, String ingredients) async {
    // Serverpod automatically loads your passwords.yaml file and makes the passwords available
    // in the session.passwords map.
    final geminiApiKey = session.passwords['gemini'];
    if (geminiApiKey == null) {
      throw Exception('Gemini API key not found');
    }
    final gemini = GenerativeModel(
      model: 'gemini-1.5-flash-latest',
      apiKey: geminiApiKey,
    );

    // A prompt to generate a recipe, the user will provide a free text input with the ingredients
    final prompt =
        'Generate a recipe using the following ingredients: $ingredients, always put the title '
        'of the recipe in the first line, and then the instructions. The recipe should be easy '
        'to follow and include all necessary steps. Please provide a detailed recipe.';

    final response = await gemini.generateContent([Content.text(prompt)]);

    final responseText = response.text;

    // Check if the response is empty or null
    if (responseText == null || responseText.isEmpty) {
      throw Exception('No response from Gemini API');
    }

    final recipe = Recipe(
      author: 'Gemini',
      text: responseText,
      date: DateTime.now(),
      ingredients: ingredients,
    );

    return recipe;
  }
}
```
<!--SNIPEND-->

</p>
</details>

## Use the model in the app

First, we need to update our generated client by running `serverpod generate`.

```bash
$ cd magic_recipe/magic_recipe_server
$ serverpod generate
```

Now that we have created the `Recipe` model we can use it in the client. We will do this in the `magic_recipe/magic_recipe_flutter/lib/main.dart` file. Let's update our `RecipeWidget` so that it displays the author and year of the recipe in addition to the recipe itself.

<!--SNIPSTART 02-typed-endpoint-flutter  {"selectedLines": ["1-5", "15-36", "38-40", "69-83"]}-->
```dart
class MyHomePageState extends State<MyHomePage> {
  // Rename _resultMessage to _recipe and change the type to Recipe.

  /// Holds the last result or null if no result exists yet.
  Recipe? _recipe;
// ...
  void _callGenerateRecipe() async {
    try {
      setState(() {
        _errorMessage = null;
        _recipe = null;
        _loading = true;
      });
      final result =
          await client.recipe.generateRecipe(_textEditingController.text);
      setState(() {
        _errorMessage = null;
        _recipe = result;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = '$e';
        _recipe = null;
        _loading = false;
      });
    }
  }
// ...
  @override
  Widget build(BuildContext context) {
    return Scaffold(
// ...
                    // Change the ResultDisplay to use the Recipe object
                    ResultDisplay(
                  resultMessage: _recipe != null
                      ? '${_recipe?.author} on ${_recipe?.date}:\n${_recipe?.text}'
                      : null,
                  errorMessage: _errorMessage,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```
<!--SNIPEND-->

<details>

<summary>Click to see the full code</summary>
<p>

<!--SNIPSTART 02-typed-endpoint-flutter-->
```dart
class MyHomePageState extends State<MyHomePage> {
  // Rename _resultMessage to _recipe and change the type to Recipe.

  /// Holds the last result or null if no result exists yet.
  Recipe? _recipe;

  /// Holds the last error message that we've received from the server or null if no
  /// error exists yet.
  String? _errorMessage;

  final _textEditingController = TextEditingController();

  bool _loading = false;

  void _callGenerateRecipe() async {
    try {
      setState(() {
        _errorMessage = null;
        _recipe = null;
        _loading = true;
      });
      final result =
          await client.recipe.generateRecipe(_textEditingController.text);
      setState(() {
        _errorMessage = null;
        _recipe = result;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = '$e';
        _recipe = null;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.only(bottom: 16.0),
              child: TextField(
                controller: _textEditingController,
                decoration: const InputDecoration(
                  hintText: 'Enter your ingredients',
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(bottom: 16.0),
              child: ElevatedButton(
                onPressed: _loading ? null : _callGenerateRecipe,
                child: _loading
                    ? const Text('Loading...')
                    : const Text('Send to Server'),
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                child:
                    // Change the ResultDisplay to use the Recipe object
                    ResultDisplay(
                  resultMessage: _recipe != null
                      ? '${_recipe?.author} on ${_recipe?.date}:\n${_recipe?.text}'
                      : null,
                  errorMessage: _errorMessage,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```
<!--SNIPEND-->

</p>
</details>
## Run the app

First, start the server:

```bash
$ cd magic_recipe/magic_recipe_server
$ docker compose up -d
$ dart bin/main.dart
```

Then, start the Flutter app:

```bash
$ cd magic_recipe/magic_recipe_flutter
$ flutter run -d chrome
```

This will start the Flutter app in your browser. It should look something like this:
![Example Flutter App](https://serverpod.dev/assets/img/flutter-example-web.png)

Click the button to get a new recipe. The app will call the endpoint on the server and display the result in the app.

## Next steps

On the Flutter side, there are quite a few things that could be improved, like a nicer display of the result, e.g., using a markdown renderer.

In the next section, you will learn how to use the database to store your favorite recipes and display them in your app.
