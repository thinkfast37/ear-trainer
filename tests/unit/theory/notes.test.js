import { describe, it, expect } from 'vitest';
import { clampToRegister } from '../../../src/theory/notes.js';

describe('notes', () => {
  it('clamps by octave into a register', () => { expect(clampToRegister(30, 48, 72)).toBe(54); expect(clampToRegister(90, 48, 72)).toBe(66); expect(clampToRegister(50, 48, 72)).toBe(50); });
});
