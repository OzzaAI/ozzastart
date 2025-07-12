// Import Better Auth handler
import { auth } from "../../../../lib/auth";

// Export the handler for all methods
export const { GET, POST, PUT, DELETE, PATCH } = auth.handler;
