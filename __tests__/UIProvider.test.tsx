import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

import { storage, storageKeys } from '@/libs/storage';
import { initializeLocalization } from '@/localization/i18n';
import type { UIContextValue } from '@/UIProvider/types';
import { UIProvider } from '@/UIProvider/UIProvider';
import { useUIContext } from '@/UIProvider/useUIContext';

describe('UIProvider', () => {
  it('initializes once and persists language changes', async () => {
    let context: UIContextValue | undefined;

    const LanguageProbe = () => {
      context = useUIContext();

      return <Text>{context.language}</Text>;
    };

    storage.clearAll();

    const firstInitialization = initializeLocalization();
    const secondInitialization = initializeLocalization();

    expect(firstInitialization).toBe(secondInitialization);

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(
        <UIProvider>
          <LanguageProbe />
        </UIProvider>,
      );
      await firstInitialization;
      await Promise.resolve();
    });

    expect(context?.language).toBe('en');

    await ReactTestRenderer.act(async () => {
      await context?.setLanguage('fr');
    });

    expect(context?.language).toBe('fr');
    expect(storage.get(storageKeys.APP_LANGUAGE)).toBe('fr');
  });
});
