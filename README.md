# Serverpod documentation website

Make sure that you have Node.js installed on your computer.

### Install

```
$ cd serverpod_docs
$ npm install
```

### Local Development

```
$ npm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Add version

Make sure that the documentation is all up-to-date then run:

```
npm run docusaurus docs:version X.X.X
```

### Build and deploy

To do this you need access to the Serverpod Github `serverpod.github.io` repository. Clone it next to the `serverpod_web` repo.

```
$ util/deploy
```
