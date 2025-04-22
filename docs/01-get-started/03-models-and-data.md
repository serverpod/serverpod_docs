# Models and Data

Serverpod ships with a powerful data modelling system that uses a definition file in yaml to generate a Dart class with all the necessary code to serialize and deserialize the data. This allows you to define your data models for the server and the client in one place, eliminating any inconsistencies. You can also have fields which are only visible on the server.

## Create a new model

Models files can be placed anywhere in the `lib` directory. We will create a new file called `recipe.spy.yaml` in the `lib/src/recipies/` directory. This is where we will define our model. We like to use the extension `.spy.yaml` to indicate that this is a "serverpod yaml file".

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

You can use the basic types here or any models you have specified using a yaml file. For more backround information, see [Working with models](../concepts/models).

## Generate the code

To generate the code for the model, you can run the following command in the root directory of your project:

```bash
$ cd magic_recipe/magic_recipe_server
$ serverpod generate
```

This will generate the code for the model and create a new file called `recipe.dart` in the `lib/src/generated` directory. It will also update the client code in `magic_recipe/magic_recipe_client` so you can use it in your Flutter app.

## Use the model in the server

Now that we have created the model, we can use it in the server code. We will now update the `lib/src/recipies/recipe_endpoint.dart` file to use the `Recipe` model instead of a simple string. We will also update the `generateRecipe` method to return a `Recipe` object instead of a string.

```dart
// change the return type of the method to Recipe
  Future<Recipe> generateRecipe(Session session, String ingredients) async {

    // ... keep this like before, at the end of the method add this:

    final recipe = Recipe(
      author: 'Gemini',
      text: responseText,
      date: DateTime.now(),
      ingredients: ingredients,
    );

    return recipe;
```

## Use the model in the app

First, we need to update our generated client by running `serverpod generate`

```bash
$ cd magic_recipe/magic_recipe_server
$ serverpod generate
```

Now that we have created the model, we can use it in the client. We will do this in the `magic_recipe/magic_recipe_flutter/lib/main.dart` file. We will update our `RecipeWidget` so that it also displays the author and year of the recipe.

```dart
class MyHomePageState extends State<MyHomePage> {

  // rename _resultMessage to _recipe and change the type to Recipe
  /// Holds the last result or null if no result exists yet.
  Recipe? _recipe;

  // keep stuff like before

void _callGenerateRecipe() async {
    try {
      final result =
          await client.recipe.generateRecipe(_textEditingController.text);
      setState(() {
        _errorMessage = null;
        // we are now getting the text from the Recipe object
        _resultMessage = result.text;
        //
      });
    } catch (e) {
      setState(() {
        _errorMessage = '$e';
      });
    }
  }

  // keep stuff like before

  @override
  Widget build(BuildContext context) {
    return Scaffold(

    // keep stuff like before
    // at the bottom change the ResultDisplay to use the Recipe object

                  ResultDisplay(
                    resultMessage: _recipe != null
                        ? '${_recipe?.author} on ${_recipe?.date}:\n${_recipe?.text}'
                        : null,
                    errorMessage: _errorMessage,
                  ),

```

## Run the app

First we need to start the server:

```bash
$ cd magic_recipe/magic_recipe_server
$ docker-compose up -d
$ dart run bin/main.dart
```

Then we can start the Flutter app:

```bash
$ cd magic_recipe/magic_recipe_flutter
$ flutter run -d chrome
```

This will start the Flutter app in your browser. It should look something like this:
![Example Flutter App](https://serverpod.dev/assets/img/flutter-example-web.png)

Now you can click the button to get a new recipe. The app will call the endpoint on the server and display the result in the app.

## Next Steps

On the Flutter side, there are quite a few things you could add, like a progress indicator while the request is being processed or a nicer display of the result, e.g. using a markdown renderer.

In the next section, you will learn how to use the database to store your favourite recipes and display them in your app.
