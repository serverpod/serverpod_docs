# Working with the database

In this section, we will build upon the models we created in the previous section and add a database to store our favourite recipes.

## Update the Recipes model to store the recipe in the database

We can now simply add the `table` keyword to the `Recipe` model in our `recipe.spy.yaml` file. This will create a new table in the database called `recipes` and map the `Recipe` model to this table.

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

:::info
Check out the reference for [database models](../concepts/database/models#keywords) for an overview of all available keywords.
:::

## Generate the code

To generate the code for the model and create the migrations for the database (that is the SQL code that will be run to create the table in the database), you need to run both `serverpod generate` and `serverpod create-migrations`.

```bash
$ cd magic_recipe/magic_recipe_server
$ serverpod generate
$ serverpod create-migrations
```

You will also notice that there will be a new entry in your "migrations" folder - serverpod creates these migrations "step by step" - each time you have changes which are relevant to the database and run `serverpod create-migrations` a new migration file will be created. This is a good way to keep track of the changes you make to the database and to be able to roll back changes if needed.

## Let's save all created recipes to the database

First we want to automatically store new recipes in the database. Because the `Recipe` now has a `table` it is now not just a serializable entity, but also a `TableRow` - that means that we can use the `insertRow` method to store it in the database.

```dart
// recipe_endpoint.dart


class RecipeEndpoint extends Endpoint {
  Future<Recipe> generateRecipe(Session session, String ingredients) async {

  // ...

    final recipe = Recipe(
      author: 'Gemini',
      text: responseText,
      date: DateTime.now(),
      ingredients: ingredients,
    );

    // --- Add this ---

    // Save the recipe to the database, but don't block the response
    unawaited(session.db.insertRow<Recipe>(recipe));

    // --- End of added code ---

    return recipe;
  }

```

Next we want to add a new endpoint that will return all the favourite recipes from the database. We will create a new method in the `RecipeEndpoint` class that will return all the recipes from the database.

To make sure that we get them in the correct order, we can sort them by the date they were created.

```dart
// recipe_endpoint.dart


class RecipeEndpoint extends Endpoint {

  // ...

  /// This method is used to get all the generated recipes from the database.
  Future<List<Recipe>> getRecipes(Session session) async {
    // Get all the recipes from the database, sorted by date
    return Recipe.db.find(
      session,
      orderBy: (t) => t.date,
      orderDescending: true,
    );
  }
```

:::info
The `session.db` object can be used to access the database. You can use it to insert, update, delete and query the database. The `insertRow` method is used to insert a new row in the database. The `find` method is used to query the database and get all the rows of a specific type. If a model uses the `table` keyword, it is automatically registered in the database, and you can use it to query the database.

You can also use the model class, to access the database like you see above (`Recipe.db.find(...)`). This is a shorthand for `session.db.find<Recipe>(...)`.
:::

## Generate the code

Like before, when you change something that has an effect on the client code, you need to run `serverpod generate` - we don't need to run `serverpod create-migrations` again because we already created the migrations in the previous step.

```bash
$ cd magic_recipe/magic_recipe_server
$ serverpod generate
```

## Call the endpoint from the app

Now that we have updated the endpoint, we can call it from the app. We will do this in the `magic_recipe/magic_recipe_flutter/lib/main.dart` file. We will call the `getRecipes` method when the app starts and store the result in a list of `Recipe` objects. We will also update the UI to show the list of recipes.

If you want to see what changed, we suggest to creating a git commit now and then replacing the code in the `main.dart` file.

```dart
import 'package:magic_recipe_client/magic_recipe_client.dart';
import 'package:flutter/material.dart';
import 'package:serverpod_flutter/serverpod_flutter.dart';

/// Sets up a global client object that can be used to talk to the server from
/// anywhere in our app. The client is generated from your server code.
/// The client is set up to connect to a Serverpod running on a local server on
/// the default port. You will need to modify this to connect to staging or
/// production servers.
/// You might want to use the dependency injection of your choice instead of
/// using a global client object. This is just a simple example.
final client = Client('http://$localhost:8080/')
  ..connectivityMonitor = FlutterConnectivityMonitor();

void main() {
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

  void _callGenerateRecipe() async {
    try {
      final result =
          await client.recipe.generateRecipe(_textEditingController.text);
      setState(() {
        _errorMessage = null;
        // we are now getting the text from the Recipe object
        _recipe = result;
        _recipeHistory.insert(0, result);
      });
    } catch (e) {
      setState(() {
        _errorMessage = '$e';
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
              padding: const EdgeInsets.all(16.0),
              child: ListView(
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
                    child: Row(
                      children: [
                        ElevatedButton(
                          onPressed: _callGenerateRecipe,
                          child: const Text('Generate Recipe'),
                        ),
                      ],
                    ),
                  ),
                  ResultDisplay(
                    resultMessage: _recipe != null
                        ? '${_recipe?.author} on ${_recipe?.date}:\n${_recipe?.text}'
                        : null,
                    errorMessage: _errorMessage,
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

/// _ResultDisplays shows the result of the call. Either the returned result from
/// the `example.hello` endpoint method or an error message.
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
