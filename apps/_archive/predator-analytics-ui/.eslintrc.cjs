// 🦅 PREDATOR Analytics v55.1 — ESLint конфігурація
module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'node_modules'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['react-refresh'],
  rules: {
    // Дозволяємо будь-який тип у деяких випадках
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['off', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    'react-hooks/exhaustive-deps': 'off',
    'react-refresh/only-export-components': 'off',
    // Дозволяємо empty interface для розширення
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/no-empty-object-type': 'off',
    // Дозволяємо require() у .cjs
    '@typescript-eslint/no-require-imports': 'off',
    // Дозволяємо namespace для JSX типів (React Three Fiber)
    '@typescript-eslint/no-namespace': 'off',
    // Зменшуємо noise для CI/CD
    'no-console': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
    'no-empty': ['error', { allowEmptyCatch: true }],
    'no-self-assign': 'off',
    'prefer-const': 'off',
    'no-regex-spaces': 'off',
  },
  overrides: [
    {
      files: ['**/*.test.tsx', '**/*.test.ts', '**/__tests__/**'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'react-hooks/rules-of-hooks': 'off',
        'no-empty': 'off',
        '@typescript-eslint/ban-types': 'off',
      },
    },
  ],
};
