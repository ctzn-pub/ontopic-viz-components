// Export all Observable Plot components and infrastructure
export * from './plot';

// Export all Recharts components
export * from './recharts';

// Export UI components (now bundled in package, not external)
export * from './ui';

// Temporarily commented out - composite components need refactoring
// export * from './composite';

// Export infrastructure
export * from './infrastructure';

// Re-export core types for convenience
export type {
  ComponentSpec,
  DataShape,
  DataFieldType,
  ValidationResult
} from '@ontopic/viz-core';
