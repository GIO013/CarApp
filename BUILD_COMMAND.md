# Build APK - Run This Command

## Copy and paste this into PowerShell:

```powershell
$env:EAS_NO_VCS='1'; npx eas-cli build --platform android --profile preview
```

## When prompted:

1. **"Generate a new Android Keystore?"** → Type: **yes** (or just press Enter, as 'yes' is usually the default)

2. The build will then:
   - Generate a keystore for signing your app
   - Upload your code
   - Start building the APK
   - Give you a URL to track progress

## What to expect:

- Build takes **10-20 minutes**
- You'll see a URL like: `https://expo.dev/accounts/gio013/builds/...`
- You'll get an **email** when the build completes
- Download the APK from the build page

---

## Alternative: Use the website

If the command line is giving you trouble:

1. Go to: https://expo.dev/accounts/gio013/projects/CarDashboardApp/builds
2. Click **"Create a build"**
3. Select:
   - Platform: **Android**
   - Profile: **preview**
4. Click **"Build"**

This does the same thing but through the web interface!

