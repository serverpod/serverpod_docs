# Models and Data

Serverpod ships with a powerful data modelling system that uses a definition file in yaml which then generates a Dart class with all the necessary code to serialize and deserialize the data. This allows you to define your data models for the server and the client in one place, eliminating any inconsistencies.

## Create a new model

Models files can be placed anywhere in the `lib` directory. We will create a new file called `quote.spy.yaml` in the `lib/src/models` directory. This is where we will define our model. We like to use the extension `.spy.yaml` to indicate that this is a "serverpod yaml file".

```yaml
# This is a comment, using ### will create a doc comment on the generated class
class: Quote
fields:
  ### The author of the quote in the format "<first name> <last name>"
  author: String
  ### The quote text
  text: String
  ### The date the quote was created
  date: DateTime
```

You can use the basic types here or any models you have specified using a yaml file, see [Working with models](../concepts/models) for more background information.

## Generate the code

To generate the code for the model, you can run the following command in the root directory of your project:

```bash
$ cd my_counter/my_counter_server
$ serverpod generate
```

This will generate the code for the model and create a new file called `quote.dart` in the `lib/src/generated` directory. It will also update the client code in `my_counter/my_counter_client` so that you can use it in your Flutter app.

## Use the model in the server

Now that we have created the model, we can use it in the server. We will do this in the `lib/src/endpoints/quote.dart` file. We will create a new function called `getQuote` that will return a random quote from the database.

```dart
TODO - add code snippet
```

## Use the model in the client

Now that we have created the model, we can use it in the client. We will do this in the `my_counter/my_counter_flutter/lib/main.dart` file. We will update our `QuoteWidget` so that it also displays the author and year of the quote.

```dart
TODO - add code snippet
```

## Run the app

First we need to start the server. You can do this by running the following command in the root directory of your project:

```bash
$ cd my_counter/my_counter_server
$ dart run bin/main.dart
```

Then we can start the Flutter app. You can do this by running the following command in the root directory of your project:

```bash
$ cd my_counter/my_counter_flutter
$ flutter run -d chrome
```

This will start the Flutter app in your browser. It should look something like this:
![Example Flutter App](https://serverpod.dev/assets/img/flutter-example-web.png)

Now you can click the button to get a new quote. The app will call the endpoint on the server and display the result in the app.

## Next Steps

Now we have seen what we can do with **serverpod mini** - let's take it a step further and add a database to our project. For that we will have to upgrade the `mini` project to a full `serverpod` project. We will do this in the next section.
