import { useMemo } from 'react';
import { Image, View } from 'react-native';

import { Button } from '@/UIKit/Button';
import { Loader } from '@/UIKit/Loader';
import { ScreenContainer } from '@/UIKit/ScreenContainer';
import { Typography } from '@/UIKit/Typography';
import { useUIContext } from '@/UIProvider/useUIContext';

import { useSplashViewPresenter } from './presenters/useSplashViewPresenter';
import { getStyles } from './styles';

export const SplashView = () => {
  const { colors, spacing, t } = useUIContext();
  const styles = useMemo(() => getStyles(colors, spacing), [colors, spacing]);
  const { errorMessage, hasTemporaryError, isLoading, onRetry } =
    useSplashViewPresenter({ t });

  return (
    <ScreenContainer
      backgroundColor={colors.white}
      containerStyle={styles.content}
    >
      <Image
        accessibilityLabel="FastRep"
        resizeMode="contain"
        source={require('@/assets/images/logo-horizontal.png')}
        style={styles.logo}
      />
      <View style={styles.status}>
        {isLoading ? <Loader size="large" /> : null}
        {errorMessage ? (
          <Typography align="center" color={colors.error}>
            {errorMessage}
          </Typography>
        ) : null}
        {hasTemporaryError ? (
          <Button
            disabled={isLoading}
            loading={isLoading}
            onPress={onRetry}
            title={String(t('common.retry'))}
          />
        ) : null}
      </View>
    </ScreenContainer>
  );
};
