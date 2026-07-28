import { useMemo } from 'react';

import { ReportForm } from '@/modules/reports/ui/components/ReportForm';
import { Header } from '@/UIKit/Header';
import { ScreenContainer } from '@/UIKit/ScreenContainer';
import { useUIContext } from '@/UIProvider/useUIContext';

import { useCreateReportViewPresenter } from './presenters/useCreateReportViewPresenter';
import { getStyles } from './styles';

export const CreateReportView = () => {
  const { spacing, t } = useUIContext();
  const styles = useMemo(() => getStyles(spacing), [spacing]);
  const { errors, isSubmitting, notes, onChangeNotes, onChangeTitle, onSubmit, title } = useCreateReportViewPresenter({
    t,
  });

  return (
    <ScreenContainer
      contentContainerStyle={styles.content}
      edges={['bottom']}
      headerComponent={<Header showBackButton title={String(t('reports.create.title'))} />}
      isKeyboardAvoiding
      scrollEnabled
    >
      <ReportForm
        isSubmitting={isSubmitting}
        notes={notes}
        notesError={errors.notes ? String(t(`reports.validation.${errors.notes}`)) : undefined}
        onChangeNotes={onChangeNotes}
        onChangeTitle={onChangeTitle}
        onSubmit={onSubmit}
        submitTitle={String(t('reports.create.action'))}
        title={title}
        titleError={errors.title ? String(t(`reports.validation.${errors.title}`)) : undefined}
      />
    </ScreenContainer>
  );
};
