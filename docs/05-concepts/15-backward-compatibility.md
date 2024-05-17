# Backward compatibility

As your app evolves, features will be added or changed. However, your users may still use older versions of the app as not everyone will update to the latest version and automatic updates through the app stores take time. Therefore it may be essential to make updates to your server compatible with older app versions.

Following a simple set of rules, your server will stay compatible with older app versions:

1. __Avoid changing parameter names in endpoint methods.__ In the REST API Serverpod generates, the parameters are passed by name. This means that changing the parameter names of the endpoint methods will break backward compatibility.
2. __Do not delete endpoint methods or change their signature.__ Instead, add new methods if you must pass another set of parameters. Technically, you can add new named parameters if they are not required, but creating a new method may still feel cleaner.
3. __Avoid changing or removing fields and types in the serialized classes.__ However, you are free to add new fields as long as they are nullable.

:::info

If you are changing serialized objects with bindings to a database table, you will need to update the database structure manually. Future versions of Serverpod will assist with database migrations.

:::
