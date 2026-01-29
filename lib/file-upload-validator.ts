/**
 * File upload validation utilities
 */

import { ApiErrors } from './api-error';

export interface FileUploadConfig {
  maxSizeBytes: number;
  allowedMimeTypes: string[];
  allowedExtensions?: string[];
}

export const FILE_UPLOAD_CONFIGS = {
  // Patient reports configuration
  PATIENT_REPORTS: {
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
    ],
    allowedExtensions: ['.pdf', '.png', '.jpg', '.jpeg'],
  },
  // Clinic logo configuration
  CLINIC_LOGO: {
    maxSizeBytes: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'],
    allowedExtensions: ['.png', '.jpg', '.jpeg', '.svg'],
  },
  // General image uploads
  IMAGES: {
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
    allowedExtensions: ['.png', '.jpg', '.jpeg', '.webp'],
  },
};

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate file size
 */
export function validateFileSize(
  file: File,
  maxSizeBytes: number
): ValidationResult {
  if (file.size > maxSizeBytes) {
    const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }
  return { valid: true };
}

/**
 * Validate file MIME type
 */
export function validateFileType(
  file: File,
  allowedMimeTypes: string[]
): ValidationResult {
  if (!allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`,
    };
  }
  return { valid: true };
}

/**
 * Validate file extension
 */
export function validateFileExtension(
  fileName: string,
  allowedExtensions: string[]
): ValidationResult {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File extension ${extension} is not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`,
    };
  }
  return { valid: true };
}

/**
 * Comprehensive file validation
 */
export function validateFile(
  file: File,
  config: FileUploadConfig
): ValidationResult {
  // Validate file size
  const sizeResult = validateFileSize(file, config.maxSizeBytes);
  if (!sizeResult.valid) {
    return sizeResult;
  }

  // Validate MIME type
  const typeResult = validateFileType(file, config.allowedMimeTypes);
  if (!typeResult.valid) {
    return typeResult;
  }

  // Validate extension if provided
  if (config.allowedExtensions) {
    const extResult = validateFileExtension(file.name, config.allowedExtensions);
    if (!extResult.valid) {
      return extResult;
    }
  }

  return { valid: true };
}

/**
 * Validate file and throw API error if invalid
 */
export function validateFileOrThrow(
  file: File,
  config: FileUploadConfig
): void {
  const result = validateFile(file, config);
  if (!result.valid) {
    throw ApiErrors.badRequest(result.error || 'File validation failed');
  }
}

/**
 * Sanitize filename to prevent directory traversal and other attacks
 */
export function sanitizeFilename(filename: string): string {
  // Remove path components
  const sanitized = filename
    .replace(/^.*[\\/]/, '') // Remove path
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid chars
    .substring(0, 255); // Limit length

  // Ensure it doesn't start with a dot
  if (sanitized.startsWith('.')) {
    return `file_${sanitized}`;
  }

  return sanitized || 'file';
}

/**
 * Generate safe filename with timestamp
 */
export function generateSafeFilename(originalName: string, prefix?: string): string {
  const sanitized = sanitizeFilename(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  const extension = sanitized.substring(sanitized.lastIndexOf('.'));
  const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.')) || 'file';
  
  return `${prefix ? `${prefix}-` : ''}${timestamp}-${random}${extension}`;
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}




