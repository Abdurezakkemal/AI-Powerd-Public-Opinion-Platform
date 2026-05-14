import 'package:flutter/material.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/app_button.dart';

class LandingPage extends StatelessWidget {
  const LandingPage({
    required this.onLogin,
    required this.onRegister,
    required this.onPlannerRequest,
    super.key,
  });

  final VoidCallback onLogin;
  final VoidCallback onRegister;
  final VoidCallback onPlannerRequest;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // Soft ambient background highlight
          Positioned(
            top: -150,
            right: -100,
            child: Container(
              width: 400,
              height: 400,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    AppTheme.primary.withValues(alpha: 0.12),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Spacer(flex: 2),
                  // Logo
                  Center(
                    child: Container(
                      width: 96,
                      height: 96,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(30),
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.primary.withValues(alpha: 0.25),
                            blurRadius: 30,
                            offset: const Offset(0, 15),
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(30),
                        child:
                            Image.asset('assets/logo.png', fit: BoxFit.cover),
                      ),
                    ),
                  ),
                  const SizedBox(height: 48),
                  // App Title
                  Text(
                    'Your Voice in\nAction',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.displaySmall?.copyWith(
                          fontWeight: FontWeight.w900,
                          color: AppTheme.text,
                          height: 1.15,
                          letterSpacing: -1,
                        ),
                  ),
                  const SizedBox(height: 18),
                  Text(
                    'Engage with your local policies, submit feedback efficiently, and make a real impact directly from your device.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 16,
                      color: AppTheme.mutedText,
                      fontWeight: FontWeight.w500,
                      height: 1.5,
                    ),
                  ),
                  const Spacer(flex: 3),
                  // Actions
                  AppButton(
                    label: 'Get Started',
                    icon: Icons.person_add_rounded,
                    onPressed: onRegister,
                  ),
                  const SizedBox(height: 16),
                  OutlinedButton(
                    onPressed: onLogin,
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size.fromHeight(56),
                      side: BorderSide(
                        color: AppTheme.primary.withValues(alpha: 0.2),
                        width: 1.5,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(18),
                      ),
                    ),
                    child: const Text(
                      'Log In',
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 16,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextButton.icon(
                    onPressed: onPlannerRequest,
                    icon: const Icon(Icons.work_outline_rounded),
                    label: const Text('Request planner access'),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
