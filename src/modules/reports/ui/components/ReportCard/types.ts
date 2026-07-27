import type { IReport } from '@/entities/report/types/report';

export interface IProps {
  onPress(report: IReport): void;
  report: IReport;
}
