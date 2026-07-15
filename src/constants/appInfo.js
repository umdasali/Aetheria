import { HEROES } from '../data/heroes';
import { STAGE_ORDER } from '../data/story';

export const APP_INFO = {
  name:         'Aetheria: Legends Unbound',
  studio:       'Ziriverse',
  website:      'www.ziriverse.com',
  privacyUrl:        'https://ziriverse.com/privacy',
  termsUrl:          'https://ziriverse.com/terms',
  accountDeletionUrl:'https://ziriverse.com/account-deletion',
  version:      '2.0.0',
  year:         '2025',
  heroCount:    HEROES.length,       // auto-updates as heroes.js grows
  stageCount:   STAGE_ORDER.length,  // auto-updates as story.js grows
  factionCount: 6,
};
