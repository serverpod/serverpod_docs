# Including non-Dart files with your server

Serverpod Cloud allows you to include non-Dart files (assets) with your server deployment. These files are copied to your deployed server and can be accessed from your server code at runtime.

## How it works

Serverpod Cloud automatically copies all files located in an `assets` folder in the root of your server project during deployment. These files are then available in your deployed server using relative paths from the server's working directory.

## Setting up assets

1. Create an `assets` folder in the root of your server project (alongside `lib/`, `bin/`, etc.)

2. Add your files to the `assets` folder:

```bash
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

3. Deploy your application as usual:

```bash
scloud deploy
```

All files in the `assets` folder will be automatically included in your deployment.

## Accessing assets in your server code

Files in the `assets` folder can be referenced from your server code using the relative path `./assets/path/to/file.txt`.

### Reading asset files

Use Dart's `dart:io` library to read asset files:

```dart
import 'dart:io';

Future<String> readConfigFile() async {
  final file = File('./assets/config/settings.json');
  final contents = await file.readAsString();
  return contents;
}
```

### Checking if files exist

Before reading a file, you may want to check if it exists:

```dart
import 'dart:io';

Future<String?> readAssetFile(String path) async {
  final file = File('./assets/$path');
  
  if (await file.exists()) {
    return await file.readAsString();
  }
  
  return null;
}
```

## Common use cases

### Configuration files

Store configuration files that your server needs at runtime:

```dart
import 'dart:io';
import 'dart:convert';

Future<Map<String, dynamic>> loadConfig() async {
  final file = File('./assets/config/app_config.json');
  final contents = await file.readAsString();
  return jsonDecode(contents) as Map<String, dynamic>;
}
```

### Template files

Include HTML or text templates for email notifications or reports:

```dart
import 'dart:io';

Future<String> loadEmailTemplate() async {
  final file = File('./assets/templates/welcome_email.html');
  return await file.readAsString();
}
```

### Static data files

Include CSV files, JSON data, or other static data files:

```dart
import 'dart:io';

Future<List<String>> readCsvData() async {
  final file = File('./assets/data/initial_data.csv');
  final lines = await file.readAsLines();
  return lines;
}
```

### Binary files

Read binary files like images or PDFs:

```dart
import 'dart:io';

Future<List<int>> loadImageBytes() async {
  final file = File('./assets/images/logo.png');
  return await file.readAsBytes();
}
```

## Complete example

Here's a complete example of using assets in a Serverpod endpoint:

```dart
import 'dart:io';
import 'dart:convert';
import 'package:serverpod/serverpod.dart';

class ConfigEndpoint extends Endpoint {
  Future<Map<String, dynamic>> getConfig(Session session) async {
    try {
      final file = File('./assets/config/app_config.json');
      
      if (!await file.exists()) {
        throw Exception('Config file not found');
      }
      
      final contents = await file.readAsString();
      final config = jsonDecode(contents) as Map<String, dynamic>;
      
      return config;
    } catch (e) {
      throw Exception('Failed to load config: $e');
    }
  }
}
```

## Important notes

1. **Folder Location**: The `assets` folder must be in the root of your server project, not in `lib/` or any subdirectory.

2. **File Paths**: Always use the `./assets/` prefix when referencing files. Paths are relative to the server's working directory.

3. **Deployment**: Assets are included automatically during deployment. No additional configuration is needed.

4. **File Size**: Consider the size of your assets, as they are included in the deployment package. Large files may increase deployment time, or hit the size limit of the deployment package.


## Troubleshooting

| Issue | Possible Solution |
|-------|------------------|
| File not found error | Verify the `assets` folder exists in the server project root and the file path is correct |
| Permission denied | Check file permissions in the assets folder |
| Assets not included in deployment | Ensure the `assets` folder is in the root directory and not excluded by `.scloudignore` |

