import type { Config } from '@jest/types';

export const config: Config.InitialOptions = {
  rootDir: '.',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
};
