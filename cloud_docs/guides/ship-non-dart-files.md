---
sidebar_position: 2
sidebar_label: Ship non-Dart files with your server
description: Include configuration files, templates, data, or other non-Dart assets alongside your Serverpod Cloud server and read them at runtime.
---

# Ship non-Dart files with your server

Bundle non-Dart files (configuration, templates, CSV data, binary blobs) with your server code on Cloud. Place them in an `assets/` folder at the project root and read them with `./assets/<path>` at runtime.

## Before you start

- A Serverpod server project on disk (alongside `lib/` and `bin/`).
- The `scloud` CLI installed and authenticated. See [Install scloud](/cloud/getting-started/installation).

## Add files to your project

Place files in an `assets/` folder at the root of your server project, alongside `lib/` and `bin/`:

```text
my_server/
├── assets/
│   ├── config/
│   │   └── settings.json
│   ├── templates/
│   │   └── email_template.html
│   └── data/
│       └── initial_data.csv
├── lib/
├── bin/
└── pubspec.yaml
```

Then deploy:

```bash
scloud deploy
```

Cloud zips your project directory and includes every file that isn't excluded from the deploy package (see [Control what gets uploaded](#control-what-gets-uploaded) below). `assets/` is the Serverpod naming convention for this folder. You can call it anything, but the rest of this guide assumes `assets/`.

To preview which files Cloud will upload before deploying:

```bash
scloud deploy --dry-run --show-files
```

## Read an asset at runtime

Use Dart's `dart:io` library and a path relative to the server's working directory:

```dart
import 'dart:io';

Future<String> readSettings() async {
  final file = File('./assets/config/settings.json');
  return file.readAsString();
}
```

The path is relative to the directory the server runs from, not to the source file. Use `./assets/<path>` everywhere; absolute paths break across local and deployed environments.

For binary data (images, PDFs, archives), use `readAsBytes()` instead of `readAsString()`.

## Read common file types

### Load JSON configuration

Parse a JSON file into a `Map` on startup or per request:

```dart
import 'dart:io';
import 'dart:convert';

Future<Map<String, dynamic>> loadConfig() async {
  final file = File('./assets/config/app_config.json');
  final contents = await file.readAsString();
  return jsonDecode(contents) as Map<String, dynamic>;
}
```

### Render a template

Read an HTML or text template, then interpolate values:

```dart
import 'dart:io';

Future<String> loadWelcomeEmail({required final String name}) async {
  final template = await File('./assets/templates/welcome_email.html').readAsString();
  return template.replaceAll('{{name}}', name);
}
```

### Read CSV data

For tabular data, read line by line:

```dart
import 'dart:io';

Future<List<String>> readCsv() async {
  return File('./assets/data/initial_data.csv').readAsLines();
}
```

For more complex parsing, the [`csv` package](https://pub.dev/packages/csv) handles quoting and escaping.

## Control what gets uploaded

Two files affect what's in the deployment:

- **`.gitignore`.** Anything excluded here is also excluded from the deploy.
- **`.scloudignore`.** Cloud-specific exclusions. Same syntax as `.gitignore`. Use the `!` prefix to opt files back in that `.gitignore` excluded.

Hidden files (those starting with `.`) are excluded by default. If you need them shipped, opt back in via `.scloudignore`. See [Deployments](/cloud/concepts/deployments) for the full picture of the deployment package.

:::tip

Asset files count toward your deployment package size. Large folders slow uploads and the Cloud build step. For files larger than a few megabytes that don't need to live in version control, consider an external object store and reading them from the network instead.

:::

## Troubleshooting

**File not found at runtime.** The path is relative to the server's working directory, not to the source file. Use `./assets/<path>`. Verify the file is in the deployment with `scloud deploy --dry-run --show-files` before debugging at runtime.

**Asset missing from the deployment.** Check `.gitignore` and `.scloudignore`. Patterns like `*.json` exclude every `.json` file unless you opt them back in with `!assets/**`.

## Related

- [Deployments](/cloud/concepts/deployments) for what's in the deployment package and how `.scloudignore` works.
- [`scloud deploy`](/cloud/reference/cli/commands/deploy) for the deploy command and its flags.
