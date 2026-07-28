import { useMemo } from 'react';

import { Button } from '@/UIKit/Button';
import { Header } from '@/UIKit/Header';
import { ScreenContainer } from '@/UIKit/ScreenContainer';
import { useUIContext } from '@/UIProvider/useUIContext';

import { useProfileViewPresenter } from './presenters/useProfileViewPresenter';
import { getStyles } from './styles';

export const ProfileView = () => {
  const { spacing, t } = useUIContext();
  const styles = useMemo(() => getStyles(spacing), [spacing]);
  const { isLoading, onLogout } = useProfileViewPresenter({ t });

  return (
    <ScreenContainer
      containerStyle={styles.content}
      edges={[]}
      headerComponent={<Header title={String(t('profile.title'))} />}
    >
      <Button
        disabled={isLoading}
        fullWidth
        loading={isLoading}
        onPress={onLogout}
        size="large"
        style={styles.button}
        title={String(t('profile.logout'))}
        variant="danger"
      />
    </ScreenContainer>
  );
};
