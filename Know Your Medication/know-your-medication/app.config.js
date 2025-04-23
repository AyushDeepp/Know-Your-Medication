module.exports = {
  name: "Know Your Medication",
  slug: "know-your-medication",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "knowyourmedication",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.yourcompany.knowyourmedication"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    package: "com.yourcompany.knowyourmedication",
    permissions: [
      "CAMERA",
      "READ_EXTERNAL_STORAGE",
      "WRITE_EXTERNAL_STORAGE"
    ]
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png"
  },
  plugins: ["expo-router"],
  experiments: {
    typedRoutes: true
  },
  updates: {
    url: "https://u.expo.dev/3fd640ee-563d-4a0f-a13c-b86c0371bff6"
  },
  runtimeVersion: {
    policy: "appVersion"
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || "https://know-your-medication-api.onrender.com",
    eas: {
      projectId: "3fd640ee-563d-4a0f-a13c-b86c0371bff6"
    }
  }
}; 