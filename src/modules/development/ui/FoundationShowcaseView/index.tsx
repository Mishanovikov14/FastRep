import { useMemo } from 'react';
import { View } from 'react-native';

import { Button } from '@/UIKit/Button';
import { Loader } from '@/UIKit/Loader';
import { ScreenContainer } from '@/UIKit/ScreenContainer';
import { Typography } from '@/UIKit/Typography';
import { useUIContext } from '@/UIProvider/useUIContext';

import { useFoundationShowcaseViewPresenter } from './presenters/useFoundationShowcaseViewPresenter';
import { getStyles } from './styles';

export const FoundationShowcaseView = () => {
  const { colors, language, languages, radius, setLanguage, spacing, t } = useUIContext();
  const styles = useMemo(() => getStyles(colors, spacing, radius), [colors, radius, spacing]);
  const {
    apiUrl,
    fontLanguageSamples,
    fontWeightSamples,
    languageControls,
    onPressNoop,
    onPressShowError,
    onPressShowInfo,
    onPressShowSuccess,
  } = useFoundationShowcaseViewPresenter({
    language,
    languages,
    setLanguage,
    t,
  });

  return (
    <ScreenContainer contentContainerStyle={styles.sections} scrollEnabled>
      <View style={styles.section}>
        <Typography variant="title">{t('showcase.title')}</Typography>
        <Typography color={colors.textSecondary}>{t('showcase.description')}</Typography>
      </View>

      <View style={styles.surface}>
        <Typography variant="heading">Typography</Typography>
        <Typography variant="title">Title</Typography>
        <Typography variant="heading">Heading</Typography>
        <Typography variant="body">Body</Typography>
        <Typography variant="bodyMedium">Body medium</Typography>
        <Typography variant="caption">Caption</Typography>
        <Typography variant="button">Button label</Typography>
      </View>

      <View style={styles.surface}>
        <Typography variant="heading">Google Sans Flex weights</Typography>
        <View style={styles.sampleGroup}>
          {fontWeightSamples.map((sample) => (
            <Typography key={sample.weight} language="en" weight={sample.weight}>
              {sample.label}
            </Typography>
          ))}
        </View>
      </View>

      <View style={styles.surface}>
        <Typography variant="heading">Language coverage</Typography>
        <View style={styles.sampleGroup}>
          {fontLanguageSamples.map((sample) => (
            <View key={sample.code}>
              <Typography color={colors.textSecondary} language={sample.code} variant="caption">
                {sample.label}
              </Typography>
              <Typography language={sample.code}>{sample.text}</Typography>
            </View>
          ))}
          <Typography color={colors.textSecondary} language="uk" variant="caption">
            Ukrainian-specific characters
          </Typography>
          <Typography language="uk">і ї є ґ І Ї Є Ґ</Typography>
        </View>
      </View>

      <View style={styles.surface}>
        <Typography variant="heading">Buttons</Typography>
        <View style={styles.buttonGroup}>
          <Button onPress={onPressNoop} title="Primary" />
          <Button onPress={onPressNoop} title="Secondary" variant="secondary" />
          <Button onPress={onPressNoop} title="Text" variant="text" />
          <Button onPress={onPressNoop} title="Danger" variant="danger" />
          <Button disabled onPress={onPressNoop} title="Disabled" />
          <Button loading onPress={onPressNoop} title={String(t('common.loading'))} />
        </View>
      </View>

      <View style={styles.surface}>
        <Typography variant="heading">Loader</Typography>
        <Loader size="large" />
      </View>

      <View style={styles.surface}>
        <Typography variant="heading">Toast</Typography>
        <Button onPress={onPressShowSuccess} title={String(t('showcase.showSuccess'))} />
        <Button onPress={onPressShowError} title={String(t('showcase.showError'))} variant="danger" />
        <Button onPress={onPressShowInfo} title={String(t('common.info'))} variant="secondary" />
      </View>

      <View style={styles.surface}>
        <Typography variant="heading">{t('showcase.currentLanguage')}</Typography>
        <Typography variant="bodyMedium">{language.toUpperCase()}</Typography>
        <View style={styles.languageGrid}>
          {languageControls.map((control) => (
            <Button
              disabled={control.disabled}
              key={control.code}
              onPress={control.onPress}
              size="small"
              title={control.title}
              variant="secondary"
            />
          ))}
        </View>
      </View>

      <View style={styles.surface}>
        <Typography variant="heading">Backend</Typography>
        <Typography color={colors.textSecondary} variant="caption">
          Active API base URL
        </Typography>
        <Typography>{apiUrl}</Typography>
        <Typography color={colors.textSecondary} variant="caption">
          No public health endpoint is defined, so no product API request is sent from this showcase. Request
          normalization and headers are covered by unit tests.
        </Typography>
      </View>
    </ScreenContainer>
  );
};
