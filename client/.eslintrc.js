module.exports = {
  extends: ['react-app', 'plugin:fp-ts/all', 'plugin:cypress/recommended', 'plugin:storybook/recommended'],
  plugins: ['fp-ts', 'cypress'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json', './cypress/tsconfig.json']
  },
  rules: {
    'no-fallthrough': 'off',
    'array-callback-return': 'off',
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
