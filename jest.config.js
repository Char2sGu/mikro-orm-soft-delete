module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  clearMocks: true,
  restoreMocks: true,
  globals: {
    "ts-jest": {
      tsconfig: "src/tsconfig.json",
    },
  },
};
