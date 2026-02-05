import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  NativeModules,
  Modal,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useKeepAwake } from 'expo-keep-awake';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, Line, Text as SvgText, Image as SvgImage, Defs, RadialGradient, Stop } from 'react-native-svg';
import BluetoothSensorService from './services/BluetoothSensorService';

// Widget Module for updating Android widgets
const WidgetModule = NativeModules.WidgetModule;

// Background images
const BACKGROUND_PORTRAIT = require('./assets/images/background_portrait.jpg');
const BACKGROUND_LANDSCAPE = require('./assets/images/background_landscape.jpeg');

// Default Car images
const DEFAULT_CAR_REAR_IMAGE = require('./assets/images/car-rear.png');
const DEFAULT_CAR_SIDE_IMAGE = require('./assets/images/car-side.png');

// Storage keys
const STORAGE_KEY_CAR_REAR = '@car_rear_image';
const STORAGE_KEY_CAR_SIDE = '@car_side_image';

// Background images for gauges and icons
const ROUND_BG = require('./assets/images/round.png');
const SPEED_BG = require('./assets/images/speed.png');
const TEMP_BG = require('./assets/images/temperature.png');

// ===== RESPONSIVE GAUGE COMPONENT =====
const Gauge = ({ value, max = 50, color = 'rgb(0, 255, 136)', title = 'PITCH', carImage, isLandscape, screenWidth, screenHeight }) => {
  // Responsive sizing based on screen dimensions
  const size = isLandscape
    ? Math.min(screenHeight * 0.65, screenWidth * 0.38)
    : Math.min(screenWidth * 0.48, screenHeight * 0.35);

  const center = size / 2;
  const radius = size * 0.36;

  const carTilt = value * 1.5;

  // Tick marks - მთელი წრის გარშემო განაწილებული
  // 0° = მარცხნივ და მარჯვნივ (მანქანის დონეზე, ჰორიზონტალური)
  // +90° = ზემოთ (მაქსიმალური დადებითი დახრა)
  // -90° = ქვემოთ (მაქსიმალური უარყოფითი დახრა)
  // ზედა მარცხენა/მარჯვენა = პლუსები, ქვედა მარცხენა/მარჯვენა = მინუსები
  const majorTickValues = [0, 30, 60];
  const minorTickValues = [15, 45, 75];

  // Tick-ების რადიუსი - წრის გარეთ
  const tickInnerRadius = size * 0.40;
  const tickOuterRadius = size * 0.44;
  const labelRadius = size * 0.48;

  // Responsive font sizes
  const titleFontSize = isLandscape ? Math.max(14, size * 0.1) : Math.max(12, size * 0.09);
  const tickFontSize = Math.max(8, size * 0.055);

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
          {/*
            4 კვადრანტი:
            - ზედა მარცხენა (180°-270°): +30°, +60° (პლუსები)
            - ზედა მარჯვენა (270°-360°): +30°, +60° (პლუსები)
            - ქვედა მარცხენა (90°-180°): -30°, -60° (მინუსები)
            - ქვედა მარჯვენა (0°-90°): -30°, -60° (მინუსები)
            - 0° = მარცხნივ (180°) და მარჯვნივ (0°/360°)
          */}

          {/* ყველა 4 კვადრანტის tick marks */}
          {[...majorTickValues, ...minorTickValues].map((tickValue) => {
            const isMajor = majorTickValues.includes(tickValue);
            const innerR = isMajor ? tickInnerRadius - 2 : tickInnerRadius;
            const outerR = isMajor ? tickOuterRadius + 2 : tickOuterRadius;

            // 4 პოზიცია თითოეული tick value-სთვის
            const positions = [
              { angle: 180 + tickValue, label: tickValue === 0 ? '0°' : `+${tickValue}°`, quadrant: 'top-left' },    // ზედა მარცხენა (+)
              { angle: 360 - tickValue, label: tickValue === 0 ? '0°' : `+${tickValue}°`, quadrant: 'top-right' },   // ზედა მარჯვენა (+)
              { angle: 180 - tickValue, label: tickValue === 0 ? '0°' : `-${tickValue}°`, quadrant: 'bottom-left' }, // ქვედა მარცხენა (-)
              { angle: tickValue, label: tickValue === 0 ? '0°' : `-${tickValue}°`, quadrant: 'bottom-right' },      // ქვედა მარჯვენა (-)
            ];

            return positions.map((pos, idx) => {
              const rad = (pos.angle * Math.PI) / 180;
              const x1 = center + innerR * Math.cos(rad);
              const y1 = center + innerR * Math.sin(rad);
              const x2 = center + outerR * Math.cos(rad);
              const y2 = center + outerR * Math.sin(rad);
              const labelX = center + labelRadius * Math.cos(rad);
              const labelY = center + labelRadius * Math.sin(rad);

              // 0°-ზე მხოლოდ მარცხენა და მარჯვენა აჩვენოს (არა 4-ჯერ)
              const showLabel = isMajor && (tickValue !== 0 || (idx === 0 || idx === 1));
              // 0°-ზე არ აჩვენოს ლეიბლი საერთოდ (მხოლოდ tick line)
              const skipZeroLabel = tickValue === 0;

              return (
                <React.Fragment key={`tick-${tickValue}-${idx}`}>
                  <Line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={color}
                    strokeWidth={isMajor ? 2.5 : 1.5}
                    opacity={isMajor ? 0.9 : 0.5}
                  />
                  {showLabel && !skipZeroLabel && (
                    <SvgText
                      x={labelX}
                      y={labelY}
                      fontSize={tickFontSize}
                      fill={color}
                      textAnchor="middle"
                      alignmentBaseline="middle"
                      opacity={0.8}
                      fontWeight="500"
                    >
                      {pos.label}
                    </SvgText>
                  )}
                </React.Fragment>
              );
            });
          })}

          {/* Car image ცენტრში */}
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
        {isLandscape ? '📱' : '↳↰'}
      </Text>
    </TouchableOpacity>
  );
};

// ===== MAIN APP COMPONENT =====
export default function App() {
  useKeepAwake();
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
  const [sensorAvailable, setSensorAvailable] = useState(true);

  // Bluetooth states
  const [bluetoothMode, setBluetoothMode] = useState(null); // 'sender', 'receiver', or null
  const [bluetoothConnected, setBluetoothConnected] = useState(false);
  const [bluetoothDeviceName, setBluetoothDeviceName] = useState(null);
  const [showBluetoothModal, setShowBluetoothModal] = useState(false);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

  // Menu and custom car images states
  const [showMenu, setShowMenu] = useState(false);
  const [customCarRearImage, setCustomCarRearImage] = useState(null);
  const [customCarSideImage, setCustomCarSideImage] = useState(null);

  // Current car images (custom or default)
  const carRearImage = customCarRearImage ? { uri: customCarRearImage } : DEFAULT_CAR_REAR_IMAGE;
  const carSideImage = customCarSideImage ? { uri: customCarSideImage } : DEFAULT_CAR_SIDE_IMAGE;

  // Ref for widget update throttling
  const lastWidgetUpdate = useRef(0);
  const bluetoothSendInterval = useRef(null);

  // Calculated values
  const roll = Math.round((isLandscape ? rawRoll : rawPitch) - (isLandscape ? rollOffset : pitchOffset));
  const pitch = Math.round((isLandscape ? rawPitch : rawRoll) - (isLandscape ? pitchOffset : rollOffset));
  const roll_land = Math.round((isLandscape ? rawRoll : rawPitch) - (isLandscape ? rollOffset : pitchOffset));
  const pitch_land = -Math.round((isLandscape ? rawPitch : rawRoll) - (isLandscape ? pitchOffset : rollOffset));

  // ===== WIDGET UPDATE FUNCTION =====
  const updateWidget = useCallback(async () => {
    if (Platform.OS !== 'android' || !WidgetModule) return;

    const now = Date.now();

    // Throttle updates to every 2 seconds to avoid excessive calls
    if (now - lastWidgetUpdate.current < 2000) return;
    lastWidgetUpdate.current = now;

    try {
      await WidgetModule.updateWidgetData(
        pitch,
        roll,
        altitude,
        speed,
        temperature || 0
      );
    } catch (error) {
      console.log('Widget update error:', error);
    }
  }, [pitch, roll, altitude, speed, temperature]);

  // ===== UPDATE WIDGET WHEN DATA CHANGES =====
  useEffect(() => {
    updateWidget();
  }, [pitch, roll, altitude, speed, temperature, updateWidget]);

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
    let subscription = null;

    const setupAccelerometer = async () => {
      try {
        // Check if accelerometer is available
        const isAvailable = await Accelerometer.isAvailableAsync();
        if (!isAvailable) {
          setSensorAvailable(false);
          // სენსორი არ არის - შევთავაზოთ Bluetooth Receiver რეჟიმი
          Alert.alert(
            'სენსორი მიუწვდომელია',
            'ამ მოწყობილობას არ აქვს accelerometer სენსორი.\n\nგსურთ Bluetooth-ით დაუკავშირდეთ ტელეფონს სენსორის მონაცემების მისაღებად?',
            [
              { text: 'არა', style: 'cancel' },
              {
                text: 'დიახ, დაკავშირება',
                onPress: () => startBluetoothReceiver()
              }
            ]
          );
          return;
        }

        setSensorAvailable(true);
        Accelerometer.setUpdateInterval(200);
        subscription = Accelerometer.addListener(({ x, y, z }) => {
          const newPitch = Math.atan2(-x, Math.sqrt(y * y + z * z)) * (180 / Math.PI);
          const newRoll = Math.atan2(y, z) * (180 / Math.PI);
          setRawPitch(newPitch);
          setRawRoll(newRoll);
        });
      } catch (error) {
        console.log('Accelerometer error:', error);
        setSensorAvailable(false);
        Alert.alert(
          'სენსორის შეცდომა',
          'Accelerometer სენსორთან დაკავშირება ვერ მოხერხდა.\n\nგსურთ Bluetooth-ით დაუკავშირდეთ ტელეფონს?',
          [
            { text: 'არა', style: 'cancel' },
            {
              text: 'დიახ, დაკავშირება',
              onPress: () => startBluetoothReceiver()
            }
          ]
        );
      }
    };

    setupAccelerometer();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  // ===== BLUETOOTH FUNCTIONS =====

  // Bluetooth Receiver რეჟიმის დაწყება (მონიტორისთვის)
  const startBluetoothReceiver = async () => {
    try {
      setBluetoothMode('receiver');
      setShowBluetoothModal(true);
      setIsScanning(true);
      setAvailableDevices([]);

      // Setup callbacks
      BluetoothSensorService.setOnDataReceived((data) => {
        if (data) {
          setRawPitch(data.pitch || 0);
          setRawRoll(data.roll || 0);
          if (data.altitude) setAltitude(data.altitude);
          if (data.speed) setSpeed(data.speed);
        }
      });

      BluetoothSensorService.setOnConnectionChange((connected, deviceName) => {
        setBluetoothConnected(connected);
        setBluetoothDeviceName(deviceName);
        if (connected) {
          setShowBluetoothModal(false);
          Alert.alert('დაკავშირებულია', `${deviceName}-თან კავშირი დამყარდა`);
        }
      });

      // Start scanning
      await BluetoothSensorService.startScanning((device) => {
        setAvailableDevices((prev) => {
          if (prev.find((d) => d.id === device.id)) return prev;
          return [...prev, device];
        });
      });

      // Stop scanning indicator after 30 seconds
      setTimeout(() => setIsScanning(false), 30000);
    } catch (error) {
      console.log('Bluetooth receiver error:', error);
      Alert.alert('შეცდომა', 'Bluetooth-ის გაშვება ვერ მოხერხდა: ' + error.message);
      setShowBluetoothModal(false);
    }
  };

  // Bluetooth Sender რეჟიმის დაწყება (ტელეფონისთვის)
  const startBluetoothSender = async () => {
    try {
      setBluetoothMode('sender');

      // შევამოწმოთ BleManager ხელმისაწვდომია თუ არა
      if (!BluetoothSensorService || !BluetoothSensorService.manager) {
        // თუ BLE არ არის ხელმისაწვდომი, უბრალოდ აჩვენე შეტყობინება
        Alert.alert(
          'Bluetooth Sender',
          'Bluetooth Sender რეჟიმი მზადაა.\n\n⚠️ შენიშვნა: BLE Peripheral რეჟიმი მოითხოვს დამატებით კონფიგურაციას.\n\nამჟამად მხარდაჭერილია მხოლოდ Receiver რეჟიმი მოწყობილობებზე სენსორის გარეშე.'
        );
        setBluetoothMode(null);
        return;
      }

      await BluetoothSensorService.initialize();

      Alert.alert(
        'Sender რეჟიმი',
        'აპლიკაცია მზადაა სენსორის მონაცემების გასაგზავნად.\n\nმანქანის მონიტორზე გახსენით აპლიკაცია და დაუკავშირდით ამ მოწყობილობას.'
      );
    } catch (error) {
      console.log('Bluetooth sender error:', error);
      setBluetoothMode(null);

      // უფრო დეტალური შეცდომის შეტყობინება
      let errorMessage = 'Bluetooth-ის გაშვება ვერ მოხერხდა.';
      if (error.message) {
        if (error.message.includes('PoweredOff')) {
          errorMessage = 'Bluetooth გამორთულია. გთხოვთ ჩართოთ Bluetooth.';
        } else if (error.message.includes('permission')) {
          errorMessage = 'Bluetooth-ის ნებართვა არ არის მიცემული.';
        } else {
          errorMessage += '\n\n' + error.message;
        }
      }
      Alert.alert('შეცდომა', errorMessage);
    }
  };

  // მოწყობილობასთან დაკავშირება
  const connectToDevice = async (device) => {
    try {
      setIsScanning(false);
      BluetoothSensorService.stopScanning();
      await BluetoothSensorService.connectToDevice(device);
    } catch (error) {
      Alert.alert('შეცდომა', 'დაკავშირება ვერ მოხერხდა: ' + error.message);
    }
  };

  // Bluetooth-ის გათიშვა
  const disconnectBluetooth = async () => {
    if (bluetoothSendInterval.current) {
      clearInterval(bluetoothSendInterval.current);
      bluetoothSendInterval.current = null;
    }
    await BluetoothSensorService.disconnect();
    setBluetoothConnected(false);
    setBluetoothMode(null);
    setBluetoothDeviceName(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (bluetoothSendInterval.current) {
        clearInterval(bluetoothSendInterval.current);
      }
      BluetoothSensorService.destroy();
    };
  }, []);

  // ===== LOAD SAVED CAR IMAGES =====
  useEffect(() => {
    const loadSavedImages = async () => {
      try {
        const savedRear = await AsyncStorage.getItem(STORAGE_KEY_CAR_REAR);
        const savedSide = await AsyncStorage.getItem(STORAGE_KEY_CAR_SIDE);

        if (savedRear) setCustomCarRearImage(savedRear);
        if (savedSide) setCustomCarSideImage(savedSide);
      } catch (error) {
        console.log('Error loading saved images:', error);
      }
    };

    loadSavedImages();
  }, []);

  // ===== CAR IMAGE FUNCTIONS =====

  // Pick image from gallery
  const pickImage = async (type) => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('ნებართვა საჭიროა', 'გალერეაზე წვდომის ნებართვა საჭიროა სურათის ასარჩევად.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'rear' ? [4, 3] : [16, 9],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;

        if (type === 'rear') {
          setCustomCarRearImage(imageUri);
          await AsyncStorage.setItem(STORAGE_KEY_CAR_REAR, imageUri);
        } else {
          setCustomCarSideImage(imageUri);
          await AsyncStorage.setItem(STORAGE_KEY_CAR_SIDE, imageUri);
        }

        Alert.alert('წარმატება', 'სურათი წარმატებით შეიცვალა!');
      }
    } catch (error) {
      console.log('Image picker error:', error);
      Alert.alert('შეცდომა', 'სურათის არჩევა ვერ მოხერხდა.');
    }
  };

  // Reset car images to default
  const resetCarImages = async () => {
    Alert.alert(
      'დაბრუნება',
      'გსურთ მანქანის სურათების default-ზე დაბრუნება?',
      [
        { text: 'არა', style: 'cancel' },
        {
          text: 'დიახ',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(STORAGE_KEY_CAR_REAR);
              await AsyncStorage.removeItem(STORAGE_KEY_CAR_SIDE);
              setCustomCarRearImage(null);
              setCustomCarSideImage(null);
              Alert.alert('წარმატება', 'სურათები დაბრუნდა default-ზე.');
            } catch (error) {
              console.log('Reset error:', error);
            }
          }
        }
      ]
    );
  };

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

        {/* Menu Button - ზევით მარცხნივ */}
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setShowMenu(true)}
        >
          <Text style={styles.menuButtonText}>☰</Text>
        </TouchableOpacity>

        {/* Bluetooth Connection Indicator */}
        {bluetoothConnected && (
          <View style={styles.bluetoothIndicator}>
            <Text style={styles.bluetoothIndicatorText}>
              📶 {bluetoothDeviceName}
            </Text>
          </View>
        )}

        {/* Bluetooth Button - Rotation-ის ქვემოთ მარჯვნივ */}
        {sensorAvailable && !bluetoothConnected && (
          <TouchableOpacity
            style={styles.bluetoothButton}
            onPress={startBluetoothSender}
          >
            <Text style={styles.bluetoothButtonText}>📡</Text>
          </TouchableOpacity>
        )}

        {/* Bluetooth Disconnect Button */}
        {bluetoothConnected && (
          <TouchableOpacity
            style={styles.bluetoothDisconnectButton}
            onPress={disconnectBluetooth}
          >
            <Text style={styles.bluetoothButtonText}>✕</Text>
          </TouchableOpacity>
        )}

        {/* Menu Modal */}
        <Modal
          visible={showMenu}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowMenu(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.menuModalContent}>
              <Text style={styles.modalTitle}>მენიუ</Text>

              <ScrollView style={styles.menuScrollView}>
                {/* Car Photos Section */}
                <View style={styles.menuSection}>
                  <Text style={styles.menuSectionTitle}>🚗 Car Photos</Text>
                  <Text style={styles.menuSectionSubtitle}>
                    ატვირთეთ საკუთარი მანქანის სურათები
                  </Text>

                  {/* Side Image (Pitch) */}
                  <View style={styles.carImageOption}>
                    <View style={styles.carImagePreviewContainer}>
                      <Image
                        source={carSideImage}
                        style={styles.carImagePreview}
                        resizeMode="contain"
                      />
                    </View>
                    <View style={styles.carImageInfo}>
                      <Text style={styles.carImageLabel}>გვერდითი ხედი (Pitch)</Text>
                      <TouchableOpacity
                        style={styles.uploadButton}
                        onPress={() => pickImage('side')}
                      >
                        <Text style={styles.uploadButtonText}>📷 ატვირთვა</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Rear Image (Roll) */}
                  <View style={styles.carImageOption}>
                    <View style={styles.carImagePreviewContainer}>
                      <Image
                        source={carRearImage}
                        style={styles.carImagePreview}
                        resizeMode="contain"
                      />
                    </View>
                    <View style={styles.carImageInfo}>
                      <Text style={styles.carImageLabel}>უკანა ხედი (Roll)</Text>
                      <TouchableOpacity
                        style={styles.uploadButton}
                        onPress={() => pickImage('rear')}
                      >
                        <Text style={styles.uploadButtonText}>📷 ატვირთვა</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Reset Button */}
                  <TouchableOpacity
                    style={styles.resetButton}
                    onPress={resetCarImages}
                  >
                    <Text style={styles.resetButtonText}>🔄 Default სურათების დაბრუნება</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>

              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeMenuButton}
                onPress={() => setShowMenu(false)}
              >
                <Text style={styles.closeMenuButtonText}>დახურვა</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Orientation Toggle Button */}
        <OrientationButton
          isLandscape={isLandscape}
          onToggle={toggleOrientation}
        />

        {/* Bluetooth Device Selection Modal */}
        <Modal
          visible={showBluetoothModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowBluetoothModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Bluetooth მოწყობილობები</Text>
              <Text style={styles.modalSubtitle}>
                აირჩიეთ ტელეფონი სენსორის მონაცემების მისაღებად
              </Text>

              {isScanning && (
                <View style={styles.scanningContainer}>
                  <ActivityIndicator size="large" color="#00e5ff" />
                  <Text style={styles.scanningText}>სკანირება...</Text>
                </View>
              )}

              <FlatList
                data={availableDevices}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.deviceItem}
                    onPress={() => connectToDevice(item)}
                  >
                    <Text style={styles.deviceName}>{item.name || 'უცნობი მოწყობილობა'}</Text>
                    <Text style={styles.deviceId}>{item.id}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  !isScanning && (
                    <Text style={styles.noDevicesText}>
                      მოწყობილობები ვერ მოიძებნა
                    </Text>
                  )
                }
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    BluetoothSensorService.stopScanning();
                    setShowBluetoothModal(false);
                    setIsScanning(false);
                  }}
                >
                  <Text style={styles.modalButtonText}>დახურვა</Text>
                </TouchableOpacity>

                {!isScanning && (
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonPrimary]}
                    onPress={startBluetoothReceiver}
                  >
                    <Text style={styles.modalButtonTextPrimary}>ხელახლა სკანირება</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>

        {isLandscape ? (
          /* ===== LANDSCAPE LAYOUT ===== */
          <View key="landscape" style={styles.landscapeContainer}>
            {/* Left Gauge - PITCH */}
            <View style={styles.landscapeGauge}>
              <Gauge
                value={pitch_land}
                color='rgb(124, 252, 0)'
                title="PITCH"
                carImage={carSideImage}
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
              <Text style={styles.altitudeLabel}>Altitude</Text>

              <View style={styles.speedAndTemperatureRow_Land}>
                <View style={styles.infoItemContainer}>
                  <View style={styles.iconWrapper}>
                    {/* <Image source={SPEED_BG} style={styles.iconBackground} resizeMode="contain" /> */}
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
                    {/* <Image source={TEMP_BG} style={styles.iconBackground} resizeMode="contain" /> */}
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

              {/* Calibrate Button - Landscape (in center panel) */}
              <TouchableOpacity style={styles.calibrateButtonLandscape} onPress={calibrate}>
                <Text style={styles.calibrateText}>⚙ CALIBRATE / RESET ZERO</Text>
              </TouchableOpacity>
            </View>

            {/* Right Gauge - ROLL */}
            <View style={styles.landscapeGauge}>
              <Gauge
                value={roll_land}
                color='rgb(255, 140, 0)'
                title="ROLL"
                carImage={carRearImage}
                isLandscape={isLandscape}
                screenWidth={screenWidth}
                screenHeight={screenHeight}
              />
            </View>
          </View>
        ) : (
          /* ===== PORTRAIT LAYOUT ===== */
          /* Structure: Altitude -> Pitch/Roll Gauges -> Speed/Temp Info */
          <View key="portrait" style={styles.portraitContainer}>
            {/* Altitude at Top */}
            <View style={styles.portraitAltitudeSection}>
              <Text style={[styles.altitude, { fontSize: altitudeFontSize }]}>
                {altitude.toLocaleString()} m
              </Text>
              <Text style={styles.altitudeLabel}>Altitude</Text>
            </View>

            {/* Gauges Container - Side by Side */}
            <View style={styles.portraitGaugesWrapper}>
              {/* PITCH Gauge - Left */}
              <View style={styles.portraitGaugeItem}>
                <Gauge
                  value={pitch}
                  color='rgb(124, 252, 0)'
                  title="PITCH"
                  carImage={carSideImage}
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
                  carImage={carRearImage}
                  isLandscape={isLandscape}
                  screenWidth={screenWidth}
                  screenHeight={screenHeight}
                />
              </View>
            </View>

            {/* Bottom Info Row */}
            <View style={styles.speedAndTemperatureRow_Portrait}>
              <View style={styles.portraitInfoItem}>
                <Text style={[styles.portraitInfoValue, { fontSize: infoValueFontSize }]}>{speed} km/h</Text>
                <Text style={styles.portraitBottomLabel}>Speed</Text>
              </View>
              <View style={styles.verticalDivider} />
              <View style={styles.portraitInfoItem}>
                <Text style={[styles.portraitInfoValue, { fontSize: infoValueFontSize }]}>
                  {loadingWeather ? '...' : temperature !== null ? `${temperature > 0 ? '+' : ''}${temperature}°c` : 'N/A'}
                </Text>
                <Text style={styles.portraitBottomLabel}>Outside</Text>
              </View>
            </View>

            {/* Calibrate Button - Portrait */}
            <TouchableOpacity style={styles.calibrateButtonPortrait} onPress={calibrate}>
              <Text style={styles.calibrateText}>⚙ CALIBRATE / RESET ZERO</Text>
            </TouchableOpacity>
          </View>
        )}

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
    top: 30,
    right: 15,
    zIndex: 100,
    width: 44,
    height: 44,
    borderRadius: 22,
    color: 'rgb(255, 255, 255)',
    textShadowColor: 'rgb(255, 255, 255)',
    backgroundColor: 'rgba(0, 0, 0, 0)',
    borderWidth: 2,
    borderColor: 'rgb(101, 101, 101)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orientationIcon: {
    fontSize: 20,
    color: 'rgb(255, 255, 255)',
  },

  // ===== LANDSCAPE LAYOUT =====
  landscapeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '5%',
    paddingTop: 10,
    // borderWidth: 5,
    // borderColor: 'rgba(255, 0, 0, 0.98)'
  },
  landscapeGauge: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // borderWidth: 5,
    // borderColor: 'rgba(111, 255, 0, 0.98)'
  },
  landscapeCenterPanel: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 10,
    paddingTop: 50,
    paddingBottom: 10,
    // borderWidth: 5,
    // borderColor: 'rgba(0, 128, 255, 0.98)'
  },

  // ===== PORTRAIT LAYOUT =====
  portraitContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 15,
    paddingBottom: 20,
    // borderWidth: 5,
    // borderColor: 'rgba(255, 0, 157, 0.98)'
  },
  portraitAltitudeSection: {
    alignItems: 'center',
    marginBottom: 0,
    marginTop: 27,
    // borderWidth: 5,
    // borderColor: 'rgba(0, 64, 255, 0.98)'
  },
  portraitGaugesWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    // borderWidth: 5,
    // borderColor: 'rgba(0, 64, 255, 0.98)'
  },
  portraitGaugeItem: {
    alignItems: 'center',
    justifyContent: 'center',
    // borderWidth: 5,
    // borderColor: 'rgba(0, 64, 255, 0.98)'
  },
  speedAndTemperatureRow_Portrait: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '90%',
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  portraitInfoItem: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    // borderWidth: 5,
    // borderColor: 'rgba(0, 64, 255, 0.98)'
  },
  portraitInfoValue: {
    fontWeight: 'bold',
    color: 'rgb(255, 255, 255)',
    textShadowColor: 'rgba(0,255,255,0.4)',
    textShadowRadius: 6,
    marginBottom: 2,
    // borderWidth: 5,
    // borderColor: 'rgba(255, 0, 238, 0.98)'
  },
  portraitBottomLabel: {
    fontSize: 12,
    color: 'rgb(153, 153, 153)',
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
    // borderWidth: 5,
    // borderColor: 'rgba(0, 64, 255, 0.98)'
  },
  altitudeLabel: {
    fontSize: 12,
    color: 'rgb(153, 153, 153)',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  speedAndTemperatureRow_Land: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginTop: 5,
    // borderWidth: 5,
    // borderColor: 'rgba(180, 82, 40, 0.98)'
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
    // borderWidth: 5,
    // borderColor: 'rgba(78, 215, 151, 0.98)'
  },
  // iconCircle: {
  //   width: 35,
  //   height: 35,
  //   borderRadius: 18,
  //   backgroundColor: 'rgba(255,255,255,0.05)',
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   marginBottom: 6,
  // },
  speedIcon: {
    fontSize: 18,
  },
  tempIcon: {
    fontSize: 18,
  },
  infoNumberValue: {
    fontWeight: 'bold',
    color: 'rgb(255, 255, 255)',
    textShadowColor: 'rgba(0,255,255,0.4)',
    textShadowRadius: 6,
    marginBottom: 3,
    // borderWidth: 5,
    // borderColor: 'rgba(78, 215, 151, 0.98)'
  },
  infoLabel: {
    fontSize: 12,
    color: 'rgb(153, 153, 153)',
    letterSpacing: 0.3,
    // borderWidth: 5,
    // borderColor: 'rgba(78, 215, 151, 0.98)'
  },
  verticalDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgb(51, 51, 51)',
    marginHorizontal: 4,
    // borderWidth: 5,
    // borderColor: 'rgba(66, 69, 147, 0.98)'
  },
  calibrateButtonPortrait: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.24)',
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgb(101, 101, 101)',
    marginTop: 10,
  },
  calibrateButtonLandscape: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.24)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgb(101, 101, 101)',
    marginTop: 50,
    marginBottom: 0,    
    // borderWidth: 5,
    // borderColor: 'rgba(182, 222, 50, 0.98)'
  },
  calibrateText: {
    color: 'rgb(101, 101, 101)',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  // ===== BLUETOOTH STYLES =====
  bluetoothIndicator: {
    position: 'absolute',
    top: 60,
    right: 15,
    backgroundColor: 'rgba(0, 229, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgb(0, 229, 255)',
    zIndex: 100,    
    // borderWidth: 5,
    // borderColor: 'rgba(182, 222, 50, 0.98)'
  },
  bluetoothIndicatorText: {
    color: 'rgb(0, 229, 255)',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bluetoothButton: {
    position: 'absolute',
    top: 80,
    right: 15,
    width: 44,
    height: 44,
    borderRadius: 22,
    // backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 2,
    borderColor: 'rgb(101, 101, 101)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,    
    // borderWidth: 5,
    // borderColor: 'rgba(182, 222, 50, 0.98)'
  },
  bluetoothDisconnectButton: {
    position: 'absolute',
    top: 115,
    right: 15,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 100, 100, 0.3)',
    borderWidth: 2,
    borderColor: 'rgb(255, 100, 100)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,    
    // borderWidth: 5,
    // borderColor: 'rgba(182, 222, 50, 0.98)'
  },
  bluetoothButtonText: {
    fontSize: 18,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'rgb(30, 30, 30)',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderWidth: 2,
    borderColor: 'rgb(0, 229, 255)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'rgb(0, 229, 255)',
    textAlign: 'center',
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgb(153, 153, 153)',
    textAlign: 'center',
    marginBottom: 20,
  },
  scanningContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  scanningText: {
    color: 'rgb(0, 229, 255)',
    marginTop: 10,
    fontSize: 14,
  },
  deviceItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  deviceName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deviceId: {
    color: 'rgb(153, 153, 153)',
    fontSize: 12,
    marginTop: 4,
  },
  noDevicesText: {
    color: 'rgb(153, 153, 153)',
    textAlign: 'center',
    marginVertical: 30,
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 5,
  },
  modalButtonPrimary: {
    backgroundColor: 'rgb(0, 229, 255)',
  },
  modalButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  modalButtonTextPrimary: {
    color: 'black',
    textAlign: 'center',
    fontWeight: 'bold',
  },

  // ===== MENU STYLES =====
  menuButton: {
    position: 'absolute',
    top: 30,
    left: 15,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 2,
    borderColor: 'rgb(101, 101, 101)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  menuButtonText: {
    fontSize: 22,
    color: 'rgb(255, 255, 255)',
  },
  menuModalContent: {
    backgroundColor: 'rgb(30, 30, 30)',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 450,
    maxHeight: '85%',
    borderWidth: 2,
    borderColor: 'rgb(0, 229, 255)',
  },
  menuScrollView: {
    maxHeight: '80%',
  },
  menuSection: {
    marginBottom: 20,
  },
  menuSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'rgb(0, 229, 255)',
    marginBottom: 5,
  },
  menuSectionSubtitle: {
    fontSize: 12,
    color: 'rgb(153, 153, 153)',
    marginBottom: 15,
  },
  carImageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  carImagePreviewContainer: {
    width: 80,
    height: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carImagePreview: {
    width: '100%',
    height: '100%',
  },
  carImageInfo: {
    flex: 1,
    marginLeft: 15,
  },
  carImageLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  uploadButton: {
    backgroundColor: 'rgb(0, 229, 255)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  uploadButtonText: {
    color: 'black',
    fontSize: 12,
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: 'rgba(255, 100, 100, 0.2)',
    borderWidth: 1,
    borderColor: 'rgb(255, 100, 100)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  resetButtonText: {
    color: 'rgb(255, 100, 100)',
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeMenuButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 15,
  },
  closeMenuButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
