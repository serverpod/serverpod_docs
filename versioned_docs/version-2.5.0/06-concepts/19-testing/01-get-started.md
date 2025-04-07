# Get started

Serverpod provides simple but feature rich test tools to make testing your backend a breeze.

:::info

For Serverpod Mini projects, everything related to the database in this guide can be ignored.

:::

<details>
<summary> Have an existing project? Follow these steps first!</summary>
<p>
For existing non-Mini projects, a few extra things need to be done:
1. Add the `server_test_tools_path` key with the value `test/integration/test_tools` to `config/generator.yaml`:

```yaml
server_test_tools_path: test/integration/test_tools
```

 Without this key, the test tools file is not generated. With the above config the location of the test tools file is `test/integration/test_tools/serverpod_test_tools.dart`, but this can be set to any folder (though should be outside of `lib` as per Dart's test conventions).

2. New projects now come with a test postgres and redis instance in `docker-compose.yaml`. This is not strictly mandatory, but is recommended to ensure that the testing state is never polluted. Add the snippet below to the `docker-compose.yaml` file in the server directory:

```yaml
# Add to the existing services
postgres_test:
  image: postgres:16.3
  ports:
    - '9090:5432'
  environment:
    POSTGRES_USER: postgres
    POSTGRES_DB: <projectname>_test
    POSTGRES_PASSWORD: "<insert database test password>"
  volumes:
    - <projectname>_test_data:/var/lib/postgresql/data
redis_test:
  image: redis:6.2.6
  ports:
    - '9091:6379'
  command: redis-server --requirepass 'REDIS_TEST_PASSWORD'
  environment:
    - REDIS_REPLICATION_MODE=master
volumes:
  # ...
  <projectname>_test_data:
```

<details>
<summary>Or copy the complete file here.</summary>
<p>

```yaml
services:
  # Development services
  postgres:
    image: postgres:16.3
    ports:
      - '8090:5432'
    environment:
      POSTGRES_USER: postgres
      POSTGRES_DB: <projectname>
      POSTGRES_PASSWORD: "<insert database development password>"
    volumes:
      - <projectname>_data:/var/lib/postgresql/data
  redis:
    image: redis:6.2.6
    ports:
      - '8091:6379'
    command: redis-server --requirepass "<insert redis development password>"
    environment:
      - REDIS_REPLICATION_MODE=master

  # Test services
  postgres_test:
    image: postgres:16.3
    ports:
      - '9090:5432'
    environment:
      POSTGRES_USER: postgres
      POSTGRES_DB: <projectname>_test
      POSTGRES_PASSWORD: "<insert database test password>"
    volumes:
      - <projectname>_test_data:/var/lib/postgresql/data
  redis_test:
    image: redis:6.2.6
    ports:
      - '9091:6379'
    command: redis-server --requirepass "<insert redis test password>"
    environment:
      - REDIS_REPLICATION_MODE=master

volumes:
  <projectname>_data:
  <projectname>_test_data:
```

</p>
</details>
3. Create a `test.yaml` file and add it to the `config` directory:

```yaml
# This is the configuration file for your test environment.
# All ports are set to zero in this file which makes the server find the next available port.
# This is needed to enable running tests concurrently. To set up your server, you will
# need to add the name of the database you are connecting to and the user name.
# The password for the database is stored in the config/passwords.yaml.

# Configuration for the main API test server.
apiServer:
  port: 0
  publicHost: localhost
  publicPort: 0
  publicScheme: http

# Configuration for the Insights test server.
insightsServer:
  port: 0
  publicHost: localhost
  publicPort: 0
  publicScheme: http

# Configuration for the web test server.
webServer:
  port: 0
  publicHost: localhost
  publicPort: 0
  publicScheme: http

# This is the database setup for your test server.
database:
  host: localhost
  port: 9090
  name: <projectname>_test
  user: postgres

# This is the setup for your Redis test instance.
redis:
  enabled: false
  host: localhost
  port: 9091
```

4. Add this entry to `config/passwords.yaml`

```yaml
test:
  database: '<insert database test password>'
  redis: '<insert redis test password>'
```

5. Add a `dart_test.yaml` file to the `server` directory (next to `pubspec.yaml`) with the following contents:

```yaml
tags:
  integration: {}

```

6. Finally, add the `test` and `serverpod_test` packages as dev dependencies in `pubspec.yaml`:

```yaml
dev_dependencies:
  serverpod_test: <serverpod version> # Should be same version as the `serverpod` package
  test: ^1.24.2
```

That's it, the project setup should be ready to start using the test tools!
</p>
</details>

Go to the server directory and generate the test tools:

 ```bash
 serverpod generate
 ```

The default location for the generated file is `test/integration/test_tools/serverpod_test_tools.dart`. The folder name `test/integration` is chosen to differentiate from unit tests (see the [best practises section](best-practises#unit-and-integration-tests) for more information on this).

The generated file exports a `withServerpod` helper that enables you to call your endpoints directly like regular functions:

```dart
import 'package:test/test.dart';

// Import the generated file, it contains everything you need.
import 'test_tools/serverpod_test_tools.dart';

void main() {
  withServerpod('Given Example endpoint', (sessionBuilder, endpoints) {
    test('when calling `hello` then should return greeting', () async {
      final greeting = await endpoints.example.hello(sessionBuilder, 'Michael');
      expect(greeting, 'Hello Michael');
    });
  });
}
```

A few things to note from the above example:

- The test tools should be imported from the generated test tools file and not the `serverpod_test` package.
- The `withServerpod` callback takes two parameters: `sessionBuilder` and `endpoints`.
  - `sessionBuilder` is used to build a `session` object that represents the server state during an endpoint call and is used to set up scenarios.
  - `endpoints` contains all your Serverpod endpoints and lets you call them.

:::tip

The location of the test tools can be changed by changing the  `server_test_tools_path` key in `config/generator.yaml`. If you remove the `server_test_tools_path` key, the test tools will stop being generated.

:::

Before the test can be run the Postgres and Redis also have to be started:

```bash
docker-compose up --build --detach
```
Now the test is ready to be run:

```bash
dart test
```

Happy testing!
