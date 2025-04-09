# Let's build a TODO app with Serverpod

In this tutorial, we will build a simple TODO app with Serverpod. The app will allow users to create, read, update, and delete TODO items. We will also use the Serverpod database to store the TODO items. We will take a look at mobile apps and how to host the Flutter app as a webapp directly on our own server. Finally we will be running a nightly cleanup task that deletes old entries as an example for our scheduled tasks.

In part two we will add authentication to our app and build a small admin dashboard to manage our users.

## Our acceptance criteria

- [ ] The app should allow users to create, read, update, and delete TODO items.
- [ ] When the app connects to the server, it should fetch the TODO items from the database and display them in a list.

## Prerequisites

- [✅ Serverpod](00-installing-serverpod) installed
- [✅ Flutter](https://flutter.dev/docs/get-started/install) installed
- [✅ Docker](https://docs.docker.com/get-docker/) installed

## Creating a new project

To create a new project, run the following command in your terminal:

```bash
$ serverpod create my_todos
```

This will create a new directory called `my_todos` with the following structure:

```bash
TODO add tree output
```

## Working with data models

### How to model your data

### Creating a model and generate the code

## Creating a database table

### Creating a migration

### Running the migration

## Creating an endpoint for the TODOs feature

### Creating the endpoint

### CRUD - Create, Read, Update, Delete

### Testing the endpoint

## Creating the Flutter app

### Listing the TODOs

### Creating a new TODO

### Updating a TODO

### Deleting a TODO

### Running the app

## Hosting the Flutter app

### Building the app for web

### Hosting the app on your server

### Running the app on your server

## Scheduled tasks

### Creating a scheduled task

## Deployment

### Building the server

### Containerizing the server

### Deploying the server

### Serverpod Cloud
