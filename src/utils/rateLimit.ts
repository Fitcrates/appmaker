interface RateLimitEntry {
  count: number;
  firstRequest: number;
}

interface RateLimitConfig {
  maxRequests: number;
  timeWindow: number; // in milliseconds
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'feedback': { maxRequests: 30, timeWindow: 60000 }, // 30 requests per minute for feedback operations
  'auth': { maxRequests: 5, timeWindow: 300000 }, // 5 requests per 5 minutes for auth operations
  'default': { maxRequests: 100, timeWindow: 60000 }, // 100 requests per minute for other operations
};

class RateLimiter {
  private limits: Map<string, Map<string, RateLimitEntry>> = new Map();

  isRateLimited(userId: string, operationType: keyof typeof RATE_LIMITS = 'default'): boolean {
    const now = Date.now();
    const config = RATE_LIMITS[operationType] || RATE_LIMITS.default;
    
    if (!this.limits.has(operationType)) {
      this.limits.set(operationType, new Map());
    }
    
    const operationLimits = this.limits.get(operationType)!;
    const userLimit = operationLimits.get(userId);

    if (!userLimit) {
      operationLimits.set(userId, { count: 1, firstRequest: now });
      return false;
    }

    if (now - userLimit.firstRequest > config.timeWindow) {
      operationLimits.set(userId, { count: 1, firstRequest: now });
      return false;
    }

    if (userLimit.count >= config.maxRequests) {
      return true;
    }

    userLimit.count++;
    return false;
  }

  clearExpiredEntries() {
    const now = Date.now();
    for (const [operationType, operationLimits] of this.limits.entries()) {
      const config = RATE_LIMITS[operationType] || RATE_LIMITS.default;
      for (const [userId, entry] of operationLimits.entries()) {
        if (now - entry.firstRequest > config.timeWindow) {
          operationLimits.delete(userId);
        }
      }
      if (operationLimits.size === 0) {
        this.limits.delete(operationType);
      }
    }
  }
}

export const globalRateLimiter = new RateLimiter();

// Clean up expired entries every minute
setInterval(() => {
  globalRateLimiter.clearExpiredEntries();
}, 60000);
