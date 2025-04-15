# Endpoints and server side logic

With Serverpod, calling endpoints is as simple as calling a function. Let's create your first custom endpoint and call it from the client. On the server, you can do stuff that you don't want to do in the client, like calling an API, which is secured by an API key, or accessing a database. The server can also do things that are not possible in the client, like sending push notifications or sending emails. In this example, you will create an endpoint that calls the Gemini API. You will then call this endpoint from the client and display the result in the app.

## Create a new project

You can use the `serverpod create` command to create a new project. This command will generate a new project with a server, a client, and a Flutter app.

```bash
serverpod create magic_recipe
```

:::tip
If you check in the code right after creating the project, you can investigate the code you will be adding to this tutorial.

```bash
$ cd magic_recipe
$ git init
$ git add .
$ git commit -m "Initial commit"
```

:::

### Add the Gemini API to your project

We will be using the free Gemini, all you need is a Google account, then you can get your API key [here](https://aistudio.google.com/app/apikey). Once you have your API key you can add it to the `config\passwords.yaml` file in your project. This file is not included in the git repository, so you can safely add your API key here.

```yaml
# config/passwords.yaml
# This file is not included in the git repository. You can safely add your API key here.
# The API key is used to authenticate with the Gemini API.
development:
  gemini: '--- Your Gemini Api Key ---'
```

Next we need to add the `google_gemini` package as a dependency to our server.

```bash
$ cd magic_recipe/magic_recipe_server
$ dart pub add google_generative_ai
```

## Create a new endpoint

Create a new file in `lib/src/recipes/` called `recipe_endpoint.dart`. This is where you will define your endpoint. With Serverpod you are free to choose which folder structure you want to use e.g. you could also use `src/endpoints/` if you want to go layer first or `src/features/recipes/` if you have many features.

```dart
import 'package:google_gemini/google_gemini.dart';
import 'package:serverpod/serverpod.dart';

/// This is the endpoint that will be used to generate a recipe using the
/// Google Gemini API. It extends the Endpoint class and implements the
/// generateRecipe method.
class RecipeEndpoint extends Endpoint {
  /// Pass in a list of ingredients and get a recipe back.
  Future<String> generateRecipe(Session session, String ingredients) async {
    // Serverpod loads your passwords.yaml file and makes the passwords available
    // in the session object.
    final geminiApiKey = session.passwords['gemini'];
    if (geminiApiKey == null) {
      throw Exception('Gemini API key not found');
    }
    final gemini = GoogleGemini(apiKey: geminiApiKey);

    // A prompt to generate a recipe, the user will provide a free text input with the ingredients
    final prompt =
        'Generate a recipe using the following ingredients: $ingredients';

    final response = await gemini.generateFromText(prompt);

    return response.text;
  }
}
```

:::tip
When writing server-side code, you want it to be "stateless". This means that you don't want to use any global variables or static variables. Instead think of each endpoint method as being a function that does stuff in a sub-second timeframe and returns data or a status message to your client. If you want to run more complex computations, you can schedule a [future call](../concepts/scheduling), but you usually shouldn't keep the connection session open for longer durations. You want to use the `session` object that is passed to the endpoint function. This object contains all the information you need to access the database and other features of Serverpod. It is similar to the `context` in Flutter.
:::

Now you need to generate the code for the endpoint. You can do this by running the following command in the root directory of your project:

```bash
$ cd magic_recipe/magic_recipe_server
$ serverpod generate
```

This will generate the code for the endpoint and create a new file called `recipe.dart` in the `lib/src/generated` directory. It will also update the client code in `magic_recipe/magic_recipe_client` so that you can call it in your Flutter app.

## Call the endpoint from the client

Now that you have created the endpoint, you can call it from the client. You will do this in the `magic_recipe/magic_recipe_flutter/main.dart` file. You can simply rename the callHello method to callGenerateRecipe and pass in the ingredients. It should similar to this, feel free to just copy and paste:

```dart
class MyHomePageState extends State<MyHomePage> {
  /// Holds the last result or null if no result exists yet.
  String? _resultMessage;

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
        _resultMessage = result;
      });
    } catch (e) {
      setState(() {
        _errorMessage = '$e';
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
                onPressed: _callGenerateRecipe,
                child: const Text('Send to Server'),
              ),
            ),
            ResultDisplay(
              resultMessage: _resultMessage,
              errorMessage: _errorMessage,
            ),
          ],
        ),
      ),
    );
  }
}
```

## Let's run the app

First you need to start the server:

```bash
$ cd magic_recipe/magic_recipe_server
$ docker-compose up -d
$ dart run bin/main.dart --apply-migrations
```

Then you can start the Flutter app:

```bash
$ cd magic_recipe/magic_recipe_flutter
$ flutter run -d chrome
```

This will start the Flutter app in your browser:

![Example Flutter App](https://serverpod.dev/assets/img/flutter-example-web.png)

Now you can click the button to get a new recipe. The app will call the endpoint on the server and display the result in the app.

## Next Steps

Right now you are just passing a `string` to the client. In the next section you will create a custom, more complex data model that you can pass to the client. Serverpod will take care of serializing and deserializing the data for you.
