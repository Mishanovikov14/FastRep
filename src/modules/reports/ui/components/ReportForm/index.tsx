import { useMemo } from 'react';
import { View } from 'react-native';

import {
  REPORT_NOTES_MAX_LENGTH,
  REPORT_TITLE_MAX_LENGTH,
} from '@/entities/report/model/reportValidation';
import { Button } from '@/UIKit/Button';
import { Input } from '@/UIKit/Input';
import { useUIContext } from '@/UIProvider/useUIContext';

import { getStyles } from './styles';

interface IProps {
  isSubmitting: boolean;
  notes: string;
  notesError?: string;
  onChangeNotes(value: string): void;
  onChangeTitle(value: string): void;
  onSubmit(): void;
  submitTitle: string;
  title: string;
  titleError?: string;
}

export const ReportForm = ({
  isSubmitting,
  notes,
  notesError,
  onChangeNotes,
  onChangeTitle,
  onSubmit,
  submitTitle,
  title,
  titleError,
}: IProps) => {
  const { spacing, t } = useUIContext();
  const styles = useMemo(() => getStyles(spacing), [spacing]);

  return (
    <View style={styles.form}>
      <Input
        autoCapitalize="sentences"
        disabled={isSubmitting}
        error={titleError}
        label={String(t('reports.form.title'))}
        maxLength={REPORT_TITLE_MAX_LENGTH}
        onChangeText={onChangeTitle}
        placeholder={String(t('reports.form.titlePlaceholder'))}
        returnKeyType="next"
        value={title}
      />
      <Input
        disabled={isSubmitting}
        error={notesError}
        label={String(t('reports.form.notes'))}
        maxLength={REPORT_NOTES_MAX_LENGTH}
        multiline
        onChangeText={onChangeNotes}
        placeholder={String(t('reports.form.notesPlaceholder'))}
        style={styles.notes}
        value={notes}
      />
      <Button
        disabled={isSubmitting}
        fullWidth
        loading={isSubmitting}
        onPress={onSubmit}
        title={submitTitle}
      />
    </View>
  );
};
