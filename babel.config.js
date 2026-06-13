module.exports = function (api) {
  api.cache(true);

  const plugins = ['react-native-reanimated/plugin'];

  // Strip all console.* calls from production bundles
  if (process.env.NODE_ENV === 'production' || process.env.BABEL_ENV === 'production') {
    plugins.unshift('transform-remove-console');
  }

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};
