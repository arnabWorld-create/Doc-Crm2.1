import { Redis } from '@upstash/redis';
import { logger } from './logger';

// FIX: In production, Redis is required for effective rate limiting.
// In-memory rate limiting resets on every serverless cold start, making it
// useless against sustained attacks. Warn loudly at startup if Redis is missing.
let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (error) {
    logger.error('Redis initialization failed — falling back to in-memory rate limiting', error);
  }
} else if (process.env.NODE_ENV === 'production') {
  // In production this is a real operational concern, not just a warning
  logger.error(
    'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not set. ' +
    'Rate limiting will use in-memory storage which resets on every cold start. ' +
    'This makes rate limiting ineffective against sustained attacks in production. ' +
    'Set up Upstash Redis: https://upstash.com'
  );
} else {
  logger.warn('Redis not configured — using in-memory rate limiting (development only)');
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export class RedisRateLimiter {
  /**
   * Check if request is allowed using sliding window algorithm
   */
  async isAllowed(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - windowMs;
    const redisKey = `ratelimit:${key}`;
    
    // Fallback to in-memory if Redis not available
    if (!redis) {
      return this.inMemoryFallback(key, limit, windowMs);
    }
    
    try {
      // Use Redis pipeline for atomic operations
      const pipeline = redis.pipeline();
      
      // Remove old entries outside the window
      pipeline.zremrangebyscore(redisKey, 0, windowStart);
      
      // Count requests in current window
      pipeline.zcard(redisKey);
      
      // Add current request
      pipeline.zadd(redisKey, { score: now, member: `${now}-${Math.random()}` });
      
      // Set expiry
      pipeline.expire(redisKey, Math.ceil(windowMs / 1000));
      
      const results = await pipeline.exec();
      const count = results[1] as number;
      
      const allowed = count < limit;
      const remaining = Math.max(0, limit - count - 1);
      const reset = now + windowMs;
      
      return {
        success: allowed,
        limit,
        remaining,
        reset,
      };
    } catch (error) {
      console.error('Redis rate limit error, falling back:', error);
      // Fail open - allow request if Redis is down
      return {
        success: true,
        limit,
        remaining: limit,
        reset: now + windowMs,
      };
    }
  }
  
  /**
   * In-memory fallback (for development or if Redis fails)
   */
  private inMemoryStore = new Map<string, { count: number; resetTime: number }>();
  
  private inMemoryFallback(
    key: string,
    limit: number,
    windowMs: number
  ): RateLimitResult {
    const now = Date.now();
    const entry = this.inMemoryStore.get(key);
    
    if (!entry || now > entry.resetTime) {
      this.inMemoryStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return {
        success: true,
        limit,
        remaining: limit - 1,
        reset: now + windowMs,
      };
    }
    
    if (entry.count < limit) {
      entry.count++;
      return {
        success: true,
        limit,
        remaining: limit - entry.count,
        reset: entry.resetTime,
      };
    }
    
    return {
      success: false,
      limit,
      remaining: 0,
      reset: entry.resetTime,
    };
  }
  
  /**
   * Reset rate limit for a key
   */
  async reset(key: string): Promise<void> {
    if (!redis) {
      this.inMemoryStore.delete(key);
      return;
    }
    
    try {
      await redis.del(`ratelimit:${key}`);
    } catch (error) {
      console.error('Redis reset error:', error);
    }
  }
  
  /**
   * Get current count for a key
   */
  async getCount(key: string): Promise<number> {
    if (!redis) {
      return this.inMemoryStore.get(key)?.count || 0;
    }
    
    try {
      return await redis.zcard(`ratelimit:${key}`);
    } catch (error) {
      console.error('Redis count error:', error);
      return 0;
    }
  }
}

export const redisRateLimiter = new RedisRateLimiter();

// Keep existing rate limit configs
export const RATE_LIMITS = {
  AUTH: { limit: 5, windowMs: 15 * 60 * 1000 },
  API: { limit: 100, windowMs: 60 * 1000 },
  STRICT: { limit: 10, windowMs: 60 * 1000 },
  UPLOAD: { limit: 20, windowMs: 60 * 60 * 1000 },
};
