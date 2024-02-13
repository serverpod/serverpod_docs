# Upgrade to 2.0

## Changes to the Session Object

With Serverpod 2.0, we have removed the deprecated legacy database layer from the `Session` object. The `Session` object now incorporates the new database layer, accessed via the `dbNext` field in Serverpod 1.2, under the `db` field.

