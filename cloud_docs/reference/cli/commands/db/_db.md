# scloud db

`scloud db` manages your project's database directly: print connection details, create and reset superusers for `psql` or GUI clients, and wipe the database during development. These operations are independent of how your server connects (the server's credentials are injected by Cloud separately).

See [Database](/cloud/concepts/database) for the model, common operations, and security notes around direct access.
