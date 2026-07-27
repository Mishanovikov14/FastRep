import { useMemo } from 'react';

import { Button } from '@/UIKit/Button';
import { Loader } from '@/UIKit/Loader';
import { ScreenContainer } from '@/UIKit/ScreenContainer';
import { Typography } from '@/UIKit/Typography';
import { useUIContext } from '@/UIProvider/useUIContext';

import { useSplashViewPresenter } from './presenters/useSplashViewPresenter';
import { getStyles } from './styles';

export const SplashView = () => {
  const { colors, spacing, t } = useUIContext();
  const styles = useMemo(() => getStyles(spacing), [spacing]);
  const { errorMessage, hasTemporaryError, isLoading, onRetry } =
    useSplashViewPresenter({ t });

  return (
    <ScreenContainer containerStyle={styles.content}>
      {isLoading ? <Loader size="large" /> : null}
      <Typography color={hasTemporaryError ? colors.error : colors.textSecondary}>
        {hasTemporaryError ? t('common.error') : t('auth.session.restoring')}
      </Typography>
      {errorMessage ? (
        <Typography color={colors.textSecondary}>{errorMessage}</Typography>
      ) : null}
      {hasTemporaryError ? (
        <Button
          disabled={isLoading}
          loading={isLoading}
          onPress={onRetry}
          title={String(t('common.retry'))}
        />
      ) : null}
    </ScreenContainer>
  );
};
