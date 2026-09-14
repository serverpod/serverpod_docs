---
sidebar_position: 9
description: Every Serverpod Cloud project gets file storage for avatars, documents, and other user files, read and written through the standard Serverpod storage API.
---

# Storage

Avatars, invoice PDFs, video attachments, and generated exports do not belong in your database. Serverpod Cloud keeps them as files instead. Your app uploads a file straight to storage rather than through an endpoint method, which keeps large files out of your API calls. Every new Serverpod Cloud project starts with two storages, `private` and `public`, matching the two the Serverpod framework configures by default.

## Choose between private and public

`private` is the default. Only your server can read the files in it. When your app needs a file, your server hands out a link that works for a short time.

`public` serves its files to anyone who has the URL. Use it for content you would put on a website, such as profile pictures, product images, and downloadable assets.

You choose access when you create a storage, and it cannot be changed afterwards. Pick `private` when you are unsure. You can add a public storage later and copy the files you want to expose into it.

## Use a storage from your server

Register each storage before you start the server. The storage id is the name you gave it.

<!-- TODO: ServerpodCloudStorage has not landed in the framework yet. Replace this
     block with the real class, its package, and its import once it ships. -->

```dart title="server.dart"
void run(List<String> args) async {
  final pod = Serverpod(args, Protocol(), Endpoints());

  pod.addCloudStorage(await ServerpodCloudStorage.create(storageId: 'private'));
  pod.addCloudStorage(await ServerpodCloudStorage.create(storageId: 'public'));

  await pod.start();
}
```

`ServerpodCloudStorage.create` is asynchronous, so call it before `pod.start()`. Projects created from the Serverpod template already contain these two lines.

After that, reach the storage through `session.storage`, the same API every Serverpod storage uses.

Write a file from your server:

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
final url = await session.storage.getPublicUrl(
  storageId: 'public',
  path: 'avatars/$userId.png',
);
```

To upload from your app, your server creates an upload description and your app sends the file with it. See [File uploads](https://docs.serverpod.dev/concepts/endpoints-and-apis/file-uploads) for the full flow, including the Flutter side.

```dart
class ProfileEndpoint extends Endpoint {
  Future<String?> getAvatarUploadDescription(Session session, String path) {
    return session.storage.createDirectFileUploadDescription(
      storageId: 'public',
      path: path,
    );
  }

  Future<bool> verifyAvatarUpload(Session session, String path) {
    return session.storage.verifyDirectFileUpload(
      storageId: 'public',
      path: path,
    );
  }
}
```

## Add a storage

Add a storage when you want files kept apart from the two defaults, such as one per tenant or one for exports you purge on a schedule.

1. Open your project in the Cloud console and select the **Storage** tab.
2. Select **Create storage**.
3. Enter a storage id. This is the name your code passes as `storageId`. Use lowercase letters, digits, and dashes.
4. Choose **Private** or **Public**.
5. Select **Create storage**.

The storage shows as `Creating` for a few seconds, then as `Private` or `Public`.

Deploy your project again so the new storage reaches your running server:

```bash
scloud deploy
```

Then register it the same way as the default storages:

<!-- TODO: same placeholder class as above. -->

```dart title="server.dart"
pod.addCloudStorage(await ServerpodCloudStorage.create(storageId: 'user-uploads'));
```

## Browse files in the console

Select a storage in the **Storage** tab to open its file browser.

A storage holds a flat list of files, and the console reads `/` in a path as a folder separator. A file stored at `avatars/2026/user-42.png` appears under `avatars`, then `2026`. The path you write is the only structure you get, so decide on a path scheme before you store many files. Use **Filter by name** to narrow a long list.

To add files, select **Upload files**, or drag them onto the browser. Select **Upload folder** to upload a whole folder and keep its structure.

Each file row has **Download** and **Delete**.

## Delete a storage

Open the row menu for the storage and select **Delete storage**. Type the storage id to confirm.

Deleting a storage deletes every file in it. The files cannot be recovered. Remove the storage from `server.dart` and deploy again, or calls to that storage id will fail.

## Usage and limits

A project's plan sets how many storages it can have and how much data it can store and transfer. Serverpod Cloud meters stored data and transfer, and bills them by usage.

When a project reaches a usage limit, its files stop being readable until usage is back under the limit. Delete files you no longer need to restore access.

See [Serverpod Cloud plans](https://serverpod.dev/cloud) for the figures on your plan.

## Related

- [File uploads](https://docs.serverpod.dev/concepts/endpoints-and-apis/file-uploads): the `session.storage` API and the Flutter upload flow.
- [Passwords, secrets, and environment variables](./passwords-secrets-env-vars): configuration your server reads at runtime.
