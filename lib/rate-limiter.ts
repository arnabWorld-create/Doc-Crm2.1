/**
 * In-memory rate limiter
 * 
 * BETA SECURITY DECISION: In-memory rate limiting (resets on deployment)
 * REASON: Avoid Redis infrastructure complexity during MVP
 * RISK: Rate limits reset on every Vercel deployment (ineffective against persistent attacks)
 * IMPACT: Acceptable for beta with manual monitoring, NOT acceptable for production
 * MIGRATION PATH: Replace with Redis-based rate limiter post-funding
 * ESTIMATED EFFORT: 1-2 days (add Redis, update all rate limit calls)
 * TODO POST-FUNDING: Implement Redis-based rate limiter with Upstash
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Check if request is allowed
   * @param key - Unique identifier (e.g., IP address, user ID)
   * @param limit - Max requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns true if request is allowed, false if rate limited
   */
  isAllowed(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      // New window or expired entry
      this.store.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    if (entry.count < limit) {
      entry.count++;
      return true;
    }

    return false;
  }

  /**
   * Get remaining requests for a key
   */
  getRemaining(key: string, limit: number): number {
    const entry = this.store.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      return limit;
    }
    return Math.max(0, limit - entry.count);
  }

  /**
   * Get reset time for a key
   */
  getResetTime(key: string): number | null {
    const entry = this.store.get(key);
    return entry?.resetTime ?? null;
  }

  /**
   * Reset a specific key
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Destroy the rate limiter
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

export const rateLimiter = new RateLimiter();

// Predefined rate limit configurations
export const RATE_LIMITS = {
  // Auth endpoints: 5 requests per 15 minutes
  AUTH: { limit: 5, windowMs: 15 * 60 * 1000 },
  // API endpoints: 100 requests per minute
  API: { limit: 100, windowMs: 60 * 1000 },
  // Strict endpoints: 10 requests per minute
  STRICT: { limit: 10, windowMs: 60 * 1000 },
  // File upload: 20 requests per hour
  UPLOAD: { limit: 20, windowMs: 60 * 60 * 1000 },
};
