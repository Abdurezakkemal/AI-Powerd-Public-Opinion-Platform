import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../layout/responsive_layout.dart';
import '../theme/app_theme.dart';

class PublicDashboardLink extends StatelessWidget {
  const PublicDashboardLink({super.key});

  static final Uri _dashboardUri = Uri.parse(
    'https://citizenvoice-frontend.onrender.com/',
  );

  Future<void> _openDashboard(BuildContext context) async {
    final messenger = ScaffoldMessenger.of(context);
    final opened = await launchUrl(
      _dashboardUri,
      mode: LaunchMode.externalApplication,
    );

    if (!opened) {
      messenger.showSnackBar(
        const SnackBar(
          content: Text('Could not open the public dashboard.'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return TextButton.icon(
      onPressed: () => _openDashboard(context),
      icon: const Icon(Icons.public_rounded, size: 18),
      label: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'View public dashboard',
            style: TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: ResponsiveLayout.bodyFontSize(context),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            'No login required',
            style: TextStyle(
              color: AppTheme.mutedTextFor(context),
              fontSize: ResponsiveLayout.secondaryBodyFontSize(context),
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
      style: TextButton.styleFrom(
        foregroundColor: AppTheme.primary,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
      ),
    );
  }
}
