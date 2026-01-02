import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@shared/types/socket";
import { AuthenticatedSocket } from "./socketHandlers";

import { Server } from "socket.io";

/**
 * Base class for all socket handlers
 * Provides common functionality and structure for socket event handlers
 */
export abstract class BaseSocketHandler {
  protected io: Server<ClientToServerEvents, ServerToClientEvents>;

  constructor(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    this.io = io;
  }

  /**
   * Setup socket event handlers for a connected socket
   * Must be implemented by subclasses to register their specific event handlers
   * @param socket - The authenticated socket connection
   */
  public abstract setupHandlers(socket: AuthenticatedSocket): void;
}
