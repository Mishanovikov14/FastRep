import { useMemo } from 'react';

import { Loader } from '@/UIKit/Loader';
import { ScreenContainer } from '@/UIKit/ScreenContainer';
import { Typography } from '@/UIKit/Typography';
import { useUIContext } from '@/UIProvider/useUIContext';

import { useSplashViewPresenter } from './presenters/useSplashViewPresenter';
import { getStyles } from './styles';

export const SplashView = () => {
  const { colors, spacing, t } = useUIContext();
  const styles = useMemo(() => getStyles(spacing), [spacing]);
  const { isRestoring } = useSplashViewPresenter();

  return (
    <ScreenContainer containerStyle={styles.content}>
      {isRestoring ? <Loader size="large" /> : null}
      <Typography color={colors.textSecondary}>{t('auth.session.restoring')}</Typography>
    </ScreenContainer>
  );
};
