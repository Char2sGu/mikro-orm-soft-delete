/** @type {import('ts-jest').JestConfigWithTsJest} */
const base = {
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  clearMocks: true,
  restoreMocks: true,
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};

// Two isolated projects so the two decorator flavors are each compiled with
// their own tsconfig. `*.es.spec.ts` uses ES (TC39) decorators (no
// `experimentalDecorators`); everything else uses legacy reflect-metadata
// decorators.
export default {
  projects: [
    {
      ...base,
      displayName: "legacy",
      testMatch: ["**/__tests__/**/*.legacy.spec.ts"],
      transform: {
        "^.+\\.tsx?$": [
          "ts-jest",
          { useESM: true, tsconfig: "./tsconfig.spec.json" },
        ],
      },
    },
    {
      ...base,
      displayName: "es",
      testMatch: ["**/__tests__/**/*.es.spec.ts"],
      transform: {
        "^.+\\.tsx?$": [
          "ts-jest",
          { useESM: true, tsconfig: "./tsconfig.spec.es.json" },
        ],
      },
    },
  ],
};
