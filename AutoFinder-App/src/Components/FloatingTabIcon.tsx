import React, { useRef, useEffect } from 'react';
import { Animated, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

const FloatingTabIcon = () => {
    const translateY = useRef(new Animated.Value(0)).current;
  
    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(translateY, {
            toValue: -5,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, []);
  
    return (
      <Animated.View
        style={{
          transform: [{ translateY }],
          width: 44,
          height: 44,
          backgroundColor: "#CD0100",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: 22,
        }}
      >
        <Feather
          name="plus" 
          size={20} 
          color="white"
          style={{ opacity: 1 }}
        />
      </Animated.View>
    );
  };

  export default FloatingTabIcon;