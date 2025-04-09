# Working with the database

In this section we will build upon the models we have created in the previous section and add a database to store our favourite quotes.

## Upgrading from mini to full serverpod

If you have created a mini project, you can upgrade it to a full serverpod project - make sure to check in your work to git before doing this in case any config files are changed. You can do this by running the following command in the root directory of your project:

```bash
$ cd my_counter/my_counter_server
$ serverpod create .
```

This will add the configuration files with preconfigured database settings, passwords and a docker-compose file to your project.

## Create a new model to store the quotes

Let's assume the user wants to store the quote in the database. We will create a new model called `FavouriteQuote` that will store the `Quote` we created in the previous section
The key difference is that we now add the `table` keyword to the model. It's best practice to use lower_case_snake_case for the table name, so we will use `favourite_quote` as the table name.
We will also add a `savedAt` field to show how to compose models. Since we will be exanpanding this later to also include user data we also add a default userId which we assume to be the anonymous user.

```yaml
class: FavouriteQuote
table: favourite_quote
fields:
  quote: Quote
  ### The date the quote was created
  savedAt: DateTime?, serveronly
  ### We currently don't have a user model, so we will just add everything to the userId "-1"
  userId: int?, serveronly, default=-1
```

:::info
Check out the reference for [database models](../concepts/database/models#keywords) for an overview of all available keywords.
:::

## Generate the code

To generate the code for the model, you can run the following command in the root directory of your project:

```bash
$ cd my_counter/my_counter_server
$ serverpod generate
```

This will generate the code for the model and create a new file called `favourite_quote.dart` in the `lib/src/generated` directory. It will also update the client code in `my_counter/my_counter_client` so that you can use it in your Flutter app.
