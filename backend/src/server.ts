import http from "node:http";
import { Server } from "socket.io";
import { app } from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { registerSockets } from "./sockets/index.js";

async function bootstrap() {
  await connectDB();
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: env.CLIENT_URL, credentials: true } });
  app.set("io", io);
  registerSockets(io);
  server.listen(env.PORT, () => console.log(`UNI-MATE API listening on :${env.PORT}`));
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
