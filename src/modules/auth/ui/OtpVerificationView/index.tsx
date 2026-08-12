import { useMemo } from 'react';
import { Image, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VerificationCodeInput } from '@/modules/auth/ui/components/VerificationCodeInput';
import { Button } from '@/UIKit/Button';
import { ScreenContainer } from '@/UIKit/ScreenContainer';
import { Typography } from '@/UIKit/Typography';
import { useUIContext } from '@/UIProvider/useUIContext';

import { useOtpVerificationViewPresenter } from './presenters/useOtpVerificationViewPresenter';
import { getStyles } from './styles';

export const OtpVerificationView = () => {
  const { colors, spacing, t } = useUIContext();
  const { top } = useSafeAreaInsets();
  const styles = useMemo(() => getStyles(colors, spacing, top), [colors, spacing, top]);
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
    <ScreenContainer backgroundColor={colors.white} edges={['bottom']} isKeyboardAvoiding scrollEnabled>
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

        <VerificationCodeInput
          accessibilityLabel={String(t('auth.otp.codeAccessibilityLabel'))}
          error={codeError}
          onChangeText={onChangeCode}
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
          <Button disabled={isResending} onPress={onBack} title={String(t('auth.recovery.back'))} variant="text" />
        </View>
      </View>
    </ScreenContainer>
  );
};
