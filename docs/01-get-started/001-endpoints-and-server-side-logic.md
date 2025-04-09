# Endpoints and server side logic

With Serverpod, calling endpoints is as simple as calling a function. Let's create our first custom endpoint and call it from the client. On the server we can do stuff that you don't want to do in the client, like calling an API which is secured by an API key, or accessing a database. The server can also do things that are not possible in the client, like sending push notifications or sending emails. In this example we will create an endpoint that calls the daily quotes API. We will then call this endpoint from the client and display the result in the app.

## Create a new project

You can use the project from [installing serverpod](installing-serverpod) or create a new one - if you create a new one we will be starting with a **[serverpod mini](get-started-with-mini)** project and then upgrade it later in the database section.

```bash
serverpod create -t mini
```

## Create a new endpoint

You can create a new endpoint anywhere in the `lib` directory. We will create a new file called `quote.dart` in the `lib/src/endpoints` directory. This is where we will define our endpoint.

```dart
// TODO - add code snippet
```

:::tip
When writing server side code, you want it to be "stateless". This means that you don't want to use any global variables or static variables. Instead think of each endpoint method as being a function that does stuff in a sub second timeframe and returns data or a status message to your client. If you want to run more complex computations, you can schedule a [future call]() but you usually shouldn't keep the connection session open for longer durations. You want to use the `session` object that is passed to the endpoint function. This object contains all the information you need to access the database, call other endpoints. It is similar to the `context` in Flutter.
:::

Now we need to generate the code for the endpoint. You can do this by running the following command in the root directory of your project:

```bash
$ cd my_counter/my_counter_server
$ serverpod generate
```

This will generate the code for the endpoint and create a new file called `quote.dart` in the `lib/src/generated` directory. It will also update the client code in `my_counter/my_counter_client` so that you can call it in your Flutter app.

## Call the endpoint from the client

Now that we have created the endpoint, we can call it from the client. We will do this in the `my_counter/my_counter_flutter/main.dart` file. We will create a new function called `getQuote` that will call the endpoint and display the result in the app.

```dart
// TODO - add code snippet
```

## Let's run the app

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

Right now we are just passing a `string` to the client. In the next section we will create a custom, more complex data model that we can pass to the client. Serverpod will take care of serializing and deserializing the data for us.
