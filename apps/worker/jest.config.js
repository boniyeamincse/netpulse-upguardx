/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
    }],
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(got|@got|hpagent|@szmarczak|lowercase-keys|mimic-response|form-data-encoder|cacheable-request|responselike|normalize-url|p-cancelable|@sindresorhus|quick-lru)/)',
  ],
};