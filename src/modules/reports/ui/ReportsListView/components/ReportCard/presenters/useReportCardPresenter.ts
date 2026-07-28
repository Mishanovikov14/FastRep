import type { TFunction } from 'i18next';
import { useCallback, useMemo } from 'react';
import type {
  PressableStateCallbackType,
  StyleProp,
  ViewStyle,
} from 'react-native';

import type { IReport } from '@/entities/report/types/report';
import type { SupportedLanguage } from '@/localization/types';
import { formatLocalizedDate } from '@/utils/formatLocalizedDate';

interface IInput {
  cardPressedStyle: StyleProp<ViewStyle>;
  cardStyle: StyleProp<ViewStyle>;
  language: SupportedLanguage;
  onPress(report: IReport): void;
  report: IReport;
  t: TFunction;
}

export const useReportCardPresenter = ({
  cardPressedStyle,
  cardStyle,
  language,
  onPress,
  report,
  t,
}: IInput) => {
  const isUpdated = report.updatedAt !== report.createdAt;
  const dateLabel = useMemo(
    () =>
      String(
        t(isUpdated ? 'reports.card.updated' : 'reports.card.created', {
          date: formatLocalizedDate(
            isUpdated ? report.updatedAt : report.createdAt,
            language,
          ),
        }),
      ),
    [isUpdated, language, report.createdAt, report.updatedAt, t],
  );

  const onPressCard = useCallback(() => {
    onPress(report);
  }, [onPress, report]);

  const getCardStyle = useCallback(
    ({ pressed }: PressableStateCallbackType): StyleProp<ViewStyle> => [
      cardStyle,
      pressed && cardPressedStyle,
    ],
    [cardPressedStyle, cardStyle],
  );

  return {
    dateLabel,
    getCardStyle,
    onPressCard,
  };
};
