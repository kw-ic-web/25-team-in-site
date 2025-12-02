export default {
  roots: ["<rootDir>/test"],
  testMatch: ["**/*.test.js"],
  testEnvironment: "node",
  testTimeout: 30000,
  moduleFileExtensions: ["js", "json"],
  collectCoverageFrom: ["src/**/*.js"],
  coverageDirectory: "coverage",
  verbose: true,
  forceExit: true, // 모든 테스트 후 강제 종료
  setupFiles: ["<rootDir>/test/utils/setup-env.js"],
  setupFilesAfterEnv: ["<rootDir>/test/utils/setup-redis.js"],
};

