import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import tw from 'twrnc';
import { useThemeStore } from '../../store/useThemeStore';
import { LucideIcon } from 'lucide-react-native';

interface Props {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  icon?: LucideIcon;
  rightIcon?: LucideIcon;
  onRightIconPress?: () => void;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  style?: StyleProp<ViewStyle>;
  error?: string | null;
}

export function EliteInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  icon: Icon,
  rightIcon: RightIcon,
  onRightIconPress,
  keyboardType = 'default',
  autoCapitalize = 'none',
  style,
  error
}: Props) {
  const { getTheme, primaryColor } = useThemeStore();
  const theme = getTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[tw`w-full mb-4`, style]}>
      {label && (
        <Text style={[tw`text-[11px] font-black mb-2 uppercase tracking-widest ml-1`, { color: theme.colors.textMuted }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          tw`flex-row items-center h-16 rounded-2xl px-5 border`,
          {
            backgroundColor: theme.colors.surface,
            borderColor: error ? theme.colors.danger : (isFocused ? primaryColor : theme.colors.border),
          }
        ]}
      >
        {Icon && <Icon color={isFocused ? primaryColor : theme.colors.textMuted} size={20} style={tw`mr-4`} />}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted + '80'}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[tw`flex-1 text-base font-semibold`, { color: theme.colors.text }]}
        />
        {RightIcon && (
          <TouchableOpacity onPress={onRightIconPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <RightIcon color={theme.colors.textMuted} size={20} />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={[tw`text-xs font-bold mt-1 ml-1`, { color: theme.colors.danger }]}>
          {error}
        </Text>
      )}
    </View>
  );
}
