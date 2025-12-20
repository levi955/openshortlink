// Centralized schema exports
// Phase 4: Schema Composition & Type Inference

// Re-export all schemas and types from a single entry point

export * from './link';
export * from './domain';
export * from './auth';
export * from './taxonomy';
export * from './apiKey';
export * from './settings';

// ============================================================================
// Shared Utilities
// ============================================================================

/**
 * Helper to create safe number coercion for query parameters
 * Handles empty strings gracefully by converting to undefined
 */
export const createSafeNumberCoerce = (min: number, max: number, defaultValue: number) => {
  const { z } = require('zod');
  return z.preprocess(
    (val: unknown) => (val === '' || val === undefined || val === null ? undefined : val),
    z.coerce.number().int().min(min).max(max).optional()
  ).default(defaultValue);
};

/**
 * Standard pagination schema for list endpoints
 */
export const createPaginationSchema = (maxLimit: number = 10000, defaultLimit: number = 25) => {
  const { z } = require('zod');
  
  const safeNumberCoerce = (min: number, max: number, defaultValue: number) =>
    z.preprocess(
      (val: unknown) => (val === '' || val === undefined || val === null ? undefined : val),
      z.coerce.number().int().min(min).max(max).optional()
    ).default(defaultValue);

  return z.object({
    limit: safeNumberCoerce(1, maxLimit, defaultLimit),
    offset: safeNumberCoerce(0, Number.MAX_SAFE_INTEGER, 0),
  });
};
