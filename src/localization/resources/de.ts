import type { TranslationResources } from './types';

export const de: TranslationResources = {
  auth: {
    forgotPassword: {
      codeSent:
        'Falls ein Konto für diese E-Mail existiert, wurde ein Bestätigungscode gesendet.',
      email: 'E-Mail',
      explanation:
        'Geben Sie Ihre E-Mail ein, um einen sechsstelligen Bestätigungscode zu erhalten.',
      sendCode: 'Code senden',
      title: 'Passwort vergessen',
      validation: {
        emailInvalid: 'Geben Sie eine gültige E-Mail-Adresse ein.',
        emailRequired: 'E-Mail ist erforderlich.',
      },
    },
    login: {
      createAccount: 'Konto erstellen',
      description: 'Melden Sie sich an, um FastRep weiter zu nutzen.',
      email: 'E-Mail',
      forgotPassword: 'Passwort vergessen?',
      invalidCredentials: 'Die E-Mail-Adresse oder das Passwort ist falsch.',
      logIn: 'Anmelden',
      password: 'Passwort',
      title: 'Willkommen zurück',
      validation: {
        emailInvalid: 'Geben Sie eine gültige E-Mail-Adresse ein.',
        emailRequired: 'E-Mail ist erforderlich.',
        passwordMax: 'Das Passwort darf höchstens 128 Zeichen enthalten.',
        passwordMin: 'Das Passwort muss mindestens 8 Zeichen enthalten.',
        passwordRequired: 'Das Passwort ist erforderlich.',
      },
    },
    registration: {
      alreadyHaveAccount: 'Sie haben bereits ein Konto?',
      confirmPassword: 'Passwort bestätigen',
      createAccount: 'Konto erstellen',
      email: 'E-Mail',
      fullName: 'Vollständiger Name',
      logIn: 'Anmelden',
      password: 'Passwort',
      subtitle: 'Erstellen Sie Ihr FastRep-Konto, um loszulegen.',
      title: 'Konto erstellen',
      validation: {
        confirmPasswordRequired: 'Bestätigen Sie Ihr Passwort.',
        emailInvalid: 'Geben Sie eine gültige E-Mail-Adresse ein.',
        emailRequired: 'E-Mail ist erforderlich.',
        fullNameMax: 'Der vollständige Name darf höchstens 80 Zeichen enthalten.',
        fullNameMin: 'Der vollständige Name muss mindestens 2 Zeichen enthalten.',
        fullNameRequired: 'Der vollständige Name ist erforderlich.',
        passwordMax: 'Das Passwort darf höchstens 128 Zeichen enthalten.',
        passwordMin: 'Das Passwort muss mindestens 8 Zeichen enthalten.',
        passwordRequired: 'Das Passwort ist erforderlich.',
        passwordsMismatch: 'Die Passwörter stimmen nicht überein.',
      },
    },
    otp: {
      codeResent:
        'Falls ein Konto für diese E-Mail existiert, wurde ein neuer Code gesendet.',
      codeSentTo: 'Code gesendet an {{email}}',
      explanation: 'Geben Sie den sechsstelligen Code aus Ihrer E-Mail ein.',
      invalidCodeFormat: 'Geben Sie genau sechs Ziffern ein.',
      resendCode: 'Code erneut senden',
      resendIn: 'Erneut senden in {{seconds}} s',
      title: 'Bestätigungscode eingeben',
      verificationCode: 'Bestätigungscode',
    },
    recovery: {
      back: 'Zurück',
      backToLogin: 'Zurück zur Anmeldung',
      invalidOrExpiredCode: 'Der Bestätigungscode ist ungültig oder abgelaufen.',
      networkError:
        'Keine Internetverbindung. Prüfen Sie Ihre Verbindung und versuchen Sie es erneut.',
      rateLimited: 'Zu viele Anfragen. Bitte warten Sie vor dem nächsten Versuch.',
      serverUnavailable:
        'Der Server ist vorübergehend nicht verfügbar. Versuchen Sie es später erneut.',
      timeoutError: 'Die Zeitüberschreitung für die Anfrage wurde erreicht.',
      tooManyAttempts:
        'Zu viele fehlgeschlagene Versuche. Fordern Sie einen neuen Code an.',
      usedCode: 'Dieser Code wurde bereits verwendet. Fordern Sie einen neuen an.',
    },
    resetPassword: {
      confirmNewPassword: 'Neues Passwort bestätigen',
      explanation: 'Wählen Sie ein neues Passwort für Ihr FastRep-Konto.',
      newPassword: 'Neues Passwort',
      resetPassword: 'Passwort zurücksetzen',
      success:
        'Ihr Passwort wurde zurückgesetzt. Melden Sie sich mit dem neuen Passwort an.',
      title: 'Passwort zurücksetzen',
      validation: {
        confirmPasswordRequired: 'Bestätigen Sie Ihr neues Passwort.',
        passwordMax: 'Das Passwort darf höchstens 128 Zeichen enthalten.',
        passwordMin: 'Das Passwort muss mindestens 8 Zeichen enthalten.',
        passwordRequired: 'Das Passwort ist erforderlich.',
        passwordsMismatch: 'Die Passwörter stimmen nicht überein.',
      },
    },
    session: {
      expired: 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.',
      genericError:
        'Die Authentifizierung konnte nicht abgeschlossen werden. Bitte versuchen Sie es erneut.',
      networkUnavailable:
        'Keine Internetverbindung. Prüfen Sie Ihre Verbindung und versuchen Sie es erneut.',
      restoring: 'Ihre Sitzung wird wiederhergestellt…',
      serverError:
        'Der Server ist vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.',
      timeout:
        'Die Zeitüberschreitung für die Anfrage wurde erreicht. Bitte versuchen Sie es erneut.',
    },
  },
  common: {
    cancel: 'Abbrechen',
    close: 'Schließen',
    continue: 'Weiter',
    error: 'Fehler',
    info: 'Information',
    loading: 'Wird geladen',
    no: 'Nein',
    retry: 'Erneut versuchen',
    save: 'Speichern',
    somethingWentWrong: 'Etwas ist schiefgelaufen',
    success: 'Erfolg',
    yes: 'Ja',
  },
  home: {
    email: 'E-Mail',
    fullName: 'Vollständiger Name',
    language: 'Sprache',
    logout: 'Abmelden',
    logoutError:
      'Sie wurden auf diesem Gerät abgemeldet, der Server konnte jedoch nicht benachrichtigt werden.',
    premium: 'Premium',
    premiumActive: 'Aktiv',
    premiumInactive: 'Inaktiv',
    title: 'Startseite',
  },
  languages: {
    english: 'Englisch',
    french: 'Französisch',
    german: 'Deutsch',
    spanish: 'Spanisch',
    ukrainian: 'Ukrainisch',
  },
  showcase: {
    currentLanguage: 'Aktuelle Sprache',
    description: 'Demo der wiederverwendbaren Anwendungsgrundlage',
    showError: 'Fehler anzeigen',
    showSuccess: 'Erfolg anzeigen',
    title: 'FastRep Grundlage',
  },
};
