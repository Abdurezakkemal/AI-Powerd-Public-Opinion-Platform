import 'package:flutter/material.dart';

import '../layout/responsive_layout.dart';

class AppButton extends StatelessWidget {
  const AppButton({
    required this.label,
    required this.onPressed,
    super.key,
    this.icon,
    this.loading = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final height = ResponsiveLayout.controlHeight(context);
    final radius = ResponsiveLayout.isCompact(context) ? 20.0 : 24.0;
    final iconSize = ResponsiveLayout.isCompact(context) ? 18.0 : 20.0;
    final fontSize = ResponsiveLayout.isCompact(context) ? 15.0 : 16.0;
    final loaderSize = ResponsiveLayout.isCompact(context) ? 20.0 : 24.0;

    final child = loading
        ? SizedBox(
            width: loaderSize,
            height: loaderSize,
            child: CircularProgressIndicator(
              strokeWidth: 2.5,
              color: Colors.white,
            ),
          )
        : Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (icon != null) ...[
                Icon(icon, size: iconSize, color: Colors.white),
                SizedBox(width: ResponsiveLayout.spacing(context, 10)),
              ],
              Flexible(
                child: Text(
                  label,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: fontSize,
                    letterSpacing: 0.3,
                  ),
                ),
              ),
            ],
          );

    return Container(
      width: double.infinity,
      height: height,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            theme.colorScheme.primary.withValues(alpha: 0.85),
            theme.colorScheme.primary,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(radius),
        boxShadow: [
          if (!loading && onPressed != null)
            BoxShadow(
              color: theme.colorScheme.primary.withValues(alpha: 0.25),
              blurRadius: 24,
              offset: const Offset(0, 8),
            ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: loading ? null : onPressed,
          borderRadius: BorderRadius.circular(radius),
          splashColor: Colors.white.withValues(alpha: 0.2),
          highlightColor: Colors.white.withValues(alpha: 0.1),
          child: Center(child: child),
        ),
      ),
    );
  }
}
