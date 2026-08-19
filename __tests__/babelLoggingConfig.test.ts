interface IBabelPluginConfig {
  plugins: Array<string | [string, Record<string, unknown>]>;
}

type BabelConfigFactory = (api: { env(name: string): boolean }) => IBabelPluginConfig;

describe('Babel logging configuration', () => {
  const loadConfig = (): BabelConfigFactory => {
    let factory: BabelConfigFactory | undefined;

    jest.isolateModules(() => {
      factory = require('../babel.config.js') as BabelConfigFactory;
    });

    return factory as BabelConfigFactory;
  };

  it('enables console stripping only for release and preserves warn/error', () => {
    const factory = loadConfig();
    const production = factory({ env: (name) => name === 'production' });
    const development = factory({ env: () => false });

    expect(production.plugins).toContainEqual([
      'transform-remove-console',
      { exclude: ['error', 'warn'] },
    ]);
    expect(development.plugins).not.toContainEqual(expect.arrayContaining(['transform-remove-console']));
    expect(production.plugins.at(-1)).toBe('react-native-worklets/plugin');
  });
});
