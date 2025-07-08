import { ClerkExpressWithAuth } from "@clerk/clerk-sdk-node";
import { Request, Response, NextFunction } from "express";

export const clerkMiddleware = ClerkExpressWithAuth({
    
});

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth || !req.auth.userId) {
        return res.status(401).json({ error: "Unauthenticated" });
    }
    next();
} 