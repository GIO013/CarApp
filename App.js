import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  ImageBackground,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Asset } from 'expo-asset';
import Svg, { Circle, Line, Text as SvgText, Image as SvgImage, Defs, RadialGradient, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isLandscape = SCREEN_WIDTH > SCREEN_HEIGHT;

// OPTION 1: Use URLs (if your images are hosted online)
// const BACKGROUND_URL = 'YOUR_BACKGROUND_IMAGE_URL';
// const CAR_FRONT_URL = 'YOUR_FRONT_CAR_IMAGE_URL';
// const CAR_SIDE_URL = 'YOUR_SIDE_CAR_IMAGE_URL';

// OPTION 2: Use local PNG images (recommended)
// Put your images in: /assets/images/
// Background image loaded dynamically to avoid AAPT compilation issues
const BACKGROUND_IMAGE = require('./assets/images/background.png');
const CAR_FRONT_IMAGE = require('./assets/images/car-front.png');
const CAR_SIDE_IMAGE = require('./assets/images/car-side.png');

const Gauge = ({ value, max = 50, color = '#00ff88', title = 'PITCH', carImage, isLandscape }) => {
  // Much smaller gauges
  const size = isLandscape ? SCREEN_HEIGHT * 0.35 : SCREEN_WIDTH * 0.32;
  const center = size / 2;
  const radius = size * 0.36;
  const circumference = 2 * Math.PI * radius;
  
  // Progress for the arc (bottom half circle)
  const normalizedValue = Math.max(-max, Math.min(max, value));
  const progress = (normalizedValue + max) / (2 * max); // 0 to 1
  
  // Arc covers bottom 180 degrees
  const arcLength = circumference / 2;
  const offset = arcLength * (1 - progress);
  
  const carTilt = value * 1.5;

  // Tick marks positions
  const ticks = [-40, -30, -20, -10, 10, 20, 30, 40];
  const majorTicks = [-30, -20, -10, 10, 20, 30];

  return (
    <View style={{ alignItems: 'center' }}>
      {/* Title above gauge */}
      <Text style={[styles.gaugeTitle, { color, fontSize: isLandscape ? 18 : 16 }]}>
        {value > 0 ? '+' : ''}{Math.round(value)}° {title}
      </Text>

      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id={`glow-${title}`} cx="50%" cy="50%">
            <Stop offset="0%" stopColor={color} stopOpacity="0.5" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Progress arc glow */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={28}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={circumference * 0.25 + offset}
          strokeLinecap="round"
          opacity={0.25}
        />

        {/* Progress arc main */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={20}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={circumference * 0.25 + offset}
          strokeLinecap="round"
          opacity={0.95}
        />

        {/* Glow effect behind gauge */}
        <Circle
          cx={center}
          cy={center}
          r={radius + 25}
          fill={`url(#glow-${title})`}
          opacity={0.2}
        />

        {/* Tick marks and labels OUTSIDE the circle */}
        {ticks.map((deg) => {
          const angle = (deg / max) * 90; // Map to -90 to +90 degrees
          const rad = ((angle - 90) * Math.PI) / 180; // Start from bottom
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
              {/* Tick line */}
              <Line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={color}
                strokeWidth={isMajor ? 4 : 2.5}
                opacity={0.8}
              />
              {/* Degree labels for major ticks */}
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

        {/* Car icon - centered and rotating */}
        <SvgImage
          href={carImage}
          x={center - size * 0.25}
          y={center - size * 0.25}
          width={size * 0.5}
          height={size * 0.5}
          preserveAspectRatio="xMidYMid meet"
          opacity={0.95}
          transform={`rotate(${carTilt} ${center} ${center})`}
        />

        {/* Center value display */}
        <SvgText 
          x={center} 
          y={center + 8} 
          fontSize={isLandscape ? "40" : "36"} 
          fill="#fff" 
          textAnchor="middle" 
          fontWeight="bold"
        >
          {value > 0 ? '+' : ''}{Math.round(value)}°
        </SvgText>
      </Svg>
    </View>
  );
};

export default function App() {
  const [rawPitch, setRawPitch] = useState(13);
  const [rawRoll, setRawRoll] = useState(-14);
  const [pitchOffset, setPitchOffset] = useState(0);
  const [rollOffset, setRollOffset] = useState(0);
  const [altitude, setAltitude] = useState(6750);
  const [speed, setSpeed] = useState(35);
  const [temperature, setTemperature] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [orientation, setOrientation] = useState(isLandscape);
  // const [backgroundUri, setBackgroundUri] = useState(null);

  // Load background image using Asset to avoid AAPT compilation issues
  // Using require.resolve to get the module path without bundling it as a resource
  // useEffect(() => {
  //   (async () => {
  //     try {
  //       // Use require.resolve to get the path without bundling as Android resource
  //       const imageModule = require.resolve('./assets/images/background.png');
  //       const asset = Asset.fromModule(imageModule);
  //       await asset.downloadAsync();
  //       setBackgroundUri(asset.localUri || asset.uri);
  //     } catch (error) {
  //       console.log('Background image load error:', error);
  //       // Fallback to black background if image fails to load
  //     }
  //   })();
  // }, []);

  const pitch = Math.round(rawPitch - pitchOffset);
  const roll = Math.round(rawRoll - rollOffset);

  // Allow both portrait and landscape
  useEffect(() => {
    async function unlockOrientation() {
      await ScreenOrientation.unlockAsync();
    }
    unlockOrientation();
    
    // Listen for orientation changes
    const subscription = ScreenOrientation.addOrientationChangeListener((event) => {
      const { orientationInfo } = event;
      setOrientation(
        orientationInfo.orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
        orientationInfo.orientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT
      );
    });
    
    return () => {
      ScreenOrientation.removeOrientationChangeListener(subscription);
    };
  }, []);

  const calibrate = () => {
    setPitchOffset(rawPitch);
    setRollOffset(rawRoll);
    Alert.alert('Calibrated!', 'Current position is now 0° for pitch and roll.');
  };

  // Request location permission
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Location access needed for altitude & speed.');
      }
    })();
  }, []);

  // Accelerometer
  useEffect(() => {
    Accelerometer.setUpdateInterval(100);
    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const newPitch = Math.atan2(-x, Math.sqrt(y * y + z * z)) * (180 / Math.PI);
      const newRoll = Math.atan2(y, z) * (180 / Math.PI);
      setRawPitch(newPitch);
      setRawRoll(newRoll);
    });
    return () => subscription.remove();
  }, []);

  // Location (altitude & speed)
  useEffect(() => {
    const updateLocation = async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({ 
          accuracy: Location.Accuracy.High 
        });
        setAltitude(Math.round(loc.coords.altitude || 0));
        setSpeed(Math.round((loc.coords.speed || 0) * 3.6));
        
        // Fetch weather data based on current location
        fetchWeather(loc.coords.latitude, loc.coords.longitude);
      } catch (e) {
        console.log('Location error:', e);
      }
    };
    updateLocation();
    const interval = setInterval(updateLocation, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch weather from OpenWeatherMap API
  const fetchWeather = async (lat, lon) => {
    try {
      // Using OpenWeatherMap free API (no key needed for basic access)
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

  return (
    <ImageBackground 
      source={BACKGROUND_IMAGE}
      style={styles.background} 
      resizeMode="cover"
    >
      <View style={styles.container}>
        <StatusBar style="light" hidden />

        {/* Main layout - changes based on orientation */}
        <View style={[styles.mainRow, orientation ? styles.landscape : styles.portrait]}>
          {/* Left/Top Gauge - Pitch */}
          <View style={styles.gaugeContainer}>
            <Gauge 
              value={pitch} 
              color="#00fc22ff" 
              title="PITCH" 
              carImage={CAR_FRONT_IMAGE}
              isLandscape={orientation}
            />
          </View>

          {/* Center Info Panel */}
          <View style={styles.centerPanel}>
            {/* Large altitude display */}
            <Text style={[styles.altitude, orientation ? styles.altitudeLandscape : styles.altitudePortrait]}>
              {altitude.toLocaleString()} m
            </Text>
            
            {/* Bottom info row */}
            <View style={styles.bottomInfo}>
              {/* Speed */}
              <View style={styles.infoBox}>
                <View style={styles.iconCircle}>
                  <Text style={styles.speedIcon}>🏎️</Text>
                </View>
                <Text style={[styles.infoValue, orientation && styles.infoValueLandscape]}>{speed} km/h</Text>
                <Text style={styles.infoLabel}>Speed</Text>
              </View>
              
              {/* Vertical divider */}
              <View style={styles.verticalDivider} />
              
              {/* Temperature */}
              <View style={styles.infoBox}>
                <View style={styles.iconCircle}>
                  <Text style={styles.tempIcon}>🌡️</Text>
                </View>
                <Text style={[styles.infoValue, orientation && styles.infoValueLandscape]}>
                  {loadingWeather ? '...' : temperature !== null ? `${temperature > 0 ? '+' : ''}${temperature}°c` : 'N/A'}
                </Text>
                <Text style={styles.infoLabel}>Outside</Text>
              </View>
            </View>
          </View>

          {/* Right/Bottom Gauge - Roll */}
          <View style={styles.gaugeContainer}>
            <Gauge 
              value={roll} 
              color="#ff5e00ff" 
              title="ROLL" 
              carImage={CAR_SIDE_IMAGE}
              isLandscape={orientation}
            />
          </View>
        </View>

        {/* Calibrate Button at bottom */}
        <TouchableOpacity style={styles.calibrateButton} onPress={calibrate}>
          <Text style={styles.calibrateText}>⚙ CALIBRATE / RESET ZERO</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { 
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  mainRow: {
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
    flex: 1,
    marginTop: 45,
  },
  landscape: {
    flexDirection: 'row',
  },
  portrait: {
    flexDirection: 'column',
  },
  gaugeContainer: {
    alignItems: 'center',
    flex: 1,
  },
  gaugeTitle: {
    fontWeight: 'bold',
    marginBottom: 6,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 2 },
  },
  centerPanel: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  altitude: {
    fontWeight: 'bold',
    color: '#00e5ff',
    textShadowColor: '#00e5ff',
    textShadowRadius: 25,
    textShadowOffset: { width: 0, height: 0 },
    letterSpacing: -1,
  },
  altitudeLandscape: {
    fontSize: 60,
    marginBottom: 18,
  },
  altitudePortrait: {
    fontSize: 50,
    marginBottom: 15,
  },
  bottomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.27)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  infoBox: {
    alignItems: 'center',
    paddingHorizontal: 12,
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
  infoValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,255,255,0.4)',
    textShadowRadius: 6,
    marginBottom: 3,
  },
  infoValueLandscape: {
    fontSize: 26,
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
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#202829ff',
    marginBottom: 8,
  },
  calibrateText: {
    color: '#333737ff',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});