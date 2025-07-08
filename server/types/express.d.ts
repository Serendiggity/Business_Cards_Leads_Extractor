import { AuthObject } from "@clerk/clerk-sdk-node";

declare global {
  namespace Express {
    interface Request {
      auth: AuthObject;
    }
  }
}

// This empty export is needed to turn this file into a module
export {}; 