import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.madeirafriends.app',
  appName: 'Madeira Friends',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchAutoHide: false,
    },
    CapacitorUpdater: {
      autoUpdate: true,
    },
  },
}

export default config
