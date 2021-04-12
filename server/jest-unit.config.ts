import { defaults } from 'jest-config'

export default {
  rootDir: 'src',
  testPathIgnorePatterns: [
    ...defaults.testPathIgnorePatterns,
    '<rootDir>/api-tests/'
  ]
}
