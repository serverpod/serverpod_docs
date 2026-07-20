---
description: File uploads in Serverpod go directly to storage via signed upload descriptions, with database, GCP, S3, and Cloudflare R2 backends.
---

# File uploads

Let your users upload avatars, documents, or any other files. The app sends the file straight to storage instead of through your endpoint methods, which keeps large files out of your API calls. Out of the box, your server stores files in the database, which works well for development. In production, configure Google Cloud Storage, AWS S3, or Cloudflare R2 instead.

## Upload a file

A `public` and a `private` file storage are set up by default. You can replace these or add more configurations for other file storages.

### Server-side code

There are a few steps required to upload a file. First, you must create an upload description on the server and pass it to your app. The upload description grants access to the app to upload the file. If you want to grant access to any file, you can add the following code to one of your endpoints. However, in most cases, you may want to restrict which files can be uploaded.

```dart
Future<String?> getUploadDescription(Session session, String path) async {
  return await session.storage.createDirectFileUploadDescription(
    storageId: 'public',
    path: path,
  );
}
```

The `createDirectFileUploadDescription` method also accepts optional parameters to control the upload:

- **`expirationDuration`** - How long the upload URL is valid. Defaults to 10 minutes.
- **`maxFileSize`** - Maximum allowed file size in bytes. Defaults to 10 MB.
- **`contentLength`** - The exact file size in bytes. When provided, the storage provider validates the upload size against `maxFileSize` and may enforce the exact size server-side (e.g. via signed URLs).
- **`preventOverwrite`** - When `true`, the upload will fail if a file already exists at the given path. Defaults to `false`.

Whether the options are enforced depends on the provider: the GCP native storage supports `preventOverwrite`, while the HMAC-based interface ignores it.

```dart
Future<String?> getRestrictedUploadDescription(
  Session session,
  String path,
  int fileSize,
) async {
  return await session.storage.createDirectFileUploadDescription(
    storageId: 'public',
    path: path,
    maxFileSize: 50 * 1024 * 1024, // 50 MB
    contentLength: fileSize,
    preventOverwrite: true,
  );
}
```

After the file is uploaded, verify that the upload completed. With a third-party service such as S3 or Google Cloud Storage, this is the only way to know it was not canceled.

```dart
Future<bool> verifyUpload(Session session, String path) async {
  return await session.storage.verifyDirectFileUpload(
    storageId: 'public',
    path: path,
  );
}
```

### Client-side code

To upload a file from the app side, first request the upload description. Next, upload the file, from either a `Stream` or a `ByteData` object. When uploading from a `Stream`, pass the file length if you know it: without a length, a multipart upload buffers the whole file in memory. The uploader does not report upload progress. Finally, verify the upload with the server.

```dart
var uploadDescription = await client.myEndpoint.getUploadDescription('myfile');
if (uploadDescription != null) {
  var uploader = FileUploader(uploadDescription);
  await uploader.upload(myStream, myFileLength);
  var success = await client.myEndpoint.verifyUpload('myfile');
}
```

:::info

In a real-world app, you most likely want to create the file paths on your server. For your file paths to be compatible with S3, do not use a leading slash. Only use standard characters and numbers. E.g.:

```dart
'profile/$userId/images/avatar.png'
```

:::

## Access stored files

You can check if a file exists or retrieve it directly from your server. Files in public storage are also accessible via URL. Private files can only be accessed from the server.

To check if a file exists, use the `fileExists` method.

```dart
var exists = await session.storage.fileExists(
  storageId: 'public',
  path: 'my/file/path',
);
```

If the file is in a public storage, you can access it through its URL.

```dart
var url = await session.storage.getPublicUrl(
  storageId: 'public',
  path: 'my/file/path',
);
```

You can also directly retrieve or store a file from your server.

```dart
var myByteData = await session.storage.retrieveFile(
  storageId: 'public',
  path: 'my/file/path',
);
```

To store a file directly from the server, use the `storeFile` method. You can set `preventOverwrite` to `true` to ensure the write fails if a file already exists at the given path, and `expiration` to give the file an expiry time.

```dart
await session.storage.storeFile(
  storageId: 'public',
  path: 'my/file/path',
  byteData: myByteData,
  preventOverwrite: true,
);
```

To delete a stored file, use `deleteFile` with the same `storageId` and `path`. To look up public URLs for many files at once, use `getPublicUrls`.

## Configure a storage provider

Each storage is identified by a `storageId`. Serverpod comes with two default storages, `public` and `private`. You can replace these with a cloud-backed implementation, or add additional storages with custom IDs. Register your cloud storage with `pod.addCloudStorage()` before starting the server.

The sections below give short descriptions on how to set up each provider. Consult the documentation of each cloud provider for more details on bucket creation, access policies, and credential management.

### GCP (HMAC)

Serverpod can use Google Cloud Storage's HMAC interoperability (S3-compatible) to handle file uploads to Google Cloud. To make file uploads work, you must make a few custom configurations in your Google Cloud console:

1. Create a service account with the _Storage Admin_ role.
2. Under _Cloud Storage_ > _Settings_ > _Interoperability_, create a new HMAC key for your newly created service account.
3. Add the two keys you received in the previous step to your `config/passwords.yaml` file. The keys should be named `HMACAccessKeyId` and `HMACSecretKey`, respectively. You can also pass them in as environment variables. The environment variable names are `SERVERPOD_HMAC_ACCESS_KEY_ID` and `SERVERPOD_HMAC_SECRET_KEY`.
4. When creating a new bucket, set the _Access control_ to _Fine-grained_ and disable the _Prevent public access_ option.

You may also want to add the bucket as a backend for your load balancer to give it a custom domain name.

When you have set up your GCP bucket, you need to configure it in Serverpod. Add the GCP package to your `pubspec.yaml` file and import it in your `server.dart` file.

```bash
dart pub add serverpod_cloud_storage_gcp
```

```dart
import 'package:serverpod_cloud_storage_gcp/serverpod_cloud_storage_gcp.dart'
    as gcp;
```

The `bucket` parameter is the GCP bucket name (find it in the console), and `publicHost` is the domain used to access the bucket over https when it sits behind a load balancer.

```dart
pod.addCloudStorage(
  gcp.GoogleCloudStorage(
    serverpod: pod,
    storageId: 'public',
    public: true,
    region: 'auto',
    bucket: 'my-bucket-name',
    publicHost: 'storage.myapp.com',
  ),
);
```

### GCP (native)

As an alternative to the HMAC approach, you can use Google Cloud Storage's native JSON API with service account credentials. This provides full GCP feature support including `preventOverwrite`.

The native implementation is available from the same `serverpod_cloud_storage_gcp` package:

```dart
import 'package:serverpod_cloud_storage_gcp/serverpod_cloud_storage_gcp.dart'
    as gcp;
```

Since the factory constructors are asynchronous, create the storage before starting the pod:

```dart
pod.addCloudStorage(
  await gcp.NativeGoogleCloudStorage.create(
    serverpod: pod,
    storageId: 'public',
    public: true,
    bucket: 'my-bucket-name',
    publicHost: 'storage.myapp.com',
  ),
);
```

The `create` factory loads the service account JSON from `passwords.yaml` (key: `gcpServiceAccount`) or the environment variable `SERVERPOD_PASSWORD_gcpServiceAccount`. Add the service account JSON to your `passwords.yaml`:

```yaml
shared:
  gcpServiceAccount: '{"type":"service_account","project_id":"...","private_key":"...",...}'
```

If you prefer to pass the JSON directly, use `fromServiceAccountJson`:

```dart
pod.addCloudStorage(
  await gcp.NativeGoogleCloudStorage.fromServiceAccountJson(
    storageId: 'public',
    public: true,
    bucket: 'my-bucket-name',
    serviceAccountJson: myServiceAccountJson,
  ),
);
```

For environments that support Application Default Credentials (e.g. Google Compute Engine, Cloud Run), use `fromApplicationDefaultCredentials`:

```dart
pod.addCloudStorage(
  await gcp.NativeGoogleCloudStorage.fromApplicationDefaultCredentials(
    storageId: 'public',
    public: true,
    bucket: 'my-bucket-name',
  ),
);
```

:::info

When using Application Default Credentials, the service account must have the `iam.serviceAccounts.signBlob` IAM permission to generate signed URLs.

:::

### AWS S3

This section shows how to set up a storage using S3. Before you write your Dart code, you need to set up an S3 bucket. Most likely, you will also want to set up a CloudFront for the bucket, where you can use a custom domain and your own SSL certificate. Finally, you will need to get a set of AWS access keys and add them to your Serverpod password file (`AWSAccessKeyId` and `AWSSecretKey`) or pass them in as environment variables (`SERVERPOD_AWS_ACCESS_KEY_ID` and `SERVERPOD_AWS_SECRET_KEY`).

When you are all set with the AWS setup, include the S3 package in your `pubspec.yaml` file and import it in your `server.dart` file.

```bash
dart pub add serverpod_cloud_storage_s3
```

```dart
import 'package:serverpod_cloud_storage_s3/serverpod_cloud_storage_s3.dart'
    as s3;
```

Set `publicHost` if your S3 bucket is accessible on a custom domain through CloudFront.

```dart
pod.addCloudStorage(
  s3.S3CloudStorage(
    serverpod: pod,
    storageId: 'public',
    public: true,
    region: 'us-west-2',
    bucket: 'my-bucket-name',
    publicHost: 'storage.myapp.com',
  ),
);
```

For your S3 configuration to work, you will also need to add your AWS credentials to the `passwords.yaml` file. Create the access keys in the AWS console for a dedicated IAM user whose access is limited to the bucket. Avoid root-user access keys.

```yaml
shared:
  AWSAccessKeyId: 'XXXXXXXXXXXXXX'
  AWSSecretKey: 'XXXXXXXXXXXXXXXXXXXXXXXXXXX'
```

### Cloudflare R2

Serverpod supports Cloudflare R2 as a cloud storage provider. R2 is S3-compatible and uses presigned PUT uploads.

Add the R2 package to your `pubspec.yaml` file and import it in your `server.dart` file.

```bash
dart pub add serverpod_cloud_storage_r2
```

```dart
import 'package:serverpod_cloud_storage_r2/serverpod_cloud_storage_r2.dart'
    as r2;
```

Configure the storage with your Cloudflare account ID and bucket name:

```dart
pod.addCloudStorage(
  r2.R2CloudStorage(
    serverpod: pod,
    storageId: 'public',
    public: true,
    bucket: 'my-bucket-name',
    accountId: 'your-cloudflare-account-id',
    publicHost: 'storage.myapp.com',
  ),
);
```

Add your R2 API credentials to the `passwords.yaml` file. You can create access keys from the Cloudflare dashboard under _R2_ > _Manage R2 API Tokens_.

```yaml
shared:
  R2AccessKeyId: 'XXXXXXXXXXXXXX'
  R2SecretKey: 'XXXXXXXXXXXXXXXXXXXXXXXXXXX'
```

You can also pass credentials via environment variables: `SERVERPOD_R2_ACCESS_KEY_ID` and `SERVERPOD_R2_SECRET_KEY`.
