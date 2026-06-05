import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  const AppTheme._();

  static const primary = Color(0xFF0F8B7B);
  static const background = Color(0xFFF7F9FB);
  static const text = Color(0xFF102A43);
  static const mutedText = Color(0xFF62748A);
  static const border = Color(0xFFE5EDF3);
  static const darkBackground = Color(0xFF0F1720);
  static const darkSurface = Color(0xFF172331);
  static const darkText = Color(0xFFE7EEF6);
  static const darkMutedText = Color(0xFF9CAFC4);
  static const darkBorder = Color(0xFF2C3A4A);

  static bool isDark(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark;

  static Color backgroundFor(BuildContext context) =>
      Theme.of(context).scaffoldBackgroundColor;

  static Color surfaceFor(BuildContext context) =>
      Theme.of(context).cardTheme.color ??
      Theme.of(context).colorScheme.surface;

  static Color textFor(BuildContext context) =>
      Theme.of(context).colorScheme.onSurface;

  static Color mutedTextFor(BuildContext context) =>
      isDark(context) ? darkMutedText : mutedText;

  static Color borderFor(BuildContext context) =>
      Theme.of(context).dividerTheme.color ??
      (isDark(context) ? darkBorder : border);

  static Color subtleFillFor(BuildContext context) =>
      isDark(context) ? const Color(0xFF223142) : const Color(0xFFF0F4F8);

  static BoxDecoration elevatedCardDecoration(
    BuildContext context, {
    double borderRadius = 20,
  }) {
    final dark = isDark(context);
    return BoxDecoration(
      color: surfaceFor(context),
      borderRadius: BorderRadius.circular(borderRadius),
      border: Border.all(
        color: borderFor(context).withValues(alpha: dark ? 0.7 : 0.25),
      ),
      boxShadow: [
        BoxShadow(
          color: Colors.black.withValues(alpha: dark ? 0.22 : 0.06),
          blurRadius: 20,
          offset: const Offset(0, 8),
        ),
        if (!dark)
          BoxShadow(
            color: primary.withValues(alpha: 0.03),
            blurRadius: 40,
            offset: const Offset(0, 16),
          ),
      ],
    );
  }

  static ThemeData light() {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: primary,
      primary: primary,
      surface: background,
      onSurface: text,
      surfaceContainerHighest: const Color(0xFFF0F4F8),
    );

    final baseTextTheme = GoogleFonts.outfitTextTheme();

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: background,
      textTheme: baseTextTheme.copyWith(
        displayLarge: baseTextTheme.displayLarge?.copyWith(
            color: text, fontWeight: FontWeight.w800, letterSpacing: 0),
        displayMedium: baseTextTheme.displayMedium?.copyWith(
            color: text, fontWeight: FontWeight.w800, letterSpacing: 0),
        displaySmall: baseTextTheme.displaySmall?.copyWith(
            color: text, fontWeight: FontWeight.w800, letterSpacing: 0),
        headlineLarge: baseTextTheme.headlineLarge?.copyWith(
            color: text, fontWeight: FontWeight.w700, letterSpacing: 0),
        headlineMedium: baseTextTheme.headlineMedium
            ?.copyWith(color: text, fontWeight: FontWeight.w700),
        headlineSmall: baseTextTheme.headlineSmall
            ?.copyWith(color: text, fontWeight: FontWeight.w700),
        titleLarge: baseTextTheme.titleLarge
            ?.copyWith(color: text, fontWeight: FontWeight.w600),
        titleMedium: baseTextTheme.titleMedium
            ?.copyWith(color: text, fontWeight: FontWeight.w600),
        titleSmall: baseTextTheme.titleSmall
            ?.copyWith(color: text, fontWeight: FontWeight.w600),
        bodyLarge: baseTextTheme.bodyLarge?.copyWith(color: text),
        bodyMedium: baseTextTheme.bodyMedium?.copyWith(color: text),
        bodySmall: baseTextTheme.bodySmall?.copyWith(color: mutedText),
        labelLarge: baseTextTheme.labelLarge
            ?.copyWith(color: primary, fontWeight: FontWeight.w600),
      ),
      appBarTheme: AppBarTheme(
        elevation: 0,
        scrolledUnderElevation: 0,
        backgroundColor: background,
        surfaceTintColor: Colors.transparent,
        foregroundColor: text,
        centerTitle: true,
        iconTheme: const IconThemeData(color: text, size: 24),
        titleTextStyle: GoogleFonts.outfit(
          color: text,
          fontSize: 22,
          fontWeight: FontWeight.w800,
          letterSpacing: 0,
        ),
      ),
      cardTheme: CardTheme(
        color: Colors.white,
        elevation: 0,
        shadowColor: primary.withValues(alpha: 0.04),
        surfaceTintColor: Colors.transparent,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(32),
          side: const BorderSide(color: Colors.transparent, width: 0),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFFF0F4F8),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 20,
          vertical: 18,
        ),
        hintStyle:
            const TextStyle(color: mutedText, fontWeight: FontWeight.w400),
        labelStyle:
            const TextStyle(color: mutedText, fontWeight: FontWeight.w500),
        floatingLabelStyle:
            const TextStyle(color: primary, fontWeight: FontWeight.w700),
        prefixIconColor: mutedText,
        suffixIconColor: mutedText,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(24),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(24),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(24),
          borderSide: const BorderSide(color: primary, width: 2.0),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(24),
          borderSide: const BorderSide(color: Colors.redAccent, width: 1.5),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(24),
          borderSide: const BorderSide(color: Colors.redAccent, width: 2.0),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          elevation: 4,
          shadowColor: primary.withValues(alpha: 0.3),
          minimumSize: const Size.fromHeight(56),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          textStyle: const TextStyle(
              fontWeight: FontWeight.w700, fontSize: 16, letterSpacing: 0.2),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: text,
          minimumSize: const Size.fromHeight(56),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          side: const BorderSide(color: border, width: 1.5),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          textStyle: const TextStyle(
              fontWeight: FontWeight.w700, fontSize: 16, letterSpacing: 0.2),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primary,
          textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: Colors.transparent,
        selectedItemColor: primary,
        unselectedItemColor: mutedText.withValues(alpha: 0.5),
        type: BottomNavigationBarType.fixed,
        elevation: 0,
        selectedLabelStyle: const TextStyle(
            fontSize: 12, fontWeight: FontWeight.w800, height: 1.5),
        unselectedLabelStyle: const TextStyle(
            fontSize: 12, fontWeight: FontWeight.w600, height: 1.5),
        showUnselectedLabels: true,
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: text,
        contentTextStyle:
            const TextStyle(color: Colors.white, fontWeight: FontWeight.w500),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        elevation: 8,
      ),
      dialogTheme: DialogTheme(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
      ),
      popupMenuTheme: PopupMenuThemeData(
        color: Colors.white,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      segmentedButtonTheme: SegmentedButtonThemeData(
        style: ButtonStyle(
          backgroundColor: WidgetStateProperty.resolveWith(
            (states) => states.contains(WidgetState.selected)
                ? primary.withValues(alpha: 0.12)
                : Colors.transparent,
          ),
          foregroundColor: WidgetStateProperty.resolveWith(
            (states) => states.contains(WidgetState.selected) ? primary : text,
          ),
          side: WidgetStateProperty.all(const BorderSide(color: border)),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: border,
        space: 1,
        thickness: 1,
      ),
    );
  }

  static ThemeData dark() {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: primary,
      brightness: Brightness.dark,
      primary: const Color(0xFF38C5B0),
      surface: darkSurface,
      onSurface: darkText,
      surfaceContainerHighest: const Color(0xFF223142),
    );

    final baseTextTheme = GoogleFonts.outfitTextTheme(
      ThemeData.dark().textTheme,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: darkBackground,
      textTheme: baseTextTheme.copyWith(
        displayLarge: baseTextTheme.displayLarge?.copyWith(
            color: darkText, fontWeight: FontWeight.w800, letterSpacing: 0),
        displayMedium: baseTextTheme.displayMedium?.copyWith(
            color: darkText, fontWeight: FontWeight.w800, letterSpacing: 0),
        displaySmall: baseTextTheme.displaySmall?.copyWith(
            color: darkText, fontWeight: FontWeight.w800, letterSpacing: 0),
        headlineLarge: baseTextTheme.headlineLarge?.copyWith(
            color: darkText, fontWeight: FontWeight.w700, letterSpacing: 0),
        headlineMedium: baseTextTheme.headlineMedium
            ?.copyWith(color: darkText, fontWeight: FontWeight.w700),
        headlineSmall: baseTextTheme.headlineSmall
            ?.copyWith(color: darkText, fontWeight: FontWeight.w700),
        titleLarge: baseTextTheme.titleLarge
            ?.copyWith(color: darkText, fontWeight: FontWeight.w600),
        titleMedium: baseTextTheme.titleMedium
            ?.copyWith(color: darkText, fontWeight: FontWeight.w600),
        titleSmall: baseTextTheme.titleSmall
            ?.copyWith(color: darkText, fontWeight: FontWeight.w600),
        bodyLarge: baseTextTheme.bodyLarge?.copyWith(color: darkText),
        bodyMedium: baseTextTheme.bodyMedium?.copyWith(color: darkText),
        bodySmall: baseTextTheme.bodySmall?.copyWith(color: darkMutedText),
        labelLarge: baseTextTheme.labelLarge
            ?.copyWith(color: colorScheme.primary, fontWeight: FontWeight.w600),
      ),
      appBarTheme: AppBarTheme(
        elevation: 0,
        scrolledUnderElevation: 0,
        backgroundColor: darkBackground,
        surfaceTintColor: Colors.transparent,
        foregroundColor: darkText,
        centerTitle: true,
        iconTheme: const IconThemeData(color: darkText, size: 24),
        titleTextStyle: GoogleFonts.outfit(
          color: darkText,
          fontSize: 22,
          fontWeight: FontWeight.w800,
          letterSpacing: 0,
        ),
      ),
      cardTheme: CardTheme(
        color: darkSurface,
        elevation: 0,
        shadowColor: Colors.black.withValues(alpha: 0.18),
        surfaceTintColor: Colors.transparent,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(32),
          side: const BorderSide(color: darkBorder, width: 1),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFF223142),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
        hintStyle:
            const TextStyle(color: darkMutedText, fontWeight: FontWeight.w400),
        labelStyle:
            const TextStyle(color: darkMutedText, fontWeight: FontWeight.w500),
        floatingLabelStyle:
            TextStyle(color: colorScheme.primary, fontWeight: FontWeight.w700),
        prefixIconColor: darkMutedText,
        suffixIconColor: darkMutedText,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(24),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(24),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(24),
          borderSide: BorderSide(color: colorScheme.primary, width: 2.0),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(24),
          borderSide: const BorderSide(color: Colors.redAccent, width: 1.5),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(24),
          borderSide: const BorderSide(color: Colors.redAccent, width: 2.0),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: colorScheme.primary,
          foregroundColor: const Color(0xFF06201B),
          elevation: 2,
          shadowColor: colorScheme.primary.withValues(alpha: 0.18),
          minimumSize: const Size.fromHeight(56),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          textStyle: const TextStyle(
              fontWeight: FontWeight.w700, fontSize: 16, letterSpacing: 0.2),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: darkText,
          minimumSize: const Size.fromHeight(56),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          side: const BorderSide(color: darkBorder, width: 1.5),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          textStyle: const TextStyle(
              fontWeight: FontWeight.w700, fontSize: 16, letterSpacing: 0.2),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: colorScheme.primary,
          textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: darkSurface,
        contentTextStyle:
            const TextStyle(color: darkText, fontWeight: FontWeight.w500),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        elevation: 8,
      ),
      dialogTheme: DialogTheme(
        backgroundColor: darkSurface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: darkSurface,
        surfaceTintColor: Colors.transparent,
      ),
      popupMenuTheme: PopupMenuThemeData(
        color: darkSurface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      segmentedButtonTheme: SegmentedButtonThemeData(
        style: ButtonStyle(
          backgroundColor: WidgetStateProperty.resolveWith(
            (states) => states.contains(WidgetState.selected)
                ? colorScheme.primary.withValues(alpha: 0.14)
                : Colors.transparent,
          ),
          foregroundColor: WidgetStateProperty.resolveWith(
            (states) => states.contains(WidgetState.selected)
                ? colorScheme.primary
                : darkText,
          ),
          side: WidgetStateProperty.all(const BorderSide(color: darkBorder)),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: darkBorder,
        space: 1,
        thickness: 1,
      ),
    );
  }
}
