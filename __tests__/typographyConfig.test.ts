import { typographyVariantWeights } from '@/UIKit';
import { fontFamiliesByPlatform } from '@/UIProvider/theme/Fonts';

describe('Typography font configuration', () => {
  it('maps variants to the bundled static font weights', () => {
    expect(typographyVariantWeights).toMatchObject({
      body: 'regular',
      bodyMedium: 'medium',
      button: 'semibold',
      caption: 'regular',
      heading: 'semibold',
      title: 'bold',
    });
  });

  it('uses verified native font names on both platforms', () => {
    expect(fontFamiliesByPlatform.ios).toEqual({
      bold: 'GoogleSansFlex24pt-Bold',
      medium: 'GoogleSansFlex24pt-Medium',
      regular: 'GoogleSansFlex24pt-Regular',
      semibold: 'GoogleSansFlex24pt-SemiBold',
    });
    expect(fontFamiliesByPlatform.android).toEqual({
      bold: 'GoogleSansFlex_24pt-Bold',
      medium: 'GoogleSansFlex_24pt-Medium',
      regular: 'GoogleSansFlex_24pt-Regular',
      semibold: 'GoogleSansFlex_24pt-SemiBold',
    });
  });
});
