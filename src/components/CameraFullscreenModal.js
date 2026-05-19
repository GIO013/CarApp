import React from 'react';
import { Modal, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { CameraView } from 'expo-camera';
import { WebView } from 'react-native-webview';
import { REAR_CAMERA_HTML } from '../constants/cameraHtml';

const CameraFullscreenModal = ({ visible, onClose, cameraPermission, isLandscape }) => (
  <Modal
    visible={visible}
    transparent={false}
    animationType="fade"
    onRequestClose={onClose}
    statusBarTranslucent
  >
    <View style={[styles.container, { flexDirection: isLandscape ? 'row' : 'column' }]}>
      <View style={styles.slot}>
        {cameraPermission?.granted ? (
          <CameraView key="fs-back" style={{ flex: 1 }} facing="back" />
        ) : (
          <View style={styles.inactive} />
        )}
        <View style={styles.labelBox}>
          <Text style={styles.label}>FRONT</Text>
        </View>
      </View>

      <View style={styles.slot}>
        {cameraPermission?.granted ? (
          <WebView
            key="fs-front"
            source={{ html: REAR_CAMERA_HTML, baseUrl: 'http://localhost/' }}
            style={{ flex: 1 }}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled={true}
            originWhitelist={['*']}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.inactive} />
        )}
        <View style={styles.labelBox}>
          <Text style={styles.label}>REAR</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  slot: {
    flex: 1,
    position: 'relative',
    backgroundColor: 'rgb(8, 8, 8)',
  },
  inactive: {
    flex: 1,
    backgroundColor: 'rgb(15, 15, 15)',
  },
  labelBox: {
    position: 'absolute',
    top: 12,
    left: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  label: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  controls: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 30,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 100, 100, 0.25)',
    borderWidth: 1,
    borderColor: 'rgb(255, 100, 100)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: 'rgb(255, 100, 100)',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CameraFullscreenModal;
