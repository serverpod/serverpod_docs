---
title: Storage
sidebar_position: 9
description: Serverpod Cloud gives every project file storage. Use it from your server through session.storage, and manage storages and files from the CLI or the console.
---

# Storage

Avatars, invoice PDFs, and generated exports do not belong in your database. Serverpod Cloud keeps them as files instead. Every new project starts with two storages, `private` and `public`, matching the two the Serverpod framework configures by default, and you can add more.

## Choose access for a storage

A storage is either private or public. Any storage id can be either, and the two you start with happen to be named after their access.

Files in a private storage are not reachable by URL by default. Your server reads and writes them, and you can reach them yourself from the CLI and the console. Use it for anything belonging to a single user or anything you would not publish. To let an app download one, your server creates a signed link with `session.storage.temporaryDownloadUrl` that works for a limited time. Check that the user is allowed to access that file before you return the link.

Files in a public storage are served to anyone who has the URL. Use it for content you would put on a website, such as profile images, product photos, and downloadable assets.

Access is fixed when a storage is created and cannot be changed afterwards. Choose private when you are unsure. You can create a public storage later and move the files you want to expose into it by downloading them and uploading them again.

## Use storage from your server

New projects already connect both default storages in `server.dart`. The `serverpod_cloud_storage` package that `serverpod create` adds provides them:

```dart title="server.dart"
pod.addCloudStorage(
  await ServerpodCloudProvider.private(
    fallback: () => DatabaseCloudStorage('private'),
  ),
);
pod.addCloudStorage(
  await ServerpodCloudProvider.public(
    fallback: () => DatabaseCloudStorage('public'),
  ),
);
```

The `fallback` runs when your server is not on Serverpod Cloud, for example on your own machine. Files are then stored in the database instead.

Your server reaches a storage through `session.storage`, naming it with a storage id. That id is the same name you see in the CLI and the console.

To use a storage you created yourself, connect it in `server.dart` the same way, with `custom` and its storage id. This needs `serverpod_cloud_storage` 4.0.2 or later:

```dart title="server.dart"
pod.addCloudStorage(
  await ServerpodCloudProvider.custom(
    storageId: 'exports',
    fallback: () => DatabaseCloudStorage('exports'),
  ),
);
```

See [File uploads](/concepts/endpoints-and-apis/file-uploads) for the `session.storage` API, the Flutter upload flow, and how storage providers are configured.

## List your storages

List the storages in your project:

```bash
serverpod cloud storage list
```

The **Storage** tab in the Cloud console shows the same list, and you can add and delete storages there too.

## Add a storage

A storage you add yourself keeps files apart from the defaults, such as exports you purge on a schedule. The Starter plan includes two storages and your project already uses both, so adding more needs the **Growth** plan.

Add one:

```bash
serverpod cloud storage create exports
```

A storage id uses lowercase letters, digits, and dashes, starts and ends with a letter or a digit, and is at most 63 characters. New storages are private unless you pass `--access public`.

To use it from your server, connect it with `ServerpodCloudProvider.custom`. See [Use storage from your server](#use-storage-from-your-server).

## Delete a storage

Deleting a storage removes every file in it, and the files cannot be recovered. Anything still using that storage id fails afterwards.

Delete one you no longer need:

```bash
serverpod cloud storage delete exports
```

The command asks you to confirm before it deletes anything.

## Work with files

Use these commands to check what your users uploaded, to put an asset in place before anyone needs it, or to clear out test data. The first argument is the storage id:

```bash
serverpod cloud storage file list public avatars
serverpod cloud storage file upload public ./avatar.png avatars/u1.png
serverpod cloud storage file download public avatars/u1.png
serverpod cloud storage file delete public avatars/u1.png
```

See [CLI reference: `storage` command](/cloud/reference/cli/commands/storage) for the `storage` commands and their options.

In the console, select a storage in the **Storage** tab to browse, upload, download and delete its files. A storage holds a flat list of files, and the console reads `/` in a path as a folder separator, so a file stored at `avatars/2026/user-42.png` appears under `avatars`, then `2026`. The path you write is the only structure you get, so decide on a path scheme before you store many files.

## Limits

- **Storages per project.** The Starter plan includes two and Growth allows up to ten.
- **Metered usage.** Serverpod Cloud meters three things and bills them by usage: the data you store, the data read out of your storages, and the operations performed on them.
- **Going over a cap.** Caps come with the plan, and there is no setting that raises them. When a project goes over one, your server can no longer read or write any storage in the project, and public URLs stop serving. Listing, downloading and deleting keep working from the CLI and the console, so you can clear space.
- **Getting access back.** Access returns once usage is back under the cap, the month rolls over for a monthly cap, or the project moves to a plan that covers the usage. The check runs about once an hour, so it can take up to an hour. Deleting files helps when stored data is what you went over.

See [Serverpod Cloud plans](https://serverpod.dev/cloud) for the caps and prices on your plan.

## Related

- [File uploads](/concepts/endpoints-and-apis/file-uploads): the `session.storage` API, the Flutter upload flow, and storage provider setup.
- [CLI reference: `storage` command](/cloud/reference/cli/commands/storage): the `storage` commands and their options.
