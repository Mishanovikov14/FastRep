export interface IProps {
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
