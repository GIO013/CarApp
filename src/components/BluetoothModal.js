import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

const BluetoothModal = ({
  visible,
  onClose,
  isScanning,
  availableDevices,
  connectToDevice,
  onRescan,
}) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="slide"
    onRequestClose={onClose}
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
            <TouchableOpacity style={styles.deviceItem} onPress={() => connectToDevice(item)}>
              <Text style={styles.deviceName}>{item.name || 'უცნობი მოწყობილობა'}</Text>
              <Text style={styles.deviceId}>{item.id}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            !isScanning && (
              <Text style={styles.noDevicesText}>მოწყობილობები ვერ მოიძებნა</Text>
            )
          }
        />

        <View style={styles.modalButtons}>
          <TouchableOpacity style={styles.modalButton} onPress={onClose}>
            <Text style={styles.modalButtonText}>დახურვა</Text>
          </TouchableOpacity>
          {!isScanning && (
            <TouchableOpacity style={[styles.modalButton, styles.modalButtonPrimary]} onPress={onRescan}>
              <Text style={styles.modalButtonTextPrimary}>ხელახლა სკანირება</Text>
            </TouchableOpacity>
          )}
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
});

export default BluetoothModal;
