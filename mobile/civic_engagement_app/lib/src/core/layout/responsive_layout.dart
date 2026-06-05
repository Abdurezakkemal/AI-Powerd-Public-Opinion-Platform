import 'dart:math' as math;

import 'package:flutter/material.dart';

class ResponsiveLayout {
  const ResponsiveLayout._();

  static Size screenSize(BuildContext context) => MediaQuery.sizeOf(context);

  static double width(BuildContext context) => screenSize(context).width;

  static double height(BuildContext context) => screenSize(context).height;

  static bool isLandscape(BuildContext context) =>
      MediaQuery.orientationOf(context) == Orientation.landscape;

  static bool isCompact(BuildContext context) => width(context) < 360;

  static bool isPhone(BuildContext context) => width(context) < 600;

  static bool isTablet(BuildContext context) => width(context) >= 600;

  static bool useSideNavigation(BuildContext context) => width(context) >= 900;

  static double pagePadding(BuildContext context) {
    final screenWidth = width(context);
    if (screenWidth >= 1200) return 40;
    if (screenWidth >= 900) return 32;
    if (screenWidth >= 600) return 24;
    if (screenWidth < 360) return 16;
    return 20;
  }

  static double contentMaxWidth(BuildContext context) {
    final screenWidth = width(context);
    if (screenWidth >= 1200) return 1040;
    if (screenWidth >= 900) return 880;
    if (screenWidth >= 700) return 720;
    return double.infinity;
  }

  static double headerTitleSize(BuildContext context) {
    if (width(context) >= 900) return 32;
    if (width(context) >= 600) return 30;
    if (width(context) < 360) return 24;
    return 28;
  }

  static double heroTitleSize(BuildContext context) {
    if (width(context) >= 900) return 42;
    if (width(context) >= 600) return 36;
    if (width(context) < 360) return 28;
    return 32;
  }

  static double sectionTitleSize(BuildContext context) {
    if (width(context) >= 900) return 20;
    if (width(context) < 360) return 16;
    return 18;
  }

  static double bodyFontSize(BuildContext context) {
    if (width(context) >= 900) return 16;
    if (width(context) < 360) return 14;
    return 15;
  }

  static double secondaryBodyFontSize(BuildContext context) {
    if (width(context) >= 900) return 14;
    if (width(context) < 360) return 12;
    return 13;
  }

  static double controlHeight(BuildContext context) {
    if (width(context) >= 900) return 60;
    if (width(context) < 360) return 50;
    return 56;
  }

  static double compactControlHeight(BuildContext context) {
    if (width(context) >= 900) return 48;
    if (width(context) < 360) return 40;
    return 44;
  }

  static double circularButtonSize(BuildContext context) {
    if (width(context) >= 900) return 48;
    if (width(context) < 360) return 40;
    return 44;
  }

  static double cardPadding(BuildContext context) {
    if (width(context) >= 900) return 24;
    if (width(context) < 360) return 16;
    return 20;
  }

  static double cardRadius(BuildContext context) {
    if (width(context) < 360) return 20;
    return 24;
  }

  static double navHeight(BuildContext context) {
    if (useSideNavigation(context)) return 0;
    if (isLandscape(context)) return 72;
    if (width(context) < 360) return 74;
    return 80;
  }

  static double navCenterButtonSize(BuildContext context) {
    if (isLandscape(context)) return 56;
    if (width(context) < 360) return 58;
    return 65;
  }

  static double navIconSize(BuildContext context) {
    if (width(context) < 360) return 22;
    return 26;
  }

  static double navLabelSize(BuildContext context) {
    if (width(context) < 360) return 10;
    return 11;
  }

  static double topSpacing(BuildContext context) {
    if (width(context) >= 900) return 28;
    if (width(context) < 360) return 12;
    return 20;
  }

  static double spacing(BuildContext context, double base) {
    final factor = width(context) >= 900
        ? 1.15
        : width(context) < 360
            ? 0.85
            : 1.0;
    return math.max(8, base * factor);
  }
}
