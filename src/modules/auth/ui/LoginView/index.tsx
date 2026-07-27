import { useMemo } from 'react';
import { Image, View } from 'react-native';

import { Button } from '@/UIKit/Button';
import { Input } from '@/UIKit/Input';
import { ScreenContainer } from '@/UIKit/ScreenContainer';
import { Typography } from '@/UIKit/Typography';
import { useUIContext } from '@/UIProvider/useUIContext';

import { useLoginViewPresenter } from './presenters/useLoginViewPresenter';
import { getStyles } from './styles';

export const LoginView = () => {
  const { colors, spacing, t } = useUIContext();
  const styles = useMemo(() => getStyles(colors, spacing), [colors, spacing]);
  const {
    email,
    emailError,
    isLoading,
    onChangeEmail,
    onChangePassword,
    onPressRegistration,
    onSubmit,
    password,
    passwordError,
  } = useLoginViewPresenter({ t });

  return (
    <ScreenContainer edges={['top', 'bottom']} contentContainerStyle={styles.content} isKeyboardAvoiding scrollEnabled>
      <View style={styles.card}>
        <Image
          accessibilityLabel="FastRep"
          resizeMode="contain"
          source={require('@/assets/images/logo-horizontal.png')}
          style={styles.logo}
        />

        <View style={styles.header}>
          <Typography align="center" variant="title">
            {t('auth.login.title')}
          </Typography>
          <Typography align="center" color={colors.textSecondary}>
            {t('auth.login.description')}
          </Typography>
        </View>

        <View style={styles.fields}>
          <Input
            autoCapitalize="none"
            autoComplete="email"
            disabled={isLoading}
            error={emailError}
            keyboardType="email-address"
            label={String(t('auth.login.email'))}
            onChangeText={onChangeEmail}
            returnKeyType="next"
            textContentType="emailAddress"
            value={email}
          />
          <Input
            autoCapitalize="none"
            autoComplete="current-password"
            disabled={isLoading}
            error={passwordError}
            label={String(t('auth.login.password'))}
            onChangeText={onChangePassword}
            onSubmitEditing={onSubmit}
            returnKeyType="go"
            secureTextEntry
            textContentType="password"
            value={password}
          />
        </View>

        <Button
          disabled={isLoading}
          fullWidth
          loading={isLoading}
          onPress={onSubmit}
          size="large"
          title={String(t('auth.login.logIn'))}
        />

        <Button
          disabled={isLoading}
          onPress={onPressRegistration}
          title={String(t('auth.login.createAccount'))}
          variant="text"
        />
      </View>
    </ScreenContainer>
  );
};
