# Step-by-Step: Build Your APK

## You're already logged in as: gio013 ✅

## Next Steps:

### Option 1: Build via Command Line (Recommended)

1. **Open PowerShell or Command Prompt** in your project folder:
   ```bash
   cd C:\Users\GIO\Desktop\CarDashboardApp
   ```

2. **Set environment variable to skip Git** (if Git isn't working):
   ```powershell
   $env:EAS_NO_VCS=1
   ```

3. **Configure EAS project** (first time only):
   ```bash
   npx eas-cli build:configure
   ```
   - When asked "Would you like to automatically create an EAS project?", type: **Y**
   - This will link your project to Expo

4. **Start the build**:
   ```bash
   npx eas-cli build --platform android --profile preview
   ```
   - This will create an APK file
   - Build takes 10-20 minutes
   - You'll get a URL to track progress

5. **Download the APK**:
   - Visit the build URL or check your email
   - Download the APK file
   - Install on your Android device

---

### Option 2: Build via Expo Website (Easier)

1. **Go to**: https://expo.dev/accounts/gio013/projects/CarDashboardApp/builds

2. **Click**: "Create a build" or "New Build"

3. **Select**:
   - Platform: **Android**
   - Build profile: **preview** (for APK)
   - Click "Build"

4. **Wait** for the build to complete (10-20 minutes)

5. **Download** the APK when ready

---

### Option 3: Local Build (If you have Android Studio)

If you have Android Studio fully set up, you can build locally:

```bash
npx eas-cli build --platform android --profile preview --local
```

This builds on your computer (faster, but requires Android Studio setup).

---

## What Happens During Build:

1. ✅ Your code is uploaded to Expo's servers
2. ✅ Native Android app is compiled
3. ✅ APK file is generated
4. ✅ You get a download link

## After Build Completes:

1. Download the APK file
2. Transfer to your Android device (USB, email, cloud storage)
3. On your Android device:
   - Go to Settings → Security
   - Enable "Install from Unknown Sources" or "Install Unknown Apps"
   - Open the APK file and install

---

## Troubleshooting:

- **Git errors**: Use `$env:EAS_NO_VCS=1` before commands
- **Login issues**: Run `npx eas-cli login` again
- **Build fails**: Check the build logs in Expo dashboard

---

## Quick Command Reference:

```bash
# Configure project (first time)
npx eas-cli build:configure

# Build APK
npx eas-cli build --platform android --profile preview

# Check build status
npx eas-cli build:list
```

