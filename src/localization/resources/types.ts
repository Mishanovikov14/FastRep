export interface TranslationResources {
  auth: {
    registration: {
      alreadyHaveAccount: string;
      confirmPassword: string;
      createAccount: string;
      email: string;
      fullName: string;
      logIn: string;
      password: string;
      subtitle: string;
      title: string;
      validation: {
        confirmPasswordRequired: string;
        emailInvalid: string;
        emailRequired: string;
        fullNameMax: string;
        fullNameMin: string;
        fullNameRequired: string;
        passwordMin: string;
        passwordRequired: string;
        passwordsMismatch: string;
      };
    };
  };
  common: {
    cancel: string;
    close: string;
    continue: string;
    error: string;
    info: string;
    loading: string;
    no: string;
    retry: string;
    save: string;
    somethingWentWrong: string;
    success: string;
    yes: string;
  };
  home: {
    email: string;
    fullName: string;
    language: string;
    logout: string;
    premium: string;
    title: string;
  };
  languages: {
    english: string;
    french: string;
    german: string;
    spanish: string;
    ukrainian: string;
  };
  showcase: {
    currentLanguage: string;
    description: string;
    showError: string;
    showSuccess: string;
    title: string;
  };
}
