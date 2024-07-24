# Uploading files

Serverpod has built-in support for handling file uploads. Out of the box, your server is configured to use the database for storing files. This works well for testing but may not be performant in larger-scale applications. You should set up your server to use Google Cloud Storage or S3 in production scenarios.

## How to upload a file

A `public` and `private` file storage are set up by default to use the database. You can replace these or add more configurations for other file storages.

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

After the file is uploaded, you should verify that the upload has been completed. If you are uploading a file to a third-party service, such as S3 or Google Cloud Storage, there is no other way of knowing if the file was uploaded or if the upload was canceled.

```dart
Future<bool> verifyUpload(Session session, String path) async {
  return await session.storage.verifyDirectFileUpload(
    storageId: 'public',
    path: path,
  );
}
```

### Client-side code

To upload a file from the app side, first request the upload description. Next, upload the file. You can upload from either a `Stream` or a `ByteData` object. If you are uploading a larger file, using a `Stream` is better because not all of the data must be held in RAM memory. Finally, you should verify the upload with the server.

```dart
var uploadDescription = await client.myEndpoint.getUploadDescription('myfile');
if (uploadDescription != null) {
  var uploader = FileUploader(uploadDescription);
  await uploader.upload(myStream);
  var success = await client.myEndpoint.verifyUpload('myfile');
}
```

:::info

In a real-world app, you most likely want to create the file paths on your server. For your file paths to be compatible with S3, do not use a leading slash; only use standard characters and numbers. E.g.:

```dart
'profile/$userId/images/avatar.png'
```

:::

## Accessing stored files

It's possible to quickly check if an uploaded file exists or access the file itself. If a file is in a public storage, it is also accessible to the world through an URL. If it is private, it can only be accessed from the server.

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

## Add a configuration for GCP

Serverpod uses Google Cloud Storage's HMAC interoperability to handle file uploads to Google Cloud. To make file uploads work, you must make a few custom configurations in your Google Cloud console:

1. Create a service account with the _Storage Admin_ role.
2. Under _Cloud Storage_ > _Settings_ > _Interoperability_, create a new HMAC key for your newly created service account.
3. Add the two keys you received in the previous step to your `config/password.yaml` file. The keys should be named `HMACAccessKeyId` and `HMACSecretKey`, respectively.
4. When creating a new bucket, set the _Access control_ to _Fine-grained_ and disable the _Prevent public access_ option.

You may also want to add the bucket as a backend for your load balancer to give it a custom domain name.

When you have set up your GCP bucket, you need to configure it in Serverpod. Add the GCP package to your `pubspec.yaml` file and import it in your `server.dart` file.

```dart
import 'package:serverpod_cloud_storage_gcp/serverpod_cloud_storage_gcp.dart'
    as gcp;
```

After creating your Serverpod, you add a storage configuration. If you want to replace the default `public` or `private` storages, set the `storageId` to `public` or `private`. Set the public host if you have configured your GCP bucket to be accessible on a custom domain through a load balancer. You should add the cloud storage before starting your pod. The `bucket` parameter refers to the GCP bucket name (you can find it in the console) and the `publicHost` is the domain name used to access the bucket via https.

```dart
  pod.addCloudStorage(gcp.GoogleCloudStorage(
    serverpod: pod,
    storageId: 'public',
    public: true,
    region: 'auto',
    bucket: 'my-bucket-name',
    publicHost: 'storage.myapp.com',
  ));
```

## Add a configuration for AWS S3

This section shows how to set up a storage using S3. Before you write your Dart code, you need to set up an S3 bucket. Most likely, you will also want to set up a CloudFront for the bucket, where you can use a custom domain and your own SSL certificate. Finally, you will need to get a set of AWS access keys and add them to your Serverpod password file.

When you are all set with the AWS setup, include the S3  package in your `pubspec.yaml` file and import it in your `server.dart` file.

```dart
import 'package:serverpod_cloud_storage_s3/serverpod_cloud_storage_s3.dart'
    as s3;
```

After creating your Serverpod, you add a storage configuration. If you want to replace the default `public` or `private` storages, set the `storageId` to `public` or `private`. Set the public host if you have configured your S3 bucket to be accessible on a custom domain through CloudFront. You should add the cloud storage before starting your pod.

```dart
pod.addCloudStorage(s3.S3CloudStorage(
  serverpod: pod,
  storageId: 'public',
  public: true,
  region: 'us-west-2',
  bucket: 'my-bucket-name',
  publicHost: 'storage.myapp.com',
));
```

For your S3 configuration to work, you will also need to add your AWS credentials to the `passwords.yaml` file. You create the access keys from your AWS console when signed in as the root user.

```yaml
shared:
  AWSAccessKeyId: 'XXXXXXXXXXXXXX'
  AWSSecretKey: 'XXXXXXXXXXXXXXXXXXXXXXXXXXX'
```

:::info

If you are using the GCP or AWS Terraform scripts that are created with your Serverpod project, the required GCP or S3 buckets will be created automatically. The scripts will also configure your load balancer or Cloudfront and the certificates needed to access the buckets securely.

:::
