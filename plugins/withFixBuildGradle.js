const { withAppBuildGradle } = require('expo/config-plugins');

/**
 * Config plugin to fix enableBundleCompression issue in React Native 0.76.x
 * This property doesn't exist in RN 0.76.9 but is set by newer Expo templates
 */
const withFixBuildGradle = (config) => {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.contents) {
      // Remove or comment out the enableBundleCompression line
      config.modResults.contents = config.modResults.contents.replace(
        /^\s*enableBundleCompression\s*=.*$/gm,
        '// enableBundleCompression removed for RN 0.76.x compatibility'
      );
    }
    return config;
  });
};

module.exports = withFixBuildGradle;
