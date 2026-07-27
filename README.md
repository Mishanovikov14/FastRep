This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Environment

FastRep uses one canonical `API_URL` variable through `react-native-config`. Normal Debug
and Release builds both use the shared remote backend:

```sh
API_URL=https://api.fastrep.app
```

- iOS Debug and Release: `.env`
- Android Debug and DebugOptimized: `.env.development`
- Android Release: `.env.production`

These environment files are tracked, so a clean checkout resolves the same backend without a
developer-specific override. The iOS `react-native-config` CocoaPods target reads the root `.env`
for both configurations; app-target `ENVFILE` build settings do not propagate to that pod target.
Application code reads the backend URL only through
`react-native-config`; requester and feature code must not contain platform-specific fallbacks.

To explicitly use a local backend later, create an ignored `.env.local`, choose the URL that is
reachable from the target, and select that file only for the intended launch:

```sh
API_URL=http://localhost:3000
ENVFILE=.env.local npm run ios
ENVFILE=.env.local npm run android
```

For the standard Android emulator, use `http://10.0.2.2:3000` in `.env.local`. For a physical
device, use the development machine's reachable LAN address and ensure both devices share a
network. Never commit `.env.local`. Environment values are embedded in native builds, so stop the
running app and rebuild it after changing the selected file; Fast Refresh is not sufficient.

# Typography

FastRep bundles **Google Sans Flex** locally; the application never downloads fonts at runtime.
The four application files are official Google Fonts static 24pt optical-size TTF instances:

- `GoogleSansFlex_24pt-Regular.ttf` — 400
- `GoogleSansFlex_24pt-Medium.ttf` — 500
- `GoogleSansFlex_24pt-SemiBold.ttf` — 600
- `GoogleSansFlex_24pt-Bold.ttf` — 700

Source: [Google Fonts — Google Sans Flex](https://fonts.google.com/specimen/Google+Sans+Flex).
The original SIL Open Font License 1.1 is stored at
`assets/fonts/licenses/GoogleSansFlex-OFL.txt`.

Google Fonts currently publishes Google Sans Flex without Cyrillic coverage. FastRep therefore
uses an explicit system-font fallback for Ukrainian (`uk`), including `і ї є ґ І Ї Є Ґ`, until
Google publishes an official Cyrillic-capable Google Sans Flex file or subset.

After changing files under `assets/fonts`, relink and inspect the native diff:

```sh
npx react-native-asset
```

Application UI must use `Typography` and the font tokens exposed by `UIProvider`. Do not hardcode
font-family names in screens or feature components.

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
