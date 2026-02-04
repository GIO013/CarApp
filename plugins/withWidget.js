const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin for Android App Widgets
 * Creates 3 widgets:
 * 1. Compact Widget - Pitch, Roll, Altitude (small)
 * 2. Portrait Widget - Full dashboard in portrait orientation
 * 3. Landscape Widget - Full dashboard in landscape orientation
 */

// ==================== COMPACT WIDGET ====================
const compactWidgetClass = `
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
        SharedPreferences prefs = context.getSharedPreferences("CarDashboardWidget", Context.MODE_PRIVATE);

        int pitch = prefs.getInt("pitch", 0);
        int roll = prefs.getInt("roll", 0);
        int altitude = prefs.getInt("altitude", 0);

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_compact);

        String pitchStr = (pitch >= 0 ? "+" : "") + pitch + "°";
        String rollStr = (roll >= 0 ? "+" : "") + roll + "°";

        views.setTextViewText(R.id.widget_pitch_value, pitchStr);
        views.setTextViewText(R.id.widget_roll_value, rollStr);
        views.setTextViewText(R.id.widget_altitude_value, altitude + " m");

        // Rotate car icons based on pitch and roll values
        // Clamp rotation to reasonable range (-45 to 45 degrees)
        float pitchRotation = Math.max(-45, Math.min(45, pitch * 1.5f));
        float rollRotation = Math.max(-45, Math.min(45, roll * 1.5f));

        views.setFloat(R.id.widget_pitch_car, "setRotation", pitchRotation);
        views.setFloat(R.id.widget_roll_car, "setRotation", rollRotation);

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
    public void onEnabled(Context context) {}

    @Override
    public void onDisabled(Context context) {}
}
`;

// ==================== PORTRAIT WIDGET ====================
const portraitWidgetClass = `
package com.cardashboard.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class CarDashboardWidgetPortrait extends AppWidgetProvider {

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences("CarDashboardWidget", Context.MODE_PRIVATE);

        int pitch = prefs.getInt("pitch", 0);
        int roll = prefs.getInt("roll", 0);
        int altitude = prefs.getInt("altitude", 0);
        int speed = prefs.getInt("speed", 0);
        int temperature = prefs.getInt("temperature", 0);

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_portrait);

        String pitchStr = (pitch >= 0 ? "+" : "") + pitch + "°";
        String rollStr = (roll >= 0 ? "+" : "") + roll + "°";
        String tempStr = (temperature >= 0 ? "+" : "") + temperature + "°C";

        views.setTextViewText(R.id.widget_altitude_value, altitude + " m");
        views.setTextViewText(R.id.widget_pitch_value, pitchStr);
        views.setTextViewText(R.id.widget_roll_value, rollStr);
        views.setTextViewText(R.id.widget_speed_value, speed + " km/h");
        views.setTextViewText(R.id.widget_temp_value, tempStr);

        // Rotate car icons
        float pitchRotation = Math.max(-45, Math.min(45, pitch * 1.5f));
        float rollRotation = Math.max(-45, Math.min(45, roll * 1.5f));
        views.setFloat(R.id.widget_pitch_car, "setRotation", pitchRotation);
        views.setFloat(R.id.widget_roll_car, "setRotation", rollRotation);

        // Open app on widget click
        Intent intent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 1, intent, PendingIntent.FLAG_IMMUTABLE);
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
    public void onEnabled(Context context) {}

    @Override
    public void onDisabled(Context context) {}
}
`;

// ==================== LANDSCAPE WIDGET ====================
const landscapeWidgetClass = `
package com.cardashboard.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class CarDashboardWidgetLandscape extends AppWidgetProvider {

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences("CarDashboardWidget", Context.MODE_PRIVATE);

        int pitch = prefs.getInt("pitch", 0);
        int roll = prefs.getInt("roll", 0);
        int altitude = prefs.getInt("altitude", 0);
        int speed = prefs.getInt("speed", 0);
        int temperature = prefs.getInt("temperature", 0);

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_landscape);

        String pitchStr = (pitch >= 0 ? "+" : "") + pitch + "°";
        String rollStr = (roll >= 0 ? "+" : "") + roll + "°";
        String tempStr = (temperature >= 0 ? "+" : "") + temperature + "°C";

        views.setTextViewText(R.id.widget_pitch_value, pitchStr);
        views.setTextViewText(R.id.widget_altitude_value, altitude + " m");
        views.setTextViewText(R.id.widget_roll_value, rollStr);
        views.setTextViewText(R.id.widget_speed_value, speed + " km/h");
        views.setTextViewText(R.id.widget_temp_value, tempStr);

        // Rotate car icons
        float pitchRotation = Math.max(-45, Math.min(45, pitch * 1.5f));
        float rollRotation = Math.max(-45, Math.min(45, roll * 1.5f));
        views.setFloat(R.id.widget_pitch_car, "setRotation", pitchRotation);
        views.setFloat(R.id.widget_roll_car, "setRotation", rollRotation);

        // Open app on widget click
        Intent intent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 2, intent, PendingIntent.FLAG_IMMUTABLE);
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
    public void onEnabled(Context context) {}

    @Override
    public void onDisabled(Context context) {}
}
`;

// ==================== LAYOUTS ====================

// Compact Widget Layout (Pitch, Roll, Altitude)
const compactLayoutXml = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/widget_container"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@drawable/widget_background"
    android:gravity="center"
    android:orientation="vertical"
    android:padding="8dp">

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="CAR DASHBOARD"
        android:textColor="#00e5ff"
        android:textSize="10sp"
        android:textStyle="bold"
        android:letterSpacing="0.1" />

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="4dp"
        android:gravity="center"
        android:orientation="horizontal">

        <!-- Pitch with visual -->
        <LinearLayout
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:gravity="center"
            android:orientation="vertical">

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="PITCH"
                android:textColor="#7cfc00"
                android:textSize="8sp"
                android:textStyle="bold" />

            <FrameLayout
                android:layout_width="48dp"
                android:layout_height="32dp"
                android:layout_marginTop="2dp">

                <View
                    android:layout_width="40dp"
                    android:layout_height="1dp"
                    android:layout_gravity="center"
                    android:background="#444444" />

                <ImageView
                    android:id="@+id/widget_pitch_car"
                    android:layout_width="40dp"
                    android:layout_height="20dp"
                    android:layout_gravity="center"
                    android:src="@drawable/ic_car_side"
                    android:rotation="0" />
            </FrameLayout>

            <TextView
                android:id="@+id/widget_pitch_value"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="+0°"
                android:textColor="#7cfc00"
                android:textSize="14sp"
                android:textStyle="bold" />
        </LinearLayout>

        <!-- Altitude -->
        <LinearLayout
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:gravity="center"
            android:orientation="vertical">

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="ALT"
                android:textColor="#00e5ff"
                android:textSize="8sp"
                android:textStyle="bold" />

            <TextView
                android:id="@+id/widget_altitude_value"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:layout_marginTop="8dp"
                android:text="0 m"
                android:textColor="#00e5ff"
                android:textSize="18sp"
                android:textStyle="bold" />
        </LinearLayout>

        <!-- Roll with visual -->
        <LinearLayout
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:gravity="center"
            android:orientation="vertical">

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="ROLL"
                android:textColor="#ff8c00"
                android:textSize="8sp"
                android:textStyle="bold" />

            <FrameLayout
                android:layout_width="48dp"
                android:layout_height="32dp"
                android:layout_marginTop="2dp">

                <View
                    android:layout_width="40dp"
                    android:layout_height="1dp"
                    android:layout_gravity="center"
                    android:background="#444444" />

                <ImageView
                    android:id="@+id/widget_roll_car"
                    android:layout_width="36dp"
                    android:layout_height="28dp"
                    android:layout_gravity="center"
                    android:src="@drawable/ic_car_rear"
                    android:rotation="0" />
            </FrameLayout>

            <TextView
                android:id="@+id/widget_roll_value"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="+0°"
                android:textColor="#ff8c00"
                android:textSize="14sp"
                android:textStyle="bold" />
        </LinearLayout>
    </LinearLayout>
</LinearLayout>
`;

// Portrait Widget Layout (Full Dashboard - Vertical)
const portraitLayoutXml = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/widget_container"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@drawable/widget_background_large"
    android:gravity="center"
    android:orientation="vertical"
    android:padding="16dp">

    <!-- Title -->
    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="CAR DASHBOARD"
        android:textColor="#00e5ff"
        android:textSize="14sp"
        android:textStyle="bold"
        android:letterSpacing="0.15" />

    <!-- Altitude (Main Display) -->
    <TextView
        android:id="@+id/widget_altitude_value"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_marginTop="12dp"
        android:text="0 m"
        android:textColor="#00e5ff"
        android:textSize="36sp"
        android:textStyle="bold"
        android:shadowColor="#00e5ff"
        android:shadowRadius="10" />

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="ALTITUDE"
        android:textColor="#666666"
        android:textSize="10sp" />

    <!-- Pitch and Roll Row -->
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="16dp"
        android:gravity="center"
        android:orientation="horizontal">

        <!-- Pitch -->
        <LinearLayout
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:gravity="center"
            android:orientation="vertical"
            android:background="@drawable/widget_item_bg"
            android:padding="8dp"
            android:layout_marginEnd="6dp">

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="PITCH"
                android:textColor="#7cfc00"
                android:textSize="10sp"
                android:textStyle="bold" />

            <FrameLayout
                android:layout_width="56dp"
                android:layout_height="36dp"
                android:layout_marginTop="4dp">

                <View
                    android:layout_width="48dp"
                    android:layout_height="1dp"
                    android:layout_gravity="center"
                    android:background="#444444" />

                <ImageView
                    android:id="@+id/widget_pitch_car"
                    android:layout_width="48dp"
                    android:layout_height="24dp"
                    android:layout_gravity="center"
                    android:src="@drawable/ic_car_side"
                    android:rotation="0" />
            </FrameLayout>

            <TextView
                android:id="@+id/widget_pitch_value"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="+0°"
                android:textColor="#7cfc00"
                android:textSize="20sp"
                android:textStyle="bold" />
        </LinearLayout>

        <!-- Roll -->
        <LinearLayout
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:gravity="center"
            android:orientation="vertical"
            android:background="@drawable/widget_item_bg"
            android:padding="8dp"
            android:layout_marginStart="6dp">

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="ROLL"
                android:textColor="#ff8c00"
                android:textSize="10sp"
                android:textStyle="bold" />

            <FrameLayout
                android:layout_width="56dp"
                android:layout_height="36dp"
                android:layout_marginTop="4dp">

                <View
                    android:layout_width="48dp"
                    android:layout_height="1dp"
                    android:layout_gravity="center"
                    android:background="#444444" />

                <ImageView
                    android:id="@+id/widget_roll_car"
                    android:layout_width="40dp"
                    android:layout_height="32dp"
                    android:layout_gravity="center"
                    android:src="@drawable/ic_car_rear"
                    android:rotation="0" />
            </FrameLayout>

            <TextView
                android:id="@+id/widget_roll_value"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="+0°"
                android:textColor="#ff8c00"
                android:textSize="20sp"
                android:textStyle="bold" />
        </LinearLayout>
    </LinearLayout>

    <!-- Speed and Temperature Row -->
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="12dp"
        android:gravity="center"
        android:orientation="horizontal">

        <!-- Speed -->
        <LinearLayout
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:gravity="center"
            android:orientation="vertical"
            android:layout_marginEnd="6dp">

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="SPEED"
                android:textColor="#999999"
                android:textSize="9sp" />

            <TextView
                android:id="@+id/widget_speed_value"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="0 km/h"
                android:textColor="#ffffff"
                android:textSize="16sp"
                android:textStyle="bold" />
        </LinearLayout>

        <!-- Temperature -->
        <LinearLayout
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:gravity="center"
            android:orientation="vertical"
            android:layout_marginStart="6dp">

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="OUTSIDE"
                android:textColor="#999999"
                android:textSize="9sp" />

            <TextView
                android:id="@+id/widget_temp_value"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="+0°C"
                android:textColor="#ff8c00"
                android:textSize="16sp"
                android:textStyle="bold" />
        </LinearLayout>
    </LinearLayout>
</LinearLayout>
`;

// Landscape Widget Layout (Full Dashboard - Horizontal)
const landscapeLayoutXml = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/widget_container"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@drawable/widget_background_large"
    android:gravity="center"
    android:orientation="horizontal"
    android:padding="12dp">

    <!-- Left: Pitch -->
    <LinearLayout
        android:layout_width="0dp"
        android:layout_height="match_parent"
        android:layout_weight="1"
        android:gravity="center"
        android:orientation="vertical"
        android:background="@drawable/widget_item_bg"
        android:padding="6dp"
        android:layout_marginEnd="4dp">

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="PITCH"
            android:textColor="#7cfc00"
            android:textSize="9sp"
            android:textStyle="bold" />

        <FrameLayout
            android:layout_width="50dp"
            android:layout_height="28dp"
            android:layout_marginTop="2dp">

            <View
                android:layout_width="44dp"
                android:layout_height="1dp"
                android:layout_gravity="center"
                android:background="#444444" />

            <ImageView
                android:id="@+id/widget_pitch_car"
                android:layout_width="44dp"
                android:layout_height="22dp"
                android:layout_gravity="center"
                android:src="@drawable/ic_car_side"
                android:rotation="0" />
        </FrameLayout>

        <TextView
            android:id="@+id/widget_pitch_value"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="+0°"
            android:textColor="#7cfc00"
            android:textSize="16sp"
            android:textStyle="bold" />
    </LinearLayout>

    <!-- Center: Altitude, Speed, Temp -->
    <LinearLayout
        android:layout_width="0dp"
        android:layout_height="match_parent"
        android:layout_weight="1.5"
        android:gravity="center"
        android:orientation="vertical"
        android:padding="8dp">

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="CAR DASHBOARD"
            android:textColor="#00e5ff"
            android:textSize="10sp"
            android:textStyle="bold"
            android:letterSpacing="0.1" />

        <TextView
            android:id="@+id/widget_altitude_value"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="0 m"
            android:textColor="#00e5ff"
            android:textSize="26sp"
            android:textStyle="bold"
            android:shadowColor="#00e5ff"
            android:shadowRadius="8" />

        <LinearLayout
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="4dp"
            android:gravity="center"
            android:orientation="horizontal">

            <TextView
                android:id="@+id/widget_speed_value"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="0 km/h"
                android:textColor="#ffffff"
                android:textSize="12sp" />

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="  |  "
                android:textColor="#444444"
                android:textSize="12sp" />

            <TextView
                android:id="@+id/widget_temp_value"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="+0°C"
                android:textColor="#ff8c00"
                android:textSize="12sp" />
        </LinearLayout>
    </LinearLayout>

    <!-- Right: Roll -->
    <LinearLayout
        android:layout_width="0dp"
        android:layout_height="match_parent"
        android:layout_weight="1"
        android:gravity="center"
        android:orientation="vertical"
        android:background="@drawable/widget_item_bg"
        android:padding="6dp"
        android:layout_marginStart="4dp">

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="ROLL"
            android:textColor="#ff8c00"
            android:textSize="9sp"
            android:textStyle="bold" />

        <FrameLayout
            android:layout_width="44dp"
            android:layout_height="32dp"
            android:layout_marginTop="2dp">

            <View
                android:layout_width="38dp"
                android:layout_height="1dp"
                android:layout_gravity="center"
                android:background="#444444" />

            <ImageView
                android:id="@+id/widget_roll_car"
                android:layout_width="34dp"
                android:layout_height="28dp"
                android:layout_gravity="center"
                android:src="@drawable/ic_car_rear"
                android:rotation="0" />
        </FrameLayout>

        <TextView
            android:id="@+id/widget_roll_value"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="+0°"
            android:textColor="#ff8c00"
            android:textSize="16sp"
            android:textStyle="bold" />
    </LinearLayout>
</LinearLayout>
`;

// ==================== DRAWABLES ====================

const widgetBackgroundXml = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <solid android:color="#DD000000" />
    <corners android:radius="16dp" />
    <stroke
        android:width="1dp"
        android:color="#00e5ff" />
</shape>
`;

const widgetBackgroundLargeXml = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <solid android:color="#EE000000" />
    <corners android:radius="20dp" />
    <stroke
        android:width="2dp"
        android:color="#00e5ff" />
</shape>
`;

const widgetItemBgXml = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <solid android:color="#33ffffff" />
    <corners android:radius="12dp" />
</shape>
`;

// Car icon for pitch (side view) - simple vector
const carSideIconXml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="48dp"
    android:height="24dp"
    android:viewportWidth="48"
    android:viewportHeight="24">
    <path
        android:fillColor="#7cfc00"
        android:pathData="M8,16 L40,16 L40,12 L36,8 L28,8 L24,4 L16,4 L12,8 L8,8 Z M12,18 A3,3 0 1,0 12,12 A3,3 0 1,0 12,18 M36,18 A3,3 0 1,0 36,12 A3,3 0 1,0 36,18"/>
</vector>
`;

// Car icon for roll (rear view) - simple vector
const carRearIconXml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="40dp"
    android:height="32dp"
    android:viewportWidth="40"
    android:viewportHeight="32">
    <path
        android:fillColor="#ff8c00"
        android:pathData="M4,24 L36,24 L36,12 L32,8 L8,8 L4,12 Z M8,28 A4,4 0 1,0 8,20 A4,4 0 1,0 8,28 M32,28 A4,4 0 1,0 32,20 A4,4 0 1,0 32,28"/>
</vector>
`;

// Horizon indicator line
const horizonLineXml = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <solid android:color="#666666" />
    <size android:height="2dp" android:width="60dp" />
</shape>
`;

// ==================== WIDGET INFO XMLs ====================

const compactWidgetInfoXml = `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:initialLayout="@layout/widget_compact"
    android:minWidth="250dp"
    android:minHeight="80dp"
    android:minResizeWidth="180dp"
    android:minResizeHeight="60dp"
    android:previewImage="@mipmap/ic_launcher"
    android:resizeMode="horizontal|vertical"
    android:updatePeriodMillis="60000"
    android:widgetCategory="home_screen"
    android:description="@string/widget_compact_description" />
`;

const portraitWidgetInfoXml = `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:initialLayout="@layout/widget_portrait"
    android:minWidth="180dp"
    android:minHeight="250dp"
    android:minResizeWidth="150dp"
    android:minResizeHeight="200dp"
    android:previewImage="@mipmap/ic_launcher"
    android:resizeMode="horizontal|vertical"
    android:updatePeriodMillis="60000"
    android:widgetCategory="home_screen"
    android:description="@string/widget_portrait_description" />
`;

const landscapeWidgetInfoXml = `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:initialLayout="@layout/widget_landscape"
    android:minWidth="320dp"
    android:minHeight="100dp"
    android:minResizeWidth="250dp"
    android:minResizeHeight="80dp"
    android:previewImage="@mipmap/ic_launcher"
    android:resizeMode="horizontal|vertical"
    android:updatePeriodMillis="60000"
    android:widgetCategory="home_screen"
    android:description="@string/widget_landscape_description" />
`;

// Strings resource
const stringsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="widget_compact_description">Compact widget showing Pitch, Roll, and Altitude</string>
    <string name="widget_portrait_description">Full dashboard widget in portrait layout</string>
    <string name="widget_landscape_description">Full dashboard widget in landscape layout</string>
</resources>
`;

// ==================== MANIFEST MODIFICATION ====================

const withWidgetManifest = (config) => {
    return withAndroidManifest(config, async (config) => {
        const mainApplication = config.modResults.manifest.application[0];

        if (!mainApplication.receiver) {
            mainApplication.receiver = [];
        }

        // Widget configurations
        const widgets = [
            { name: '.CarDashboardWidget', info: '@xml/widget_compact_info' },
            { name: '.CarDashboardWidgetPortrait', info: '@xml/widget_portrait_info' },
            { name: '.CarDashboardWidgetLandscape', info: '@xml/widget_landscape_info' },
        ];

        widgets.forEach(widget => {
            const existingReceiver = mainApplication.receiver.find(
                (r) => r.$['android:name'] === widget.name
            );

            if (!existingReceiver) {
                mainApplication.receiver.push({
                    $: {
                        'android:name': widget.name,
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
                                'android:resource': widget.info,
                            },
                        },
                    ],
                });
            }
        });

        return config;
    });
};

// ==================== FILE CREATION ====================

const withWidgetFiles = (config) => {
    return withDangerousMod(config, [
        'android',
        async (config) => {
            const projectRoot = config.modRequest.projectRoot;
            const androidPath = path.join(projectRoot, 'android');

            if (fs.existsSync(androidPath)) {
                const packagePath = 'app/src/main/java/com/cardashboard/app';
                const resPath = 'app/src/main/res';

                // Create directories
                const dirs = [
                    path.join(androidPath, packagePath),
                    path.join(androidPath, resPath, 'layout'),
                    path.join(androidPath, resPath, 'drawable'),
                    path.join(androidPath, resPath, 'xml'),
                    path.join(androidPath, resPath, 'values'),
                ];

                dirs.forEach((dir) => {
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }
                });

                // Write widget classes
                fs.writeFileSync(
                    path.join(androidPath, packagePath, 'CarDashboardWidget.java'),
                    compactWidgetClass.trim()
                );
                fs.writeFileSync(
                    path.join(androidPath, packagePath, 'CarDashboardWidgetPortrait.java'),
                    portraitWidgetClass.trim()
                );
                fs.writeFileSync(
                    path.join(androidPath, packagePath, 'CarDashboardWidgetLandscape.java'),
                    landscapeWidgetClass.trim()
                );

                // Write layouts
                fs.writeFileSync(
                    path.join(androidPath, resPath, 'layout', 'widget_compact.xml'),
                    compactLayoutXml.trim()
                );
                fs.writeFileSync(
                    path.join(androidPath, resPath, 'layout', 'widget_portrait.xml'),
                    portraitLayoutXml.trim()
                );
                fs.writeFileSync(
                    path.join(androidPath, resPath, 'layout', 'widget_landscape.xml'),
                    landscapeLayoutXml.trim()
                );

                // Write drawables
                fs.writeFileSync(
                    path.join(androidPath, resPath, 'drawable', 'widget_background.xml'),
                    widgetBackgroundXml.trim()
                );
                fs.writeFileSync(
                    path.join(androidPath, resPath, 'drawable', 'widget_background_large.xml'),
                    widgetBackgroundLargeXml.trim()
                );
                fs.writeFileSync(
                    path.join(androidPath, resPath, 'drawable', 'widget_item_bg.xml'),
                    widgetItemBgXml.trim()
                );
                fs.writeFileSync(
                    path.join(androidPath, resPath, 'drawable', 'ic_car_side.xml'),
                    carSideIconXml.trim()
                );
                fs.writeFileSync(
                    path.join(androidPath, resPath, 'drawable', 'ic_car_rear.xml'),
                    carRearIconXml.trim()
                );

                // Write widget info
                fs.writeFileSync(
                    path.join(androidPath, resPath, 'xml', 'widget_compact_info.xml'),
                    compactWidgetInfoXml.trim()
                );
                fs.writeFileSync(
                    path.join(androidPath, resPath, 'xml', 'widget_portrait_info.xml'),
                    portraitWidgetInfoXml.trim()
                );
                fs.writeFileSync(
                    path.join(androidPath, resPath, 'xml', 'widget_landscape_info.xml'),
                    landscapeWidgetInfoXml.trim()
                );

                // Write strings
                const stringsPath = path.join(androidPath, resPath, 'values', 'widget_strings.xml');
                fs.writeFileSync(stringsPath, stringsXml.trim());
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
