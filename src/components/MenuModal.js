import React from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';

const MenuModal = ({
  visible,
  onClose,
  carSideImage,
  carRearImage,
  pickImage,
  resetCarImages,
  calibrate,
  sensorAvailable,
  wifiConnected,
  wifiServerIp,
  disconnectWifi,
  onOpenWifiModal,
  bluetoothConnected,
  bluetoothDeviceName,
  disconnectBluetooth,
  startBluetoothReceiver,
}) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="slide"
    onRequestClose={onClose}
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

            <View style={styles.carImageOption}>
              <View style={styles.carImagePreviewContainer}>
                <Image source={carSideImage} style={styles.carImagePreview} resizeMode="contain" />
              </View>
              <View style={styles.carImageInfo}>
                <Text style={styles.carImageLabel}>გვერდითი ხედი (Pitch)</Text>
                <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage('side')}>
                  <Text style={styles.uploadButtonText}>📷 ატვირთვა</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.carImageOption}>
              <View style={styles.carImagePreviewContainer}>
                <Image source={carRearImage} style={styles.carImagePreview} resizeMode="contain" />
              </View>
              <View style={styles.carImageInfo}>
                <Text style={styles.carImageLabel}>უკანა ხედი (Roll)</Text>
                <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage('rear')}>
                  <Text style={styles.uploadButtonText}>📷 ატვირთვა</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.resetButton} onPress={resetCarImages}>
              <Text style={styles.resetButtonText}>🔄 Default სურათების დაბრუნება</Text>
            </TouchableOpacity>
          </View>

          {/* Calibration Section */}
          <View style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>⚙️ კალიბრაცია</Text>
            <TouchableOpacity
              style={styles.calibrateMenuButton}
              onPress={() => { calibrate(); onClose(); }}
            >
              <Text style={styles.calibrateMenuButtonText}>⚙ CALIBRATE / RESET ZERO</Text>
            </TouchableOpacity>
          </View>

          {/* WiFi Section */}
          {!sensorAvailable && (
            <View style={styles.menuSection}>
              <Text style={styles.menuSectionTitle}>📶 WiFi / Hotspot სენსორი</Text>
              <Text style={styles.menuSectionSubtitle}>
                სენსორიანი ტელეფონი: გახსენით აპი, ჩართეთ Hotspot, ჩაუწერეთ IP მისამართი ქვემოთ
              </Text>
              {wifiConnected ? (
                <TouchableOpacity
                  style={styles.disconnectButton}
                  onPress={() => { disconnectWifi(); onClose(); }}
                >
                  <Text style={styles.disconnectButtonText}>✕ გათიშვა ({wifiServerIp})</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => { onClose(); onOpenWifiModal(); }}
                >
                  <Text style={styles.uploadButtonText}>📶 WiFi-ით დაკავშირება</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Bluetooth Section */}
          {!sensorAvailable && (
            <View style={styles.menuSection}>
              <Text style={styles.menuSectionTitle}>📡 Bluetooth სენსორი</Text>
              <Text style={styles.menuSectionSubtitle}>
                დაუკავშირდით ტელეფონს სენსორის მონაცემების მისაღებად
              </Text>
              {bluetoothConnected ? (
                <TouchableOpacity
                  style={styles.disconnectButton}
                  onPress={() => { disconnectBluetooth(); onClose(); }}
                >
                  <Text style={styles.disconnectButtonText}>✕ გათიშვა ({bluetoothDeviceName})</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => { onClose(); startBluetoothReceiver(); }}
                >
                  <Text style={styles.uploadButtonText}>🔍 მოწყობილობების ძებნა</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>

        <TouchableOpacity style={styles.closeMenuButton} onPress={onClose}>
          <Text style={styles.closeMenuButtonText}>დახურვა</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'rgb(0, 229, 255)',
    textAlign: 'center',
    marginBottom: 5,
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
  calibrateMenuButton: {
    backgroundColor: 'rgba(101, 101, 101, 0.3)',
    borderWidth: 2,
    borderColor: 'rgb(101, 101, 101)',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
  },
  calibrateMenuButtonText: {
    color: 'rgb(200, 200, 200)',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  disconnectButton: {
    backgroundColor: 'rgba(255, 100, 100, 0.2)',
    borderWidth: 1,
    borderColor: 'rgb(255, 100, 100)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  disconnectButtonText: {
    color: 'rgb(255, 100, 100)',
    fontSize: 13,
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

export default MenuModal;
