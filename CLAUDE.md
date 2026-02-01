# CLAUDE.md - AI Assistant Guide for Car Dashboard App

## Quick Reference

```bash
npm start              # Start dev server, scan QR with Expo Go
npm run android        # Run on Android emulator/device
npx expo start --clear # Clear cache and restart
```

```bash
# Build APK (Windows)
$env:EAS_NO_VCS='1'; eas build --platform android --profile preview
```

**Key file**: `App.js` - entire app in single file (614 lines)

---

## Project Overview

React Native / Expo car dashboard app displaying real-time vehicle telemetry:
- **Pitch/Roll angles** from device accelerometer
- **Altitude** (meters) and **Speed** (km/h) from GPS
- **Outside temperature** from Open-Meteo weather API
- Responsive **portrait and landscape** layouts

### Tech Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| React Native | 0.76.9 | Mobile framework |
| Expo SDK | 54.0.0 | Development platform |
| React | 18.3.1 | UI library |
| react-native-svg | 15.8.0 | Gauge rendering |

---

## Project Structure

```
CarApp/
├── App.js                 # MAIN FILE - all components and logic
├── index.js               # Entry point (8 lines)
├── app.json               # Expo config, permissions, assets
├── eas.json               # Build profiles (preview, production)
├── package.json           # Dependencies
├── assets/
│   └── images/
│       ├── background_portrait.jpg   # Portrait background
│       ├── background_landscape.jpeg # Landscape background
│       ├── car-rear.png    # Roll gauge car image
│       ├── car-side.png    # Pitch gauge car image
│       ├── round.png       # Gauge circular background
│       ├── speed.png       # Speed icon glow
│       └── temperature.png # Temp icon glow
```

---

## App.js Deep Dive

### File Structure
| Lines | Content |
|-------|---------|
| 1-16 | Imports |
| 18-32 | Constants and image requires |
| 34-171 | `Gauge` component |
| 173-416 | `App` component |
| 418-614 | `StyleSheet` definitions |

### State Variables (`App` component, lines 174-182)

```javascript
rawPitch, setRawPitch       // Raw accelerometer pitch (default: 13)
rawRoll, setRawRoll         // Raw accelerometer roll (default: -14)
pitchOffset, setPitchOffset // Calibration offset for pitch
rollOffset, setRollOffset   // Calibration offset for roll
altitude, setAltitude       // GPS altitude in meters (default: 6750)
speed, setSpeed             // GPS speed in km/h (default: 35)
temperature, setTemperature // Weather temp in Celsius
loadingWeather              // Weather loading state
orientation                 // true = landscape, false = portrait
```

### Computed Values (lines 184-187)
```javascript
// Orientation swaps pitch/roll axes and applies calibration
roll = (orientation ? rawRoll : rawPitch) - offset
pitch = (orientation ? rawPitch : rawRoll) - offset
roll_land = roll   // Used in landscape
pitch_land = -pitch // Inverted for landscape display
```

### useEffect Hooks

| Lines | Purpose | Interval |
|-------|---------|----------|
| 189-206 | Screen orientation listener | Event-based |
| 213-220 | Location permission request | Once on mount |
| 222-231 | Accelerometer subscription | 200ms updates |
| 233-250 | GPS location polling + weather | 5000ms (5 sec) |

### Gauge Component Props (line 34)
```javascript
Gauge({ value, max=50, color='#00ff88', title='PITCH', carImage, isLandscape })
```

### Gauge Math (lines 36-44)
```javascript
size = isLandscape ? SCREEN_HEIGHT * 0.35 : SCREEN_WIDTH * 0.32
radius = size * 0.36
circumference = 2 * Math.PI * radius
normalizedValue = clamp(value, -max, max)
progress = (normalizedValue + max) / (2 * max)  // 0 to 1
arcLength = circumference / 2  // Semi-circle
carTilt = value * 1.5  // Visual rotation multiplier
```

---

## Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Cyan | `#00e5ff` | Altitude text, calibrate button |
| Lime Green | `#7cfc00` | Pitch gauge |
| Orange | `#ff8c00` | Roll gauge |
| White | `#fff` | Speed/temp values |
| Gray | `#999` | Labels ("Speed", "Outside") |
| Black | `#000` | Background fallback |

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ ACCELEROMETER (200ms)                                       │
│ Accelerometer.addListener → x,y,z → atan2 → pitch/roll     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ CALIBRATION                                                 │
│ rawPitch - pitchOffset = displayed pitch                    │
│ rawRoll - rollOffset = displayed roll                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ GAUGE RENDERING                                             │
│ value → normalize → progress arc + car tilt                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ GPS LOCATION (5 sec polling)                                │
│ Location.getCurrentPositionAsync → altitude (m), speed (m/s)│
│ speed * 3.6 → km/h                                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ WEATHER API (on location update)                            │
│ lat/lon → Open-Meteo → temperature (°C)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Dual Layout Architecture

The app renders completely different UI trees for portrait vs landscape:

```javascript
{orientation ? (
  // LANDSCAPE: lines 280-342
  // Horizontal row: [Pitch Gauge] [Altitude + Info] [Roll Gauge]
) : (
  // PORTRAIT: lines 344-407
  // Vertical stack: Altitude → Roll → Pitch → Bottom Info Bar
)}
```

**CRITICAL**: Any UI change must be made in BOTH branches.

### Layout Differences
| Element | Portrait | Landscape |
|---------|----------|-----------|
| Gauges | Stacked vertically | Side by side |
| Info panel | Fixed bottom bar | Center column |
| Gauge size | `SCREEN_WIDTH * 0.32` | `SCREEN_HEIGHT * 0.35` |
| Altitude | Top | Center |

---

## Common Modifications

### Add a New Data Display

1. **Add state** (after line 182):
```javascript
const [newData, setNewData] = useState(null);
```

2. **Add data source** (new useEffect):
```javascript
useEffect(() => {
  const subscription = SomeAPI.addListener(data => {
    setNewData(data);
  });
  return () => subscription.remove();
}, []);
```

3. **Add to BOTH layouts**:
   - Landscape: inside `altitudeAndInfoPanel` (around line 291)
   - Portrait: inside `portraitBottomInfoRow` (around line 371)

### Change Gauge Range

Edit the `max` prop when calling `<Gauge>`:
```javascript
<Gauge value={pitch} max={45} .../>  // Change from 50 to 45
```

Also update tick marks in Gauge component (lines 48-49):
```javascript
const ticks = [-40, -30, -20, -10, 10, 20, 30, 40];
const majorTicks = [-30, -20, -10, 10, 20, 30];
```

### Change Update Frequency

- **Accelerometer** (line 223): `Accelerometer.setUpdateInterval(200)` - milliseconds
- **GPS polling** (line 248): `setInterval(updateLocation, 5000)` - milliseconds

### Add New Permission

1. Edit `app.json` under `expo.android.permissions`:
```json
"permissions": ["ACCESS_FINE_LOCATION", "NEW_PERMISSION"]
```

2. If using Expo plugin, add to `expo.plugins` array

---

## API Reference

### Open-Meteo Weather (lines 252-268)
```
GET https://api.open-meteo.com/v1/forecast
    ?latitude={lat}
    &longitude={lon}
    &current_weather=true
    &temperature_unit=celsius

Response: { current_weather: { temperature: number } }
```
- Free, no API key
- Called on each GPS location update

---

## Build Configuration

### eas.json Profiles
```json
{
  "preview": {    // For testing - outputs APK
    "distribution": "internal",
    "android": { "buildType": "apk" }
  },
  "production": { // For release - outputs APK
    "distribution": "internal",
    "android": { "buildType": "apk" }
  }
}
```

### app.json Key Settings
```json
{
  "expo": {
    "name": "Car Dashboard",
    "slug": "CarDashboardApp",
    "android": {
      "package": "com.cardashboard.app",
      "permissions": ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION", "INTERNET"]
    },
    "plugins": ["expo-location", "expo-sensors"],
    "assetBundlePatterns": ["assets/images/*"]  // Include images in build
  }
}
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Metro cache issues | `npx expo start --clear` |
| "ReadableNativeMap" error | `rm -rf node_modules && npm install` |
| Sensors not working | Test on physical device, not emulator |
| Images not loading | Check `assetBundlePatterns` in app.json |
| Git errors on Windows | Set `$env:EAS_NO_VCS='1'` before build |
| Build fails | Check logs at expo.dev dashboard |

---

## Gotchas & Edge Cases

1. **Orientation swaps axes**: In portrait, device pitch becomes display roll. The computed values (lines 184-187) handle this swap.

2. **Negative pitch in landscape**: `pitch_land` is negated (`-pitch`) for correct visual direction.

3. **Speed unit conversion**: GPS returns m/s, multiplied by 3.6 for km/h (line 240).

4. **Weather on location**: `fetchWeather()` is called inside the location update callback, not on a separate interval.

5. **Default values**: State defaults (lines 174-179) show demo values when sensors aren't available.

6. **Calibration is volatile**: Resets on app restart - no persistence.

7. **Car tilt multiplier**: Visual rotation is `value * 1.5` for exaggerated effect (line 46).

---

## Code Style

- **No TypeScript** - plain JavaScript only
- **No tests** - manual testing via Expo Go
- **Single file** - no component splitting
- **Inline styles** - some styles mixed with StyleSheet
- **Ternary layouts** - `{condition ? <A/> : <B/>}` for orientation

### Naming
- Components: `PascalCase`
- Variables/functions: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Style keys: `camelCase`

---

## Quick Commands Reference

```bash
# Development
npm start                    # Start Expo dev server
npm run android              # Run on Android
npm run ios                  # Run on iOS (macOS only)
npx expo start --clear       # Clear cache

# Building
eas login                    # Login to Expo (once)
eas build --platform android --profile preview      # Test APK
eas build --platform android --profile production   # Release APK
eas build --platform android --profile preview --local  # Local build

# Debugging
npx expo start --clear       # Reset Metro bundler
rm -rf node_modules && npm i # Clean reinstall
adb devices                  # Check connected Android devices
```

---

## Important Reminders for AI Assistants

1. **Read before editing** - Always read `App.js` sections before modifying
2. **Update BOTH layouts** - Portrait (lines 344-407) AND landscape (lines 280-342)
3. **Check line numbers** - They shift with edits; use search instead
4. **Test orientation** - Rotate device to verify both layouts work
5. **Asset bundling** - New images need `assetBundlePatterns` entry
6. **No TypeScript** - Don't add type annotations
7. **Preserve calibration logic** - The offset system is intentional
8. **Keep it single-file** - Don't refactor into multiple files without user request
