import { Logger } from "./Logger";
import { Server } from "./Server";

Logger.configure();

const server = new Server();

server.start();
