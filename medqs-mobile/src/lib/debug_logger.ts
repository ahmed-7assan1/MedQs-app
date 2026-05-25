import { Alert, Platform } from 'react-native';

export function logErrorToFile(error: any) {
  const errorMessage = error instanceof Error ? error.stack : JSON.stringify(error);
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${errorMessage}`;

  // Log to console so it appears in the Metro bundler / terminal
  console.error(logMessage);

  // On mobile, showing an alert is helpful for immediate feedback during debugging
  if (Platform.OS !== 'web') {
    Alert.alert(
      'App Error',
      'An unexpected error occurred. Check your console for details.',
      [{ text: 'OK' }]
    );
  }
}
