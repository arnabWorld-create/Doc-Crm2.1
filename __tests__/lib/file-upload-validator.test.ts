/**
 * Unit tests for file upload validation utilities
 */

import {
  validateFileSize,
  validateFileType,
  validateFileExtension,
  validateFile,
  sanitizeFilename,
  generateSafeFilename,
  formatFileSize,
  FILE_UPLOAD_CONFIGS,
} from '@/lib/file-upload-validator';

// Minimal File-like mock for Node test environment
function createMockFile(overrides: { size?: number; type?: string; name?: string } = {}) {
  return {
    size: 1024,
    type: 'application/pdf',
    name: 'test.pdf',
    ...overrides,
  } as File;
}

describe('file-upload-validator', () => {
  describe('validateFileSize', () => {
    it('returns valid when file is under limit', () => {
      const file = createMockFile({ size: 1024 });
      const result = validateFileSize(file, 10 * 1024 * 1024);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('returns invalid when file exceeds limit', () => {
      const file = createMockFile({ size: 11 * 1024 * 1024 });
      const result = validateFileSize(file, 10 * 1024 * 1024);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('10.0MB');
    });
  });

  describe('validateFileType', () => {
    it('returns valid when type is allowed', () => {
      const file = createMockFile({ type: 'application/pdf' });
      const result = validateFileType(file, ['application/pdf', 'image/png']);
      expect(result.valid).toBe(true);
    });

    it('returns invalid when type is not allowed', () => {
      const file = createMockFile({ type: 'application/x-msdownload', name: 'x.exe' });
      const result = validateFileType(file, ['application/pdf']);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed');
    });
  });

  describe('validateFileExtension', () => {
    it('returns valid for allowed extension', () => {
      expect(validateFileExtension('report.pdf', ['.pdf', '.png']).valid).toBe(true);
      expect(validateFileExtension('img.PNG', ['.pdf', '.png']).valid).toBe(true);
    });

    it('returns invalid for disallowed extension', () => {
      const result = validateFileExtension('file.exe', ['.pdf', '.png']);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('.exe');
    });
  });

  describe('validateFile', () => {
    it('returns valid when size and type pass', () => {
      const file = createMockFile({ size: 1000, name: 'doc.pdf' });
      const result = validateFile(file, FILE_UPLOAD_CONFIGS.PATIENT_REPORTS);
      expect(result.valid).toBe(true);
    });

    it('returns invalid when size exceeds', () => {
      const file = createMockFile({ size: 11 * 1024 * 1024, name: 'doc.pdf' });
      const result = validateFile(file, FILE_UPLOAD_CONFIGS.PATIENT_REPORTS);
      expect(result.valid).toBe(false);
    });
  });

  describe('sanitizeFilename', () => {
    it('strips path components', () => {
      expect(sanitizeFilename('../../../etc/passwd')).not.toContain('..');
      expect(sanitizeFilename('folder/file.pdf')).toBe('file.pdf');
    });

    it('replaces invalid characters', () => {
      expect(sanitizeFilename('file<>:name.pdf')).toBe('file___name.pdf');
    });

    it('prevents leading dot', () => {
      expect(sanitizeFilename('.hidden')).toMatch(/^file_/);
    });

    it('limits length', () => {
      const long = 'a'.repeat(300);
      expect(sanitizeFilename(long).length).toBeLessThanOrEqual(255);
    });
  });

  describe('generateSafeFilename', () => {
    it('includes timestamp and random suffix', () => {
      const name = generateSafeFilename('report.pdf', 'prefix');
      expect(name).toMatch(/^prefix-\d+-[a-z0-9]+\.pdf$/);
    });
  });

  describe('formatFileSize', () => {
    it('formats bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    });
  });
});
