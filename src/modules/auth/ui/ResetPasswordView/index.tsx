import { useMemo } from 'react';
import { Image, View } from 'react-native';

import { Button } from '@/UIKit/Button';
import { Input } from '@/UIKit/Input';
import { ScreenContainer } from '@/UIKit/ScreenContainer';
import { Typography } from '@/UIKit/Typography';
import { useUIContext } from '@/UIProvider/useUIContext';

import { useResetPasswordViewPresenter } from './presenters/useResetPasswordViewPresenter';
import { getStyles } from './styles';

export const ResetPasswordView = () => {
  const { colors, spacing, t } = useUIContext();
  const styles = useMemo(() => getStyles(colors, spacing), [colors, spacing]);
  const {
    confirmPassword,
    errors,
    isLoading,
    onBack,
    onChangeConfirmPassword,
    onChangePassword,
    onSubmit,
    password,
  } = useResetPasswordViewPresenter({ t });

  return (
    <ScreenContainer
      backgroundColor={colors.white}
      edges={['top', 'bottom']}
      isKeyboardAvoiding
      scrollEnabled
    >
      <View style={styles.container}>
        <Image
          accessibilityLabel="FastRep"
          resizeMode="contain"
          source={require('@/assets/images/logo-horizontal.png')}
          style={styles.logo}
        />

        <View style={styles.header}>
          <Typography align="center" variant="title">
            {t('auth.resetPassword.title')}
          </Typography>
          <Typography align="center" color={colors.textSecondary}>
            {t('auth.resetPassword.explanation')}
          </Typography>
        </View>

        <View style={styles.fields}>
          <Input
            autoCapitalize="none"
            autoComplete="new-password"
            disabled={isLoading}
            error={errors.password}
            label={String(t('auth.resetPassword.newPassword'))}
            maxLength={128}
            onChangeText={onChangePassword}
            returnKeyType="next"
            secureTextEntry
            textContentType="newPassword"
            value={password}
          />
          <Input
            autoCapitalize="none"
            autoComplete="new-password"
            disabled={isLoading}
            error={errors.confirmPassword}
            label={String(t('auth.resetPassword.confirmNewPassword'))}
            maxLength={128}
            onChangeText={onChangeConfirmPassword}
            onSubmitEditing={onSubmit}
            returnKeyType="done"
            secureTextEntry
            textContentType="newPassword"
            value={confirmPassword}
          />
        </View>

        <View style={styles.actions}>
          <Button
            disabled={isLoading}
            fullWidth
            loading={isLoading}
            onPress={onSubmit}
            size="large"
            title={String(t('auth.resetPassword.resetPassword'))}
          />
          <Button
            disabled={isLoading}
            onPress={onBack}
            title={String(t('auth.recovery.back'))}
            variant="text"
          />
        </View>
      </View>
    </ScreenContainer>
  );
};
