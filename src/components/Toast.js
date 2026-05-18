import React, { useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';

const Toast = forwardRef((_, ref) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const timerRef = useRef(null);
  const animRef = useRef(null);

  useImperativeHandle(ref, () => ({
    show(msg, toastType = 'info') {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (animRef.current) animRef.current.stop();

      setMessage(msg);
      setType(toastType);
      opacity.setValue(0);

      animRef.current = Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(2500),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]);
      animRef.current.start();
      timerRef.current = setTimeout(() => setMessage(''), 3100);
    },
  }));

  if (!message) return null;

  return (
    <Animated.View style={[styles.toast, styles[type], { opacity }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 70,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    maxWidth: '80%',
    zIndex: 999,
  },
  info: {
    backgroundColor: 'rgba(0, 229, 255, 0.92)',
  },
  success: {
    backgroundColor: 'rgba(0, 200, 100, 0.92)',
  },
  error: {
    backgroundColor: 'rgba(255, 80, 80, 0.92)',
  },
  text: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
  },
});

export default Toast;
