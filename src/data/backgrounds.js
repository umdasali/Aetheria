export const WEATHER_BACKGROUNDS = [
  { bg: require('../../assets/background/bg_001.webp'), weather: 'rain'  }, // rainy
  { bg: require('../../assets/background/bg_002.webp'), weather: 'fog'   }, // cloudy
  { bg: require('../../assets/background/bg_003.webp'), weather: 'wind'  }, // windy / clear sky
];

// Legacy flat array kept for any other consumers
export const BACKGROUNDS = WEATHER_BACKGROUNDS.map((e) => e.bg);
