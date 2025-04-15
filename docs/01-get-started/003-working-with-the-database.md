# Working with the database

In this section we will build upon the models we have created in the previous section and add a database to store our favourite recipes.

## Create a new model to store the recipes

Let's assume the user wants to store the recipe in the database. We will create a new model called `FavouriteRecipe` that will store the `Recipe` we created in the previous section
The key difference is that we now add the `table` keyword to the model. It's best practice to use lower_case_snake_case for the table name, so we will use `favourite_recipe` as the table name.
We will also add a `userId` field to the model. This will be used to store the ID of the user who created the recipe. Since we don't have a user model yet, we will just use `-1` as the default value for the user ID.
Since the user does not really need to know its userId, we will mark it as `serveronly`. This means that the field will not be available in the client code and will only be used on the server side.

```yaml
class: FavouriteRecipe
table: favourite_recipe
fields:
  ### The actual recipe, by adding it like this we will embed it as a blob in this table
  ### This is a good way to store models that are not too big and don't need to be queried
  ### separately. If you want to query the recipe separately, you can use a separate table.
  ### And create a relation to the recipe table.
  recipe: Recipe
  ### We currently don't have a user model, so we will just add everything to the userId "-1"
  userId: int?, scope=serveronly, default=-1
```

:::info
Check out the reference for [database models](../concepts/database/models#keywords) for an overview of all available keywords.
:::

## Generate the code

To generate the code for the model, and create the migrations for the database (that is the sql code that will be run to create the table in the database), you need to run both `serverpod generate` and `serverpod create-migrations`.

```bash
$ cd my_project/my_project_server
$ serverpod generate
$ serverpod create-migrations
```

This will generate the code for the model and create a new file called `favourite_recipe.dart` in the `lib/src/generated` directory. It will also update the client code in `my_project/my_project_client` so that you can use it in your Flutter app.

You will also notice that there will be a new entry in your "migrations" folder - serverpod creates these migrations "step by step" - each time you have changes which are relevant to the database and run `serverpod create-migrations` a new migration file will be created. This is a good way to keep track of the changes you make to the database and to be able to roll back changes if needed.

## Create an endpoint to save and retrieve our favourite recipes

We will be adding a few more methods to the `RecipeEndpoint` class we created in the previous section. We will add a method to save the recipe to the database and a method to retrieve all the favourite recipes from the database.

```dart
  /// This method is used to save the recipe as a favourite in the database.
  Future<void> saveRecipe(Session session, Recipe recipe) async {
    final favourite = FavouriteRecipe(recipe: recipe);
    // Store the recipe in the database
    await session.db.insertRow(favourite);
  }

  /// This method is used to get all the favourite recipes from the database.
  Future<List<Recipe>> getFavouriteRecipes(Session session) async {
    // Get all the favourite recipes from the database
    final favouriteRecipes = await session.db.find<FavouriteRecipe>();
    return favouriteRecipes.map((e) => e.recipe).toList();
  }
```

:::info
The `session.db` object is used to access the database. You can use it to insert, update, delete and query the database. The `insertRow` method is used to insert a new row in the database. The `find` method is used to query the database and get all the rows of a specific type. If a model uses the `table` keyword it is automatically registered in the database and you can use it to query the database.
:::

## Generate the code

Like before, when you change something that has an effect on the client code you need to run `serverpod generate` - we don't need to run `serverpod create-migrations` again, because we already created the migrations in the previous step.

```bash
$ cd my_project/my_project_server
$ serverpod generate
```

## Call the endpoint from the app

Now that we have updated the endpoint, we can call it from the app. We will do this in the `my_project/my_project_flutter/lib/main.dart` file. We will add a button to save the recipe to the database and a button to retrieve all the favourite recipes from the database.

```dart

```
