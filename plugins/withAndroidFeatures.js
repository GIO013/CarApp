const { withAndroidManifest, withMainActivity } = require('@expo/config-plugins');

/**
 * Expo Config Plugin for Android PiP, Split-Screen, and Multi-Window support
 */

// Add PiP and Multi-Window attributes to AndroidManifest
const withPiPAndMultiWindow = (config) => {
  return withAndroidManifest(config, async (config) => {
    const mainApplication = config.modResults.manifest.application[0];
    const mainActivity = mainApplication.activity.find(
      (activity) => activity.$['android:name'] === '.MainActivity'
    );

    if (mainActivity) {
      // Enable Picture-in-Picture
      mainActivity.$['android:supportsPictureInPicture'] = 'true';

      // Enable Multi-Window / Split-Screen
      mainActivity.$['android:resizeableActivity'] = 'true';

      // Handle configuration changes to prevent activity restart
      mainActivity.$['android:configChanges'] =
        'keyboard|keyboardHidden|orientation|screenSize|screenLayout|smallestScreenSize|uiMode';

      // Set launch mode for better PiP behavior
      mainActivity.$['android:launchMode'] = 'singleTask';
    }

    return config;
  });
};

// Add PiP trigger logic to MainActivity
const withPiPActivity = (config) => {
  return withMainActivity(config, async (config) => {
    const mainActivity = config.modResults;

    // Add imports
    if (!mainActivity.contents.includes('import android.app.PictureInPictureParams')) {
      const importStatement = `
import android.app.PictureInPictureParams;
import android.util.Rational;
import android.os.Build;
import android.content.res.Configuration;
`;
      mainActivity.contents = mainActivity.contents.replace(
        'import android.os.Bundle;',
        'import android.os.Bundle;' + importStatement
      );
    }

    // Add onUserLeaveHint for auto-PiP when pressing Home
    if (!mainActivity.contents.includes('onUserLeaveHint')) {
      const pipMethod = `
  @Override
  public void onUserLeaveHint() {
    super.onUserLeaveHint();
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      enterPiPMode();
    }
  }

  private void enterPiPMode() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Rational aspectRatio = new Rational(16, 9);
      PictureInPictureParams.Builder pipBuilder = new PictureInPictureParams.Builder();
      pipBuilder.setAspectRatio(aspectRatio);
      enterPictureInPictureMode(pipBuilder.build());
    }
  }

  @Override
  public void onConfigurationChanged(Configuration newConfig) {
    super.onConfigurationChanged(newConfig);
    // Handle configuration changes for Split-Screen
    // State is preserved through React Native's state management
  }

  @Override
  public void onPictureInPictureModeChanged(boolean isInPictureInPictureMode, Configuration newConfig) {
    super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig);
    // React Native will handle the layout changes automatically
  }
`;
      // Insert before the last closing brace
      const lastBraceIndex = mainActivity.contents.lastIndexOf('}');
      mainActivity.contents =
        mainActivity.contents.slice(0, lastBraceIndex) +
        pipMethod +
        mainActivity.contents.slice(lastBraceIndex);
    }

    return config;
  });
};

// Combined plugin
module.exports = (config) => {
  config = withPiPAndMultiWindow(config);
  config = withPiPActivity(config);
  return config;
};
