---
description: Add PostGIS to a Serverpod project to enable geography fields, with steps for Docker, managed PostgreSQL services, and pgvector.
---

# Upgrading to PostGIS support

New Serverpod projects do not include PostGIS by default. To use geography fields in your models, you need a PostgreSQL instance with the PostGIS extension installed.

:::info
This upgrade is only necessary if you want to use geography fields in your models. If you do not plan to use geography fields, you can skip this upgrade.
:::

:::warning
If trying to use geography fields without upgrading, you will encounter an error when applying migrations.
:::

## For Docker-based environments

1. Update your `docker-compose.yml` to use a PostgreSQL image with PostGIS (e.g., `postgis/postgis:16-3.5`):

```yaml
services:
  postgres:
    image: postgis/postgis:16-3.5  # <-- Change from postgres image here
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
    image: postgis/postgis:16-3.5  # <-- Change from postgres image here
    ports:
      - '9090:5432'
    environment:
      POSTGRES_USER: postgres
      POSTGRES_DB: <projectname>_test
      POSTGRES_PASSWORD: <DB_TEST_PASSWORD>
    volumes:
      - <projectname>_test_data:/var/lib/postgresql/data
```

If your project also uses [vector fields](../concepts/data-and-the-database/database/vector-and-geography-fields), you need both pgvector and PostGIS. Create a custom `Dockerfile` instead:

```dockerfile
FROM pgvector/pgvector:pg16
RUN apt-get update \
    && apt-get install -y --no-install-recommends postgresql-16-postgis-3 \
    && rm -rf /var/lib/apt/lists/*
```

Then reference it in your `docker-compose.yml`:

```yaml
services:
  postgres:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - '8090:5432'
    environment:
      POSTGRES_USER: postgres
      POSTGRES_DB: <projectname>
      POSTGRES_PASSWORD: <DB_PASSWORD>
    volumes:
      - <projectname>_data:/var/lib/postgresql/data
```

<!-- markdownlint-disable-next-line MD029-->
2. Recreate your containers to use the new image:

```bash
docker compose down
docker compose up -d
```

<!-- markdownlint-disable-next-line MD029-->
3. Create your first geography field in a model:

```yaml
class: Store
table: store
fields:
  name: String
  location: GeographyPoint
```

<!-- markdownlint-disable-next-line MD029-->
4. Generate and apply a migration:

```bash
$ serverpod create-migration
$ dart run bin/main.dart --apply-migrations
```

For more details on creating and applying migrations, see the [Migrations](../concepts/data-and-the-database/database/migrations) section.

The PostGIS extension will be automatically enabled during the first migration that includes a geography column.

## For managed PostgreSQL services

For cloud providers (AWS RDS, Google Cloud SQL, Azure Database, etc.), ensure that the PostGIS extension is available on your PostgreSQL instance. Most major managed services support PostGIS with no additional setup required. If available, the extension will be enabled automatically when applying the migration.

:::tip
If the cloud provider instructs you to run a `CREATE EXTENSION postgis;` command, you can skip this step as Serverpod will handle it automatically during migration.
:::

## Troubleshooting

If you encounter issues with PostGIS:

- Verify that your PostgreSQL version is 12 or later.
- Check that the PostGIS extension is properly installed on the instance.
- Ensure your database user has the necessary permissions to create extensions.
