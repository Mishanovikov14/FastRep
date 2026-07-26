export interface TranslationResources {
  auth: {
    login: {
      createAccount: string;
      description: string;
      email: string;
      forgotPassword: string;
      invalidCredentials: string;
      logIn: string;
      password: string;
      passwordRecoveryComingSoon: string;
      title: string;
      validation: {
        emailInvalid: string;
        emailRequired: string;
        passwordMax: string;
        passwordMin: string;
        passwordRequired: string;
      };
    };
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
    session: {
      expired: string;
      genericError: string;
      networkUnavailable: string;
      restoring: string;
      serverError: string;
      timeout: string;
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
    logoutError: string;
    premium: string;
    premiumActive: string;
    premiumInactive: string;
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
