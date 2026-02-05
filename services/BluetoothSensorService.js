/**
 * Bluetooth Sensor Streaming Service
 *
 * ორი რეჟიმი:
 * 1. SENDER - ტელეფონი აგზავნის სენსორის მონაცემებს (როცა სენსორი აქვს)
 * 2. RECEIVER - მონიტორი იღებს მონაცემებს (როცა სენსორი არ აქვს)
 */

import { BleManager } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';
import { Buffer } from 'buffer';

// Bluetooth UUIDs - უნიკალური იდენტიფიკატორები სერვისისა და მახასიათებლებისთვის
const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const SENSOR_DATA_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
const DEVICE_NAME = 'CarDashboard_Sensor';

class BluetoothSensorService {
  constructor() {
    this.manager = null;
    this.connectedDevice = null;
    this.isScanning = false;
    this.mode = null; // 'sender' or 'receiver'
    this.onDataReceived = null;
    this.onConnectionChange = null;
    this.onDeviceFound = null;
  }

  // ინიციალიზაცია
  async initialize() {
    if (!this.manager) {
      this.manager = new BleManager();
    }

    // Android permissions
    if (Platform.OS === 'android') {
      await this.requestAndroidPermissions();
    }

    return new Promise((resolve, reject) => {
      const subscription = this.manager.onStateChange((state) => {
        if (state === 'PoweredOn') {
          subscription.remove();
          resolve(true);
        } else if (state === 'PoweredOff') {
          reject(new Error('Bluetooth გამორთულია'));
        }
      }, true);
    });
  }

  // Android Bluetooth permissions
  async requestAndroidPermissions() {
    if (Platform.OS !== 'android') return true;

    const apiLevel = Platform.Version;

    if (apiLevel >= 31) {
      // Android 12+
      const permissions = [
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ];

      const results = await PermissionsAndroid.requestMultiple(permissions);
      return Object.values(results).every(
        (result) => result === PermissionsAndroid.RESULTS.GRANTED
      );
    } else {
      // Android 11 and below
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
  }

  // ===== RECEIVER MODE (მონიტორისთვის) =====

  // მოწყობილობების სკანირება
  async startScanning(onDeviceFound) {
    if (this.isScanning) return;

    await this.initialize();
    this.isScanning = true;
    this.onDeviceFound = onDeviceFound;

    this.manager.startDeviceScan(
      [SERVICE_UUID],
      { allowDuplicates: false },
      (error, device) => {
        if (error) {
          console.log('Scan error:', error);
          return;
        }

        if (device && device.name && device.name.includes('CarDashboard')) {
          if (this.onDeviceFound) {
            this.onDeviceFound(device);
          }
        }
      }
    );

    // 30 წამის შემდეგ გაჩერდეს სკანირება
    setTimeout(() => {
      this.stopScanning();
    }, 30000);
  }

  // სკანირების გაჩერება
  stopScanning() {
    if (this.manager && this.isScanning) {
      this.manager.stopDeviceScan();
      this.isScanning = false;
    }
  }

  // მოწყობილობასთან დაკავშირება (Receiver)
  async connectToDevice(device) {
    try {
      this.stopScanning();

      const connectedDevice = await device.connect();
      await connectedDevice.discoverAllServicesAndCharacteristics();

      this.connectedDevice = connectedDevice;
      this.mode = 'receiver';

      if (this.onConnectionChange) {
        this.onConnectionChange(true, device.name);
      }

      // მონაცემების მიღების subscription
      this.connectedDevice.monitorCharacteristicForService(
        SERVICE_UUID,
        SENSOR_DATA_UUID,
        (error, characteristic) => {
          if (error) {
            console.log('Monitor error:', error);
            return;
          }

          if (characteristic && characteristic.value) {
            const data = this.decodeData(characteristic.value);
            if (this.onDataReceived) {
              this.onDataReceived(data);
            }
          }
        }
      );

      // Disconnection handler
      this.manager.onDeviceDisconnected(device.id, () => {
        this.connectedDevice = null;
        if (this.onConnectionChange) {
          this.onConnectionChange(false, null);
        }
      });

      return true;
    } catch (error) {
      console.log('Connection error:', error);
      throw error;
    }
  }

  // ===== SENDER MODE (ტელეფონისთვის) =====

  // Advertising დაწყება (BLE Peripheral)
  // შენიშვნა: react-native-ble-plx არ უჭერს მხარს peripheral mode-ს
  // ამიტომ გამოვიყენოთ სხვა მიდგომა - Central-to-Central კავშირი

  // სენსორის მონაცემების გაგზავნა
  async sendSensorData(pitch, roll, altitude, speed) {
    if (!this.connectedDevice || this.mode !== 'sender') {
      return false;
    }

    try {
      const data = this.encodeData({ pitch, roll, altitude, speed });
      await this.connectedDevice.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        SENSOR_DATA_UUID,
        data
      );
      return true;
    } catch (error) {
      console.log('Send error:', error);
      return false;
    }
  }

  // მონაცემების კოდირება Base64-ში
  encodeData(data) {
    const json = JSON.stringify(data);
    return Buffer.from(json).toString('base64');
  }

  // მონაცემების დეკოდირება Base64-დან
  decodeData(base64) {
    try {
      const json = Buffer.from(base64, 'base64').toString('utf8');
      return JSON.parse(json);
    } catch (error) {
      console.log('Decode error:', error);
      return null;
    }
  }

  // კავშირის გაწყვეტა
  async disconnect() {
    if (this.connectedDevice) {
      try {
        await this.connectedDevice.cancelConnection();
      } catch (error) {
        console.log('Disconnect error:', error);
      }
      this.connectedDevice = null;
    }
    this.mode = null;
  }

  // სერვისის გათიშვა
  destroy() {
    this.stopScanning();
    this.disconnect();
    if (this.manager) {
      this.manager.destroy();
      this.manager = null;
    }
  }

  // Callbacks
  setOnDataReceived(callback) {
    this.onDataReceived = callback;
  }

  setOnConnectionChange(callback) {
    this.onConnectionChange = callback;
  }

  // სტატუსი
  isConnected() {
    return this.connectedDevice !== null;
  }

  getMode() {
    return this.mode;
  }
}

// Singleton instance
export default new BluetoothSensorService();
