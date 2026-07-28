import type { NavigatorScreenParams } from '@react-navigation/native';

export type AppTabsParamList = {
  Profile: undefined;
  Reports: undefined;
};

export type AppStackParamList = {
  CreateReport: undefined;
  EditReport: {
    reportId: string;
  };
  ReportDetails: {
    reportId: string;
  };
  Tabs: NavigatorScreenParams<AppTabsParamList> | undefined;
};

export type GuestStackParamList = {
  ForgotPassword: undefined;
  Login: undefined;
  OtpVerification: {
    email: string;
  };
  Registration: undefined;
  RegistrationVerification: {
    email: string;
    resendAvailableInSeconds: number;
  };
  ResetPassword: {
    code: string;
    email: string;
  };
};

export type SplashStackParamList = {
  Splash: undefined;
};

export type RootNavigationState = 'app' | 'guest' | 'splash';
