/** Registers. Middle C = 60. */

/** Fold a MIDI note into [low, high] by octave shifts; if the range is narrower than an octave, clamp. */
export function clampToRegister(midi, low, high) {
  let m = midi;
  while (m < low) m += 12;
  while (m > high) m -= 12;
  if (m < low) m = low;
  return m;
}
