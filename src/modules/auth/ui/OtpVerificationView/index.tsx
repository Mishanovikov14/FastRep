import { useMemo } from 'react';
import { Image, View } from 'react-native';

import { Button } from '@/UIKit/Button';
import { Input } from '@/UIKit/Input';
import { ScreenContainer } from '@/UIKit/ScreenContainer';
import { Typography } from '@/UIKit/Typography';
import { useUIContext } from '@/UIProvider/useUIContext';

import { useOtpVerificationViewPresenter } from './presenters/useOtpVerificationViewPresenter';
import { getStyles } from './styles';

export const OtpVerificationView = () => {
  const { colors, spacing, t } = useUIContext();
  const styles = useMemo(() => getStyles(colors, spacing), [colors, spacing]);
  const {
    code,
    codeError,
    email,
    isResendDisabled,
    isResending,
    onBack,
    onChangeCode,
    onContinue,
    onResend,
    resendLabel,
  } = useOtpVerificationViewPresenter({ t });

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
            {t('auth.otp.title')}
          </Typography>
          <Typography align="center" color={colors.textSecondary}>
            {t('auth.otp.explanation')}
          </Typography>
          <Typography align="center" variant="bodyMedium">
            {t('auth.otp.codeSentTo', { email })}
          </Typography>
        </View>

        <Input
          autoComplete="one-time-code"
          error={codeError}
          keyboardType="number-pad"
          label={String(t('auth.otp.verificationCode'))}
          maxLength={6}
          onChangeText={onChangeCode}
          onSubmitEditing={onContinue}
          returnKeyType="done"
          style={styles.otpInput}
          textContentType="oneTimeCode"
          value={code}
        />

        <View style={styles.actions}>
          <Button
            disabled={code.length !== 6}
            fullWidth
            onPress={onContinue}
            size="large"
            title={String(t('common.continue'))}
          />
          <Button
            disabled={isResendDisabled}
            loading={isResending}
            onPress={onResend}
            title={resendLabel}
            variant="text"
          />
          <Button
            disabled={isResending}
            onPress={onBack}
            title={String(t('auth.recovery.back'))}
            variant="text"
          />
        </View>
      </View>
    </ScreenContainer>
  );
};
