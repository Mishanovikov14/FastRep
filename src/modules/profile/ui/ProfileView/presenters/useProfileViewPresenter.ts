import type { TFunction } from 'i18next';
import { useCallback, useMemo, useRef, useState } from 'react';

import { APP_ENVIRONMENTS } from '@/entities/environment/config/appEnvironments';
import { useAppEnvironmentStore } from '@/entities/environment/model/appEnvironmentStore';
import { isEnvironmentOwner } from '@/entities/environment/services/appEnvironmentService';
import type { AppEnvironmentKey } from '@/entities/environment/types/appEnvironment';
import { useUserStore } from '@/entities/user/model/userStore';
import { switchAppEnvironment } from '@/entities/user/services/environmentSwitchService';
import { useLogout } from '@/hooks/useLogout';
import type { ICustomAlertAction } from '@/UIKit/CustomAlert/types';
import { logger } from '@/libs/logger/logger';
import { toastService } from '@/libs/toast/toastService';

interface IInput {
  t: TFunction;
}

export const useProfileViewPresenter = ({ t }: IInput) => {
  const activeEnvironment = useAppEnvironmentStore((state) => state.activeEnvironment);
  const isEnvironmentSwitching = useAppEnvironmentStore((state) => state.isSwitching);
  const userEmail = useUserStore((state) => state.user?.email);
  const isOwner = isEnvironmentOwner(userEmail);
  const { isLoading: isLogoutLoading, onLogout } = useLogout(t);
  const [alertMode, setAlertMode] = useState<'confirmation' | 'selection'>();
  const [pendingEnvironment, setPendingEnvironment] = useState<AppEnvironmentKey>();
  const isConfirmingRef = useRef(false);

  const onDismissEnvironmentAlert = useCallback(() => {
    if (isConfirmingRef.current) {
      return;
    }

    setAlertMode(undefined);
    setPendingEnvironment(undefined);
  }, []);

  const onOpenEnvironmentSelection = useCallback(() => {
    setAlertMode('selection');
  }, []);

  const onSelectEnvironment = useCallback(
    (key: AppEnvironmentKey) => {
      if (key === activeEnvironment.key) {
        onDismissEnvironmentAlert();
        return;
      }

      setPendingEnvironment(key);
      setAlertMode('confirmation');
    },
    [activeEnvironment.key, onDismissEnvironmentAlert],
  );

  const onConfirmEnvironmentSwitch = useCallback(async () => {
    if (!pendingEnvironment || isConfirmingRef.current) {
      return;
    }

    isConfirmingRef.current = true;

    try {
      await switchAppEnvironment({
        currentUserEmail: userEmail,
        targetEnvironment: pendingEnvironment,
      });
    } catch {
      logger.error('environment.switch_failed');
      toastService.showError(String(t('common.error')), String(t('common.somethingWentWrong')));
    } finally {
      isConfirmingRef.current = false;
      setAlertMode(undefined);
      setPendingEnvironment(undefined);
    }
  }, [pendingEnvironment, t, userEmail]);

  const environmentAlertActions = useMemo<ICustomAlertAction[]>(() => {
    if (alertMode === 'confirmation') {
      return [
        {
          disabled: isEnvironmentSwitching,
          key: 'cancel',
          onPress: onDismissEnvironmentAlert,
          title: String(t('common.cancel')),
          variant: 'secondary',
        },
        {
          disabled: isEnvironmentSwitching,
          key: 'switch',
          loading: isEnvironmentSwitching,
          onPress: () => {
            onConfirmEnvironmentSwitch().catch(() => {
              logger.error('environment.switch_failed');
            });
          },
          title: String(t('profile.environment.switchAction')),
          variant: 'danger',
        },
      ];
    }

    return [
      ...(['development', 'production'] as const).map((key) => ({
        disabled: activeEnvironment.key === key,
        key,
        onPress: () => {
          onSelectEnvironment(key);
        },
        title: APP_ENVIRONMENTS[key].displayName,
        variant: 'secondary' as const,
      })),
      {
        key: 'cancel',
        onPress: onDismissEnvironmentAlert,
        title: String(t('common.cancel')),
        variant: 'text',
      },
    ];
  }, [
    activeEnvironment.key,
    alertMode,
    isEnvironmentSwitching,
    onConfirmEnvironmentSwitch,
    onDismissEnvironmentAlert,
    onSelectEnvironment,
    t,
  ]);

  const pendingEnvironmentName = pendingEnvironment
    ? APP_ENVIRONMENTS[pendingEnvironment].displayName
    : activeEnvironment.displayName;

  return {
    activeEnvironment,
    environmentAlertActions,
    environmentAlertDescription:
      alertMode === 'confirmation'
        ? String(t('profile.environment.confirmationMessage', { environment: pendingEnvironmentName }))
        : String(t('profile.environment.selectionMessage')),
    environmentAlertTitle:
      alertMode === 'confirmation'
        ? String(t('profile.environment.confirmationTitle'))
        : String(t('profile.environment.title')),
    isEnvironmentAlertVisible: Boolean(alertMode),
    isEnvironmentSwitching,
    isLoading: isLogoutLoading || isEnvironmentSwitching,
    isOwner,
    onDismissEnvironmentAlert,
    onLogout,
    onOpenEnvironmentSelection,
  };
};
