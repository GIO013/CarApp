# Android Testing Guide for Car Dashboard App

## Prerequisites

1. **Node.js and npm** (already installed if you can run `npm start`)
2. **Expo CLI** (usually installed globally or via npx)

## Method 1: Expo Go App (Easiest - Recommended for Quick Testing)

### Steps:
1. **Install Expo Go** on your Android device:
   - Go to Google Play Store
   - Search for "Expo Go"
   - Install it

2. **Start the development server:**
   ```bash
   npm start
   ```
   or
   ```bash
   npx expo start
   ```

3. **Connect your device:**
   - **Option A (Same WiFi):** Make sure your phone and computer are on the same WiFi network. Scan the QR code shown in the terminal with Expo Go app.
   - **Option B (USB/Tunnel):** Press `s` in the terminal to switch to tunnel mode, then scan the QR code.

4. **Open in Expo Go:**
   - Open Expo Go app on your phone
   - Scan the QR code from the terminal
   - The app will load on your device

### Note: 
Some native modules (like `expo-location` and `expo-sensors`) work in Expo Go, but for full native functionality, use Method 2 or 3.

---

## Method 2: Android Emulator (Best for Development)

### Setup Android Studio:
1. **Download Android Studio:**
   - Go to https://developer.android.com/studio
   - Download and install Android Studio

2. **Install Android SDK:**
   - Open Android Studio
   - Go to Tools → SDK Manager
   - Install Android SDK Platform (API 33 or 34 recommended)
   - Install Android SDK Build-Tools
   - Install Android Emulator

3. **Create an Android Virtual Device (AVD):**
   - Open Android Studio
   - Go to Tools → Device Manager
   - Click "Create Device"
   - Choose a device (e.g., Pixel 6)
   - Select a system image (API 33 or 34)
   - Finish setup

4. **Start the emulator:**
   - In Device Manager, click the play button next to your AVD
   - Wait for the emulator to boot

5. **Run your app:**
   ```bash
   npm run android
   ```
   or
   ```bash
   npx expo run:android
   ```

   This will:
   - Build the native Android app
   - Install it on the emulator
   - Launch it automatically

---

## Method 3: Physical Android Device (Best for Real Testing)

### Setup:
1. **Enable Developer Options on your Android device:**
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back to Settings → Developer Options
   - Enable "USB Debugging"

2. **Connect via USB:**
   - Connect your phone to your computer via USB
   - On your phone, allow USB debugging when prompted

3. **Verify connection:**
   ```bash
   adb devices
   ```
   (You may need to install Android SDK Platform Tools for `adb`)

4. **Run the app:**
   ```bash
   npm run android
   ```
   or
   ```bash
   npx expo run:android
   ```

---

## Method 4: Development Build (For Full Native Features)

If you need all native features working properly:

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Configure the project:**
   ```bash
   eas build:configure
   ```

4. **Build for Android:**
   ```bash
   eas build --platform android --profile development
   ```

5. **Install on device:**
   - Download the APK from the build link
   - Install it on your Android device

---

## Troubleshooting

### Common Issues:

1. **"adb: command not found"**
   - Install Android SDK Platform Tools
   - Add to PATH: `C:\Users\YourName\AppData\Local\Android\Sdk\platform-tools`

2. **"No devices found"**
   - Make sure USB debugging is enabled
   - Try `adb kill-server` then `adb start-server`
   - Check USB cable connection

3. **Build errors:**
   - Make sure Java JDK is installed (Android Studio includes it)
   - Check that ANDROID_HOME environment variable is set

4. **Expo Go limitations:**
   - Some native modules may not work in Expo Go
   - Use `expo run:android` for full native support

---

## Quick Start (Recommended)

For the fastest testing experience:

1. **Install Expo Go** on your Android phone
2. **Run:** `npm start`
3. **Scan the QR code** with Expo Go app
4. **Done!** Your app is running on Android

For full native features (location, sensors, etc.), use Method 2 or 3.

---

## Current App Features That Need Native Build:
- ✅ Location services (expo-location)
- ✅ Accelerometer (expo-sensors)
- ✅ Screen orientation (expo-screen-orientation)

These work in Expo Go, but for best performance and full access, use `expo run:android`.

