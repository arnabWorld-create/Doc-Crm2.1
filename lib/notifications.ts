/**
 * In-app notifications system
 * Manages toast notifications, alerts, and user feedback
 */

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // milliseconds, 0 = persistent
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp: Date;
}

class NotificationManager {
  private notifications: Map<string, Notification> = new Map();
  private listeners: Set<(notifications: Notification[]) => void> = new Set();
  private nextId = 0;

  /**
   * Subscribe to notification changes
   */
  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners
   */
  private notify() {
    const notifications = Array.from(this.notifications.values());
    this.listeners.forEach(listener => listener(notifications));
  }

  /**
   * Add a notification
   */
  add(notification: Omit<Notification, 'id' | 'timestamp'>): string {
    const id = `notification-${this.nextId++}`;
    const fullNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
      duration: notification.duration ?? 5000, // Default 5 seconds
    };

    this.notifications.set(id, fullNotification);
    this.notify();

    // Auto-remove after duration
    if ((fullNotification.duration ?? 0) > 0) {
      setTimeout(() => this.remove(id), fullNotification.duration!);
    }

    return id;
  }

  /**
   * Remove a notification
   */
  remove(id: string): void {
    this.notifications.delete(id);
    this.notify();
  }

  /**
   * Clear all notifications
   */
  clear(): void {
    this.notifications.clear();
    this.notify();
  }

  /**
   * Get all notifications
   */
  getAll(): Notification[] {
    return Array.from(this.notifications.values());
  }

  /**
   * Success notification
   */
  success(title: string, message?: string, duration?: number): string {
    return this.add({ type: 'success', title, message, duration });
  }

  /**
   * Error notification
   */
  error(title: string, message?: string, duration?: number): string {
    return this.add({ type: 'error', title, message, duration: duration ?? 7000 });
  }

  /**
   * Warning notification
   */
  warning(title: string, message?: string, duration?: number): string {
    return this.add({ type: 'warning', title, message, duration });
  }

  /**
   * Info notification
   */
  info(title: string, message?: string, duration?: number): string {
    return this.add({ type: 'info', title, message, duration });
  }

  /**
   * Persistent notification (doesn't auto-dismiss)
   */
  persistent(type: NotificationType, title: string, message?: string, action?: Notification['action']): string {
    return this.add({ type, title, message, duration: 0, action });
  }
}

export const notificationManager = new NotificationManager();
