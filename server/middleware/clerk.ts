import { Clerk, ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import { Request, Response, NextFunction } from "express";

const clerk = Clerk({
    secretKey: process.env.CLERK_SECRET_KEY,
});

export const clerkMiddleware = clerk.expressRequireAuth();

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth || !req.auth.userId) {
        return res.status(401).json({ error: "Unauthenticated" });
    }
    next();
}; 