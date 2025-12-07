import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
} from 'react-native';

interface InputFieldProps extends TextInputProps {
  icon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  error?: string;
  containerStyle?: any;
}

export default function InputField({
  icon,
  rightIcon,
  onRightIconPress,
  error,
  containerStyle,
  style,
  ...props
}: InputFieldProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[styles.inputContainer, error && styles.inputContainerError]}>
        {icon && (
          <Ionicons 
            name={icon} 
            size={20} 
            color={error ? "#FF6B6B" : "#666"} 
            style={styles.inputIcon} 
          />
        )}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor="#999"
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIcon}
          >
            <Ionicons 
              name={rightIcon} 
              size={20} 
              color={error ? "#FF6B6B" : "#666"} 
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputContainerError: {
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 16,
  },
  rightIcon: {
    padding: 4,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
