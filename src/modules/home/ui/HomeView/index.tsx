import { useMemo } from 'react';
import { View } from 'react-native';

import { Button } from '@/UIKit/Button';
import { Loader } from '@/UIKit/Loader';
import { ScreenContainer } from '@/UIKit/ScreenContainer';
import { Typography } from '@/UIKit/Typography';
import { useUIContext } from '@/UIProvider/useUIContext';

import { useHomeViewPresenter } from './presenters/useHomeViewPresenter';
import { getStyles } from './styles';

export const HomeView = () => {
  const { colors, radius, spacing, t } = useUIContext();
  const styles = useMemo(() => getStyles(colors, radius, spacing), [colors, radius, spacing]);
  const { isLoading, onLogout, user } = useHomeViewPresenter({ t });

  if (!user) {
    return (
      <ScreenContainer contentContainerStyle={styles.content}>
        <Loader size="large" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer contentContainerStyle={styles.content} horizontalPadding>
      <View style={styles.card}>
        <Typography variant="title">{t('home.title')}</Typography>

        <View style={styles.details}>
          <View style={styles.detail}>
            <Typography color={colors.textSecondary} variant="caption">
              {t('home.fullName')}
            </Typography>
            <Typography variant="bodyMedium">{user.fullName}</Typography>
          </View>
          <View style={styles.detail}>
            <Typography color={colors.textSecondary} variant="caption">
              {t('home.email')}
            </Typography>
            <Typography variant="bodyMedium">{user.email}</Typography>
          </View>
          <View style={styles.detail}>
            <Typography color={colors.textSecondary} variant="caption">
              {t('home.language')}
            </Typography>
            <Typography variant="bodyMedium">{user.language}</Typography>
          </View>
          <View style={styles.detail}>
            <Typography color={colors.textSecondary} variant="caption">
              {t('home.premium')}
            </Typography>
            <Typography variant="bodyMedium">
              {user.isPremium ? t('common.yes') : t('common.no')}
            </Typography>
          </View>
        </View>

        <Button
          disabled={isLoading}
          fullWidth
          loading={isLoading}
          onPress={onLogout}
          title={String(t('home.logout'))}
          variant="danger"
        />
      </View>
    </ScreenContainer>
  );
};
