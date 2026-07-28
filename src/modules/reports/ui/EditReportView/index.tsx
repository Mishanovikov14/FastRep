import { useMemo } from 'react';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import { ReportForm } from '@/modules/reports/ui/components/ReportForm';
import type { AppStackParamList } from '@/navigation/types';
import { Button } from '@/UIKit/Button';
import { Header } from '@/UIKit/Header';
import { Loader } from '@/UIKit/Loader';
import { ScreenContainer } from '@/UIKit/ScreenContainer';
import { Typography } from '@/UIKit/Typography';
import { useUIContext } from '@/UIProvider/useUIContext';

import { useEditReportViewPresenter } from './presenters/useEditReportViewPresenter';
import { getStyles } from './styles';

export const EditReportView = () => {
  const route = useRoute<RouteProp<AppStackParamList, 'EditReport'>>();
  const { colors, spacing, t } = useUIContext();
  const styles = useMemo(() => getStyles(spacing), [spacing]);
  const { errors, isError, isLoading, isSubmitting, notes, onChangeNotes, onChangeTitle, onRetry, onSubmit, title } =
    useEditReportViewPresenter({
      reportId: route.params.reportId,
      t,
    });
  const isFormVisible = !isLoading && !isError;

  return (
    <ScreenContainer
      containerStyle={isFormVisible ? undefined : styles.centered}
      contentContainerStyle={isFormVisible ? styles.content : undefined}
      edges={['bottom']}
      headerComponent={<Header showBackButton title={String(t('reports.edit.title'))} />}
      isKeyboardAvoiding={isFormVisible}
      scrollEnabled={isFormVisible}
    >
      {isLoading ? (
        <Loader size="large" />
      ) : isError ? (
        <>
          <Typography align="center" variant="heading">
            {t('reports.details.errorTitle')}
          </Typography>
          <Typography align="center" color={colors.textSecondary}>
            {t('reports.details.errorDescription')}
          </Typography>
          <Button onPress={onRetry} title={String(t('common.retry'))} />
        </>
      ) : (
        <ReportForm
          isSubmitting={isSubmitting}
          notes={notes}
          notesError={errors.notes ? String(t(`reports.validation.${errors.notes}`)) : undefined}
          onChangeNotes={onChangeNotes}
          onChangeTitle={onChangeTitle}
          onSubmit={onSubmit}
          submitTitle={String(t('common.save'))}
          title={title}
          titleError={errors.title ? String(t(`reports.validation.${errors.title}`)) : undefined}
        />
      )}
    </ScreenContainer>
  );
};
