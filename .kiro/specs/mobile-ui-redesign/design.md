# Design Document – Mobile UI Redesign

## Overview

The Mobile UI Redesign updates the presentation layer of the existing Civic Engagement Flutter app to match the polished design patterns from the React-based website. This is a visual-only redesign—the backend integration, data layer, domain logic, and routing are complete and functional. The focus is exclusively on updating screens, widgets, styling, and component libraries to create a consistent, accessible, and visually appealing mobile experience.

The redesign introduces a centralized design system (colors, typography, spacing), a shared widget library (15+ reusable components), and redesigned screens for all three user roles (Citizen, Planner, Admin). All screens will follow the website's emerald-600 primary color, slate color palette, rounded corners, and modern card-based layouts. The design ensures WCAG AA accessibility compliance, responsive layouts for phones and tablets, smooth animations, and optional dark mode support.

**Key Design Principles:**
- **Consistency**: All screens use the same design tokens (colors, typography, spacing)
- **Reusability**: Shared widget library eliminates duplication
- **Accessibility**: WCAG AA compliance with semantic labels, contrast ratios, and keyboard navigation
- **Responsiveness**: Adaptive layouts for phones (< 600dp) and tablets (≥ 600dp)
- **Polish**: Smooth animations, loading states, error states, and empty states

---

## Architecture

### Design System Structure

The design system is organized into three layers:

```
lib/presentation/shared/
├── theme/
│   ├── app_theme.dart          # ThemeData configuration
│   ├── app_colors.dart         # Color constants
│   ├── app_typography.dart     # TextStyle definitions
│   └── app_spacing.dart        # Spacing constants
├── widgets/
│   ├── status_badge.dart       # Status chip component
│   ├── metric_card.dart        # KPI card component
│   ├── policy_card.dart        # Policy summary card
│   ├── region_chip.dart        # Region tag chip
│   ├── star_rating.dart        # Star rating widget
│   ├── empty_state.dart        # Empty state placeholder
│   ├── error_state.dart        # Error state with retry
│   ├── loading_indicator.dart  # Loading spinner
│   ├── section_header.dart     # Section title
│   ├── primary_button.dart     # Primary CTA button
│   └── ...                     # Additional widgets
└── utils/
    ├── responsive.dart         # Responsive breakpoints
    └── animations.dart         # Animation constants
```

### Integration with Existing Architecture

The redesign integrates seamlessly with the existing clean architecture:

- **No changes to domain layer**: Entities remain unchanged
- **No changes to data layer**: Models, repositories, and data sources remain unchanged
- **No changes to core layer**: API client, auth, DI, router remain unchanged
- **Only presentation layer changes**: Screens and widgets are updated with new UI

The existing BLoC state management, GoRouter navigation, and dependency injection continue to work without modification. Screens will consume the same BLoC events/states but render them with the new design system.

---

## Components and Interfaces

### Theme Configuration

#### AppColors

Centralized color constants matching the website design system.

```dart
// lib/presentation/shared/theme/app_colors.dart

import 'package:flutter/material.dart';

class AppColors {
  // Primary
  static const primary = Color(0xFF10B981);      // emerald-600
  static const primaryLight = Color(0xFFD1FAE5); // emerald-100
  static const primaryDark = Color(0xFF047857);  // emerald-700

  // Neutral
  static const slate900 = Color(0xFF0F172A);
  static const slate800 = Color(0xFF1E293B);
  static const slate700 = Color(0xFF334155);
  static const slate600 = Color(0xFF475569);
  static const slate500 = Color(0xFF64748B);
  static const slate400 = Color(0xFF94A3B8);
  static const slate300 = Color(0xFFCBD5E1);
  static const slate200 = Color(0xFFE2E8F0);
  static const slate100 = Color(0xFFF1F5F9);
  static const slate50 = Color(0xFFF8FAFC);

  // Status - Active/Success
  static const successBg = Color(0xFFD1FAE5);    // emerald-100
  static const successText = Color(0xFF047857);  // emerald-700

  // Status - Inactive/Error
  static const errorBg = Color(0xFFFFE4E6);      // rose-100
  static const errorText = Color(0xFFBE123C);    // rose-700

  // Status - Draft/Neutral
  static const neutralBg = Color(0xFFF1F5F9);    // slate-100
  static const neutralText = Color(0xFF334155);  // slate-700

  // Status - Warning
  static const warningBg = Color(0xFFFEF3C7);    // amber-100
  static const warningText = Color(0xFFB45309);  // amber-700

  // Semantic
  static const info = Color(0xFF3B82F6);         // blue-500
  static const infoBg = Color(0xFFDBEAFE);       // blue-100

  // Backgrounds
  static const background = Colors.white;
  static const cardBackground = Colors.white;
  static const surfaceBackground = slate50;

  // Text
  static const textPrimary = slate900;
  static const textSecondary = slate600;
  static const textTertiary = slate500;

  // Borders
  static const border = slate200;
  static const borderFocus = primary;

  // Dark mode variants (optional)
  static const darkBackground = slate900;
  static const darkCard = slate800;
  static const darkText = slate100;
  static const darkBorder = slate700;
}
```

#### AppTypography

Text style definitions matching the website typography scale.

```dart
// lib/presentation/shared/theme/app_typography.dart

import 'package:flutter/material.dart';
import 'app_colors.dart';

class AppTypography {
  // Headline - 24sp bold
  static const headline = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: AppColors.textPrimary,
    height: 1.3,
  );

  // Title - 18sp bold
  static const title = TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.bold,
    color: AppColors.textPrimary,
    height: 1.4,
  );

  // Subtitle - 16sp semibold
  static const subtitle = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w600,
    color: AppColors.textPrimary,
    height: 1.5,
  );

  // Body - 14sp regular
  static const body = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.normal,
    color: AppColors.textPrimary,
    height: 1.5,
  );

  // Body Large - 16sp regular
  static const bodyLarge = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.normal,
    color: AppColors.textPrimary,
    height: 1.5,
  );

  // Caption - 12sp medium
  static const caption = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w500,
    color: AppColors.textSecondary,
    height: 1.4,
  );

  // Label - 13sp medium
  static const label = TextStyle(
    fontSize: 13,
    fontWeight: FontWeight.w500,
    color: AppColors.textSecondary,
    height: 1.4,
  );

  // Button - 14sp semibold
  static const button = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w600,
    height: 1.2,
  );

  // Overline - 10sp uppercase
  static const overline = TextStyle(
    fontSize: 10,
    fontWeight: FontWeight.w600,
    letterSpacing: 1.2,
    height: 1.6,
  );
}
```

#### AppSpacing

Spacing constants for consistent layout.

```dart
// lib/presentation/shared/theme/app_spacing.dart

class AppSpacing {
  // Base unit
  static const double unit = 4.0;

  // Common spacing values
  static const double xs = 4.0;   // 1 unit
  static const double sm = 8.0;   // 2 units
  static const double md = 12.0;  // 3 units
  static const double lg = 16.0;  // 4 units
  static const double xl = 24.0;  // 6 units
  static const double xxl = 32.0; // 8 units

  // Specific use cases
  static const double cardPadding = 16.0;
  static const double sectionSpacing = 24.0;
  static const double listItemSpacing = 8.0;
  static const double screenPadding = 16.0;

  // Border radius
  static const double radiusSmall = 8.0;
  static const double radiusMedium = 12.0;
  static const double radiusLarge = 16.0;
  static const double radiusFull = 9999.0;

  // Touch targets
  static const double minTouchTarget = 48.0;
}
```

#### AppTheme

Complete ThemeData configuration.

```dart
// lib/presentation/shared/theme/app_theme.dart

import 'package:flutter/material.dart';
import 'app_colors.dart';
import 'app_typography.dart';
import 'app_spacing.dart';

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      
      // Color scheme
      colorScheme: ColorScheme.light(
        primary: AppColors.primary,
        secondary: AppColors.slate600,
        surface: AppColors.background,
        background: AppColors.background,
        error: AppColors.errorText,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: AppColors.textPrimary,
        onBackground: AppColors.textPrimary,
        onError: Colors.white,
      ),

      // Scaffold
      scaffoldBackgroundColor: AppColors.background,

      // AppBar
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: AppTypography.title,
        iconTheme: IconThemeData(color: AppColors.textPrimary),
      ),

      // Card
      cardTheme: CardTheme(
        color: AppColors.cardBackground,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusLarge),
          side: BorderSide(color: AppColors.border, width: 1),
        ),
        margin: EdgeInsets.zero,
      ),

      // Input decoration
      inputDecorationTheme: InputDecorationTheme(
        filled: false,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusMedium),
          borderSide: BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusMedium),
          borderSide: BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusMedium),
          borderSide: BorderSide(color: AppColors.borderFocus, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusMedium),
          borderSide: BorderSide(color: AppColors.errorText),
        ),
        contentPadding: EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        labelStyle: AppTypography.label,
        hintStyle: AppTypography.body.copyWith(color: AppColors.slate400),
      ),

      // Elevated button
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: EdgeInsets.symmetric(
            horizontal: AppSpacing.xl,
            vertical: AppSpacing.md,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSpacing.radiusMedium),
          ),
          textStyle: AppTypography.button,
          minimumSize: Size(0, AppSpacing.minTouchTarget),
        ),
      ),

      // Outlined button
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primary,
          side: BorderSide(color: AppColors.primary),
          padding: EdgeInsets.symmetric(
            horizontal: AppSpacing.xl,
            vertical: AppSpacing.md,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSpacing.radiusMedium),
          ),
          textStyle: AppTypography.button,
          minimumSize: Size(0, AppSpacing.minTouchTarget),
        ),
      ),

      // Text button
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primary,
          padding: EdgeInsets.symmetric(
            horizontal: AppSpacing.lg,
            vertical: AppSpacing.sm,
          ),
          textStyle: AppTypography.button,
          minimumSize: Size(0, AppSpacing.minTouchTarget),
        ),
      ),

      // Floating action button
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusLarge),
        ),
      ),

      // Chip
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.slate100,
        selectedColor: AppColors.primary,
        labelStyle: AppTypography.caption,
        padding: EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.xs,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
        ),
      ),

      // Divider
      dividerTheme: DividerThemeData(
        color: AppColors.border,
        thickness: 1,
        space: AppSpacing.xl,
      ),

      // Snackbar
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.slate900,
        contentTextStyle: AppTypography.body.copyWith(color: Colors.white),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusMedium),
        ),
        behavior: SnackBarBehavior.floating,
        actionTextColor: AppColors.primary,
      ),

      // Progress indicator
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: AppColors.primary,
      ),

      // Text theme
      textTheme: TextTheme(
        displayLarge: AppTypography.headline,
        displayMedium: AppTypography.title,
        displaySmall: AppTypography.subtitle,
        bodyLarge: AppTypography.bodyLarge,
        bodyMedium: AppTypography.body,
        bodySmall: AppTypography.caption,
        labelLarge: AppTypography.button,
        labelMedium: AppTypography.label,
        labelSmall: AppTypography.caption,
      ),
    );
  }

  static ThemeData get darkTheme {
    return lightTheme.copyWith(
      colorScheme: ColorScheme.dark(
        primary: AppColors.primary,
        secondary: AppColors.slate400,
        surface: AppColors.darkCard,
        background: AppColors.darkBackground,
        error: Color(0xFFFDA4AF), // rose-300
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: AppColors.darkText,
        onBackground: AppColors.darkText,
        onError: AppColors.slate900,
      ),
      scaffoldBackgroundColor: AppColors.darkBackground,
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.darkCard,
        foregroundColor: AppColors.darkText,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: AppTypography.title.copyWith(color: AppColors.darkText),
        iconTheme: IconThemeData(color: AppColors.darkText),
      ),
      cardTheme: CardTheme(
        color: AppColors.darkCard,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusLarge),
          side: BorderSide(color: AppColors.darkBorder, width: 1),
        ),
        margin: EdgeInsets.zero,
      ),
      dividerTheme: DividerThemeData(
        color: AppColors.darkBorder,
        thickness: 1,
        space: AppSpacing.xl,
      ),
    );
  }
}
```

### Shared Widget Library

#### StatusBadge

Displays policy or user status with appropriate color coding.

```dart
// lib/presentation/shared/widgets/status_badge.dart

import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../theme/app_spacing.dart';

class StatusBadge extends StatelessWidget {
  final String status;
  final bool compact;

  const StatusBadge({
    Key? key,
    required this.status,
    this.compact = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final config = _getStatusConfig(status.toLowerCase());

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? AppSpacing.sm : AppSpacing.md,
        vertical: compact ? AppSpacing.xs : AppSpacing.xs,
      ),
      decoration: BoxDecoration(
        color: config.backgroundColor,
        borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
      ),
      child: Text(
        status.toUpperCase(),
        style: (compact ? AppTypography.overline : AppTypography.caption).copyWith(
          color: config.textColor,
          fontWeight: FontWeight.w600,
        ),
        semanticsLabel: 'Status: $status',
      ),
    );
  }

  _StatusConfig _getStatusConfig(String status) {
    switch (status) {
      case 'active':
      case 'success':
      case 'verified':
        return _StatusConfig(
          backgroundColor: AppColors.successBg,
          textColor: AppColors.successText,
        );
      case 'closed':
      case 'inactive':
      case 'error':
      case 'rejected':
        return _StatusConfig(
          backgroundColor: AppColors.errorBg,
          textColor: AppColors.errorText,
        );
      case 'draft':
      case 'pending':
      case 'neutral':
        return _StatusConfig(
          backgroundColor: AppColors.neutralBg,
          textColor: AppColors.neutralText,
        );
      case 'processing':
      case 'warning':
        return _StatusConfig(
          backgroundColor: AppColors.warningBg,
          textColor: AppColors.warningText,
        );
      case 'positive':
        return _StatusConfig(
          backgroundColor: AppColors.successBg,
          textColor: AppColors.successText,
        );
      case 'negative':
        return _StatusConfig(
          backgroundColor: AppColors.errorBg,
          textColor: AppColors.errorText,
        );
      default:
        return _StatusConfig(
          backgroundColor: AppColors.neutralBg,
          textColor: AppColors.neutralText,
        );
    }
  }
}

class _StatusConfig {
  final Color backgroundColor;
  final Color textColor;

  _StatusConfig({
    required this.backgroundColor,
    required this.textColor,
  });
}
```

#### MetricCard

Displays a single KPI with label, value, and optional change indicator.

```dart
// lib/presentation/shared/widgets/metric_card.dart

import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../theme/app_spacing.dart';

class MetricCard extends StatelessWidget {
  final String label;
  final String value;
  final String? change;
  final bool? isPositive;
  final IconData? icon;

  const MetricCard({
    Key? key,
    required this.label,
    required this.value,
    this.change,
    this.isPositive,
    this.icon,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.surfaceBackground,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLarge),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null)
            Icon(
              icon,
              size: 24,
              color: AppColors.primary,
            ),
          if (icon != null) SizedBox(height: AppSpacing.sm),
          Text(
            label,
            style: AppTypography.caption.copyWith(
              color: AppColors.textSecondary,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          SizedBox(height: AppSpacing.xs),
          Text(
            value,
            style: AppTypography.headline.copyWith(
              fontSize: 28,
              fontWeight: FontWeight.bold,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          if (change != null) ...[
            SizedBox(height: AppSpacing.xs),
            Row(
              children: [
                Icon(
                  isPositive == true
                      ? Icons.trending_up
                      : isPositive == false
                          ? Icons.trending_down
                          : Icons.remove,
                  size: 16,
                  color: isPositive == true
                      ? AppColors.successText
                      : isPositive == false
                          ? AppColors.errorText
                          : AppColors.textSecondary,
                ),
                SizedBox(width: 4),
                Text(
                  change!,
                  style: AppTypography.caption.copyWith(
                    color: isPositive == true
                        ? AppColors.successText
                        : isPositive == false
                            ? AppColors.errorText
                            : AppColors.textSecondary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
```


#### PolicyCard

Displays policy summary information with all key details.

```dart
// lib/presentation/shared/widgets/policy_card.dart

import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../theme/app_spacing.dart';
import 'status_badge.dart';
import 'region_chip.dart';
import 'star_rating.dart';

class PolicyCard extends StatelessWidget {
  final String code;
  final String title;
  final String status;
  final String description;
  final List<String> regions;
  final String dateRange;
  final double? rating;
  final int? voteCount;
  final VoidCallback? onTap;
  final List<Widget>? actions;

  const PolicyCard({
    Key? key,
    required this.code,
    required this.title,
    required this.status,
    required this.description,
    required this.regions,
    required this.dateRange,
    this.rating,
    this.voteCount,
    this.onTap,
    this.actions,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLarge),
        child: Padding(
          padding: EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header: Code and Status
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    code.toUpperCase(),
                    style: AppTypography.overline.copyWith(
                      color: AppColors.primaryDark,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  StatusBadge(status: status, compact: true),
                ],
              ),
              SizedBox(height: AppSpacing.sm),
              
              // Title
              Text(
                title,
                style: AppTypography.title.copyWith(
                  fontSize: 16,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              SizedBox(height: AppSpacing.sm),
              
              // Description
              Text(
                description,
                style: AppTypography.body.copyWith(
                  color: AppColors.textSecondary,
                ),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
              SizedBox(height: AppSpacing.md),
              
              // Regions
              if (regions.isNotEmpty) ...[
                Wrap(
                  spacing: AppSpacing.sm,
                  runSpacing: AppSpacing.sm,
                  children: regions.map((region) => RegionChip(region: region)).toList(),
                ),
                SizedBox(height: AppSpacing.md),
              ],
              
              // Date range
              Row(
                children: [
                  Icon(Icons.calendar_today, size: 14, color: AppColors.textTertiary),
                  SizedBox(width: 4),
                  Text(
                    dateRange,
                    style: AppTypography.caption.copyWith(
                      color: AppColors.textTertiary,
                    ),
                  ),
                ],
              ),
              
              // Rating and votes
              if (rating != null || voteCount != null) ...[
                SizedBox(height: AppSpacing.sm),
                Row(
                  children: [
                    if (rating != null) ...[
                      StarRating(rating: rating!, size: 16, interactive: false),
                      SizedBox(width: AppSpacing.xs),
                    ],
                    if (voteCount != null)
                      Text(
                        '($voteCount ${voteCount == 1 ? 'vote' : 'votes'})',
                        style: AppTypography.caption.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                  ],
                ),
              ],
              
              // Actions or View Details button
              if (actions != null) ...[
                SizedBox(height: AppSpacing.md),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: actions!,
                ),
              ] else if (onTap != null) ...[
                SizedBox(height: AppSpacing.md),
                Align(
                  alignment: Alignment.centerRight,
                  child: OutlinedButton(
                    onPressed: onTap,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.primaryDark,
                      side: BorderSide(color: AppColors.primaryLight),
                      padding: EdgeInsets.symmetric(
                        horizontal: AppSpacing.lg,
                        vertical: AppSpacing.sm,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text('View details'),
                        SizedBox(width: 4),
                        Icon(Icons.arrow_forward, size: 16),
                      ],
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
```

#### RegionChip

Displays a region tag.

```dart
// lib/presentation/shared/widgets/region_chip.dart

import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../theme/app_spacing.dart';

class RegionChip extends StatelessWidget {
  final String region;
  final bool selected;
  final VoidCallback? onTap;

  const RegionChip({
    Key? key,
    required this.region,
    this.selected = false,
    this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
      child: Container(
        padding: EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.xs,
        ),
        decoration: BoxDecoration(
          color: selected ? AppColors.primaryLight : AppColors.slate100,
          borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
          border: selected ? Border.all(color: AppColors.primary, width: 1.5) : null,
        ),
        child: Text(
          region,
          style: AppTypography.caption.copyWith(
            color: selected ? AppColors.primaryDark : AppColors.slate700,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}
```

#### StarRating

Displays and optionally allows selection of star ratings.

```dart
// lib/presentation/shared/widgets/star_rating.dart

import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class StarRating extends StatelessWidget {
  final double rating;
  final double size;
  final bool interactive;
  final ValueChanged<double>? onRatingChanged;

  const StarRating({
    Key? key,
    required this.rating,
    this.size = 24,
    this.interactive = false,
    this.onRatingChanged,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (index) {
        final starValue = index + 1;
        return GestureDetector(
          onTap: interactive && onRatingChanged != null
              ? () => onRatingChanged!(starValue.toDouble())
              : null,
          child: Icon(
            starValue <= rating ? Icons.star : Icons.star_border,
            size: size,
            color: Color(0xFFF59E0B), // amber-500
            semanticLabel: 'Star $starValue',
          ),
        );
      }),
    );
  }
}
```

#### EmptyState

Displays a placeholder when no data is available.

```dart
// lib/presentation/shared/widgets/empty_state.dart

import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../theme/app_spacing.dart';

class EmptyState extends StatelessWidget {
  final IconData icon;
  final String message;
  final String? subtitle;
  final Widget? action;

  const EmptyState({
    Key? key,
    required this.icon,
    required this.message,
    this.subtitle,
    this.action,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: EdgeInsets.all(AppSpacing.xxl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 64,
              color: AppColors.slate300,
            ),
            SizedBox(height: AppSpacing.lg),
            Text(
              message,
              style: AppTypography.subtitle.copyWith(
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            if (subtitle != null) ...[
              SizedBox(height: AppSpacing.sm),
              Text(
                subtitle!,
                style: AppTypography.body.copyWith(
                  color: AppColors.textTertiary,
                ),
                textAlign: TextAlign.center,
              ),
            ],
            if (action != null) ...[
              SizedBox(height: AppSpacing.xl),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}
```

#### ErrorState

Displays an error message with retry option.

```dart
// lib/presentation/shared/widgets/error_state.dart

import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../theme/app_spacing.dart';
import 'primary_button.dart';

class ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const ErrorState({
    Key? key,
    required this.message,
    required this.onRetry,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: EdgeInsets.all(AppSpacing.xxl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: AppColors.errorText,
            ),
            SizedBox(height: AppSpacing.lg),
            Text(
              'Something went wrong',
              style: AppTypography.subtitle.copyWith(
                color: AppColors.textPrimary,
              ),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: AppSpacing.sm),
            Text(
              message,
              style: AppTypography.body.copyWith(
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: AppSpacing.xl),
            PrimaryButton(
              onPressed: onRetry,
              child: Text('Try Again'),
            ),
          ],
        ),
      ),
    );
  }
}
```

#### LoadingIndicator

Displays a loading spinner with optional message.

```dart
// lib/presentation/shared/widgets/loading_indicator.dart

import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../theme/app_spacing.dart';

class LoadingIndicator extends StatelessWidget {
  final String? message;

  const LoadingIndicator({
    Key? key,
    this.message,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(
            color: AppColors.primary,
          ),
          if (message != null) ...[
            SizedBox(height: AppSpacing.lg),
            Text(
              message!,
              style: AppTypography.body.copyWith(
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );
  }
}
```

#### SectionHeader

Displays a section title with consistent styling.

```dart
// lib/presentation/shared/widgets/section_header.dart

import 'package:flutter/material.dart';
import '../theme/app_typography.dart';
import '../theme/app_spacing.dart';

class SectionHeader extends StatelessWidget {
  final String title;
  final Widget? action;

  const SectionHeader({
    Key? key,
    required this.title,
    this.action,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: AppSpacing.md),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: AppTypography.subtitle,
          ),
          if (action != null) action!,
        ],
      ),
    );
  }
}
```

#### PrimaryButton

Primary CTA button with consistent styling.

```dart
// lib/presentation/shared/widgets/primary_button.dart

import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../theme/app_spacing.dart';

class PrimaryButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final Widget child;
  final bool isLoading;
  final bool fullWidth;

  const PrimaryButton({
    Key? key,
    required this.onPressed,
    required this.child,
    this.isLoading = false,
    this.fullWidth = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final button = ElevatedButton(
      onPressed: isLoading ? null : onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        disabledBackgroundColor: AppColors.slate300,
        disabledForegroundColor: AppColors.slate500,
      ),
      child: isLoading
          ? Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                ),
                SizedBox(width: AppSpacing.sm),
                Text('Submitting...'),
              ],
            )
          : child,
    );

    return fullWidth ? SizedBox(width: double.infinity, child: button) : button;
  }
}
```

### Responsive Utilities

```dart
// lib/presentation/shared/utils/responsive.dart

import 'package:flutter/material.dart';

class Responsive {
  static const double mobileBreakpoint = 600;
  static const double tabletBreakpoint = 900;
  static const double desktopBreakpoint = 1200;

  static bool isMobile(BuildContext context) =>
      MediaQuery.of(context).size.width < mobileBreakpoint;

  static bool isTablet(BuildContext context) =>
      MediaQuery.of(context).size.width >= mobileBreakpoint &&
      MediaQuery.of(context).size.width < desktopBreakpoint;

  static bool isDesktop(BuildContext context) =>
      MediaQuery.of(context).size.width >= desktopBreakpoint;

  static int getGridColumns(BuildContext context, {int mobile = 2, int tablet = 4}) {
    if (isMobile(context)) return mobile;
    return tablet;
  }

  static EdgeInsets getScreenPadding(BuildContext context) {
    if (isMobile(context)) return EdgeInsets.all(16);
    if (isTablet(context)) return EdgeInsets.all(24);
    return EdgeInsets.all(32);
  }
}
```

### Animation Constants

```dart
// lib/presentation/shared/utils/animations.dart

class AppAnimations {
  static const Duration fast = Duration(milliseconds: 100);
  static const Duration normal = Duration(milliseconds: 200);
  static const Duration slow = Duration(milliseconds: 300);
  static const Duration verySlow = Duration(milliseconds: 400);

  static const Curve easeIn = Curves.easeIn;
  static const Curve easeOut = Curves.easeOut;
  static const Curve easeInOut = Curves.easeInOut;
}
```

---

## Data Models

No changes to existing data models. The redesign uses the same entities and DTOs from the existing architecture.

---

