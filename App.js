import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  ImageBackground,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';
import * as ScreenOrientation from 'expo-screen-orientation';
import Svg, { Circle, Line, Text as SvgText, Image as SvgImage, Defs, RadialGradient, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isLandscape = SCREEN_WIDTH > SCREEN_HEIGHT;

// Background images
const BACKGROUND_PORTRAIT = require('./assets/images/background_portrait.jpg');
const BACKGROUND_LANDSCAPE = require('./assets/images/background_landscape.jpeg');

// Car images
const CAR_REAR_IMAGE = require('./assets/images/car-rear.png');
const CAR_SIDE_IMAGE = require('./assets/images/car-side.png');

// New background images for gauges and icons
const ROUND_BG = require('./assets/images/round.png');
const SPEED_BG = require('./assets/images/speed.png');
const TEMP_BG = require('./assets/images/temperature.png');

const Gauge = ({ value, max = 50, color = '#00ff88', title = 'PITCH', carImage, isLandscape }) => {
  const size = isLandscape ? SCREEN_HEIGHT * 0.35 : SCREEN_WIDTH * 0.32;
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

  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={[styles.gaugeTitle, { color, fontSize: isLandscape ? 18 : 16 }]}>
        {value > 0 ? '+' : ''}{Math.round(value)}° {title}
      </Text>

      <View style={{ position: 'relative', width: size, height: size }}>
        {/* Round background image behind gauge */}
        <Image
          source={ROUND_BG}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            opacity: 0.8,
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

          <Circle
            cx={center}
            cy={center}
            r={radius + 25}
            fill={`url(#glow-${title})`}
            opacity={0.2}
          />

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
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={color}
                  strokeWidth={isMajor ? 4 : 2.5}
                  opacity={0.8}
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
            x={center - size * 0.35}
            y={center - size * 0.35}
            width={size * 0.7}
            height={size * 0.7}
            preserveAspectRatio="xMidYMid meet"
            opacity={0.95}
            transform={`rotate(${carTilt} ${center} ${center})`}
          />
        </Svg>
      </View>
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

  const roll = Math.round((orientation ? rawRoll : rawPitch) - (orientation ? rollOffset : pitchOffset));
  const pitch = Math.round((orientation ? rawPitch : rawRoll) - (orientation ? pitchOffset : rollOffset));
  const roll_land  = Math.round((orientation ? rawRoll : rawPitch) - (orientation ? rollOffset : pitchOffset));
  const pitch_land = - Math.round((orientation ? rawPitch : rawRoll) - (orientation ? pitchOffset : rollOffset));

  useEffect(() => {
    async function unlockOrientation() {
      await ScreenOrientation.unlockAsync();
    }
    unlockOrientation();
    
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
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Location access needed for altitude & speed.');
      }
    })();
  }, []);

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

  return (
    <ImageBackground
      source={orientation ? BACKGROUND_LANDSCAPE : BACKGROUND_PORTRAIT}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <StatusBar style="light" hidden />

        {orientation ? (
          <View style={[styles.mainRow, styles.landscape]}>
            <View style={styles.gaugeContainer}>
              <Gauge
                value={pitch_land}
                color="#7cfc00"
                title="PITCH"
                carImage={CAR_SIDE_IMAGE}
                isLandscape={orientation}
              />
            </View>

            <View style={styles.altitudeAndInfoPanel}>
              <Text style={[styles.altitude, styles.altitudeLandscape]}>
                {altitude.toLocaleString()} m
              </Text>

              <View style={styles.speedAndTemperatureRow}>
                <View style={styles.infoItemContainer}>
                  <View style={{ position: 'relative' }}>
                    <Image
                      source={SPEED_BG}
                      style={styles.iconBackground}
                      resizeMode="contain"
                    />
                    <View style={styles.iconCircle}>
                      <Text style={styles.speedIcon}>🏎️</Text>
                    </View>
                  </View>
                  <Text style={[styles.infoNumberValue, styles.infoValueLandscape]}>{speed} km/h</Text>
                  <Text style={styles.infoLabel}>Speed</Text>
                </View>

                <View style={styles.verticalDivider} />

                <View style={styles.infoItemContainer}>
                  <View style={{ position: 'relative' }}>
                    <Image
                      source={TEMP_BG}
                      style={styles.iconBackground}
                      resizeMode="contain"
                    />
                    <View style={styles.iconCircle}>
                      <Text style={styles.tempIcon}>🌡️</Text>
                    </View>
                  </View>
                  <Text style={[styles.infoNumberValue, styles.infoValueLandscape]}>
                    {loadingWeather ? '...' : temperature !== null ? `${temperature > 0 ? '+' : ''}${temperature}°c` : 'N/A'}
                  </Text>
                  <Text style={styles.infoLabel}>Outside</Text>
                </View>
              </View>
            </View>

            <View style={styles.gaugeContainer}>
              <Gauge
                value={roll_land}
                color="#ff8c00"
                title="ROLL"
                carImage={CAR_REAR_IMAGE}
                isLandscape={orientation}
              />
            </View>
          </View>
        ) : (
          <View style={[styles.portraitLayoutContainer]}>
            <View style={styles.portraitAltitudeSection}>
              <Text style={[styles.altitude, styles.altitudePortrait]}>
                {altitude.toLocaleString()} m
              </Text>
            </View>

            <View style={styles.portraitRollSection}>
              <Gauge
                value={roll}
                color="#ff8c00"
                title="ROLL"
                carImage={CAR_REAR_IMAGE}
                isLandscape={orientation}
              />
            </View>

            <View style={styles.portraitPitchSection}>
              <Gauge
                value={pitch}
                color="#7cfc00"
                title="PITCH"
                carImage={CAR_SIDE_IMAGE}
                isLandscape={orientation}
              />
            </View>

            <View style={styles.portraitBottomInfoRow}>
              <View style={styles.portraitInfoItem}>
                <View style={{ position: 'relative' }}>
                  <Image
                    source={SPEED_BG}
                    style={styles.iconBackgroundPortrait}
                    resizeMode="contain"
                  />
                  <View style={[styles.iconCircle, styles.portraitIcon]}>
                    <Text style={styles.speedIcon}></Text>
                  </View>
                </View>
                <View style={styles.portraitValueAndLabel}>
                  <Text style={styles.portraitInfoValue}>{speed} km/h</Text>
                  <Text style={styles.portraitBottomLabel}>Speed</Text>
                </View>
              </View>
              <View style={styles.portraitInfoItem}>
                <View style={{ position: 'relative' }}>
                  <Image
                    source={TEMP_BG}
                    style={styles.iconBackgroundPortrait}
                    resizeMode="contain"
                  />
                  <View style={[styles.iconCircle, styles.portraitIcon]}>
                    <Text style={styles.tempIcon}></Text>
                  </View>
                </View>
                <View style={styles.portraitValueAndLabel}>
                  <Text style={styles.portraitInfoValue}>
                    {loadingWeather ? '...' : temperature !== null ? `${temperature > 0 ? '+' : ''}${temperature}°c` : 'N/A'}
                  </Text>
                  <Text style={styles.portraitBottomLabel}>Outside</Text>
                </View>
              </View>
            </View>
          </View>
        )}

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
  altitudeAndInfoPanel: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  altitude: {
    fontWeight: 'bold',
    color: '#00e5ff',
    textShadowColor: '#00e5ff',
    textShadowRadius: 15,
    textShadowOffset: { width: 0, height: 0 },
    letterSpacing: -1,
  },
  altitudeLandscape: {
    fontSize: 50,
    marginBottom: 18,
  },
  altitudePortrait: {
    fontSize: 50,
    marginBottom: 18,
  },
  speedAndTemperatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.27)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  infoItemContainer: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  iconBackground: {
    position: 'absolute',
    width: 50,
    height: 50,
    top: -7.5,
    left: -7.5,
    opacity: 0.7,
  },
  iconBackgroundPortrait: {
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#00e5ff',
    marginBottom: 8,
  },
  calibrateText: {
    color: '#00e5ff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  portraitLayoutContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 20,
  },
  portraitAltitudeSection: {
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 20
  },
  portraitRollSection: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '28%'
  },
  portraitPitchSection: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '35%'
  },
  portraitBottomInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.27)',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    position: 'absolute',
    bottom: 50,
  },
  portraitInfoItem: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  portraitInfoValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,255,255,0.4)',
    textShadowRadius: 6,
    marginBottom: 2,
  },
  portraitIcon: {
    marginRight: 8,
    marginTop: 0,
  },
  portraitValueAndLabel: {
    alignItems: 'center',
  },
  portraitBottomLabel: {
    fontSize: 12,
    color: '#999',
    letterSpacing: 0.3,
  },
});