export type AppStackParamList = {
  CreateReport: undefined;
  EditReport: {
    reportId: string;
  };
  ReportDetails: {
    reportId: string;
  };
  ReportsList: undefined;
};

export type GuestStackParamList = {
  ForgotPassword: undefined;
  Login: undefined;
  OtpVerification: {
    email: string;
  };
  Registration: undefined;
  ResetPassword: {
    code: string;
    email: string;
  };
};

export type SplashStackParamList = {
  Splash: undefined;
};

export type RootNavigationState = 'app' | 'guest' | 'splash';
