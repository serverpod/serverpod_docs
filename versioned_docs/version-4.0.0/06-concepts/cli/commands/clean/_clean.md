# serverpod clean

The `serverpod clean` command deletes the cached server build of a server project, so the next `serverpod start` compiles the server from scratch. Run it when `serverpod start` keeps reporting compilation errors you already fixed. The command needs Serverpod 4.0.4 or later.

Stop `serverpod start` before you run the command, then start it again to rebuild.
