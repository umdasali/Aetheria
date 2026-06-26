// Single authoritative Expo config. Static values live in app.base.json and are
// spread here; this file layers in env-driven `extra` keys (Supabase).
const { expo } = require('./app.base.json');

module.exports = {
  expo: {
    ...expo,
    extra: {
      ...expo.extra,
      supabaseUrl:          process.env.SUPABASE_URL            ?? '',
      supabaseAnonKey:      process.env.SUPABASE_ANON_KEY       ?? '',
      revenueCatAndroidKey: process.env.REVENUECAT_ANDROID_KEY  ?? '',
      revenueCatIosKey:     process.env.REVENUECAT_IOS_KEY      ?? '',
    },
  },
};
