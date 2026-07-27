import type { TranslationResources } from './types';

export const fr: TranslationResources = {
  auth: {
    forgotPassword: {
      codeSent:
        'Si un compte existe pour cet e-mail, nous avons envoyé un code de vérification.',
      email: 'E-mail',
      explanation:
        'Saisissez votre e-mail pour recevoir un code de vérification à six chiffres.',
      sendCode: 'Envoyer le code',
      title: 'Mot de passe oublié',
      validation: {
        emailInvalid: 'Saisissez une adresse e-mail valide.',
        emailRequired: "L'adresse e-mail est requise.",
      },
    },
    login: {
      createAccount: 'Créer un compte',
      description: 'Connectez-vous pour continuer à utiliser FastRep.',
      email: 'E-mail',
      forgotPassword: 'Mot de passe oublié ?',
      invalidCredentials: "L'adresse e-mail ou le mot de passe est incorrect.",
      logIn: 'Se connecter',
      password: 'Mot de passe',
      title: 'Bon retour',
      validation: {
        emailInvalid: 'Saisissez une adresse e-mail valide.',
        emailRequired: "L'adresse e-mail est requise.",
        passwordMax: 'Le mot de passe ne doit pas dépasser 128 caractères.',
        passwordMin: 'Le mot de passe doit contenir au moins 8 caractères.',
        passwordRequired: 'Le mot de passe est requis.',
      },
    },
    registration: {
      alreadyHaveAccount: 'Vous avez déjà un compte ?',
      confirmPassword: 'Confirmer le mot de passe',
      createAccount: 'Créer un compte',
      email: 'E-mail',
      fullName: 'Nom complet',
      logIn: 'Se connecter',
      password: 'Mot de passe',
      subtitle: 'Créez votre compte FastRep pour commencer.',
      title: 'Créer votre compte',
      validation: {
        confirmPasswordRequired: 'Confirmez votre mot de passe.',
        emailInvalid: 'Saisissez une adresse e-mail valide.',
        emailRequired: "L'adresse e-mail est requise.",
        fullNameMax: 'Le nom complet ne doit pas dépasser 80 caractères.',
        fullNameMin: 'Le nom complet doit contenir au moins 2 caractères.',
        fullNameRequired: 'Le nom complet est requis.',
        passwordMax: 'Le mot de passe ne doit pas dépasser 128 caractères.',
        passwordMin: 'Le mot de passe doit contenir au moins 8 caractères.',
        passwordRequired: 'Le mot de passe est requis.',
        passwordsMismatch: 'Les mots de passe ne correspondent pas.',
      },
    },
    otp: {
      codeResent:
        'Si un compte existe pour cet e-mail, nous avons envoyé un nouveau code.',
      codeSentTo: 'Code envoyé à {{email}}',
      explanation: 'Saisissez le code à six chiffres reçu par e-mail.',
      invalidCodeFormat: 'Saisissez exactement six chiffres.',
      resendCode: 'Renvoyer le code',
      resendIn: 'Renvoyer dans {{seconds}} s',
      title: 'Saisir le code de vérification',
      verificationCode: 'Code de vérification',
    },
    recovery: {
      back: 'Retour',
      backToLogin: 'Retour à la connexion',
      invalidOrExpiredCode: 'Le code de vérification est invalide ou expiré.',
      networkError:
        'Aucune connexion Internet. Vérifiez votre connexion et réessayez.',
      rateLimited: 'Trop de demandes. Veuillez patienter avant de réessayer.',
      serverUnavailable:
        'Le serveur est temporairement indisponible. Veuillez réessayer plus tard.',
      timeoutError: "Le délai d'attente de la requête a été dépassé.",
      tooManyAttempts:
        'Trop de tentatives infructueuses. Demandez un nouveau code.',
      usedCode: 'Ce code a déjà été utilisé. Demandez un nouveau code.',
    },
    resetPassword: {
      confirmNewPassword: 'Confirmer le nouveau mot de passe',
      explanation: 'Choisissez un nouveau mot de passe pour votre compte FastRep.',
      newPassword: 'Nouveau mot de passe',
      resetPassword: 'Réinitialiser le mot de passe',
      success:
        'Votre mot de passe a été réinitialisé. Connectez-vous avec le nouveau.',
      title: 'Réinitialiser le mot de passe',
      validation: {
        confirmPasswordRequired: 'Confirmez votre nouveau mot de passe.',
        passwordMax: 'Le mot de passe ne doit pas dépasser 128 caractères.',
        passwordMin: 'Le mot de passe doit contenir au moins 8 caractères.',
        passwordRequired: 'Le mot de passe est requis.',
        passwordsMismatch: 'Les mots de passe ne correspondent pas.',
      },
    },
    session: {
      expired: 'Votre session a expiré. Veuillez vous reconnecter.',
      genericError: "L'authentification n'a pas pu aboutir. Veuillez réessayer.",
      networkUnavailable:
        'Aucune connexion Internet. Vérifiez votre connexion et réessayez.',
      restoring: 'Restauration de votre session…',
      serverError:
        'Le serveur est temporairement indisponible. Veuillez réessayer plus tard.',
      timeout: "Le délai d'attente de la requête a été dépassé. Veuillez réessayer.",
    },
  },
  common: {
    cancel: 'Annuler',
    close: 'Fermer',
    continue: 'Continuer',
    error: 'Erreur',
    info: 'Information',
    loading: 'Chargement',
    no: 'Non',
    retry: 'Réessayer',
    save: 'Enregistrer',
    somethingWentWrong: "Une erreur s'est produite",
    success: 'Succès',
    yes: 'Oui',
  },
  home: {
    email: 'E-mail',
    fullName: 'Nom complet',
    language: 'Langue',
    logout: 'Se déconnecter',
    logoutError:
      "Vous avez été déconnecté sur cet appareil, mais le serveur n'a pas pu être averti.",
    premium: 'Premium',
    premiumActive: 'Actif',
    premiumInactive: 'Inactif',
    title: 'Accueil',
  },
  languages: {
    english: 'Anglais',
    french: 'Français',
    german: 'Allemand',
    spanish: 'Espagnol',
    ukrainian: 'Ukrainien',
  },
  showcase: {
    currentLanguage: 'Langue actuelle',
    description: "Présentation de la base réutilisable de l'application",
    showError: "Afficher l'erreur",
    showSuccess: 'Afficher le succès',
    title: 'Base FastRep',
  },
};
