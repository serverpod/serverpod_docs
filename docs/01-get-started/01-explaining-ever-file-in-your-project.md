# Overview

Getting started with a new framework can be overwhelming - to make it easier for you we created a walkthrough of each and every file that is part of the `serverpod create` template. This will give you the full picture, but feel free to skip ahead and come back here if you are looking for a deeper understanding.

//TODO replace with actual video

<div style={{ position : 'relative', paddingBottom : '56.25%', height : '0' }}><iframe style={{ position : 'absolute', top : '0', left : '0', width : '100%', height : '100%' }} width="560" height="315" src="https://www.youtube-nocookie.com/embed/FwttjcKyWFk" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>

// TODO clean up the tree and only show the files that are relevant for the user

```bash
my_project ➤ tree -L 3
.
├── my_project_client
│   ├── CHANGELOG.md
│   ├── README.md
│   ├── analysis_options.yaml
│   ├── dartdoc_options.yaml
│   ├── doc
│   │   └── endpoint.md
│   ├── lib
│   │   ├── my_project_client.dart
│   │   └── src
│   ├── pubspec.lock
│   └── pubspec.yaml
├── my_project_flutter
│   ├── README.md
│   ├── analysis_options.yaml
│   ├── android
│   │   ├── app
│   │   ├── build.gradle
│   │   ├── gradle
│   │   ├── gradle.properties
│   │   ├── gradlew
│   │   ├── gradlew.bat
│   │   ├── local.properties
│   │   ├── my_project_flutter_android.iml
│   │   └── settings.gradle
│   ├── build
│   │   ├── 6e821092f1b86bf52bb658fc010d717d
│   │   ├── f4da31578bf74e160393d588ebd02ee2.cache.dill.track.dill
│   │   └── flutter_assets
│   ├── ios
│   │   ├── Flutter
│   │   ├── Podfile
│   │   ├── Runner
│   │   ├── Runner.xcodeproj
│   │   ├── Runner.xcworkspace
│   │   └── RunnerTests
│   ├── lib
│   │   └── main.dart
│   ├── linux
│   │   ├── CMakeLists.txt
│   │   ├── flutter
│   │   ├── main.cc
│   │   ├── my_application.cc
│   │   └── my_application.h
│   ├── macos
│   │   ├── Flutter
│   │   ├── Podfile
│   │   ├── Runner
│   │   ├── Runner.xcodeproj
│   │   ├── Runner.xcworkspace
│   │   └── RunnerTests
│   ├── my_project_flutter.iml
│   ├── pubspec.lock
│   ├── pubspec.yaml
│   ├── test
│   │   └── widget_test.dart
│   ├── web
│   │   ├── favicon.png
│   │   ├── icons
│   │   ├── index.html
│   │   └── manifest.json
│   └── windows
│       ├── CMakeLists.txt
│       ├── flutter
│       └── runner
└── my_project_server
    ├── CHANGELOG.md
    ├── Dockerfile
    ├── README.md
    ├── analysis_options.yaml
    ├── bin
    │   └── main.dart
    ├── config
    │   ├── development.yaml
    │   ├── generator.yaml
    │   ├── passwords.yaml
    │   ├── production.yaml
    │   ├── staging.yaml
    │   └── test.yaml
    ├── dart_test.yaml
    ├── deploy
    │   ├── aws
    │   └── gcp
    ├── docker-compose.yaml
    ├── lib
    │   ├── server.dart
    │   └── src
    ├── migrations
    │   ├── 20250422113340878
    │   └── migration_registry.txt
    ├── pubspec.lock
    ├── pubspec.yaml
    ├── test
    │   └── integration
    └── web
        ├── static
        └── templates

48 directories, 50 files
```
