import { useMemo } from 'react';
import { View } from 'react-native';

import { VerificationCodeInput } from '@/modules/auth/ui/components/VerificationCodeInput';
import { Button } from '@/UIKit/Button';
import { Header } from '@/UIKit/Header';
import { ScreenContainer } from '@/UIKit/ScreenContainer';
import { Typography } from '@/UIKit/Typography';
import { useUIContext } from '@/UIProvider/useUIContext';

import { useRegistrationVerificationViewPresenter } from './presenters/useRegistrationVerificationViewPresenter';
import { getStyles } from './styles';

export const RegistrationVerificationView = () => {
  const { colors, spacing, t } = useUIContext();
  const styles = useMemo(() => getStyles(colors, spacing), [colors, spacing]);
  const {
    code,
    codeError,
    email,
    isResendDisabled,
    isResending,
    isSubmitDisabled,
    isSubmitting,
    onBack,
    onChangeCode,
    onResend,
    onSubmit,
    resendLabel,
  } = useRegistrationVerificationViewPresenter({ t });

  return (
    <ScreenContainer
      backgroundColor={colors.white}
      edges={['bottom']}
      headerComponent={
        <Header
          onBackPress={onBack}
          showBackButton
          title={String(t('auth.registrationVerification.title'))}
        />
      }
      isKeyboardAvoiding
      scrollEnabled
    >
      <View style={styles.container}>
        <View style={styles.introduction}>
          <Typography align="center" color={colors.textSecondary}>
            {t('auth.registrationVerification.description')}
          </Typography>
          <Typography align="center" variant="bodyMedium">
            {t('auth.registrationVerification.emailDestination', { email })}
          </Typography>
        </View>

        <VerificationCodeInput
          accessibilityLabel={String(t('auth.registrationVerification.codeAccessibilityLabel'))}
          disabled={isSubmitting}
          error={codeError}
          onChangeText={onChangeCode}
          value={code}
        />

        <View style={styles.actions}>
          <Button
            disabled={isSubmitDisabled}
            fullWidth
            loading={isSubmitting}
            onPress={onSubmit}
            size="large"
            title={String(t('auth.registrationVerification.confirm'))}
          />
          <Button
            disabled={isResendDisabled || isSubmitting}
            loading={isResending}
            onPress={onResend}
            title={resendLabel}
            variant="text"
          />
          <Button
            disabled={isSubmitting || isResending}
            onPress={onBack}
            title={String(t('auth.registrationVerification.correctDetails'))}
            variant="text"
          />
        </View>
      </View>
    </ScreenContainer>
  );
};
