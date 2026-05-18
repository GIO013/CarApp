import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const OrientationButton = ({ isLandscape, onToggle }) => (
  <TouchableOpacity style={styles.orientationButton} onPress={onToggle}>
    <Text style={styles.orientationIcon}>
      {isLandscape ? '📱' : '↳↰'}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  orientationButton: {
    position: 'absolute',
    top: 30,
    right: 15,
    zIndex: 100,
    width: 44,
    height: 44,
    borderRadius: 22,
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
});

export default OrientationButton;
