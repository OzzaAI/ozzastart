// Import Better Auth handler
import { auth } from "../../../../lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Export handlers for GET and POST via Better Auth helper
export const { GET, POST } = toNextJsHandler(auth.handler);
