import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/', 'dist/', 'test-results/', 'playwright-report/', 'ios/', 'android/', '.claude/'] },
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-restricted-globals': ['error', 'event'],
    },
  },
  {
    // Constitution VII: no timers in the audio path.
    files: ['src/audio/**/*.js'],
    rules: {
      'no-restricted-properties': [
        'error',
        { object: 'window', property: 'setTimeout', message: 'Schedule on the AudioContext clock.' },
        { object: 'window', property: 'setInterval', message: 'Schedule on the AudioContext clock.' },
        { object: 'globalThis', property: 'setTimeout', message: 'Schedule on the AudioContext clock.' },
      ],
      'no-restricted-globals': ['error', 'setTimeout', 'setInterval'],
    },
  },
];
