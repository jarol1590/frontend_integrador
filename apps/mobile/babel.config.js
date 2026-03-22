module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '@domain': '../../src/domain',
            '@application': '../../src/application',
            '@infra': '../../src/infrastructure',
            '@ui': '../../src/ui'
          }
        }
      ]
    ]
  };
};