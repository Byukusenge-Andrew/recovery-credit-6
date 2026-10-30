import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'rw.recoverycredit.app',
  appName: 'Recovery Credit',
  webDir: 'public',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  android: {
    backgroundColor: '#0c2340',
    allowMixedContent: true,
  },
};

export default config;
