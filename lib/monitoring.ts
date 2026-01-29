/**
 * Error tracking and performance monitoring
 * Supports Sentry integration with graceful fallback
 */

import { logger } from './logger';

interface ErrorContext {
  userId?: string;
  email?: string;
  endpoint?: string;
  method?: string;
  [key: string]: any;
}

interface PerformanceMetric {
  name: string;
  duration: number;
  metadata?: Record<string, any>;
}

class MonitoringService {
  private sentryEnabled = false;
  private performanceEnabled = false;

  constructor() {
    // Initialize Sentry if DSN is provided
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      this.initializeSentry();
    }

    // Enable performance monitoring in production
    this.performanceEnabled = process.env.NODE_ENV === 'production';
  }

  private initializeSentry() {
    try {
      // Dynamic import to avoid bundling Sentry in development if not needed
      if (typeof window === 'undefined') {
        // Server-side
        import('@sentry/nextjs').then((Sentry) => {
          Sentry.init({
            dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
            environment: process.env.NODE_ENV || 'development',
            tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
            beforeSend(event, hint) {
              // Filter out sensitive data
              if (event.request) {
                delete event.request.cookies;
                delete event.request.headers?.['authorization'];
              }
              return event;
            },
          });
          this.sentryEnabled = true;
          logger.info('Sentry initialized for server-side');
        });
      } else {
        // Client-side
        import('@sentry/nextjs').then((Sentry) => {
          Sentry.init({
            dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
            environment: process.env.NODE_ENV || 'development',
            tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
            integrations: [
              new Sentry.BrowserTracing(),
              new Sentry.Replay({
                maskAllText: true,
                blockAllMedia: true,
              }),
            ],
          });
          this.sentryEnabled = true;
          logger.info('Sentry initialized for client-side');
        });
      }
    } catch (error) {
      logger.warn('Failed to initialize Sentry', { error: String(error) });
    }
  }

  /**
   * Capture and report an error
   */
  captureError(error: Error | unknown, context?: ErrorContext): void {
    // Log to console/logger
    logger.error('Error captured', error, context);

    // Send to Sentry if enabled
    if (this.sentryEnabled && typeof window === 'undefined') {
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.captureException(error, {
          tags: context,
          extra: context,
        });
      });
    } else if (this.sentryEnabled) {
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.captureException(error, {
          tags: context,
          extra: context,
        });
      });
    }
  }

  /**
   * Capture a message (info, warning, etc.)
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext): void {
    if (level === 'error') {
      logger.error(message, context);
    } else if (level === 'warning') {
      logger.warn(message, context);
    } else {
      logger.info(message, context);
    }

    if (this.sentryEnabled) {
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.captureMessage(message, {
          level: level === 'error' ? 'error' : level === 'warning' ? 'warning' : 'info',
          tags: context,
          extra: context,
        });
      });
    }
  }

  /**
   * Track performance metric
   */
  trackPerformance(metric: PerformanceMetric): void {
    if (!this.performanceEnabled) return;

    logger.info('Performance metric', {
      name: metric.name,
      duration: metric.duration,
      unit: 'ms',
      ...metric.metadata,
    });

    // Send to Sentry if enabled
    if (this.sentryEnabled) {
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.metrics.distribution(metric.name, metric.duration, {
          unit: 'millisecond',
          tags: metric.metadata,
        });
      });
    }
  }

  /**
   * Set user context for error tracking
   */
  setUser(user: { id: string; email: string; name?: string }): void {
    if (this.sentryEnabled) {
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.setUser({
          id: user.id,
          email: user.email,
          username: user.name,
        });
      });
    }
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    if (this.sentryEnabled) {
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.setUser(null);
      });
    }
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(message: string, category: string, level: 'info' | 'warning' | 'error' = 'info', data?: any): void {
    if (this.sentryEnabled) {
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.addBreadcrumb({
          message,
          category,
          level: level === 'error' ? 'error' : level === 'warning' ? 'warning' : 'info',
          data,
        });
      });
    }
  }
}

export const monitoring = new MonitoringService();

/**
 * Performance monitoring decorator/wrapper
 */
export function withPerformanceTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  name: string
): T {
  return (async (...args: any[]) => {
    const startTime = Date.now();
    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;
      monitoring.trackPerformance({
        name,
        duration,
        metadata: { success: true },
      });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      monitoring.trackPerformance({
        name,
        duration,
        metadata: { success: false },
      });
      throw error;
    }
  }) as T;
}




