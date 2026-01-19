/**
 * SpaceSaver - Toggle Component
 * Animated toggle switch
 */

import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES, ANIMATION_DURATION } from '../../constants';

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export const Toggle: React.FC<ToggleProps> = ({
  value,
  onValueChange,
  label,
  description,
  disabled = false,
  size = 'medium',
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;
  
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: ANIMATION_DURATION.fast,
      useNativeDriver: true,
    }).start();
  }, [value, animatedValue]);
  
  const sizes = {
    small: { width: 36, height: 20, knobSize: 16 },
    medium: { width: 48, height: 28, knobSize: 24 },
    large: { width: 58, height: 34, knobSize: 30 },
  };
  
  const { width, height, knobSize } = sizes[size];
  const knobOffset = width - knobSize - 4;
  
  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, knobOffset],
  });
  
  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.gray[300], COLORS.primary],
  });
  
  return (
    <View style={[styles.container, style]}>
      <View style={styles.labelContainer}>
        {label && <Text style={styles.label}>{label}</Text>}
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
      
      <TouchableOpacity
        onPress={() => !disabled && onValueChange(!value)}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Animated.View
          style={[
            styles.track,
            {
              width,
              height,
              borderRadius: height / 2,
              backgroundColor,
              opacity: disabled ? 0.5 : 1,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.knob,
              {
                width: knobSize,
                height: knobSize,
                borderRadius: knobSize / 2,
                transform: [{ translateX }],
              },
            ]}
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelContainer: {
    flex: 1,
    marginRight: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text.light,
  },
  description: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[500],
    marginTop: SPACING.xs,
  },
  track: {
    justifyContent: 'center',
  },
  knob: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default Toggle;
