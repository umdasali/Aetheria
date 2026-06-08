import { HEROES } from '../data/heroes';
import { STAGE_ORDER } from '../data/story';

export const APP_INFO = {
  name:         'Aetheria: Legends Unbound',
  studio:       'Ziriverse',
  website:      'www.ziriverse.com',
  version:      '1.0.0',
  year:         '2025',
  heroCount:    HEROES.length,       // auto-updates as heroes.js grows
  stageCount:   STAGE_ORDER.length,  // auto-updates as story.js grows
  factionCount: 5,
};
