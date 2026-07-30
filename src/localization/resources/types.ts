export interface TranslationResources {
  auth: {
    environment: {
      productionRequired: string;
    };
    forgotPassword: {
      codeSent: string;
      email: string;
      explanation: string;
      sendCode: string;
      title: string;
      validation: {
        emailInvalid: string;
        emailRequired: string;
      };
    };
    login: {
      createAccount: string;
      description: string;
      email: string;
      forgotPassword: string;
      invalidCredentials: string;
      logIn: string;
      password: string;
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
        passwordMax: string;
        passwordMin: string;
        passwordRequired: string;
        passwordsMismatch: string;
      };
    };
    registrationVerification: {
      accountAlreadyExists: string;
      codeAccessibilityLabel: string;
      codeResent: string;
      confirm: string;
      correctDetails: string;
      description: string;
      emailDestination: string;
      expiredRegistration: string;
      genericError: string;
      invalidCode: string;
      invalidCodeFormat: string;
      networkError: string;
      rateLimited: string;
      resend: string;
      resendIn: string;
      serverUnavailable: string;
      timeoutError: string;
      title: string;
    };
    otp: {
      codeAccessibilityLabel: string;
      codeResent: string;
      codeSentTo: string;
      explanation: string;
      invalidCodeFormat: string;
      resendCode: string;
      resendIn: string;
      title: string;
    };
    recovery: {
      back: string;
      backToLogin: string;
      invalidOrExpiredCode: string;
      networkError: string;
      rateLimited: string;
      serverUnavailable: string;
      timeoutError: string;
      tooManyAttempts: string;
      usedCode: string;
    };
    resetPassword: {
      confirmNewPassword: string;
      explanation: string;
      newPassword: string;
      resetPassword: string;
      success: string;
      title: string;
      validation: {
        confirmPasswordRequired: string;
        passwordMax: string;
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
    back: string;
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
  profile: {
    environment: {
      confirmationMessage: string;
      confirmationTitle: string;
      developmentIndicator: string;
      selectionMessage: string;
      switchAction: string;
      title: string;
    };
    logout: string;
    logoutError: string;
    title: string;
  };
  reports: {
    card: {
      created: string;
      updated: string;
    };
    create: {
      action: string;
      success: string;
      title: string;
    };
    delete: {
      action: string;
      alreadyDeleted: string;
      confirmation: string;
      success: string;
      title: string;
    };
    details: {
      createdAt: string;
      errorDescription: string;
      errorTitle: string;
      noNotes: string;
      notFoundDescription: string;
      notFoundTitle: string;
      title: string;
      updatedAt: string;
    };
    edit: {
      action: string;
      success: string;
      title: string;
    };
    errors: {
      network: string;
      notFound: string;
      server: string;
      timeout: string;
      validation: string;
    };
    form: {
      notes: string;
      notesPlaceholder: string;
      title: string;
      titlePlaceholder: string;
    };
    list: {
      emptyDescription: string;
      emptyTitle: string;
      errorDescription: string;
      errorTitle: string;
      title: string;
    };
    status: {
      draft: string;
      failed: string;
      processing: string;
      ready: string;
    };
    validation: {
      notesMax: string;
      titleMax: string;
      titleRequired: string;
    };
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
    successMessage: string;
    successTitle: string;
    title: string;
  };
}
