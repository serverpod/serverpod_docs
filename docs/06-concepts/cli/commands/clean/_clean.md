# serverpod clean

The `serverpod clean` command deletes the cached server build of a server project, so the next `serverpod start` compiles the server from scratch and the next `serverpod generate` regenerates all code. Run it when `serverpod start` keeps reporting compilation errors you already fixed, or when `serverpod generate` leaves bad output.

Stop `serverpod start` before you run the command, then start it again to rebuild.
