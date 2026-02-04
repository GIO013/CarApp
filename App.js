import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ImageBackground,
  Image,
  useWindowDimensions,
  AppState,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';
import * as ScreenOrientation from 'expo-screen-orientation';
import Svg, { Circle, Line, Text as SvgText, Image as SvgImage, Defs, RadialGradient, Stop } from 'react-native-svg';

// Background images
const BACKGROUND_PORTRAIT = require('./assets/images/background_portrait.jpg');
const BACKGROUND_LANDSCAPE = require('./assets/images/background_landscape.jpeg');

// Car images
const CAR_REAR_IMAGE = require('./assets/images/car-rear.png');
const CAR_SIDE_IMAGE = require('./assets/images/car-side.png');

// Background images for gauges and icons
const ROUND_BG = require('./assets/images/round.png');
const SPEED_BG = require('./assets/images/speed.png');
const TEMP_BG = require('./assets/images/temperature.png');

// ===== RESPONSIVE GAUGE COMPONENT =====
const Gauge = ({ value, max = 50, color = '#00ff88', title = 'PITCH', carImage, isLandscape, screenWidth, screenHeight }) => {
  // Responsive sizing based on screen dimensions
  const size = isLandscape
    ? Math.min(screenHeight * 0.38, screenWidth * 0.25)
    : Math.min(screenWidth * 0.36, screenHeight * 0.22);

  const center = size / 2;
  const radius = size * 0.36;
  const circumference = 2 * Math.PI * radius;
  

  const normalizedValue = Math.max(-max, Math.min(max, value));
  const progress = (normalizedValue + max) / (2 * max);

  const arcLength = circumference / 2;
  const offset = arcLength * (1 - progress);

  const carTilt = value * 1.5;

  const ticks = [-40, -30, -20, -10, 10, 20, 30, 40];
  const majorTicks = [-30, -20, -10, 10, 20, 30];

  // Responsive font size
  const titleFontSize = isLandscape ? Math.max(14, size * 0.1) : Math.max(12, size * 0.09);

  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={[styles.gaugeTitle, { color, fontSize: titleFontSize }]}>
        {value > 0 ? '+' : ''}{Math.round(value)}° {title}
      </Text>

      <View style={{ position: 'relative', width: size, height: size }}>
        <Image
          source={ROUND_BG}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            opacity: 0.9,
          }}
          resizeMode="contain"
        />

        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            <RadialGradient id={`glow-${title}`} cx="50%" cy="50%">
              <Stop offset="0%" stopColor={color} stopOpacity="0.5" />
              <Stop offset="100%" stopColor={color} stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {ticks.map((deg) => {
            const angle = (deg / max) * 90;
            const rad = ((angle - 90) * Math.PI) / 180;
            const innerRadius = radius + 18;
            const outerRadius = radius + 35;
            const labelRadius = radius + 50;

            const x1 = center + innerRadius * Math.cos(rad);
            const y1 = center + innerRadius * Math.sin(rad);
            const x2 = center + outerRadius * Math.cos(rad);
            const y2 = center + outerRadius * Math.sin(rad);
            const labelX = center + labelRadius * Math.cos(rad);
            const labelY = center + labelRadius * Math.sin(rad);

            const isMajor = majorTicks.includes(deg);

            return (
              <React.Fragment key={deg}>
                <Line
                  // x1={x1}
                  // y1={y1}
                  // x2={x2}
                  // y2={y2}
                  // stroke={color}
                  // strokeWidth={isMajor ? 4 : 2.5}
                  // opacity={0.8}
                />
                {isMajor && (
                  <SvgText
                    x={labelX}
                    y={labelY}
                    fontSize="11"
                    fill={color}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    opacity={0.7}
                    fontWeight="400"
                  >
                    {deg > 0 ? `-${deg}°` : `${Math.abs(deg)}°`}
                  </SvgText>
                )}
              </React.Fragment>
            );
          })}

          <SvgImage
            href={carImage}
            x={center - size * 0.44}
            y={center - size * 0.44}
            width={size * 0.9}
            height={size * 0.9}
            preserveAspectRatio="xMidYMid meet"
            opacity={1}
            transform={`rotate(${carTilt} ${center} ${center})`}
          />
        </Svg>
      </View>
    </View>
  );
};

// ===== ORIENTATION TOGGLE BUTTON =====
const OrientationButton = ({ isLandscape, onToggle }) => {
  return (
    <TouchableOpacity style={styles.orientationButton} onPress={onToggle}>
      <Text style={styles.orientationIcon}>
        {isLandscape ? '📱' : '🔄'}
      </Text>
    </TouchableOpacity>
  );
};

// ===== MAIN APP COMPONENT =====
export default function App() {
  // Use useWindowDimensions for responsive layout (auto-updates on resize/rotation)
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;

  const [rawPitch, setRawPitch] = useState(13);
  const [rawRoll, setRawRoll] = useState(-14);
  const [pitchOffset, setPitchOffset] = useState(0);
  const [rollOffset, setRollOffset] = useState(0);
  const [altitude, setAltitude] = useState(6750);
  const [speed, setSpeed] = useState(35);
  const [temperature, setTemperature] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [isOrientationLocked, setIsOrientationLocked] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);

  // Calculated values
  const roll = Math.round((isLandscape ? rawRoll : rawPitch) - (isLandscape ? rollOffset : pitchOffset));
  const pitch = Math.round((isLandscape ? rawPitch : rawRoll) - (isLandscape ? pitchOffset : rollOffset));
  const roll_land = Math.round((isLandscape ? rawRoll : rawPitch) - (isLandscape ? rollOffset : pitchOffset));
  const pitch_land = -Math.round((isLandscape ? rawPitch : rawRoll) - (isLandscape ? pitchOffset : rollOffset));

  // Responsive font sizes
  const altitudeFontSize = isLandscape
    ? Math.min(50, screenWidth * 0.07)
    : Math.min(45, screenWidth * 0.11);

  const infoValueFontSize = isLandscape
    ? Math.min(26, screenWidth * 0.035)
    : Math.min(20, screenWidth * 0.05);

  // ===== ORIENTATION CONTROL =====
  const toggleOrientation = useCallback(async () => {
    try {
      if (isOrientationLocked) {
        // Unlock orientation
        await ScreenOrientation.unlockAsync();
        setIsOrientationLocked(false);
      } else {
        // Lock to opposite orientation
        if (isLandscape) {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        } else {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
        }
        setIsOrientationLocked(true);
      }
    } catch (error) {
      console.log('Orientation toggle error:', error);
    }
  }, [isLandscape, isOrientationLocked]);

  // ===== APP STATE HANDLING (for PiP and Split-Screen) =====
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      // Handle app going to background (for PiP trigger)
      if (appState === 'active' && nextAppState.match(/inactive|background/)) {
        // App is going to background - PiP would trigger here on native
        console.log('App moving to background - PiP mode would activate');
      }
      setAppState(nextAppState);
    });

    return () => subscription?.remove();
  }, [appState]);

  // ===== INITIAL ORIENTATION SETUP =====
  useEffect(() => {
    async function unlockOrientation() {
      await ScreenOrientation.unlockAsync();
    }
    unlockOrientation();
  }, []);

  const calibrate = () => {
    setPitchOffset(rawPitch);
    setRollOffset(rawRoll);
  };

  // ===== LOCATION PERMISSION =====
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Location access needed for altitude & speed.');
      }
    })();
  }, []);

  // ===== ACCELEROMETER =====
  useEffect(() => {
    Accelerometer.setUpdateInterval(200);
    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const newPitch = Math.atan2(-x, Math.sqrt(y * y + z * z)) * (180 / Math.PI);
      const newRoll = Math.atan2(y, z) * (180 / Math.PI);
      setRawPitch(newPitch);
      setRawRoll(newRoll);
    });
    return () => subscription.remove();
  }, []);

  // ===== LOCATION UPDATES =====
  useEffect(() => {
    const updateLocation = async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });
        setAltitude(Math.round(loc.coords.altitude || 0));
        setSpeed(Math.round((loc.coords.speed || 0) * 3.6));

        fetchWeather(loc.coords.latitude, loc.coords.longitude);
      } catch (e) {
        console.log('Location error:', e);
      }
    };
    updateLocation();
    const interval = setInterval(updateLocation, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchWeather = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=celsius`
      );
      const data = await response.json();

      if (data.current_weather && data.current_weather.temperature !== undefined) {
        setTemperature(Math.round(data.current_weather.temperature));
        setLoadingWeather(false);
      }
    } catch (error) {
      console.log('Weather fetch error:', error);
      setTemperature(null);
      setLoadingWeather(false);
    }
  };

  // ===== RENDER =====
  return (
    <ImageBackground
      source={isLandscape ? BACKGROUND_LANDSCAPE : BACKGROUND_PORTRAIT}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <StatusBar style="light" hidden />

        {/* Orientation Toggle Button */}
        <OrientationButton
          isLandscape={isLandscape}
          onToggle={toggleOrientation}
        />

        {isLandscape ? (
          /* ===== LANDSCAPE LAYOUT ===== */
          <View style={styles.landscapeContainer}>
            {/* Left Gauge - PITCH */}
            <View style={styles.landscapeGauge}>
              <Gauge
                value={pitch_land}
                color='rgb(124, 252, 0)'
                title="PITCH"
                carImage={CAR_SIDE_IMAGE}
                isLandscape={isLandscape}
                screenWidth={screenWidth}
                screenHeight={screenHeight}
              />
            </View>

            {/* Center Info Panel */}
            <View style={styles.landscapeCenterPanel}>
              <Text style={[styles.altitude, { fontSize: altitudeFontSize }]}>
                {altitude.toLocaleString()} m
              </Text>

              <View style={styles.speedAndTemperatureRow}>
                <View style={styles.infoItemContainer}>
                  <View style={styles.iconWrapper}>
                    <Image source={SPEED_BG} style={styles.iconBackground} resizeMode="contain" />
                    <View style={styles.iconCircle}>
                      <Text style={styles.speedIcon}></Text>
                    </View>
                  </View>
                  <Text style={[styles.infoNumberValue, { fontSize: infoValueFontSize }]}>{speed} km/h</Text>
                  <Text style={styles.infoLabel}>Speed</Text>
                </View>

                <View style={styles.verticalDivider} />

                <View style={styles.infoItemContainer}>
                  <View style={styles.iconWrapper}>
                    <Image source={TEMP_BG} style={styles.iconBackground} resizeMode="contain" />
                    <View style={styles.iconCircle}>
                      <Text style={styles.tempIcon}></Text>
                    </View>
                  </View>
                  <Text style={[styles.infoNumberValue, { fontSize: infoValueFontSize }]}>
                    {loadingWeather ? '...' : temperature !== null ? `${temperature > 0 ? '+' : ''}${temperature}°c` : 'N/A'}
                  </Text>
                  <Text style={styles.infoLabel}>Outside</Text>
                </View>
              </View>
            </View>

            {/* Right Gauge - ROLL */}
            <View style={styles.landscapeGauge}>
              <Gauge
                value={roll_land}
                color='rgb(255, 140, 0)'
                title="ROLL"
                carImage={CAR_REAR_IMAGE}
                isLandscape={isLandscape}
                screenWidth={screenWidth}
                screenHeight={screenHeight}
              />
            </View>
          </View>
        ) : (
          /* ===== PORTRAIT LAYOUT ===== */
          /* Structure: Altitude -> Pitch/Roll Gauges -> Speed/Temp Info */
          <View style={styles.portraitContainer}>
            {/* Altitude at Top */}
            <View style={styles.portraitAltitudeSection}>
              <Text style={[styles.altitude, { fontSize: altitudeFontSize }]}>
                {altitude.toLocaleString()} m
              </Text>
            </View>

            {/* Gauges Container - Side by Side */}
            <View style={styles.portraitGaugesWrapper}>
              {/* PITCH Gauge - Left */}
              <View style={styles.portraitGaugeItem}>
                <Gauge
                  value={pitch}
                  color='rgb(124, 252, 0)'
                  title="PITCH"
                  carImage={CAR_SIDE_IMAGE}
                  isLandscape={isLandscape}
                  screenWidth={screenWidth}
                  screenHeight={screenHeight}
                />
              </View>

              {/* ROLL Gauge - Right */}
              <View style={styles.portraitGaugeItem}>
                <Gauge
                  value={roll}
                  color='rgb(255, 140, 0)'
                  title="ROLL"
                  carImage={CAR_REAR_IMAGE}
                  isLandscape={isLandscape}
                  screenWidth={screenWidth}
                  screenHeight={screenHeight}
                />
              </View>
            </View>

            {/* Bottom Info Row */}
            <View style={styles.portraitBottomInfoRow}>
              <View style={styles.portraitInfoItem}>
                <Text style={[styles.portraitInfoValue, { fontSize: infoValueFontSize }]}>{speed} km/h</Text>
                <Text style={styles.portraitBottomLabel}>Speed</Text>
              </View>

              <View style={styles.portraitInfoItem}>
                <Text style={[styles.portraitInfoValue, { fontSize: infoValueFontSize }]}>
                  {loadingWeather ? '...' : temperature !== null ? `${temperature > 0 ? '+' : ''}${temperature}°c` : 'N/A'}
                </Text>
                <Text style={styles.portraitBottomLabel}>Outside</Text>
              </View>
            </View>
          </View>
        )}

        {/* Calibrate Button */}
        <TouchableOpacity style={styles.calibrateButton} onPress={calibrate}>
          <Text style={styles.calibrateText}>⚙ CALIBRATE / RESET ZERO</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

// ===== STYLES =====
const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: 'rgb(0, 0, 0)',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  // ===== ORIENTATION BUTTON =====
  orientationButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 100,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderWidth: 2,
    borderColor: 'rgb(0, 229, 255)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orientationIcon: {
    fontSize: 20,
  },

  // ===== LANDSCAPE LAYOUT =====
  landscapeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '2%',
    paddingTop: 10,
    // borderWidth: 5,
    // borderColor: 'rgba(255, 0, 0, 0.98)'
  },
  landscapeGauge: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
    // borderWidth: 5,
    // borderColor: 'rgba(255, 0, 0, 0.98)'
  },
  landscapeCenterPanel: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },

  // ===== PORTRAIT LAYOUT =====
  portraitContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
    borderWidth: 5,
    marginBottom: 50
    // borderWidth: 5,
    // borderColor: 'rgba(255, 0, 0, 0.98)'
  },
  portraitAltitudeSection: {
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 10
    // borderWidth: 5,
    // borderColor: 'rgba(255, 0, 0, 0.98)'
  },
  portraitGaugesWrapper: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly'
    // borderWidth: 5,
    // borderColor: 'rgb(85, 73, 139)'
  },
  portraitGaugeItem: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 100
    // borderWidth: 5,
    // borderColor: 'rgba(255, 0, 0, 0.98)'
  },
  portraitBottomInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '90%',
    // backgroundColor: 'rgba(0, 0, 0, 0.27)',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 70
    // borderWidth: 5,
    // borderColor: 'rgba(30, 255, 0, 0.98)'
  },
  portraitInfoItem: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center'
    // borderWidth: 5,
    // borderColor: 'rgba(0, 64, 255, 0.98)'
  },
  portraitInfoValue: {
    fontWeight: 'bold',
    color: 'rgb(153, 153, 153)',
    textShadowColor: 'rgba(0,255,255,0.4)',
    textShadowRadius: 6,
    marginBottom: 2
    // borderWidth: 5,
    // borderColor: 'rgba(255, 0, 238, 0.98)'
  },
  portraitBottomLabel: {
    fontSize: 12,
    color: '#999',
    letterSpacing: 0.3
    // borderWidth: 5,
    // borderColor: 'rgba(242, 245, 68, 0.98)'
  },

  // ===== SHARED STYLES =====
  gaugeTitle: {
    fontWeight: 'bold',
    marginBottom: 6,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 2 },
  },
  altitude: {
    fontWeight: 'bold',
    color: 'rgb(0, 229, 255)',
    textShadowColor: 'rgb(0, 229, 255)',
    textShadowRadius: 15,
    textShadowOffset: { width: 0, height: 0 },
    letterSpacing: -1,
  },
  speedAndTemperatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.27)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginTop: 15,
  },
  infoItemContainer: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  iconWrapper: {
    position: 'relative',
  },
  iconBackground: {
    position: 'absolute',
    width: 50,
    height: 50,
    top: -7.5,
    left: -7.5,
    opacity: 0.7,
  },
  iconCircle: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  speedIcon: {
    fontSize: 18,
  },
  tempIcon: {
    fontSize: 18,
  },
  infoNumberValue: {
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,255,255,0.4)',
    textShadowRadius: 6,
    marginBottom: 3,
    // borderWidth: 5,
    // borderColor: 'rgba(78, 215, 151, 0.98)'
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    letterSpacing: 0.3,
  },
  verticalDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#333',
    marginHorizontal: 4,
  },
  calibrateButton: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.24)',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgb(101, 101, 101)'
    
  },
  calibrateText: {
    color: 'rgb(101, 101, 101)',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
