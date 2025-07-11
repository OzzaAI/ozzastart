import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";
import validator from "validator";
import DOMPurify from "isomorphic-dompurify";

// Redis client for rate limiting
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limiters for different endpoints
export const rateLimiters = {
  // Strict limits for auth endpoints
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 requests per 15 minutes
    analytics: true,
    prefix: "ratelimit:auth",
  }),
  
  // API endpoints
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "1 m"), // 60 requests per minute
    analytics: true,
    prefix: "ratelimit:api",
  }),
  
  // Upload endpoints
  upload: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 uploads per minute
    analytics: true,
    prefix: "ratelimit:upload",
  }),
  
  // Chat/AI endpoints
  chat: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "1 m"), // 30 messages per minute
    analytics: true,
    prefix: "ratelimit:chat",
  }),
  
  // Admin endpoints - very strict
  admin: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "5 m"), // 10 requests per 5 minutes
    analytics: true,
    prefix: "ratelimit:admin",
  }),
};

// Rate limiting middleware
export async function rateLimit(
  request: NextRequest,
  limiterType: keyof typeof rateLimiters = "api"
) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "anonymous";
  const limiter = rateLimiters[limiterType];
  
  const { success, limit, reset, remaining } = await limiter.limit(ip);
  
  if (!success) {
    return NextResponse.json(
      {
        success: false,
        error: "Rate limit exceeded",
        message: "Too many requests. Please try again later.",
        reset: new Date(reset).toISOString(),
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": new Date(reset).toISOString(),
          "Retry-After": Math.round((reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }
  
  return null; // No rate limit hit
}

// Input sanitization and validation
export class InputValidator {
  static sanitizeHtml(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br"],
      ALLOWED_ATTR: [],
    });
  }
  
  static validateEmail(email: string): boolean {
    return validator.isEmail(email) && email.length <= 254;
  }
  
  static validateUrl(url: string): boolean {
    return validator.isURL(url, {
      protocols: ["http", "https"],
      require_protocol: true,
      require_valid_protocol: true,
    });
  }
  
  static sanitizeString(input: string, maxLength = 255): string {
    if (typeof input !== "string") return "";
    return validator.escape(input).substring(0, maxLength);
  }
  
  static validateUuid(id: string): boolean {
    return validator.isUUID(id, 4);
  }
  
  static validateAlphanumeric(input: string): boolean {
    return validator.isAlphanumeric(input, "en-US");
  }
  
  static validateLength(input: string, min = 1, max = 255): boolean {
    return validator.isLength(input, { min, max });
  }
  
  static sanitizeFileName(filename: string): string {
    // Remove dangerous characters and limit length
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .substring(0, 100);
  }
}

// SQL injection prevention helpers
export class DatabaseSecurity {
  static validateSqlIdentifier(identifier: string): boolean {
    // Only allow alphanumeric characters and underscores
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier);
  }
  
  static sanitizeSortColumn(column: string, allowedColumns: string[]): string {
    if (!allowedColumns.includes(column)) {
      return allowedColumns[0]; // Default to first allowed column
    }
    return column;
  }
  
  static validateSortDirection(direction: string): "asc" | "desc" {
    return direction.toLowerCase() === "desc" ? "desc" : "asc";
  }
}

// Security headers configuration
export const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
};

// API key management
export class ApiKeyManager {
  private static readonly REDIS_PREFIX = "api_key:";
  private static readonly REVOKED_PREFIX = "revoked_key:";
  
  static async generateApiKey(userId: string): Promise<string> {
    const key = `ozza_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const keyData = {
      userId,
      createdAt: new Date().toISOString(),
      lastUsed: null,
      isActive: true,
    };
    
    await redis.setex(`${this.REDIS_PREFIX}${key}`, 86400 * 365, JSON.stringify(keyData)); // 1 year expiry
    return key;
  }
  
  static async validateApiKey(key: string): Promise<{ valid: boolean; userId?: string }> {
    try {
      // Check if key is revoked
      const isRevoked = await redis.get(`${this.REVOKED_PREFIX}${key}`);
      if (isRevoked) {
        return { valid: false };
      }
      
      const data = await redis.get(`${this.REDIS_PREFIX}${key}`);
      if (!data) {
        return { valid: false };
      }
      
      const keyData = JSON.parse(data as string);
      if (!keyData.isActive) {
        return { valid: false };
      }
      
      // Update last used timestamp
      keyData.lastUsed = new Date().toISOString();
      await redis.setex(`${this.REDIS_PREFIX}${key}`, 86400 * 365, JSON.stringify(keyData));
      
      return { valid: true, userId: keyData.userId };
    } catch (error) {
      console.error("API key validation error:", error);
      return { valid: false };
    }
  }
  
  static async revokeApiKey(key: string): Promise<boolean> {
    try {
      // Add to revoked list
      await redis.setex(`${this.REVOKED_PREFIX}${key}`, 86400 * 365, "revoked");
      
      // Remove from active keys
      await redis.del(`${this.REDIS_PREFIX}${key}`);
      
      return true;
    } catch (error) {
      console.error("API key revocation error:", error);
      return false;
    }
  }
  
  static async rotateApiKey(oldKey: string, userId: string): Promise<string | null> {
    try {
      // Validate old key belongs to user
      const validation = await this.validateApiKey(oldKey);
      if (!validation.valid || validation.userId !== userId) {
        return null;
      }
      
      // Generate new key
      const newKey = await this.generateApiKey(userId);
      
      // Revoke old key
      await this.revokeApiKey(oldKey);
      
      return newKey;
    } catch (error) {
      console.error("API key rotation error:", error);
      return null;
    }
  }
}

// CSRF token management
export class CSRFProtection {
  private static readonly TOKEN_LENGTH = 32;
  private static readonly REDIS_PREFIX = "csrf:";
  
  static generateToken(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(this.TOKEN_LENGTH)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  static async storeToken(sessionId: string, token: string): Promise<void> {
    await redis.setex(`${this.REDIS_PREFIX}${sessionId}`, 3600, token); // 1 hour expiry
  }
  
  static async validateToken(sessionId: string, token: string): Promise<boolean> {
    try {
      const storedToken = await redis.get(`${this.REDIS_PREFIX}${sessionId}`);
      return storedToken === token;
    } catch (error) {
      console.error("CSRF token validation error:", error);
      return false;
    }
  }
}