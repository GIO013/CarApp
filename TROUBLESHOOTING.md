# Troubleshooting Android Image Error

## Error: "ReadableNativeMap cannot be cast to ReadableArray"

This error typically occurs due to:
1. Metro bundler cache issues
2. Image asset not properly bundled
3. React Native/Expo version compatibility

## Step-by-Step Fix:

### 1. Clear All Caches
```bash
# Stop the current server (Ctrl+C)

# Clear Metro bundler cache
npx expo start --clear

# Or if that doesn't work, clear everything:
rm -rf node_modules
npm install
npx expo start --clear
```

### 2. Rebuild the Android App
```bash
# If using physical device or emulator:
npm run android

# This will rebuild the native app with fresh assets
```

### 3. Check Image File
- Verify `assets/images/background.png` exists
- Ensure the image is a valid PNG file
- Try opening the image in an image viewer to confirm it's not corrupted

### 4. Temporary Workaround - Remove Background
If the error persists, you can temporarily remove the background image to test if that's the issue:

In `App.js`, replace:
```jsx
<ImageBackground source={backgroundSource} ...>
```

With:
```jsx
<View style={[styles.background, { backgroundColor: '#000' }]}>
```

And change the closing tag from `</ImageBackground>` to `</View>`

### 5. Alternative: Use Remote URL Temporarily
To test if it's a local asset issue, try using a remote URL:
```jsx
const backgroundSource = { uri: 'https://images.unsplash.com/photo-1454391304352-2bf4678b1a7a?w=800' };
```

### 6. Check Expo Version Compatibility
Make sure your Expo SDK version supports the image format you're using.

