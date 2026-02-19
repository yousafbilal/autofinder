/**
 * Icon Helper - Ensures icons always render correctly
 */
import React from 'react';
import { Ionicons, FontAwesome5, Feather, AntDesign, MaterialCommunityIcons, FontAwesome, MaterialIcons } from '@expo/vector-icons';

export const SafeIonicons = ({ name, size, color, style, ...props }: any) => {
  if (!name) return null;
  
  const iconSize = size || 24;
  const iconColor = color || '#CD0100';
  
  return (
    <Ionicons
      name={name as any}
      size={iconSize}
      color={iconColor}
      style={[{ opacity: 1, lineHeight: iconSize, includeFontPadding: false }, style]}
      {...props}
    />
  );
};

export const SafeFontAwesome5 = ({ name, size, color, style, ...props }: any) => {
  if (!name) return null;
  
  const iconSize = size || 24;
  const iconColor = color || '#CD0100';
  
  return (
    <FontAwesome5
      name={name as any}
      size={iconSize}
      color={iconColor}
      style={[{ opacity: 1, lineHeight: iconSize, includeFontPadding: false }, style]}
      {...props}
    />
  );
};

export const SafeFeather = ({ name, size, color, style, ...props }: any) => {
  if (!name) return null;
  
  const iconSize = size || 24;
  const iconColor = color || '#CD0100';
  
  return (
    <Feather
      name={name as any}
      size={iconSize}
      color={iconColor}
      style={[{ opacity: 1, lineHeight: iconSize, includeFontPadding: false }, style]}
      {...props}
    />
  );
};

export const SafeAntDesign = ({ name, size, color, style, ...props }: any) => {
  if (!name) return null;
  
  return (
    <AntDesign
      name={name}
      size={size || 24}
      color={color || '#000'}
      style={[{ opacity: 1 }, style]}
      {...props}
    />
  );
};

export const SafeFontAwesome = ({ name, size, color, style, ...props }: any) => {
  if (!name) return null;
  
  return (
    <FontAwesome
      name={name}
      size={size || 24}
      color={color || '#000'}
      style={[{ opacity: 1 }, style]}
      {...props}
    />
  );
};

export const SafeMaterialCommunityIcons = ({ name, size, color, style, ...props }: any) => {
  if (!name) return null;
  
  return (
    <MaterialCommunityIcons
      name={name}
      size={size || 24}
      color={color || '#000'}
      style={[{ opacity: 1 }, style]}
      {...props}
    />
  );
};

export const SafeMaterialIcons = ({ name, size, color, style, ...props }: any) => {
  if (!name) return null;
  
  return (
    <MaterialIcons
      name={name}
      size={size || 24}
      color={color || '#000'}
      style={[{ opacity: 1 }, style]}
      {...props}
    />
  );
};

