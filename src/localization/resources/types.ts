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
    attachments: {
      accessFailed: string;
      attentionRequired: string;
      audio: string;
      audioRecordingName: string;
      camera: string;
      cameraPermission: string;
      confirmFailed: string;
      delete: string;
      deleteAccessibility: string;
      deleteConfirmation: string;
      deleteTitle: string;
      documentFailed: string;
      empty: string;
      file: string;
      fileName: string;
      invalid: string;
      microphonePermission: string;
      pauseAccessibility: string;
      permissionTitle: string;
      photo: string;
      photoName: string;
      playFailed: string;
      playAccessibility: string;
      photoConversionFailed: string;
      photoFailed: string;
      recording: string;
      recordingFailed: string;
      rejectionReasons: Record<
        | 'expired'
        | 'invalidContent'
        | 'limitExceeded'
        | 'processingFailed'
        | 'storageUnavailable'
        | 'tooLarge'
        | 'unsupportedType',
        string
      >;
      remove: string;
      removeFailed: string;
      removed: string;
      retryAccessibility: string;
      states: Record<'CONFIRMING' | 'FAILED' | 'LOCAL' | 'READY' | 'REQUESTING_UPLOAD' | 'UPLOADING', string>;
      stop: string;
      title: string;
      tryAgain: string;
      types: Record<'AUDIO' | 'DOCUMENT' | 'IMAGE', string>;
      uploadFailed: string;
      validation: Record<
        | 'audioDurationTooLong'
        | 'fileTooLarge'
        | 'imageDimensionsTooLarge'
        | 'missingFileMetadata'
        | 'reportTotalTooLarge'
        | 'tooManyFiles'
        | 'unsupportedType',
        string
      >;
    };
    fallbackTitle: string;
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
    duplicate: {
      action: string;
      failed: string;
    };
    edit: {
      action: string;
      notEditableDescription: string;
      notEditableTitle: string;
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
    generation: {
      cancel: string;
      cancelFailed: string;
      credits: string;
      description: string;
      errors: Record<
        | 'GENERATION_ALREADY_ACTIVE'
        | 'GENERATION_CREDITS_EXHAUSTED'
        | 'GENERATION_CREDIT_RESERVATION_FAILED'
        | 'GENERATION_DAILY_LIMIT_REACHED'
        | 'GENERATION_DISABLED'
        | 'GENERATION_QUEUE_UNAVAILABLE'
        | 'GENERATION_RATE_LIMITED'
        | 'REPORT_HAS_NO_CONTENT'
        | 'REPORT_HAS_PENDING_UPLOADS'
        | 'REPORT_HAS_REJECTED_ASSETS'
        | 'REPORT_NOT_EDITABLE'
        | 'REPORT_TEMPORARILY_LOCKED'
        | 'generic',
        string
      >;
      failedDescription: string;
      generate: string;
      generated: string;
      lock: { message: string; title: string };
      outputReady: string;
      rejectedAttachments: string;
      retry: string;
      stages: Record<
        'analyzing' | 'completed' | 'creatingPdf' | 'finalizing' | 'generating' | 'preparing' | 'transcribing',
        string
      >;
      startFailed: string;
      title: string;
    };
    list: {
      emptyDescription: string;
      emptyTitle: string;
      errorDescription: string;
      errorTitle: string;
      title: string;
    };
    output: {
      open: string;
      openFailed: string;
      share: string;
      shareFailed: string;
      tryAgain: string;
    };
    status: {
      draft: string;
      failed: string;
      processing: string;
      queued: string;
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
