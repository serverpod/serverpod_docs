---
sidebar_label: 3. Working with the database
---

# Working with the database

In this section, we will build upon the models we created in the previous section and add a database to store our favorite recipes that we create in the app.

## Object relation mapping

Any Serverpod model can be mapped to the database through Serverpod's object relation mapping (ORM). Simply add the `table` keyword to the `Recipe` model in our `recipe.spy.yaml` file. This will map the model to a new table in the database called `recipes`.

<!--SNIPSTART 03-table-model-->
```yaml
### Our AI generated Recipe
class: Recipe
table: recipes
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

:::info
Check out the reference for [database models](../06-concepts/02-models.md#keywords-1) for an overview of all available keywords.
:::

## Migrations

With database migrations, Serverpod makes it easy to evolve your database schema. When you make changes to your project that should be reflected in your database, you need to create a migration. A migration is a set of SQL queries that are run to update the database. To create a migration, run `serverpod create-migration` in the home directory of the server. Since we modified one of our models, make sure to also run `serverpod generate`, to update the generated code in our server.

```bash
$ cd magic_recipe/magic_recipe_server
$ serverpod generate
$ serverpod create-migration
```

You will notice that there will be a new entry in your _migrations_ folder - serverpod creates these migrations "step by step" - each time you have changes which are relevant to the database and run `serverpod create-migrations` a new migration file will be created. This is a good way to keep track of the changes you make to the database and to be able to roll back changes if needed.

## Writing to the database

Let's save all the recipes we create to the database. Because the `Recipe` now has a `table` key, it is not just a serializable model but also a `TableRow`. This means that Serverpod has generated bindings for us to the database. You can access the bindings through the static `db` field of the `Recipe`. Here, you will find the `insertRow` method, which is used to create a new entry in the database.

<!--SNIPSTART 03-persisted-endpoint {"selectedLines": ["10-12", "39-51"]}-->
```dart
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

    // Save the recipe to the database, the returned recipe has the id set
    final recipeWithId = await Recipe.db.insertRow(session, recipe);

    return recipeWithId;
  }

```
<!--SNIPEND-->

## Reading from the database

Next, let's add a new method to the `RecipeEndpoint` class that will return all the recipes that we have created and saved to the database.

To make sure that we get them in the correct order, we sort them by the date they were created.

<!--SNIPSTART 03-persisted-endpoint {"selectedLines": ["10-12", "52-61"]}-->
```dart
// ...
class RecipeEndpoint extends Endpoint {
  /// Pass in a string containing the ingredients and get a recipe back.
  Future<Recipe> generateRecipe(Session session, String ingredients) async {
// ...
  /// This method returns all the generated recipes from the database.
  Future<List<Recipe>> getRecipes(Session session) async {
    // Get all the recipes from the database, sorted by date.
    return Recipe.db.find(
      session,
      orderBy: (t) => t.date,
      orderDescending: true,
    );
  }
}
```
<!--SNIPEND-->

<details>

<summary>Click to see the full code</summary>
<p>

<!--SNIPSTART 03-persisted-endpoint-->
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

    // Save the recipe to the database, the returned recipe has the id set
    final recipeWithId = await Recipe.db.insertRow(session, recipe);

    return recipeWithId;
  }

  /// This method returns all the generated recipes from the database.
  Future<List<Recipe>> getRecipes(Session session) async {
    // Get all the recipes from the database, sorted by date.
    return Recipe.db.find(
      session,
      orderBy: (t) => t.date,
      orderDescending: true,
    );
  }
}
```
<!--SNIPEND-->

</p>
</details>

:::info
The when adding a `table` to the model class definition, the model will now give you access to the database, specifically to the `recipes` table through `Recipe.db` (e.g. `Recipe.db.find(session)`.
The `insertRow` method is used to insert a new row in the database. The `find` method is used to query the database and get all the rows of a specific type. See [CRUD](../06-concepts/06-database/05-crud.md) and [relation queries](../06-concepts/06-database/07-relation-queries.md) for more information.
:::

## Generate the code

Like before, when you change something that has an effect on the client code, you need to run `serverpod generate`. We don't need to run `serverpod create-migrations` again because we already created a migration in the previous step and haven't done any changes that affect the database.

```bash
$ cd magic_recipe/magic_recipe_server
$ serverpod generate
```

## Call the endpoint from the app

Now that we have updated the endpoint, we can call it from the app. We do this in the `magic_recipe_flutter/lib/main.dart` file. We will call the `getRecipes` method when the app starts and store the result in a list of `Recipe` objects. We will also update the UI to show the list of recipes.

![Final result](/img/getting-started/final-result.png)

If you want to see what changed, we suggest to creating a git commit now and then replacing the code in the `main.dart` file.

<!--SNIPSTART 03-flutter-->
```dart
import 'package:magic_recipe_client/magic_recipe_client.dart';
import 'package:flutter/material.dart';
import 'package:serverpod_flutter/serverpod_flutter.dart';

/// Sets up a global client object that can be used to talk to the server from
/// anywhere in our app. The client is generated from your server code
/// and is set up to connect to a Serverpod running on a local server on
/// the default port. You will need to modify this to connect to staging or
/// production servers.
/// In a larger app, you may want to use the dependency injection of your choice instead of
/// using a global client object. This is just a simple example.
late final Client client;

late String serverUrl;

void main() {
  // When you are running the app on a physical device, you need to set the
  // server URL to the IP address of your computer. You can find the IP
  // address by running `ipconfig` on Windows or `ifconfig` on Mac/Linux.
  // You can set the variable when running or building your app like this:
  // E.g. `flutter run --dart-define=SERVER_URL=https://api.example.com/`
  const serverUrlFromEnv = String.fromEnvironment('SERVER_URL');
  final serverUrl =
      serverUrlFromEnv.isEmpty ? 'http://$localhost:8080/' : serverUrlFromEnv;

  client = Client(serverUrl)
    ..connectivityMonitor = FlutterConnectivityMonitor();

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Serverpod Demo',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: const MyHomePage(title: 'Serverpod Example'),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key, required this.title});

  final String title;

  @override
  MyHomePageState createState() => MyHomePageState();
}

class MyHomePageState extends State<MyHomePage> {
  /// Holds the last result or null if no result exists yet.
  Recipe? _recipe;

  List<Recipe> _recipeHistory = [];

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
        _recipeHistory.insert(0, result);
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
  void initState() {
    super.initState();
    // Get the favourite recipes from the database
    client.recipe.getRecipes().then((favouriteRecipes) {
      setState(() {
        _recipeHistory = favouriteRecipes;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
      ),
      body: Row(
        children: [
          Expanded(
            child: DecoratedBox(
              decoration: BoxDecoration(color: Colors.grey[300]),
              child: ListView.builder(
                itemCount: _recipeHistory.length,
                itemBuilder: (context, index) {
                  final recipe = _recipeHistory[index];
                  return ListTile(
                    title: Text(
                        recipe.text.substring(0, recipe.text.indexOf('\n'))),
                    subtitle: Text('${recipe.author} - ${recipe.date}'),
                    onTap: () {
                      // Show the recipe in the text field
                      _textEditingController.text = recipe.ingredients;
                      setState(() {
                        _recipe = recipe;
                      });
                    },
                  );
                },
              ),
            ),
          ),
          Expanded(
            flex: 3,
            child: Padding(
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
          ),
        ],
      ),
    );
  }
}

/// ResultDisplays shows the result of the call. Either the returned result from
/// the `example.greeting` endpoint method or an error message.
class ResultDisplay extends StatelessWidget {
  final String? resultMessage;
  final String? errorMessage;

  const ResultDisplay({
    super.key,
    this.resultMessage,
    this.errorMessage,
  });

  @override
  Widget build(BuildContext context) {
    String text;
    Color backgroundColor;
    if (errorMessage != null) {
      backgroundColor = Colors.red[300]!;
      text = errorMessage!;
    } else if (resultMessage != null) {
      backgroundColor = Colors.green[300]!;
      text = resultMessage!;
    } else {
      backgroundColor = Colors.grey[300]!;
      text = 'No server response yet.';
    }

    return ConstrainedBox(
      constraints: const BoxConstraints(minHeight: 50),
      child: Container(
        color: backgroundColor,
        child: Center(
          child: Text(text),
        ),
      ),
    );
  }
}
```
<!--SNIPEND-->

## Run the app

First, we need to start the server and apply the migrations by adding the `--apply-migrations` flag:

```bash
$ cd magic_recipe/magic_recipe_server
$ docker compose up -d
$ dart bin/main.dart --apply-migrations
```

:::tip
When developing your server, it's always safe to pass the `--apply-migrations` flag. If no migration needs to be applied, the flag is simply ignored. In a production environment, you may want to have a bit more control.
:::
Now, start the Flutter app:

```bash
$ cd magic_recipe/magic_recipe_flutter
$ flutter run -d chrome
```

## Summary

You now know the fundamentals of Serverpod - how to create and use endpoints with custom data models and how to store the data in a database. You have also learned how to use the generated client code to call the endpoints from your Flutter app. We cannot wait to see what you will build with Flutter and Serverpod.

If you get stuck, never be afraid to ask questions in our [community on Github](https://github.com/serverpod/serverpod/discussions). The Serverpod team is very active there, and many questions are also answered by other developers.

:::tip

Working with a database is an extensive subject, and Serverpod's ORM is very powerful. Learn more in the [Database](../06-concepts/06-database/01-connection.md) section.

:::
