# Upgrading to pgvector support

New Serverpod projects automatically include pgvector support through the `pgvector/pgvector` PostgreSQL Docker image. However, existing projects need to be upgraded to use vector functionality.

:::info
This upgrade is only necessary if you want to use vector fields in your models. If you do not plan to use vector fields, you can skip this upgrade.
:::

:::warning
If trying to use vector fields without upgrading, you will encounter an error when applying migrations.
:::

## For Docker-based environments

1. Update your `docker-compose.yml` to use a PostgreSQL image with pgvector (e.g., `pgvector/pgvector:pg16`):

```yaml
services:
  postgres:
    image: pgvector/pgvector:pg16  # <-- Change from postgres image here
    ports:
      - '8090:5432'
    environment:
      POSTGRES_USER: postgres
      POSTGRES_DB: <projectname>
      POSTGRES_PASSWORD: <DB_PASSWORD>
    volumes:
      - <projectname>_data:/var/lib/postgresql/data

# Other services...

  postgres_test:
    image: pgvector/pgvector:pg16  # <-- Change from postgres image here
    ports:
      - '9090:5432'
    environment:
      POSTGRES_USER: postgres
      POSTGRES_DB: <projectname>_test
      POSTGRES_PASSWORD: <DB_TEST_PASSWORD>
    volumes:
      - <projectname>_test_data:/var/lib/postgresql/data
```

<!-- markdownlint-disable-next-line MD029-->
2. Recreate your containers to use the new image:

```bash
docker compose down
docker compose up -d
```

<!-- markdownlint-disable-next-line MD029-->
3. Create your first vector field in a model:

```yaml
class: Document
table: document
fields:
  content: String
  embedding: Vector(1536)
```

<!-- markdownlint-disable-next-line MD029-->
4. Generate and apply a migration:

```bash
$ serverpod create-migration
$ dart run bin/main.dart --apply-migrations
```

For more details on creating and applying migrations, see the [Migrations](../concepts/database/migrations) section.

The pgvector extension will be automatically enabled during the first migration that includes a vector column.

## For managed PostgreSQL services

For cloud providers (AWS RDS, Google Cloud SQL, Azure Database, etc.), ensure that **pgvector extension is available** on your PostgreSQL instance. Most managed services already support pgvector with no additional setup required. If available, the extension will be enabled automatically when applying the migration.

:::tip
If the cloud provider instructions is to run a `CREATE EXTENSION vector;` command, you can skip this step as Serverpod will handle it automatically during migration.
:::

## Troubleshooting

If you encounter issues with pgvector:

- Verify that your PostgreSQL version supports pgvector 0.7.0+ (PostgreSQL 12+).
- Check that the pgvector extension is properly installed.
- Ensure your database user has the necessary permissions to create extensions.
