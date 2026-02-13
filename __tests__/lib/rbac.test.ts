/**
 * Unit tests for RBAC hasPermission
 */

import { hasPermission, type UserRole } from '@/lib/rbac';

describe('rbac hasPermission', () => {
  describe('admin', () => {
    it('has permission for any resource and action', () => {
      expect(hasPermission('admin', 'patients', 'read')).toBe(true);
      expect(hasPermission('admin', 'patients', 'delete')).toBe(true);
      expect(hasPermission('admin', 'payments', 'write')).toBe(true);
      expect(hasPermission('admin', 'anything', 'anything')).toBe(true);
    });
  });

  describe('doctor', () => {
    it('can read, write, delete patients', () => {
      expect(hasPermission('doctor', 'patients', 'read')).toBe(true);
      expect(hasPermission('doctor', 'patients', 'write')).toBe(true);
      expect(hasPermission('doctor', 'patients', 'delete')).toBe(true);
    });

    it('can read analytics', () => {
      expect(hasPermission('doctor', 'analytics', 'read')).toBe(true);
    });

    it('can read and write settings', () => {
      expect(hasPermission('doctor', 'settings', 'read')).toBe(true);
      expect(hasPermission('doctor', 'settings', 'write')).toBe(true);
    });

    it('can read and write payments and invoices', () => {
      expect(hasPermission('doctor', 'payments', 'read')).toBe(true);
      expect(hasPermission('doctor', 'payments', 'write')).toBe(true);
      expect(hasPermission('doctor', 'invoices', 'read')).toBe(true);
      expect(hasPermission('doctor', 'invoices', 'write')).toBe(true);
    });
  });

  describe('staff', () => {
    it('can read and write patients but not delete', () => {
      expect(hasPermission('staff', 'patients', 'read')).toBe(true);
      expect(hasPermission('staff', 'patients', 'write')).toBe(true);
      expect(hasPermission('staff', 'patients', 'delete')).toBe(false);
    });

    it('can read and write visits and appointments', () => {
      expect(hasPermission('staff', 'visits', 'read')).toBe(true);
      expect(hasPermission('staff', 'visits', 'write')).toBe(true);
      expect(hasPermission('staff', 'appointments', 'read')).toBe(true);
      expect(hasPermission('staff', 'appointments', 'write')).toBe(true);
    });

    it('cannot read analytics or delete appointments', () => {
      expect(hasPermission('staff', 'analytics', 'read')).toBe(false);
      expect(hasPermission('staff', 'appointments', 'delete')).toBe(false);
    });

    it('cannot access settings', () => {
      expect(hasPermission('staff', 'settings', 'read')).toBe(false);
      expect(hasPermission('staff', 'settings', 'write')).toBe(false);
    });

    it('can read and write payments and invoices', () => {
      expect(hasPermission('staff', 'payments', 'read')).toBe(true);
      expect(hasPermission('staff', 'payments', 'write')).toBe(true);
      expect(hasPermission('staff', 'invoices', 'read')).toBe(true);
      expect(hasPermission('staff', 'invoices', 'write')).toBe(true);
    });
  });

  describe('unknown role', () => {
    it('has no permissions', () => {
      expect(hasPermission('doctor' as UserRole, 'patients', 'read')).toBe(true);
      expect(hasPermission('invalid' as UserRole, 'patients', 'read')).toBe(false);
    });
  });
});
