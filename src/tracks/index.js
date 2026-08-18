/** Track registry built from levels.json and the progression catalog. */
import levelsData from '../data/levels.json';
import catalog from '../data/progressions.json';
import { createIntervalsTrack } from './intervals.js';
import { createScaleDegreesTrack } from './scaleDegrees.js';
import { createChordQualitiesTrack } from './chordQualities.js';
import { createInversionsTrack } from './inversions.js';
import { createMelodicTrack } from './melodic.js';
import { createProgressionsTrack } from './progressions.js';

const FACTORY = {
  intervals: createIntervalsTrack,
  scaleDegrees: createScaleDegreesTrack,
  chordQualities: createChordQualitiesTrack,
  inversions: createInversionsTrack,
  melodic: createMelodicTrack,
  progressions: (def) => createProgressionsTrack(def, catalog),
};

export function buildTracks(data = levelsData) {
  const tracks = data.tracks.map((def) => FACTORY[def.id](def));
  const byId = Object.fromEntries(tracks.map((t) => [t.id, t]));
  return { list: tracks, byId, defs: Object.fromEntries(data.tracks.map((d) => [d.id, d])) };
}

export const TRACK_ORDER = ['intervals', 'scaleDegrees', 'chordQualities', 'inversions', 'melodic', 'progressions'];
