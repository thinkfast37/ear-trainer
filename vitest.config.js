import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The second glob runs the spec-trace skill's own self-tests (CLAUDE.md §2b:
    // changing the checker means changing its tests).
    include: ['tests/unit/**/*.test.js', '.claude/skills/*/tests/*.test.js'],
    environment: 'node',
  },
});
