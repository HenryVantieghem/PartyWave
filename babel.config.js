module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@lib': './src/lib',
            '@stores': './src/stores',
            '@constants': './src/constants',
          },
        },
      ],
      'react-native-reanimated/plugin', // Must be last - includes worklets plugin internally
    ],
  };
};
