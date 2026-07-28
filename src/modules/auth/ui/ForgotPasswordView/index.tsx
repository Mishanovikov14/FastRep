import { useMemo } from 'react';
import { Image, View } from 'react-native';

import { Button } from '@/UIKit/Button';
import { Input } from '@/UIKit/Input';
import { ScreenContainer } from '@/UIKit/ScreenContainer';
import { Typography } from '@/UIKit/Typography';
import { useUIContext } from '@/UIProvider/useUIContext';

import { useForgotPasswordViewPresenter } from './presenters/useForgotPasswordViewPresenter';
import { getStyles } from './styles';

export const ForgotPasswordView = () => {
  const { colors, spacing, t } = useUIContext();
  const styles = useMemo(() => getStyles(colors, spacing), [colors, spacing]);
  const { email, emailError, isLoading, onBackToLogin, onChangeEmail, onSubmit } = useForgotPasswordViewPresenter({
    t,
  });

  return (
    <ScreenContainer backgroundColor={colors.white} edges={['top', 'bottom']} isKeyboardAvoiding scrollEnabled>
      <View style={styles.container}>
        <Image
          accessibilityLabel="FastRep"
          resizeMode="contain"
          source={require('@/assets/images/logo-horizontal.png')}
          style={styles.logo}
        />

        <View style={styles.header}>
          <Typography align="center" variant="title">
            {t('auth.forgotPassword.title')}
          </Typography>
          <Typography align="center" color={colors.textSecondary}>
            {t('auth.forgotPassword.explanation')}
          </Typography>
        </View>

        <Input
          autoCapitalize="none"
          autoComplete="email"
          disabled={isLoading}
          error={emailError}
          keyboardType="email-address"
          label={String(t('auth.forgotPassword.email'))}
          maxLength={254}
          onChangeText={onChangeEmail}
          onSubmitEditing={onSubmit}
          returnKeyType="send"
          textContentType="emailAddress"
          value={email}
        />

        <View style={styles.actions}>
          <Button
            disabled={isLoading}
            fullWidth
            loading={isLoading}
            onPress={onSubmit}
            size="large"
            title={String(t('auth.forgotPassword.sendCode'))}
          />
          <Button
            disabled={isLoading}
            onPress={onBackToLogin}
            title={String(t('auth.recovery.backToLogin'))}
            variant="text"
          />
        </View>
      </View>
    </ScreenContainer>
  );
};
