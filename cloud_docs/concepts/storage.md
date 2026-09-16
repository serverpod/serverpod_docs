---
title: Storage
sidebar_position: 9
description: Serverpod Cloud gives every project file storage. Use it from your server through session.storage, and manage storages and their files from the CLI or the console.
---

# Storage

Avatars, invoice PDFs, and generated exports do not belong in your database. Serverpod Cloud keeps them as files instead. Every new project starts with two storages, `private` and `public`, matching the two the Serverpod framework configures by default, and you can add more.

## Choose access for a storage

A storage is either private or public, and the two you start with are named after their access.

Files in a private storage are never served publicly. Your server reads and writes them, and you can reach them yourself from the CLI and the console. Use it for anything belonging to a single user or anything you would not publish. To let an app download one, your server hands out a link that works for a short time with `session.storage.temporaryDownloadUrl`.

Files in a public storage are served to anyone who has the URL. Use it for content you would put on a website, such as profile images, product photos, and downloadable assets.

Access is fixed when a storage is created and cannot be changed afterwards. Choose private when you are unsure. You can create a public storage later and copy the files you want to expose into it.

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

Register storages before `pod.start()`, because the running server serves the storages registered on it. The `fallback` runs when your server is not running on Serverpod Cloud, for example on your own machine, and files are then stored in the database instead.

Each call names the storage it works on with a storage id, the same name you see in the CLI and the console. Write a file:

```dart
await session.storage.storeFile(
  storageId: 'private',
  path: 'invoices/2026/$invoiceId.pdf',
  byteData: pdfBytes,
);
```

Read it back:

```dart
final pdfBytes = await session.storage.retrieveFile(
  storageId: 'private',
  path: 'invoices/2026/$invoiceId.pdf',
);
```

Get the URL of a file in a public storage:

```dart
final url = await session.storage.publicDownloadUrl(
  storageId: 'public',
  path: 'avatars/$userId.png',
);
```

To upload from your app instead, your server creates an upload description and your app sends the file with it. See [File uploads](/concepts/endpoints-and-apis/file-uploads) for the full flow, including the Flutter side.

Cloud connects `private` and `public` for you. A storage you add yourself has no ready-made helper, so you register it in `server.dart` the same way you would any other storage provider. See [Configure a storage provider](/concepts/endpoints-and-apis/file-uploads#configure-a-storage-provider) for how registration works.

## Manage your storages

List the storages in your project:

```bash
serverpod cloud storage list
```

Add one when you want files kept apart from the defaults, such as exports you purge on a schedule:

```bash
serverpod cloud storage create exports
```

A storage id uses lowercase letters, digits, and dashes, starts and ends with a letter or a digit, and is at most 63 characters. New storages are private unless you pass `--access public`.

Delete a storage and everything in it:

```bash
serverpod cloud storage delete exports
```

The command asks you to confirm. The files cannot be recovered, and code that still writes to that storage id fails afterwards.

You can do both in the Cloud console instead, from the **Storage** tab. A new storage shows as `Creating` briefly, then as `Private` or `Public`, and deleting one asks you to type its storage id to confirm.

## Work with files

Use these commands to check what your users uploaded, to put an asset in place before anyone needs it, or to clear out test data. The first argument is the storage id:

```bash
serverpod cloud storage file list public avatars
serverpod cloud storage file upload public ./avatar.png avatars/u1.png
serverpod cloud storage file download public avatars/u1.png
serverpod cloud storage file delete public avatars/u1.png
```

See [CLI reference: `storage` command](/cloud/reference/cli/commands/storage) for every subcommand and flag.

In the console, select a storage in the **Storage** tab to open its file browser. A storage holds a flat list of files, and the console reads `/` in a path as a folder separator. A file stored at `avatars/2026/user-42.png` appears under `avatars`, then `2026`. The path you write is the only structure you get, so decide on a path scheme before you store many files. Use **Filter by name** to narrow a long list.

To add files, select **Upload files**, or drag them onto the browser. Select **Upload folder** to upload a whole folder and keep its structure. Each file row has a menu with **Download** and **Delete**.

## Limits

- **Storages per project.** Your plan sets how many storages a project can have.
- **Metered usage.** Serverpod Cloud meters three things and bills them by usage: the data you store, the data read out of your storages, and the operations performed on them.
- **Caps on some plans.** Plans that set caps lock a project out when it goes over one. Every storage in the project becomes unreadable and unwritable, and public URLs stop working.
- **Getting access back.** Access returns on the next enforcement pass, once usage is back under the cap, once the month rolls over for a monthly cap, or once the project moves to a plan that covers the usage. Deleting files helps when the amount stored is what you went over.

See [Serverpod Cloud plans](https://serverpod.dev/cloud) for the caps and prices on your plan.

## Related

- [File uploads](/concepts/endpoints-and-apis/file-uploads): the `session.storage` API and the Flutter upload flow.
- [CLI reference: `storage` command](/cloud/reference/cli/commands/storage): every storage subcommand and flag.
