export {};

declare const __dirname: string;

const { readFileSync } = require('fs') as {
  readFileSync(path: string, encoding: 'utf8'): string;
};
const { resolve } = require('path') as {
  resolve(...paths: string[]): string;
};

const remoteEnvironment = 'API_URL=https://api.fastrep.app';

const readProjectFile = (relativePath: string): string => {
  return readFileSync(resolve(__dirname, '..', relativePath), 'utf8');
};

describe('API environment selection', () => {
  it.each(['.env.development', '.env.production', '.env.example'])(
    'configures %s with the shared remote backend',
    environmentFile => {
      expect(readProjectFile(environmentFile).trim()).toBe(remoteEnvironment);
    },
  );

  it('maps Android Debug and Release to tracked environment files', () => {
    const androidBuild = readProjectFile('android/app/build.gradle');

    expect(androidBuild).toContain('debug: ".env.development"');
    expect(androidBuild).toContain('debugoptimized: ".env.development"');
    expect(androidBuild).toContain('release: ".env.production"');
  });

  it('maps iOS Debug and Release to tracked environment files', () => {
    const iosProject = readProjectFile('ios/FastRep.xcodeproj/project.pbxproj');
    const debugConfiguration = iosProject.match(
      /13B07F941A680F5B00A75B9A \/\* Debug \*\/ = \{[\s\S]*?\n\t\t\};/,
    )?.[0];
    const releaseConfiguration = iosProject.match(
      /13B07F951A680F5B00A75B9A \/\* Release \*\/ = \{[\s\S]*?\n\t\t\};/,
    )?.[0];

    expect(debugConfiguration).toContain('ENVFILE = .env.development;');
    expect(releaseConfiguration).toContain('ENVFILE = .env.production;');
  });

  it('keeps localhost out of active environment files and requester setup', () => {
    const activeConfiguration = [
      readProjectFile('.env.development'),
      readProjectFile('.env.production'),
      readProjectFile('src/libs/requester/requester.ts'),
    ].join('\n');

    expect(activeConfiguration).not.toMatch(
      /localhost|127\.0\.0\.1|10\.0\.2\.2/,
    );
  });
});
