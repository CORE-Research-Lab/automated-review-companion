export default {
  testEnvironment: 'jsdom',
  preset: "ts-jest",
  setupFilesAfterEnv: ["<rootDir>/setupTests.ts"],
  moduleNameMapper: {
    '\\.(css|less|scss)$': 'identity-obj-proxy',  // Mocks CSS imports
    '^@/(.*)$': '<rootDir>/src/$1',  // Map `@/` to the `src/` directory
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}', // Specify which files to collect coverage from
    '!src/**/*.d.ts',    // Exclude TypeScript declaration files
    '!src/**/*.test.{ts,tsx}', // Exclude test files
  ],
  coverageReporters: ['text', 'lcov'], // Specify the format of the coverage report
  coverageDirectory: '<rootDir>/coverage', // Output directory for coverage reports
  coverageThreshold: { // Add coverage thresholds here
    global: {
      statements: 80, // Require at least 80% statement coverage
      branches: 80, // Require at least 80% branch coverage
      functions: 80, // Require at least 80% function coverage
      lines: 80, // Require at least 80% line coverage
    },
  },
};
