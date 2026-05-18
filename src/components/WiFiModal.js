import React from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

const WiFiModal = ({ visible, onClose, wifiIpInput, setWifiIpInput, connectWifi, isConnecting }) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="slide"
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>📶 WiFi სენსორი</Text>
        <Text style={styles.modalSubtitle}>
          სენსორიანი ტელეფონი:{'\n'}
          1. გახსენით ეს აპი{'\n'}
          2. ჩართეთ Hotspot{'\n'}
          3. გახსენით Settings → Hotspot → IP მისამართი
        </Text>

        <TextInput
          style={styles.ipInput}
          placeholder="192.168.x.x"
          placeholderTextColor="rgb(100, 100, 100)"
          value={wifiIpInput}
          onChangeText={setWifiIpInput}
          keyboardType="numeric"
          autoCorrect={false}
        />

        <View style={styles.modalButtons}>
          <TouchableOpacity style={styles.modalButton} onPress={onClose}>
            <Text style={styles.modalButtonText}>გაუქმება</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, styles.modalButtonPrimary, isConnecting && { opacity: 0.6 }]}
            onPress={connectWifi}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <ActivityIndicator size="small" color="black" />
            ) : (
              <Text style={styles.modalButtonTextPrimary}>დაკავშირება</Text>
            )}
          </TouchableOpacity>
        </View>
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
  ipInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgb(0, 229, 100)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 2,
    marginVertical: 16,
    width: '100%',
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
});

export default WiFiModal;
