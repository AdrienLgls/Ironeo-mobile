module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@/app': './app',
            '@/components': './components',
            '@/hooks': './hooks',
            '@/services': './services',
            '@/types': './types',
          },
        },
      ],
    ],
  };
};
