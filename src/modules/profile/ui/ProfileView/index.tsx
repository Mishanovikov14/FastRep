import { useMemo } from 'react';

import { Button } from '@/UIKit/Button';
import { CustomAlert } from '@/UIKit/CustomAlert';
import { Header } from '@/UIKit/Header';
import { ScreenContainer } from '@/UIKit/ScreenContainer';
import { useUIContext } from '@/UIProvider/useUIContext';

import { EnvironmentSection } from './components/EnvironmentSection';
import { useProfileViewPresenter } from './presenters/useProfileViewPresenter';
import { getStyles } from './styles';

export const ProfileView = () => {
  const { spacing, t } = useUIContext();
  const styles = useMemo(() => getStyles(spacing), [spacing]);
  const {
    activeEnvironment,
    environmentAlertActions,
    environmentAlertDescription,
    environmentAlertTitle,
    isEnvironmentAlertVisible,
    isEnvironmentSwitching,
    isLoading,
    isOwner,
    onDismissEnvironmentAlert,
    onLogout,
    onOpenEnvironmentSelection,
  } = useProfileViewPresenter({ t });

  return (
    <ScreenContainer
      containerStyle={styles.content}
      edges={[]}
      headerComponent={<Header title={String(t('profile.title'))} />}
    >
      {isOwner ? (
        <EnvironmentSection
          activeEnvironment={activeEnvironment}
          disabled={isEnvironmentSwitching}
          indicatorText={String(t('profile.environment.developmentIndicator'))}
          onPress={onOpenEnvironmentSelection}
          sectionTitle={String(t('profile.environment.title'))}
        />
      ) : null}
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
      <CustomAlert
        actions={environmentAlertActions}
        description={environmentAlertDescription}
        onDismiss={onDismissEnvironmentAlert}
        title={environmentAlertTitle}
        visible={isEnvironmentAlertVisible}
      />
    </ScreenContainer>
  );
};
