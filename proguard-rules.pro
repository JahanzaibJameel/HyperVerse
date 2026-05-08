# ===================================================================
# HyperVerse ProGuard Rules for Android Release Builds
# ===================================================================
# This file contains ProGuard configuration for code obfuscation and optimization
# Copy this file to android/app/proguard-rules.pro when building for Android

# Add any project specific keep options here:

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Expo modules
-keep class expo.modules.** { *; }
-keep class expo.modules.adapters.** { *; }

# React Native Flipper
-keep,allowobfuscation,allowshrinking class com.facebook.flipper.** { *; }
-keep,allowobfuscation,allowshrinking class com.facebook.flipper.plugins.** { *; }

# React Native Fast Image
-keep class com.bumptech.glide.** { *; }

# React Native Vector Icons
-keep class com.oblador.vectorial.** { *; }

# React Native Reanimated
-keep class com.swmansion.reanimated.** { *; }

# React Native Gesture Handler
-keep class com.swmansion.gesturehandler.** { *; }

# React Native Screens
-keep class com.swmansion.rnscreens.** { *; }

# React Native Safe Area Context
-keep class com.th3rdwave.safeareacontext.** { *; }

# React Native Keychain
-keep class com.oblador.keychain.** { *; }

# React Native Async Storage
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# React Native Net Info
-keep class com.reactnativecommunity.netinfo.** { *; }

# Tamagui
-keep class com.tamagui.** { *; }

# Victory Native
-keep class com.formidablelabs.victory.** { *; }

# WatermelonDB
-keep class com.nozbe.watermelondb.** { *; }

# Transformers.js (for AI features)
-keep class com.xenova.transformers.** { *; }

# Application-specific classes
-keep class com.hyperverse.** { *; }

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep enums
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Keep Parcelable implementations
-keep class * implements android.os.Parcelable {
    public static final ** CREATOR;
}

# Keep R class
-keepclassmembers class **.R$* {
    public static <fields>;
}

# Keep WebView interfaces for potential web features
-keepclassmembers class * extends android.webkit.WebViewClient {
    public void *(android.webkit.WebView, java.lang.String, android.graphics.Bitmap);
    public boolean *(android.webkit.WebView, java.lang.String);
}

# Keep SQLite related classes for local database
-keep class android.database.sqlite.** { *; }

# Keep cryptography related classes for secure storage
-keep class javax.crypto.** { *; }
-keep class java.security.** { *; }

# Optimization settings
-optimizations !code/simplification/arithmetic,!code/simplification/cast,!field/*,!class/merging/*
-optimizationpasses 5
-allowaccessmodification
-dontpreverify

# Remove logging in release builds
-assumenosideeffects class android.util.Log {
    public static *** v(...);
    public static *** d(...);
    public static *** i(...);
    public static *** w(...);
    public static *** e(...);
}

# Keep line numbers for debugging (optional, remove for better obfuscation)
-keepattributes SourceFile,LineNumberTable

# Keep annotations for reflection
-keepattributes *Annotation*

# Keep signature for generic types
-keepattributes Signature

# Keep inner classes for anonymous classes
-keepattributes InnerClasses

# Keep EnclosingMethod for anonymous classes
-keepattributes EnclosingMethod

# Remove unused classes from libraries
-dontwarn javax.annotation.**
-dontwarn javax.inject.**
-dontwarn android.support.**
-dontwarn com.google.common.**
-dontwarn org.apache.http.**
-dontwarn org.apache.commons.logging.**
-dontwarn org.bouncycastle.**
-dontwarn org.conscrypt.**

# Hermes specific rules
-keep,allowobfuscation,allowshrinking class com.facebook.hermes.** { *; }
-keep class com.facebook.hermes.reactexecutor.** { *; }

# Metro bundler
-keep class com.facebook.metro.** { *; }

# Debugging (remove in production for better obfuscation)
# -keepattributes SourceFile,LineNumberTable
