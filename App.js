import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ImageBackground,
  useWindowDimensions,
  AppState,
  Platform,
  NativeModules,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useKeepAwake } from 'expo-keep-awake';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { WebView } from 'react-native-webview';

import WiFiSensorService from './services/WiFiSensorService';
import BluetoothSensorService from './services/BluetoothSensorService';
import Gauge from './src/components/Gauge';
import OrientationButton from './src/components/OrientationButton';
import MenuModal from './src/components/MenuModal';
import WiFiModal from './src/components/WiFiModal';
import BluetoothModal from './src/components/BluetoothModal';
import CameraFullscreenModal from './src/components/CameraFullscreenModal';
import Toast from './src/components/Toast';
import { REAR_CAMERA_HTML } from './src/constants/cameraHtml';

const WidgetModule = NativeModules.WidgetModule;

const BACKGROUND_PORTRAIT = require('./assets/images/background_portrait.jpg');
const BACKGROUND_LANDSCAPE = require('./assets/images/background_landscape.jpeg');
const DEFAULT_CAR_REAR_IMAGE = require('./assets/images/car-rear.png');
const DEFAULT_CAR_SIDE_IMAGE = require('./assets/images/car-side.png');

const STORAGE_KEY_CAR_REAR = '@car_rear_image';
const STORAGE_KEY_CAR_SIDE = '@car_side_image';

// Suppress state updates when sensor change is below this threshold (degrees).
// Prevents unnecessary re-renders from micro-vibrations.
const SENSOR_UPDATE_THRESHOLD = 0.3;

export default function App() {
  useKeepAwake();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [cameraFullscreen, setCameraFullscreen] = useState(false);

  const [rawPitch, setRawPitch] = useState(13);
  const [rawRoll, setRawRoll] = useState(-14);
  const [pitchOffset, setPitchOffset] = useState(0);
  const [rollOffset, setRollOffset] = useState(0);
  const [altitude, setAltitude] = useState(6750);
  const [speed, setSpeed] = useState(35);
  const [temperature, setTemperature] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [isOrientationLocked, setIsOrientationLocked] = useState(false);
  const [sensorAvailable, setSensorAvailable] = useState(true);

  const [wifiConnected, setWifiConnected] = useState(false);
  const [wifiServerIp, setWifiServerIp] = useState('');
  const [showWifiModal, setShowWifiModal] = useState(false);
  const [wifiIpInput, setWifiIpInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const [bluetoothConnected, setBluetoothConnected] = useState(false);
  const [bluetoothDeviceName, setBluetoothDeviceName] = useState(null);
  const [bluetoothMode, setBluetoothMode] = useState(null);
  const [showBluetoothModal, setShowBluetoothModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [availableDevices, setAvailableDevices] = useState([]);

  const [showMenu, setShowMenu] = useState(false);
  const [customCarRearImage, setCustomCarRearImage] = useState(null);
  const [customCarSideImage, setCustomCarSideImage] = useState(null);

  const bluetoothSendInterval = useRef(null);
  const lastWidgetUpdate = useRef(0);
  const toastRef = useRef(null);
  // Ref tracks AppState inside the listener to avoid re-subscribing on every change.
  const appStateRef = useRef(AppState.currentState);

  const carRearImage = customCarRearImage ? { uri: customCarRearImage } : DEFAULT_CAR_REAR_IMAGE;
  const carSideImage = customCarSideImage ? { uri: customCarSideImage } : DEFAULT_CAR_SIDE_IMAGE;

  const roll = Math.round((isLandscape ? rawRoll : rawPitch) - (isLandscape ? rollOffset : pitchOffset));
  const pitch = Math.round((isLandscape ? rawPitch : rawRoll) - (isLandscape ? pitchOffset : rollOffset));

  // ===== RESPONSIVE SIZING =====
  const altitudeFontSize = isLandscape
    ? Math.min(50, screenWidth * 0.07)
    : Math.min(45, screenWidth * 0.11);

  const infoValueFontSize = isLandscape
    ? Math.min(26, screenWidth * 0.035)
    : Math.min(20, screenWidth * 0.05);

  // ===== WIDGET UPDATE =====
  const updateWidget = useCallback(async () => {
    if (Platform.OS !== 'android' || !WidgetModule) return;
    const now = Date.now();
    if (now - lastWidgetUpdate.current < 2000) return;
    lastWidgetUpdate.current = now;
    try {
      await WidgetModule.updateWidgetData(pitch, roll, altitude, speed, temperature || 0);
    } catch (error) {
      console.log('Widget update error:', error);
    }
  }, [pitch, roll, altitude, speed, temperature]);

  useEffect(() => {
    updateWidget();
  }, [pitch, roll, altitude, speed, temperature, updateWidget]);

  // ===== ORIENTATION =====
  const toggleOrientation = useCallback(async () => {
    try {
      if (isOrientationLocked) {
        await ScreenOrientation.unlockAsync();
        setIsOrientationLocked(false);
      } else {
        await ScreenOrientation.lockAsync(
          isLandscape
            ? ScreenOrientation.OrientationLock.PORTRAIT_UP
            : ScreenOrientation.OrientationLock.LANDSCAPE
        );
        setIsOrientationLocked(true);
      }
    } catch (error) {
      console.log('Orientation toggle error:', error);
    }
  }, [isLandscape, isOrientationLocked]);

  useEffect(() => {
    ScreenOrientation.unlockAsync();
  }, []);

  // ===== APP STATE (fixed: single subscription, ref for prev state) =====
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
        console.log('App moving to background');
      }
      appStateRef.current = nextAppState;
    });
    return () => subscription?.remove();
  }, []);

  // ===== PERMISSIONS =====
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Location access needed for altitude & speed.');
      }
      await requestCameraPermission();
    })();
  }, []);

  // ===== ACCELEROMETER (with threshold smoothing) =====
  useEffect(() => {
    let subscription = null;

    const setupAccelerometer = async () => {
      try {
        const isAvailable = await Accelerometer.isAvailableAsync();
        if (!isAvailable) {
          setSensorAvailable(false);
          return;
        }
        setSensorAvailable(true);
        Accelerometer.setUpdateInterval(200);
        subscription = Accelerometer.addListener(({ x, y, z }) => {
          const newPitch = Math.atan2(-x, Math.sqrt(y * y + z * z)) * (180 / Math.PI);
          const newRoll = Math.atan2(y, z) * (180 / Math.PI);
          setRawPitch(prev => Math.abs(newPitch - prev) > SENSOR_UPDATE_THRESHOLD ? newPitch : prev);
          setRawRoll(prev => Math.abs(newRoll - prev) > SENSOR_UPDATE_THRESHOLD ? newRoll : prev);
        });
      } catch (error) {
        console.log('Accelerometer error:', error);
        setSensorAvailable(false);
      }
    };

    setupAccelerometer();
    return () => subscription?.remove();
  }, []);

  // ===== CLEANUP ON UNMOUNT =====
  useEffect(() => {
    return () => {
      if (bluetoothSendInterval.current) clearInterval(bluetoothSendInterval.current);
      BluetoothSensorService.destroy();
      WiFiSensorService.disconnect();
    };
  }, []);

  // ===== LOAD SAVED IMAGES =====
  useEffect(() => {
    (async () => {
      try {
        const [savedRear, savedSide] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_CAR_REAR),
          AsyncStorage.getItem(STORAGE_KEY_CAR_SIDE),
        ]);
        if (savedRear) setCustomCarRearImage(savedRear);
        if (savedSide) setCustomCarSideImage(savedSide);
      } catch (error) {
        console.log('Error loading saved images:', error);
      }
    })();
  }, []);

  // ===== LOCATION & WEATHER =====
  useEffect(() => {
    const updateLocation = async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
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
      if (data.current_weather?.temperature !== undefined) {
        setTemperature(Math.round(data.current_weather.temperature));
        setLoadingWeather(false);
      }
    } catch (error) {
      console.log('Weather fetch error:', error);
      setTemperature(null);
      setLoadingWeather(false);
    }
  };

  const calibrate = () => {
    setPitchOffset(rawPitch);
    setRollOffset(rawRoll);
  };

  // ===== BLUETOOTH =====
  const startBluetoothReceiver = async () => {
    try {
      setBluetoothMode('receiver');
      setShowBluetoothModal(true);
      setIsScanning(true);
      setAvailableDevices([]);

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
          toastRef.current?.show(`📡 ${deviceName}-თან კავშირი დამყარდა`, 'success');
        }
      });

      await BluetoothSensorService.startScanning((device) => {
        setAvailableDevices((prev) => {
          if (prev.find((d) => d.id === device.id)) return prev;
          return [...prev, device];
        });
      });

      setTimeout(() => setIsScanning(false), 30000);
    } catch (error) {
      console.log('Bluetooth receiver error:', error);
      Alert.alert('შეცდომა', 'Bluetooth-ის გაშვება ვერ მოხერხდა: ' + error.message);
      setShowBluetoothModal(false);
    }
  };

  const startBluetoothSender = async () => {
    try {
      setBluetoothMode('sender');

      if (!BluetoothSensorService?.manager) {
        Alert.alert(
          'Bluetooth Sender',
          'Bluetooth Sender რეჟიმი მზადაა.\n\n⚠️ შენიშვნა: BLE Peripheral რეჟიმი მოითხოვს დამატებით კონფიგურაციას.\n\nამჟამად მხარდაჭერილია მხოლოდ Receiver რეჟიმი.'
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
      let errorMessage = 'Bluetooth-ის გაშვება ვერ მოხერხდა.';
      if (error.message?.includes('PoweredOff')) {
        errorMessage = 'Bluetooth გამორთულია. გთხოვთ ჩართოთ Bluetooth.';
      } else if (error.message?.includes('permission')) {
        errorMessage = 'Bluetooth-ის ნებართვა არ არის მიცემული.';
      } else if (error.message) {
        errorMessage += '\n\n' + error.message;
      }
      Alert.alert('შეცდომა', errorMessage);
    }
  };

  const connectToDevice = async (device) => {
    try {
      setIsScanning(false);
      BluetoothSensorService.stopScanning();
      await BluetoothSensorService.connectToDevice(device);
    } catch (error) {
      Alert.alert('შეცდომა', 'დაკავშირება ვერ მოხერხდა: ' + error.message);
    }
  };

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

  const handleCloseBluetoothModal = () => {
    BluetoothSensorService.stopScanning();
    setShowBluetoothModal(false);
    setIsScanning(false);
  };

  // ===== WIFI =====
  const connectWifi = async () => {
    const ip = wifiIpInput.trim();
    if (!ip) return;

    setIsConnecting(true);

    WiFiSensorService.setOnDataReceived((data) => {
      if (!data) return;
      setRawPitch(data.pitch ?? 0);
      setRawRoll(data.roll ?? 0);
      if (data.altitude !== undefined) setAltitude(Math.round(data.altitude));
      if (data.speed !== undefined) setSpeed(Math.round(data.speed));
    });

    WiFiSensorService.setOnConnectionChange((connected, connectedIp) => {
      setWifiConnected(connected);
      setWifiServerIp(connected ? connectedIp : '');
      if (connected) {
        setShowWifiModal(false);
        toastRef.current?.show(`📶 WiFi კავშირი დამყარდა (${connectedIp})`, 'success');
      }
    });

    try {
      await WiFiSensorService.connectToServer(ip);
    } catch (error) {
      Alert.alert('WiFi შეცდომა', error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWifi = () => {
    WiFiSensorService.disconnect();
    setWifiConnected(false);
    setWifiServerIp('');
  };

  // ===== CAR IMAGES =====
  const pickImage = async (type) => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('ნებართვა საჭიროა', 'გალერეაზე წვდომის ნებართვა საჭიროა სურათის ასარჩევად.');
        return;
      }

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
              await Promise.all([
                AsyncStorage.removeItem(STORAGE_KEY_CAR_REAR),
                AsyncStorage.removeItem(STORAGE_KEY_CAR_SIDE),
              ]);
              setCustomCarRearImage(null);
              setCustomCarSideImage(null);
              Alert.alert('წარმატება', 'სურათები დაბრუნდა default-ზე.');
            } catch (error) {
              console.log('Reset error:', error);
            }
          },
        },
      ]
    );
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

        {/* Menu Button */}
        <TouchableOpacity style={styles.menuButton} onPress={() => setShowMenu(true)}>
          <Text style={styles.menuButtonText}>☰</Text>
        </TouchableOpacity>

        {/* WiFi Connection Indicator */}
        {wifiConnected && (
          <View style={styles.wifiIndicator}>
            <Text style={styles.wifiIndicatorText}>📶 WiFi {wifiServerIp}</Text>
          </View>
        )}

        {/* Bluetooth Connection Indicator */}
        {bluetoothConnected && !wifiConnected && (
          <View style={styles.bluetoothIndicator}>
            <Text style={styles.bluetoothIndicatorText}>📡 {bluetoothDeviceName}</Text>
          </View>
        )}

        {/* WiFi Connect Button (no sensor, not connected) */}
        {!sensorAvailable && !wifiConnected && !bluetoothConnected && (
          <TouchableOpacity style={styles.wifiButton} onPress={() => setShowWifiModal(true)}>
            <Text style={styles.iconButtonText}>📶</Text>
          </TouchableOpacity>
        )}

        {/* WiFi Disconnect Button */}
        {wifiConnected && (
          <TouchableOpacity style={styles.disconnectButton} onPress={disconnectWifi}>
            <Text style={styles.iconButtonText}>✕</Text>
          </TouchableOpacity>
        )}

        {/* Bluetooth Sender Button */}
        {sensorAvailable && !bluetoothConnected && !wifiConnected && (
          <TouchableOpacity style={styles.bluetoothButton} onPress={startBluetoothSender}>
            <Text style={styles.iconButtonText}>📡</Text>
          </TouchableOpacity>
        )}

        {/* Bluetooth Disconnect Button */}
        {bluetoothConnected && !wifiConnected && (
          <TouchableOpacity style={styles.disconnectButton} onPress={disconnectBluetooth}>
            <Text style={styles.iconButtonText}>✕</Text>
          </TouchableOpacity>
        )}

        {/* Orientation Button */}
        <OrientationButton isLandscape={isLandscape} onToggle={toggleOrientation} />

        {/* Modals */}
        <MenuModal
          visible={showMenu}
          onClose={() => setShowMenu(false)}
          carSideImage={carSideImage}
          carRearImage={carRearImage}
          pickImage={pickImage}
          resetCarImages={resetCarImages}
          calibrate={calibrate}
          sensorAvailable={sensorAvailable}
          wifiConnected={wifiConnected}
          wifiServerIp={wifiServerIp}
          disconnectWifi={disconnectWifi}
          onOpenWifiModal={() => setShowWifiModal(true)}
          bluetoothConnected={bluetoothConnected}
          bluetoothDeviceName={bluetoothDeviceName}
          disconnectBluetooth={disconnectBluetooth}
          startBluetoothReceiver={startBluetoothReceiver}
        />

        <WiFiModal
          visible={showWifiModal}
          onClose={() => setShowWifiModal(false)}
          wifiIpInput={wifiIpInput}
          setWifiIpInput={setWifiIpInput}
          connectWifi={connectWifi}
          isConnecting={isConnecting}
        />

        <BluetoothModal
          visible={showBluetoothModal}
          onClose={handleCloseBluetoothModal}
          isScanning={isScanning}
          availableDevices={availableDevices}
          connectToDevice={connectToDevice}
          onRescan={startBluetoothReceiver}
        />

        {isLandscape ? (
          /* ===== LANDSCAPE LAYOUT ===== */
          <View key="landscape" style={styles.landscapeContainer}>
            <View style={styles.landscapeGauge}>
              <Gauge
                value={-pitch}
                color="rgb(124, 252, 0)"
                title="PITCH"
                carImage={carSideImage}
                isLandscape={isLandscape}
                screenWidth={screenWidth}
                screenHeight={screenHeight}
              />
            </View>

            <View style={styles.landscapeCenterPanel}>
              <Text style={[styles.altitude, { fontSize: altitudeFontSize }]}>
                {altitude.toLocaleString()} m
              </Text>
              <Text style={styles.altitudeLabel}>Altitude</Text>

              {/* Cameras — FRONT & REAR */}
              <View style={styles.cameraSectionLand}>
                <View style={styles.cameraHalfLand}>
                  <View style={styles.cameraFrameLand}>
                    {cameraPermission?.granted ? (
                      !cameraFullscreen ? (
                        <CameraView style={styles.cameraPreview} facing="back" />
                      ) : null
                    ) : (
                      <TouchableOpacity style={styles.cameraPermissionBox} onPress={requestCameraPermission}>
                        <Text style={styles.cameraPermissionIcon}>📷</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.cameraLabel}>FRONT</Text>
                </View>

                <View style={styles.cameraHalfLand}>
                  <View style={styles.cameraFrameLand}>
                    {cameraPermission?.granted ? (
                      !cameraFullscreen ? (
                        <WebView
                          source={{ html: REAR_CAMERA_HTML, baseUrl: 'http://localhost/' }}
                          style={styles.cameraPreview}
                          allowsInlineMediaPlayback={true}
                          mediaPlaybackRequiresUserAction={false}
                          javaScriptEnabled={true}
                          originWhitelist={['*']}
                          scrollEnabled={false}
                        />
                      ) : null
                    ) : (
                      <TouchableOpacity style={styles.cameraPermissionBox} onPress={requestCameraPermission}>
                        <Text style={styles.cameraPermissionIcon}>📷</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.cameraLabel}>REAR</Text>
                </View>

                <TouchableOpacity style={styles.cameraExpandBtnFloat} onPress={() => setCameraFullscreen(true)}>
                  <Text style={styles.cameraExpandIcon}>⛶</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.speedAndTemperatureRow_Land}>
                <View style={styles.infoItemContainer}>
                  <View style={styles.iconCircle}>
                    <Text style={styles.speedIcon}></Text>
                  </View>
                  <Text style={[styles.infoNumberValue, { fontSize: infoValueFontSize }]}>{speed} km/h</Text>
                  <Text style={styles.infoLabel}>Speed</Text>
                </View>

                <View style={styles.verticalDivider} />

                <View style={styles.infoItemContainer}>
                  <View style={styles.iconCircle}>
                    <Text style={styles.tempIcon}></Text>
                  </View>
                  <Text style={[styles.infoNumberValue, { fontSize: infoValueFontSize }]}>
                    {loadingWeather ? '...' : temperature !== null ? `${temperature > 0 ? '+' : ''}${temperature}°c` : 'N/A'}
                  </Text>
                  <Text style={styles.infoLabel}>Outside</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.calibrateButtonLandscape} onPress={calibrate}>
                <Text style={styles.calibrateText}>⚙ CALIBRATE / RESET ZERO</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.landscapeGauge}>
              <Gauge
                value={roll}
                color="rgb(255, 140, 0)"
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
          <View key="portrait" style={styles.portraitContainer}>
            <View style={styles.portraitAltitudeSection}>
              <Text style={[styles.altitude, { fontSize: altitudeFontSize }]}>
                {altitude.toLocaleString()} m
              </Text>
              <Text style={styles.altitudeLabel}>Altitude</Text>
            </View>

            <View style={styles.portraitGaugesWrapper}>
              <View style={styles.portraitGaugeItem}>
                <Gauge
                  value={pitch}
                  color="rgb(124, 252, 0)"
                  title="PITCH"
                  carImage={carSideImage}
                  isLandscape={isLandscape}
                  screenWidth={screenWidth}
                  screenHeight={screenHeight}
                  compact={true}
                />
              </View>
              <View style={styles.portraitGaugeItem}>
                <Gauge
                  value={roll}
                  color="rgb(255, 140, 0)"
                  title="ROLL"
                  carImage={carRearImage}
                  isLandscape={isLandscape}
                  screenWidth={screenWidth}
                  screenHeight={screenHeight}
                  compact={true}
                />
              </View>
            </View>

            {/* Cameras — FRONT & REAR */}
            <View style={styles.cameraSection}>
              <View style={styles.cameraHalf}>
                <View style={styles.cameraFrameHalf}>
                  {cameraPermission?.granted ? (
                    !cameraFullscreen ? (
                      <CameraView style={styles.cameraPreview} facing="back" />
                    ) : null
                  ) : (
                    <TouchableOpacity style={styles.cameraPermissionBox} onPress={requestCameraPermission}>
                      <Text style={styles.cameraPermissionIcon}>📷</Text>
                      <Text style={styles.cameraPermissionText}>ნებართვა</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.cameraLabel}>FRONT</Text>
              </View>

              <View style={styles.cameraHalf}>
                <View style={styles.cameraFrameHalf}>
                  {cameraPermission?.granted ? (
                    !cameraFullscreen ? (
                      <WebView
                        source={{ html: REAR_CAMERA_HTML, baseUrl: 'http://localhost/' }}
                        style={StyleSheet.absoluteFill}
                        allowsInlineMediaPlayback={true}
                        mediaPlaybackRequiresUserAction={false}
                        javaScriptEnabled={true}
                        originWhitelist={['*']}
                        scrollEnabled={false}
                      />
                    ) : null
                  ) : (
                    <TouchableOpacity style={styles.cameraPermissionBox} onPress={requestCameraPermission}>
                      <Text style={styles.cameraPermissionIcon}>📷</Text>
                      <Text style={styles.cameraPermissionText}>ნებართვა</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.cameraLabel}>REAR</Text>
              </View>

              <TouchableOpacity style={styles.cameraExpandBtnFloat} onPress={() => setCameraFullscreen(true)}>
                <Text style={styles.cameraExpandIcon}>⛶</Text>
              </TouchableOpacity>
            </View>

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

            <TouchableOpacity style={styles.calibrateButtonPortrait} onPress={calibrate}>
              <Text style={styles.calibrateText}>⚙ CALIBRATE / RESET ZERO</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <CameraFullscreenModal
        visible={cameraFullscreen}
        onClose={() => setCameraFullscreen(false)}
        cameraPermission={cameraPermission}
        isLandscape={isLandscape}
      />

      <Toast ref={toastRef} />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: 'rgb(0, 0, 0)',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  // ===== LANDSCAPE LAYOUT =====
  landscapeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '5%',
    paddingTop: 10,
  },
  landscapeGauge: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  landscapeCenterPanel: {
    flex: 1.4,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 8,
  },

  // ===== PORTRAIT LAYOUT =====
  portraitContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 15,
    paddingBottom: 20,
  },
  portraitAltitudeSection: {
    alignItems: 'center',
    marginBottom: 0,
    marginTop: 27,
  },
  portraitGaugesWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    marginTop: 4,
  },
  portraitGaugeItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ===== CAMERA SECTION =====
  cameraSection: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginTop: 10,
  },
  cameraHalf: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  cameraFrameHalf: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgb(10, 10, 10)',
    borderWidth: 1,
    borderColor: 'rgb(60, 60, 60)',
  },
  cameraPreview: {
    flex: 1,
  },
  cameraPermissionBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  cameraPermissionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  cameraPermissionText: {
    color: 'rgb(153, 153, 153)',
    fontSize: 11,
  },
  cameraLabel: {
    color: 'rgb(153, 153, 153)',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  cameraExpandBtnFloat: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraExpandIcon: {
    fontSize: 16,
    color: 'white',
  },

  // ===== LANDSCAPE CAMERA =====
  cameraSectionLand: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 6,
  },
  cameraHalfLand: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  cameraFrameLand: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgb(10, 10, 10)',
    borderWidth: 1,
    borderColor: 'rgb(60, 60, 60)',
  },

  // ===== SHARED INFO =====
  altitude: {
    fontWeight: 'bold',
    color: 'rgb(0, 229, 255)',
    textShadowColor: 'rgb(0, 229, 255)',
    textShadowRadius: 15,
    textShadowOffset: { width: 0, height: 0 },
    letterSpacing: -1,
  },
  altitudeLabel: {
    fontSize: 12,
    color: 'rgb(153, 153, 153)',
    letterSpacing: 0.3,
    marginTop: 2,
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
  },
  portraitInfoValue: {
    fontWeight: 'bold',
    color: 'rgb(255, 255, 255)',
    textShadowColor: 'rgba(0, 255, 255, 0.4)',
    textShadowRadius: 6,
    marginBottom: 2,
  },
  portraitBottomLabel: {
    fontSize: 12,
    color: 'rgb(153, 153, 153)',
    letterSpacing: 0.3,
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
  },
  infoItemContainer: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  iconCircle: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
    color: 'rgb(255, 255, 255)',
    textShadowColor: 'rgba(0, 255, 255, 0.4)',
    textShadowRadius: 6,
    marginBottom: 3,
  },
  infoLabel: {
    fontSize: 12,
    color: 'rgb(153, 153, 153)',
    letterSpacing: 0.3,
  },
  verticalDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgb(51, 51, 51)',
    marginHorizontal: 4,
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
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgb(101, 101, 101)',
    marginTop: 8,
  },
  calibrateText: {
    color: 'rgb(101, 101, 101)',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  // ===== MENU BUTTON =====
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

  // ===== WIFI INDICATOR & BUTTONS =====
  wifiIndicator: {
    position: 'absolute',
    top: 60,
    right: 15,
    backgroundColor: 'rgba(0, 229, 100, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgb(0, 229, 100)',
    zIndex: 100,
  },
  wifiIndicatorText: {
    color: 'rgb(0, 229, 100)',
    fontSize: 12,
    fontWeight: 'bold',
  },
  wifiButton: {
    position: 'absolute',
    top: 80,
    right: 15,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgb(0, 229, 100)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },

  // ===== BLUETOOTH INDICATOR & BUTTONS =====
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
    borderWidth: 2,
    borderColor: 'rgb(101, 101, 101)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  disconnectButton: {
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
  },
  iconButtonText: {
    fontSize: 18,
  },
});
