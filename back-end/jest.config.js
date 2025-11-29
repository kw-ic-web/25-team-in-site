export default {
  roots: ["<rootDir>/test"],
  testMatch: ["**/*.test.js"],
  testEnvironment: "node",
  testTimeout: 30000,
  moduleFileExtensions: ["js", "json"],
  collectCoverageFrom: ["src/**/*.js"],
  coverageDirectory: "coverage",
  verbose: true,
  setupFiles: ["<rootDir>/test/utils/setup-env.js"],
};

