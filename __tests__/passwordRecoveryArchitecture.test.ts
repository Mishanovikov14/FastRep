declare const __dirname: string;

const { readFileSync } = require('fs') as {
  readFileSync(path: string, encoding: 'utf8'): string;
};
const { resolve } = require('path') as {
  resolve(...paths: string[]): string;
};

const readProjectFile = (relativePath: string): string => {
  return readFileSync(resolve(__dirname, '..', relativePath), 'utf8');
};

describe('password-recovery architecture and startup', () => {
  it('configures production releases with the FastRep production API URL', () => {
    expect(readProjectFile('.env.production').trim()).toBe(
      'API_URL=https://api.fastrep.app',
    );
    expect(readProjectFile('android/app/build.gradle')).toContain(
      'release: ".env.production"',
    );
    expect(readProjectFile('ios/FastRep.xcodeproj/project.pbxproj')).toContain(
      'ENVFILE = .env.production;',
    );
  });

  it('registers a mandatory separate OTP route with only email input params', () => {
    const navigation = readProjectFile('src/navigation/RootNavigation.tsx');
    const types = readProjectFile('src/navigation/types.ts');

    expect(navigation).toContain('name="OtpVerification"');
    expect(navigation).toContain('component={OtpVerificationView}');
    expect(types).toMatch(/OtpVerification:\s*\{\s*email: string;\s*\}/);
    expect(types).toMatch(
      /ResetPassword:\s*\{\s*code: string;\s*email: string;\s*\}/,
    );
  });

  it('keeps reset secrets in local navigation flow and outside persistent state', () => {
    const otpPresenter = readProjectFile(
      'src/modules/auth/ui/OtpVerificationView/presenters/useOtpVerificationViewPresenter.ts',
    );
    const resetPresenter = readProjectFile(
      'src/modules/auth/ui/ResetPasswordView/presenters/useResetPasswordViewPresenter.ts',
    );
    const recoverySources = `${otpPresenter}\n${resetPresenter}`;

    expect(recoverySources).not.toMatch(
      /userTokenStorage|MMKV|Keychain|AsyncStorage|useUserStore/,
    );
    expect(recoverySources).not.toMatch(/console\.(log|debug|info)\s*\(/);
  });

  it('uses one continuous branded JavaScript startup state without an intermediate loader', () => {
    const providers = readProjectFile('src/AppProviders.tsx');
    const navigation = readProjectFile('src/navigation/RootNavigation.tsx');
    const splash = readProjectFile('src/modules/home/ui/SplashView/index.tsx');

    expect(providers).not.toContain('<Loader fullscreen');
    expect(navigation).toContain(
      'isSessionRestored: isInitialized && isSessionRestored',
    );
    expect(splash).toContain("logo-horizontal.png");
  });
});
