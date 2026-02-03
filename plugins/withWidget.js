const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin for Android App Widget
 * Creates a simple widget showing Speed, Altitude, and Temperature
 */

// Widget receiver class content
const widgetProviderClass = `
package com.cardashboard.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class CarDashboardWidget extends AppWidgetProvider {

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences("CarDashboardData", Context.MODE_PRIVATE);

        int speed = prefs.getInt("speed", 0);
        int altitude = prefs.getInt("altitude", 0);
        int temperature = prefs.getInt("temperature", 0);

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_car_dashboard);

        views.setTextViewText(R.id.widget_speed, speed + " km/h");
        views.setTextViewText(R.id.widget_altitude, altitude + " m");
        views.setTextViewText(R.id.widget_temperature, temperature + "°C");

        // Open app on widget click
        Intent intent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_container, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onEnabled(Context context) {
        // Widget first instance
    }

    @Override
    public void onDisabled(Context context) {
        // Widget last instance removed
    }
}
`;

// Widget layout XML
const widgetLayoutXml = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/widget_container"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@drawable/widget_background"
    android:gravity="center"
    android:orientation="vertical"
    android:padding="16dp">

    <TextView
        android:id="@+id/widget_title"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Car Dashboard"
        android:textColor="#00e5ff"
        android:textSize="14sp"
        android:textStyle="bold" />

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="8dp"
        android:gravity="center"
        android:orientation="horizontal">

        <LinearLayout
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:gravity="center"
            android:orientation="vertical">

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="SPEED"
                android:textColor="#999999"
                android:textSize="10sp" />

            <TextView
                android:id="@+id/widget_speed"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="0 km/h"
                android:textColor="#ffffff"
                android:textSize="16sp"
                android:textStyle="bold" />
        </LinearLayout>

        <LinearLayout
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:gravity="center"
            android:orientation="vertical">

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="ALTITUDE"
                android:textColor="#999999"
                android:textSize="10sp" />

            <TextView
                android:id="@+id/widget_altitude"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="0 m"
                android:textColor="#00e5ff"
                android:textSize="16sp"
                android:textStyle="bold" />
        </LinearLayout>

        <LinearLayout
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:gravity="center"
            android:orientation="vertical">

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="TEMP"
                android:textColor="#999999"
                android:textSize="10sp" />

            <TextView
                android:id="@+id/widget_temperature"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="0°C"
                android:textColor="#ff8c00"
                android:textSize="16sp"
                android:textStyle="bold" />
        </LinearLayout>
    </LinearLayout>
</LinearLayout>
`;

// Widget background drawable
const widgetBackgroundXml = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <solid android:color="#CC000000" />
    <corners android:radius="16dp" />
    <stroke
        android:width="1dp"
        android:color="#00e5ff" />
</shape>
`;

// Widget info XML
const widgetInfoXml = `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:initialLayout="@layout/widget_car_dashboard"
    android:minWidth="250dp"
    android:minHeight="80dp"
    android:previewImage="@mipmap/ic_launcher"
    android:resizeMode="horizontal|vertical"
    android:updatePeriodMillis="1800000"
    android:widgetCategory="home_screen" />
`;

// Add widget to manifest
const withWidgetManifest = (config) => {
  return withAndroidManifest(config, async (config) => {
    const mainApplication = config.modResults.manifest.application[0];

    // Add widget receiver
    const widgetReceiver = {
      $: {
        'android:name': '.CarDashboardWidget',
        'android:exported': 'true',
      },
      'intent-filter': [
        {
          action: [
            {
              $: {
                'android:name': 'android.appwidget.action.APPWIDGET_UPDATE',
              },
            },
          ],
        },
      ],
      'meta-data': [
        {
          $: {
            'android:name': 'android.appwidget.provider',
            'android:resource': '@xml/widget_info',
          },
        },
      ],
    };

    // Check if receiver already exists
    if (!mainApplication.receiver) {
      mainApplication.receiver = [];
    }

    const existingReceiver = mainApplication.receiver.find(
      (r) => r.$['android:name'] === '.CarDashboardWidget'
    );

    if (!existingReceiver) {
      mainApplication.receiver.push(widgetReceiver);
    }

    return config;
  });
};

// Create widget files
const withWidgetFiles = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const androidPath = path.join(projectRoot, 'android');

      // Only proceed if android folder exists (after prebuild)
      if (fs.existsSync(androidPath)) {
        const packagePath = 'app/src/main/java/com/cardashboard/app';
        const resPath = 'app/src/main/res';

        // Create directories
        const dirs = [
          path.join(androidPath, packagePath),
          path.join(androidPath, resPath, 'layout'),
          path.join(androidPath, resPath, 'drawable'),
          path.join(androidPath, resPath, 'xml'),
        ];

        dirs.forEach((dir) => {
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
        });

        // Write widget provider class
        fs.writeFileSync(
          path.join(androidPath, packagePath, 'CarDashboardWidget.java'),
          widgetProviderClass.trim()
        );

        // Write widget layout
        fs.writeFileSync(
          path.join(androidPath, resPath, 'layout', 'widget_car_dashboard.xml'),
          widgetLayoutXml.trim()
        );

        // Write widget background
        fs.writeFileSync(
          path.join(androidPath, resPath, 'drawable', 'widget_background.xml'),
          widgetBackgroundXml.trim()
        );

        // Write widget info
        fs.writeFileSync(
          path.join(androidPath, resPath, 'xml', 'widget_info.xml'),
          widgetInfoXml.trim()
        );
      }

      return config;
    },
  ]);
};

// Combined plugin
module.exports = (config) => {
  config = withWidgetManifest(config);
  config = withWidgetFiles(config);
  return config;
};
