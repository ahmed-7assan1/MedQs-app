import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.medqs.app',
  appName: 'MedQs',
  webDir: 'public',
  server: {
    url: 'https://med-qs0.vercel.app',
    cleartext: false,
  },
  android: {
    backgroundColor: '#0f172a',
    allowMixedContent: false,
  },
  ios: {
    contentInset: 'always',
  },
};

export default config;
