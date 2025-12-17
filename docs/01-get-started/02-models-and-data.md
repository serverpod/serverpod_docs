---
sidebar_label: 2️⃣ Models and data
---

# Models and data

Serverpod ships with a powerful data modeling system that uses easy-to-read definition files in YAML. It generates Dart classes with all the necessary code to serialize and deserialize the data and connect to the database. This allows you to define your data models for the server and the app in one place, eliminating any inconsistencies. The models give you fine-grained control over the visibility of properties and how they interact with each other.

## Create a new model

Models files can be placed anywhere in the server's `lib` directory. We will create a new model file called `recipe.spy.yaml` in the `magic_recipe_server/lib/src/recipes/` directory. Use the `.spy.yaml` extension to indicate that this is a _serverpod YAML_ file.

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

You can use most primitive Dart types here or any other models you have specified in other YAML files. You can also use typed `List`, `Map`, or `Set`. For detailed information, see [Working with models](../06-concepts/02-models.md)

## Generate the code

To generate the code for the model, run the `serverpod generate` command in your server directory:

```bash
$ cd magic_recipe_server
$ serverpod generate
```

This will generate the code for the model and create a new file called `recipe.dart` in the `lib/src/generated` directory. It will also update the client code in `magic_recipe/magic_recipe_client` so you can use it in your Flutter app.

## Use the model in the server

Now that you have created the model, you can use it in your server code. Let's update the `lib/src/recipes/recipe_endpoint.dart` file to make the `generateRecipe` method return a `Recipe` object instead of a string.

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

import 'package:dartantic_ai/dartantic_ai.dart';
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
    final geminiApiKey = session.passwords['geminiApiKey'];
    if (geminiApiKey == null) {
      throw Exception('Gemini API key not found');
    }
    
    // Configure the Dartantic AI agent for Gemini before sending the prompt.
    final agent = Agent.forProvider(
      GoogleProvider(apiKey: geminiApiKey),
      chatModelName: 'gemini-2.5-flash-lite',
    );

    // A prompt to generate a recipe, the user will provide a free text input with the ingredients.
    final prompt =
        'Generate a recipe using the following ingredients: $ingredients, always put the title '
        'of the recipe in the first line, and then the instructions. The recipe should be easy '
        'to follow and include all necessary steps. Please provide a detailed recipe.';

    final response = await agent.send(prompt);
    final responseText = response.output;

    // Check if the response is empty.
    if (responseText.isEmpty) {
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
$ cd magic_recipe_server
$ serverpod generate
```

Now that we have created the `Recipe` model we can use it in the app. We will do this in the `_callGenerateRecipe` method of the `magic_recipe_flutter/lib/main.dart` file. Let's update our `RecipeWidget` so that it displays the author and year of the recipe in addition to the recipe itself.

<!--SNIPSTART 02-typed-endpoint-flutter-->
```dart
void _callGenerateRecipe() async {
// ...

    // Update the state with the recipe we got from the server.
    setState(() {
      _errorMessage = null;

      // Here we read the properties from our new Recipe model.
      _resultMessage = '${result.author} on ${result.date}:\n${result.text}';
      _loading = false;
    });

// ...
  }
}
```
<!--SNIPEND-->

<details>

<summary>Click to see the full code</summary>
<p>

<!--SNIPSTART 02-typed-endpoint-flutter-->
```dart
import 'package:magic_recipe_client/magic_recipe_client.dart';
import 'package:flutter/material.dart';
import 'package:serverpod_flutter/serverpod_flutter.dart';
import 'package:serverpod_auth_idp_flutter/serverpod_auth_idp_flutter.dart';

/// Sets up a global client object that can be used to talk to the server from
/// anywhere in our app. The client is generated from your server code
/// and is set up to connect to a Serverpod running on a local server on
/// the default port. You will need to modify this to connect to staging or
/// production servers.
/// In a larger app, you may want to use the dependency injection of your choice
/// instead of using a global client object. This is just a simple example.
late final Client client;

late String serverUrl;

void main() {
  // When you are running the app on a physical device, you need to set the
  // server URL to the IP address of your computer. You can find the IP
  // address by running `ipconfig` on Windows or `ifconfig` on Mac/Linux.
  // You can set the variable when running or building your app like this:
  // E.g. `flutter run --dart-define=SERVER_URL=https://api.example.com/`
  const serverUrlFromEnv = String.fromEnvironment('SERVER_URL');
  final serverUrl = serverUrlFromEnv.isEmpty
      ? 'http://$localhost:8080/'
      : serverUrlFromEnv;

  client = Client(serverUrl)
    ..connectivityMonitor = FlutterConnectivityMonitor()
    ..authSessionManager = FlutterAuthSessionManager();

  client.auth.initialize();

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Serverpod Demo',
      theme: ThemeData(primarySwatch: Colors.blue),
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
  String? _resultMessage;

  /// Holds the last error message that we've received from the server or null
  /// if no error exists yet.
  String? _errorMessage;

  final _textEditingController = TextEditingController();

  bool _loading = false;

  void _callGenerateRecipe() async {
    try {
      // Reset the state.
      setState(() {
        _errorMessage = null;
        _resultMessage = null;
        _loading = true;
      });

      // Call our `generateRecipe` method on the server.
      final result = await client.recipe.generateRecipe(
        _textEditingController.text,
      );

      // Update the state with the recipe we got from the server.
      setState(() {
        _errorMessage = null;
        _resultMessage = '${result.author} on ${result.date}:\n${result.text}';
        _loading = false;
      });
    } catch (e) {
      // If something goes wrong, set an error message.
      setState(() {
        _errorMessage = '$e';
        _resultMessage = null;
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
                    : const Text('Generate Recipe'),
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                child: ResultDisplay(
                  resultMessage: _resultMessage,
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

class SignInScreen extends StatelessWidget {
  const SignInScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SignInWidget(
        client: client,
        onAuthenticated: () {},
      ),
    );
  }
}

class ConnectedScreen extends StatefulWidget {
  const ConnectedScreen({super.key});

  @override
  State<ConnectedScreen> createState() => _ConnectedScreenState();
}

class _ConnectedScreenState extends State<ConnectedScreen> {
  /// Holds the last result or null if no result exists yet.
  String? _resultMessage;

  /// Holds the last error message that we've received from the server or null
  /// if no error exists yet.
  String? _errorMessage;

  final _textEditingController = TextEditingController();

  /// Calls the `hello` method of the `greeting` endpoint. Will set either the
  /// `_resultMessage` or `_errorMessage` field, depending on if the call
  /// is successful.
  void _callHello() async {
    try {
      final result = await client.greeting.hello(_textEditingController.text);
      setState(() {
        _errorMessage = null;
        _resultMessage = result.message;
      });
    } catch (e) {
      setState(() {
        _errorMessage = '$e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          const Text('You are connected'),
          ElevatedButton(
            onPressed: () async {
              await client.auth.signOutDevice();
            },
            child: const Text('Sign out'),
          ),
          const SizedBox(height: 32),
          TextField(
            controller: _textEditingController,
            decoration: const InputDecoration(hintText: 'Enter your name'),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _callHello,
            child: const Text('Send to Server'),
          ),
          const SizedBox(height: 16),
          ResultDisplay(
            resultMessage: _resultMessage,
            errorMessage: _errorMessage,
          ),
        ],
      ),
    );
  }
}

/// ResultDisplays shows the result of the call. Either the returned result
/// from the `example.greeting` endpoint method or an error message.
class ResultDisplay extends StatelessWidget {
  final String? resultMessage;
  final String? errorMessage;

  const ResultDisplay({super.key, this.resultMessage, this.errorMessage});

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
        child: Center(child: Text(text)),
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
$ cd magic_recipe_server
$ docker compose up -d
$ dart bin/main.dart
```

Then, start the Flutter app:

```bash
$ cd magic_recipe_flutter
$ flutter run -d chrome
```

This will start the Flutter app in your browser. It should look something like this:
![Flutter Recipe App](/img/getting-started/flutter-web-ingredients.png)

Click the button to get a new recipe. The app will call the endpoint on the server and display the result in the app.

## Next steps

On the Flutter side, there are quite a few things that could be improved, like a nicer display of the result, e.g., using a markdown renderer.

In the next section, you will learn how to use the database to store your favorite recipes and display them in your app.
