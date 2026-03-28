// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^cheerio$': '<rootDir>/node_modules/cheerio/dist/commonjs/slim.js',
  },
  testMatch: ['**/__tests__/**/*.(ts|tsx)'],
};

export default config;
