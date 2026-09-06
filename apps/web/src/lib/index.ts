/**
 * @file src/lib/index.ts
 * @description Barrel export for all shared library utilities.
 * Allows clean imports across the codebase: `import { callTextAI, callVisionAI } from '@/lib'`
 */
export * from './ai';
export * from './chatStore';
export * from './offlineStore';
export * from './whatsapp';
