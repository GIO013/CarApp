# Building APK for Android - Step by Step Guide

## Prerequisites
1. An Expo account (free) - sign up at https://expo.dev
2. Your app is working correctly

## Step 1: Install EAS CLI (if not already installed)
```bash
npm install -g eas-cli
```

**OR use npx (no installation needed):**
```bash
npx eas-cli login
```

## Step 2: Login to Expo
```bash
eas login
```
Enter your Expo account credentials (or create a free account if you don't have one).

## Step 3: Configure the Build
The `eas.json` file has been created with APK build configuration. You can customize it if needed.

## Step 4: Build the APK

### Option A: Build APK for Testing (Preview Build)
```bash
eas build --platform android --profile preview
```

### Option B: Build Production APK
```bash
eas build --platform android --profile production
```

## Step 5: Wait for Build
- The build will run on Expo's servers (takes 10-20 minutes)
- You'll see a URL to track the build progress
- You'll receive an email when the build is complete

## Step 6: Download the APK
- Once the build completes, you'll get a download link
- Download the APK file to your computer
- Transfer it to your Android device and install it

## Alternative: Local Build (Advanced)
If you have Android Studio set up, you can build locally:
```bash
eas build --platform android --profile preview --local
```

## Important Notes:
1. **Package Name**: The app is configured with package name `com.cardashboardapp.app`
   - You can change this in `app.json` under `android.package` if needed
   - Must be unique (reverse domain format)

2. **Permissions**: Location permissions are already configured in `app.json`

3. **First Build**: The first build may take longer as it sets up the build environment

4. **Free Tier**: Expo's free tier includes builds, but there are limits

## Troubleshooting:
- If you get errors, check the build logs in the Expo dashboard
- Make sure all assets (images) are properly included
- Verify your `app.json` configuration is correct

