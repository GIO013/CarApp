# CLAUDE.md - AI Assistant Guide for Car Dashboard App

## Project Overview

This is a **React Native / Expo** car dashboard application that displays real-time vehicle telemetry data including pitch/roll angles (from accelerometer), altitude, speed (from GPS), and outside temperature (from weather API).

### Tech Stack
- **Framework**: React Native with Expo SDK 54
- **Language**: JavaScript (ES6+)
- **Build System**: EAS Build (Expo Application Services)
- **Package Manager**: npm (with yarn.lock also present)

## Project Structure

```
CarApp/
├── App.js                 # Main application component (single-file app)
├── index.js               # Entry point - registers root component
├── app.json               # Expo configuration (permissions, icons, splash)
├── eas.json               # EAS Build configuration
├── package.json           # Dependencies and scripts
├── assets/
│   ├── images/
│   │   ├── background_portrait.jpg   # Portrait mode background
│   │   ├── background_landscape.jpeg # Landscape mode background
│   │   ├── car-rear.png              # Car rear view for roll gauge
│   │   ├── car-side.png              # Car side view for pitch gauge
│   │   ├── round.png                 # Gauge background
│   │   ├── speed.png                 # Speed icon background
│   │   └── temperature.png           # Temperature icon background
│   ├── icon.png           # App icon
│   ├── splash.png         # Splash screen
│   └── adaptive-icon.png  # Android adaptive icon
└── *.md                   # Documentation files
```

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `expo` (~54.0.0) | Core Expo framework |
| `expo-location` (~18.0.0) | GPS for altitude and speed |
| `expo-sensors` (~14.0.0) | Accelerometer for pitch/roll |
| `expo-screen-orientation` (~8.0.0) | Handle portrait/landscape |
| `react-native-svg` (15.8.0) | SVG rendering for gauges |

## Development Commands

```bash
# Start development server
npm start

# Run on Android (requires emulator or device)
npm run android

# Run on iOS (macOS only)
npm run ios

# Start with cleared cache
npx expo start --clear
```

## Building APK

### Using EAS Build (Recommended)
```bash
# Login to Expo (required once)
eas login

# Build preview APK
eas build --platform android --profile preview

# Build production APK
eas build --platform android --profile production

# Local build (requires Android Studio)
eas build --platform android --profile preview --local
```

### Windows PowerShell (Skip Git Issues)
```powershell
$env:EAS_NO_VCS='1'; eas build --platform android --profile preview
```

## App Architecture

### Main Component (`App.js`)
The entire application is contained in a single `App.js` file with:

1. **`Gauge` Component** (lines 34-171): SVG-based circular gauge displaying pitch or roll angles with:
   - Semi-circular progress arc
   - Tick marks at 10-degree intervals
   - Car image that tilts based on angle value
   - Glowing radial gradient effect

2. **`App` Component** (lines 173-415): Main app with:
   - State management for sensor data, location, and weather
   - Accelerometer subscription for pitch/roll
   - Location polling (every 5 seconds) for altitude/speed
   - Weather API calls to Open-Meteo
   - Responsive layout for portrait/landscape

### Data Flow
```
Accelerometer → rawPitch/rawRoll → calibration offset → displayed value
GPS Location → altitude (meters), speed (km/h)
Open-Meteo API → temperature (Celsius)
```

## Code Conventions

### Styling
- All styles defined in `StyleSheet.create()` at file bottom
- Dark theme with neon accent colors:
  - Cyan (`#00e5ff`) - altitude, calibrate button
  - Green (`#7cfc00`) - pitch gauge
  - Orange (`#ff8c00`) - roll gauge
- Responsive sizing based on screen dimensions

### State Management
- React `useState` for all state
- `useEffect` for side effects (sensors, location, orientation)
- No external state management library

### Naming Conventions
- PascalCase for components (`Gauge`, `App`)
- camelCase for variables and functions
- SCREAMING_SNAKE_CASE for constants (e.g., `SCREEN_WIDTH`)

## Configuration Files

### `app.json`
- **Package ID**: `com.cardashboard.app`
- **Permissions**: `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `INTERNET`
- **EAS Project ID**: `486d94e3-dbcc-4f2d-8e29-515e3c765f6d`

### `eas.json`
- **preview**: Builds APK for internal testing
- **production**: Builds APK for distribution
- Both use `distribution: internal`

## External APIs

### Open-Meteo Weather API
```
GET https://api.open-meteo.com/v1/forecast
  ?latitude={lat}&longitude={lon}
  &current_weather=true
  &temperature_unit=celsius
```
- Free, no API key required
- Returns `current_weather.temperature`

## Common Tasks for AI Assistants

### Adding New Sensor Data
1. Import from appropriate `expo-*` package
2. Add state variable in `App` component
3. Set up subscription in `useEffect` with cleanup
4. Display in the UI (both portrait and landscape layouts)

### Modifying Gauge Appearance
- Gauge component accepts: `value`, `max`, `color`, `title`, `carImage`, `isLandscape`
- Tick marks defined in `ticks` and `majorTicks` arrays
- Arc length calculated from `circumference / 2` (half-circle gauge)

### Adding New Data Panel
1. Create icon background image in `assets/images/`
2. Add to `assetBundlePatterns` in `app.json`
3. Import with `require()`
4. Add UI in both `{orientation ? (...) : (...)}` branches

### Updating Permissions
Edit `app.json` under `expo.android.permissions` and `expo.plugins`

## Troubleshooting

### "ReadableNativeMap cannot be cast to ReadableArray"
- Clear Metro cache: `npx expo start --clear`
- Rebuild: `rm -rf node_modules && npm install`

### Location/Sensor Issues
- Verify permissions in `app.json`
- Test on physical device (emulators have limited sensor support)

### Build Failures
- Check EAS dashboard for logs
- Verify all images exist and are valid
- Ensure `app.json` configuration is valid JSON

## Testing

### Quick Testing (Expo Go)
1. Install Expo Go on Android device
2. Run `npm start`
3. Scan QR code with Expo Go

### Native Feature Testing
For full accelerometer/GPS functionality, use:
- Android emulator with `npm run android`
- Physical device with USB debugging
- Development build via EAS

## Important Notes for AI Assistants

1. **Single-file architecture**: All app logic is in `App.js`. Consider this when making changes - no separate component files exist.

2. **Dual layouts**: Portrait and landscape modes have separate UI code branches. Changes to displayed data require updating both.

3. **Calibration**: The calibrate button sets current pitch/roll as the zero reference point. State is in `pitchOffset`/`rollOffset`.

4. **No TypeScript**: Project uses plain JavaScript. Type annotations are not used.

5. **No tests**: No test files exist. Manual testing via Expo Go or device builds is the current workflow.

6. **Windows development**: Primary development appears to be on Windows (PowerShell scripts, Windows paths in docs).

7. **Asset bundling**: New images must be added to `assetBundlePatterns` in `app.json` to be included in builds.
