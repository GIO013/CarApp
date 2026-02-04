const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Native Module for Widget Data Communication
 * Allows React Native to send data to Android Widgets via SharedPreferences
 */

// Expo Module class (Kotlin)
const widgetModuleClass = `
package com.cardashboard.app

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class WidgetModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("WidgetModule")

        Function("updateWidgetData") { pitch: Int, roll: Int, altitude: Int, speed: Int, temperature: Int ->
            val context = appContext.reactContext ?: return@Function false

            // Save to SharedPreferences
            val prefs = context.getSharedPreferences("CarDashboardWidget", Context.MODE_PRIVATE)
            with(prefs.edit()) {
                putInt("pitch", pitch)
                putInt("roll", roll)
                putInt("altitude", altitude)
                putInt("speed", speed)
                putInt("temperature", temperature)
                putLong("lastUpdate", System.currentTimeMillis())
                commit()
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

            return@Function true
        }
    }
}
`;

// Expo Package for registration
const widgetPackageClass = `
package com.cardashboard.app

import android.content.Context
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.ReactActivityLifecycleListener

class WidgetPackage : Package {
    override fun createReactActivityLifecycleListeners(activityContext: Context): List<ReactActivityLifecycleListener> {
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
            }

            return config;
        },
    ]);
};

module.exports = withWidgetModule;
