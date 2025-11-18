// Export all Observable Plot components and infrastructure
export * from './plot';

// Export all Recharts components
export * from './recharts';

// Temporarily commented out - need to resolve app dependencies
// export * from './composite';
// export * from './ui';

// Export infrastructure
export * from './infrastructure';

// Re-export core types for convenience
export type {
  ComponentSpec,
  DataShape,
  DataFieldType,
  ValidationResult
} from '@ontopic/viz-core';
