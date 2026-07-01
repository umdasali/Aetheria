// Dedicated 1:1 player profile avatars — independent from hero art.
export const DEFAULT_AVATAR_ID = 'avatar-01';

const AVATAR_IMAGES = {
  'avatar-01': require('../../assets/avatar/avatar-01.webp'),
  'avatar-02': require('../../assets/avatar/avatar-02.webp'),
  'avatar-03': require('../../assets/avatar/avatar-03.webp'),
  'avatar-04': require('../../assets/avatar/avatar-04.webp'),
  'avatar-05': require('../../assets/avatar/avatar-05.webp'),
  'avatar-06': require('../../assets/avatar/avatar-06.webp'),
  'avatar-07': require('../../assets/avatar/avatar-07.webp'),
  'avatar-08': require('../../assets/avatar/avatar-08.webp'),
  'avatar-09': require('../../assets/avatar/avatar-09.webp'),
  'avatar-10': require('../../assets/avatar/avatar-10.webp'),
  'avatar-11': require('../../assets/avatar/avatar-11.webp'),
  'avatar-12': require('../../assets/avatar/avatar-12.webp'),
  'avatar-13': require('../../assets/avatar/avatar-13.webp'),
  'avatar-14': require('../../assets/avatar/avatar-14.webp'),
  'avatar-15': require('../../assets/avatar/avatar-15.webp'),
};

export const AVATARS = Object.keys(AVATAR_IMAGES).map(id => ({ id, image: AVATAR_IMAGES[id] }));

export function getAvatarImage(avatarId) {
  return AVATAR_IMAGES[avatarId] ?? AVATAR_IMAGES[DEFAULT_AVATAR_ID];
}
