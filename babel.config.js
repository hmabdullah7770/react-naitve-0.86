module.exports = function (api) {
  api.cache(true);

  const presets = ['module:@react-native/babel-preset'];

  const plugins = [
    ['@babel/plugin-proposal-decorators', { legacy: true }],
  ];

  // ✅ CRITICAL: Remove console.* in production builds
  // This alone can give you 30-40% performance improvement
  if (process.env.NODE_ENV === 'production') {
    plugins.push([
      'transform-remove-console',
      {
        // Keep error and warn for crash reporting
        exclude: ['error', 'warn'],
      },
    ]);
  }

  // ⚠️ Reanimated plugin MUST always be the last one in the array
plugins.push('react-native-worklets/plugin');

  return { presets, plugins };
};