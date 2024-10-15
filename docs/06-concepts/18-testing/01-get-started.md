# Get started

Serverpod provides simple but feature rich test tools to make testing your backend a breeze.

:::warning

The test tools are an experimental feature. Experimental features should not be used in production environments, as their stability is uncertain and they may receive breaking changes in upcoming releases.

:::

:::info

For Serverpod Mini projects, everything related to the database in this guide can be ignored.

:::

<details>
<summary> Have an existing project? Follow these steps first!</summary>
<p>
For existing non-Mini projects, a few extra things need to be done:
1. Add the `server_test_tools_path` key to `config/generator.yaml`. Without this key, the test tools file is not generated. The default location for the generated file is `integration_test/test_tools/serverpod_test_tools.dart`, but this can be set to any path (though should be outside of `lib` as per Dart's test conventions).

2. New projects now come with a test profile in `docker-compose.yaml`. This is not strictly mandatory, but is recommended to ensure that the testing state is never polluted. Add the snippet below to the `docker-compose.yaml` file in the server directory:

```yaml
# Test services
postgres_test:
  image: postgres:16.3
  ports:
    - '9090:5432'
  environment:
    POSTGRES_USER: postgres_test
    POSTGRES_DB: projectname_test
    POSTGRES_PASSWORD: "<insert database test password>"
  volumes:
    - projectname_data:/var/lib/postgresql/data
  profiles:
    - '' # Default profile
    - test
redis_test:
  image: redis:6.2.6
  ports:
    - '9091:6379'
  command: redis-server --requirepass "<insert redis test password>"
  environment:
    - REDIS_REPLICATION_MODE=master
  profiles:
    - '' # Default profile
    - test
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
      POSTGRES_DB: projectname
      POSTGRES_PASSWORD: "<insert database development password>"
    volumes:
      - projectname_data:/var/lib/postgresql/data
    profiles:
      - '' # Default profile
      - dev
  redis:
    image: redis:6.2.6
    ports:
      - '8091:6379'
    command: redis-server --requirepass "<insert redis development password>"
    environment:
      - REDIS_REPLICATION_MODE=master
    profiles:
      - '' # Default profile
      - dev

  # Test services
  postgres_test:
    image: postgres:16.3
    ports:
      - '9090:5432'
    environment:
      POSTGRES_USER: postgres_test
      POSTGRES_DB: projectname_test
      POSTGRES_PASSWORD: "<insert database test password>"
    volumes:
      - projectname_data:/var/lib/postgresql/data
    profiles:
      - '' # Default profile
      - test
  redis_test:
    image: redis:6.2.6
    ports:
      - '9091:6379'
    command: redis-server --requirepass "<insert redis test password>"
    environment:
      - REDIS_REPLICATION_MODE=master
    profiles:
      - '' # Default profile
      - test

volumes:
  projectname_data:
```

</p>
</details>
3. Create a `test.yaml` file and add it to the `config` directory:

```yaml
# This is the configuration file for your local test environment. By
# default, it runs a single server on port 8090. To set up your server, you will
# need to add the name of the database you are connecting to and the user name.
# The password for the database is stored in the config/passwords.yaml.
#
# When running your server locally, the server ports are the same as the public
# facing ports.

# Configuration for the main API test server.
apiServer:
  port: 9080
  publicHost: localhost
  publicPort: 9080
  publicScheme: http

# Configuration for the Insights test server.
insightsServer:
  port: 9081
  publicHost: localhost
  publicPort: 9081
  publicScheme: http

# Configuration for the web test server.
webServer:
  port: 9082
  publicHost: localhost
  publicPort: 9082
  publicScheme: http

# This is the database setup for your test server.
database:
  host: localhost
  port: 9090
  name: projectname_test
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

That's it, the project setup should be ready to start using the test tools!
</p>
</details>

Go to the server directory and generate the test tools by running `serverpod generate --experimental-features testTools`. The default location for the generated file is `integration_test/test_tools/serverpod_test_tools.dart`. The folder name `integration_test` is chosen to differentiate from unit tests (see the [best practises section](best-practises#unit-and-integration-tests) for more information on this).

The generated file exports a `withServerpod` helper that enables you to call your endpoints directly like regular functions:

```dart
// Import the generated file, it contains everything you need.
import 'test_tools/serverpod_test_tools.dart';

void main() {
  withServerpod('Given Example endpoint', (sessionBuilder, endpoints) {
    test('when calling `hello` then should return greeting', () async {
      final greeting =
          await endpoints.example.hello(sessionBuilder, 'Michael');
      expect(greeting, 'Hello, Michael!');
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

By default this starts up both the `development` and `test` profiles. To only start one profile, simply add `--profile test` to the command.

Now the test is ready to be run:

```bash
dart test integration_test
```

Happy testing!
