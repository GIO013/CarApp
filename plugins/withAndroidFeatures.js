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

// Add PiP trigger logic to MainActivity (Kotlin syntax)
const withPiPActivity = (config) => {
  return withMainActivity(config, async (config) => {
    const mainActivity = config.modResults;

    // Add imports for Kotlin (only if not already present)
    const importsToAdd = [];

    if (!mainActivity.contents.includes('import android.app.PictureInPictureParams')) {
      importsToAdd.push('import android.app.PictureInPictureParams');
    }
    if (!mainActivity.contents.includes('import android.util.Rational')) {
      importsToAdd.push('import android.util.Rational');
    }
    if (!mainActivity.contents.includes('import android.os.Build')) {
      importsToAdd.push('import android.os.Build');
    }
    if (!mainActivity.contents.includes('import android.content.res.Configuration')) {
      importsToAdd.push('import android.content.res.Configuration');
    }

    if (importsToAdd.length > 0) {
      const importStatement = '\n' + importsToAdd.join('\n');
      mainActivity.contents = mainActivity.contents.replace(
        'import android.os.Bundle',
        'import android.os.Bundle' + importStatement
      );
    }

    // Add onUserLeaveHint for auto-PiP when pressing Home (Kotlin syntax)
    if (!mainActivity.contents.includes('onUserLeaveHint')) {
      const pipMethod = `

  override fun onUserLeaveHint() {
    super.onUserLeaveHint()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      enterPiPMode()
    }
  }

  private fun enterPiPMode() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val aspectRatio = Rational(16, 9)
      val pipBuilder = PictureInPictureParams.Builder()
      pipBuilder.setAspectRatio(aspectRatio)
      enterPictureInPictureMode(pipBuilder.build())
    }
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    // Handle configuration changes for Split-Screen
    // State is preserved through React Native's state management
  }

  override fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean, newConfig: Configuration) {
    super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)
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
