module.exports = {
  extends: ['react-app', 'plugin:fp-ts/all', 'plugin:cypress/recommended'],
  plugins: ['fp-ts', 'cypress'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json']
  },
  rules: {
    'no-fallthrough': 'off',
    '@typescript-eslint/no-redeclare': 'off',
    'fp-ts/no-module-imports': [
      'error',
      {
        allowTypes: true,
        allowedModules: [
          'function',
          'Apply',
          'Applicative',
          'FromEither',
          'Functor',
          'Chain',
          'Witherable'
        ]
      }
    ]
  }
}
