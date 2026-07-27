import { useMemo } from 'react';
import { Image, View } from 'react-native';

import { Button } from '@/UIKit/Button';
import { Input } from '@/UIKit/Input';
import { ScreenContainer } from '@/UIKit/ScreenContainer';
import { Typography } from '@/UIKit/Typography';
import { useUIContext } from '@/UIProvider/useUIContext';

import { useRegistrationViewPresenter } from './presenters/useRegistrationViewPresenter';
import { getStyles } from './styles';

export const RegistrationView = () => {
  const { colors, language, spacing, t } = useUIContext();
  const styles = useMemo(() => getStyles(colors, spacing), [colors, spacing]);
  const {
    confirmPassword,
    email,
    errors,
    fullName,
    isLoading,
    onChangeConfirmPassword,
    onChangeEmail,
    onChangeName,
    onChangePassword,
    onLogin,
    onRegister,
    password,
  } = useRegistrationViewPresenter({
    language,
    t,
  });

  return (
    <ScreenContainer
      backgroundColor={colors.white}
      contentContainerStyle={styles.content}
      isKeyboardAvoiding
      scrollEnabled
    >
      <View style={styles.card}>
        <Image
          accessibilityLabel="FastRep"
          resizeMode="contain"
          source={require('@/assets/images/logo-horizontal.png')}
          style={styles.logo}
        />

        <View style={styles.header}>
          <Typography align="center" variant="title">
            {t('auth.registration.createAccount')}
          </Typography>
          <Typography align="center" color={colors.textSecondary}>
            {t('auth.registration.subtitle')}
          </Typography>
        </View>

        <View style={styles.fields}>
          <Input
            autoCapitalize="words"
            autoComplete="name"
            disabled={isLoading}
            error={errors.fullName}
            label={String(t('auth.registration.fullName'))}
            onChangeText={onChangeName}
            returnKeyType="next"
            textContentType="name"
            value={fullName}
          />
          <Input
            autoCapitalize="none"
            autoComplete="email"
            disabled={isLoading}
            error={errors.email}
            keyboardType="email-address"
            label={String(t('auth.registration.email'))}
            onChangeText={onChangeEmail}
            returnKeyType="next"
            textContentType="emailAddress"
            value={email}
          />
          <Input
            autoCapitalize="none"
            autoComplete="new-password"
            disabled={isLoading}
            error={errors.password}
            label={String(t('auth.registration.password'))}
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
            label={String(t('auth.registration.confirmPassword'))}
            onChangeText={onChangeConfirmPassword}
            returnKeyType="done"
            secureTextEntry
            textContentType="newPassword"
            value={confirmPassword}
          />
        </View>

        <Button
          disabled={isLoading}
          fullWidth
          loading={isLoading}
          onPress={onRegister}
          size="large"
          title={String(t('auth.registration.createAccount'))}
        />

        <View style={styles.login}>
          <Typography color={colors.textSecondary}>
            {t('auth.registration.alreadyHaveAccount')}
          </Typography>
          <Button
            disabled={isLoading}
            onPress={onLogin}
            size="small"
            title={String(t('auth.registration.logIn'))}
            variant="text"
          />
        </View>
      </View>
    </ScreenContainer>
  );
};
