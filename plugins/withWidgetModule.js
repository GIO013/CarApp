const { withDangerousMod, withMainApplication } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Native Module for Widget Data Communication
 * Uses standard React Native Native Modules (not Expo modules)
 * Allows React Native to send data to Android Widgets via SharedPreferences
 */

// React Native Native Module class (Kotlin)
const widgetModuleClass = `
package com.cardashboard.app

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class WidgetModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "WidgetModule"
    }

    @ReactMethod
    fun updateWidgetData(pitch: Int, roll: Int, altitude: Int, speed: Int, temperature: Int, promise: Promise) {
        try {
            val context = reactApplicationContext

            // Save to SharedPreferences
            val prefs = context.getSharedPreferences("CarDashboardWidget", Context.MODE_PRIVATE)
            with(prefs.edit()) {
                putInt("pitch", pitch)
                putInt("roll", roll)
                putInt("altitude", altitude)
                putInt("speed", speed)
                putInt("temperature", temperature)
                putLong("lastUpdate", System.currentTimeMillis())
                apply()
            }

            // Trigger all widget updates
            val widgetManager = AppWidgetManager.getInstance(context)

            // Update Compact Widget
            try {
                val compactIds = widgetManager.getAppWidgetIds(
                    ComponentName(context, CarDashboardWidget::class.java)
                )
                if (compactIds.isNotEmpty()) {
                    val intent = Intent(context, CarDashboardWidget::class.java).apply {
                        action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                        putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, compactIds)
                    }
                    context.sendBroadcast(intent)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }

            // Update Portrait Widget
            try {
                val portraitIds = widgetManager.getAppWidgetIds(
                    ComponentName(context, CarDashboardWidgetPortrait::class.java)
                )
                if (portraitIds.isNotEmpty()) {
                    val intent = Intent(context, CarDashboardWidgetPortrait::class.java).apply {
                        action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                        putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, portraitIds)
                    }
                    context.sendBroadcast(intent)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }

            // Update Landscape Widget
            try {
                val landscapeIds = widgetManager.getAppWidgetIds(
                    ComponentName(context, CarDashboardWidgetLandscape::class.java)
                )
                if (landscapeIds.isNotEmpty()) {
                    val intent = Intent(context, CarDashboardWidgetLandscape::class.java).apply {
                        action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                        putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, landscapeIds)
                    }
                    context.sendBroadcast(intent)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
}
`;

// React Native Package for registration
const widgetPackageClass = `
package com.cardashboard.app

import android.view.View
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ReactShadowNode
import com.facebook.react.uimanager.ViewManager

class WidgetPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(WidgetModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<View, ReactShadowNode<*>>> {
        return emptyList()
    }
}
`;

const withWidgetModule = (config) => {
    return withDangerousMod(config, [
        'android',
        async (config) => {
            const projectRoot = config.modRequest.projectRoot;
            const androidPath = path.join(projectRoot, 'android');

            if (fs.existsSync(androidPath)) {
                const packagePath = path.join(androidPath, 'app/src/main/java/com/cardashboard/app');

                if (!fs.existsSync(packagePath)) {
                    fs.mkdirSync(packagePath, { recursive: true });
                }

                // Write Widget Module
                fs.writeFileSync(
                    path.join(packagePath, 'WidgetModule.kt'),
                    widgetModuleClass.trim()
                );

                // Write Widget Package
                fs.writeFileSync(
                    path.join(packagePath, 'WidgetPackage.kt'),
                    widgetPackageClass.trim()
                );

                // Register package in MainApplication
                const mainAppPath = path.join(androidPath, 'app/src/main/java/com/cardashboard/app/MainApplication.kt');
                if (fs.existsSync(mainAppPath)) {
                    let mainAppContent = fs.readFileSync(mainAppPath, 'utf-8');

                    // Check if WidgetPackage is already registered
                    if (!mainAppContent.includes('WidgetPackage()')) {
                        // Find the getPackages method and add WidgetPackage
                        if (mainAppContent.includes('override fun getPackages()')) {
                            mainAppContent = mainAppContent.replace(
                                /override fun getPackages\(\):\s*List<ReactPackage>\s*\{/,
                                `override fun getPackages(): List<ReactPackage> {
            // Add WidgetPackage for widget data communication`
                            );

                            // Find packages.apply or packages += and add WidgetPackage
                            if (mainAppContent.includes('packages.apply {')) {
                                mainAppContent = mainAppContent.replace(
                                    'packages.apply {',
                                    'packages.apply {\n              add(WidgetPackage())'
                                );
                            } else if (mainAppContent.includes('return packages')) {
                                mainAppContent = mainAppContent.replace(
                                    'return packages',
                                    'packages.add(WidgetPackage())\n            return packages'
                                );
                            }
                        }

                        fs.writeFileSync(mainAppPath, mainAppContent);
                    }
                }
            }

            return config;
        },
    ]);
};

module.exports = withWidgetModule;
