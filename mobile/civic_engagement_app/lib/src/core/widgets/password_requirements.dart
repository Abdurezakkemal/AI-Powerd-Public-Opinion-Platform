import 'package:flutter/material.dart';

import '../layout/responsive_layout.dart';
import '../theme/app_theme.dart';

class PasswordRules {
  const PasswordRules._();

  static const minLength = 8;

  static List<PasswordRequirement> evaluate(String password) {
    return [
      PasswordRequirement(
        label: 'At least $minLength characters',
        met: password.length >= minLength,
      ),
      PasswordRequirement(
        label: 'One uppercase letter',
        met: RegExp(r'[A-Z]').hasMatch(password),
      ),
      PasswordRequirement(
        label: 'One lowercase letter',
        met: RegExp(r'[a-z]').hasMatch(password),
      ),
      PasswordRequirement(
        label: 'One number',
        met: RegExp(r'\d').hasMatch(password),
      ),
      PasswordRequirement(
        label: 'One special character',
        met: RegExp(r'[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;/`~]').hasMatch(
          password,
        ),
      ),
    ];
  }

  static bool isStrong(String password) {
    return evaluate(password).every((requirement) => requirement.met);
  }
}

class PasswordRequirement {
  const PasswordRequirement({
    required this.label,
    required this.met,
  });

  final String label;
  final bool met;
}

class PasswordRequirements extends StatelessWidget {
  const PasswordRequirements({
    required this.controller,
    super.key,
  });

  final TextEditingController controller;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) {
        final password = controller.text;
        final requirements = PasswordRules.evaluate(password);
        final metCount =
            requirements.where((requirement) => requirement.met).length;
        final strength = metCount / requirements.length;
        final strengthLabel = _strengthLabel(metCount);
        final strengthColor = _strengthColor(context, metCount);

        return Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppTheme.subtleFillFor(context),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: AppTheme.borderFor(context).withValues(alpha: 0.8),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(
                    Icons.security_rounded,
                    size: 18,
                    color: strengthColor,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Password strength',
                    style: TextStyle(
                      color: AppTheme.textFor(context),
                      fontWeight: FontWeight.w800,
                      fontSize: ResponsiveLayout.secondaryBodyFontSize(context),
                    ),
                  ),
                  const Spacer(),
                  Text(
                    strengthLabel,
                    style: TextStyle(
                      color: strengthColor,
                      fontWeight: FontWeight.w800,
                      fontSize: ResponsiveLayout.secondaryBodyFontSize(context),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              ClipRRect(
                borderRadius: BorderRadius.circular(999),
                child: LinearProgressIndicator(
                  value: strength,
                  minHeight: 7,
                  backgroundColor:
                      AppTheme.borderFor(context).withValues(alpha: 0.6),
                  valueColor: AlwaysStoppedAnimation<Color>(strengthColor),
                ),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 10,
                runSpacing: 8,
                children: requirements.map((requirement) {
                  final color = requirement.met
                      ? const Color(0xFF178A5B)
                      : AppTheme.mutedTextFor(context);
                  return Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        requirement.met
                            ? Icons.check_circle_rounded
                            : Icons.radio_button_unchecked_rounded,
                        size: 16,
                        color: color,
                      ),
                      const SizedBox(width: 5),
                      Text(
                        requirement.label,
                        style: TextStyle(
                          color: color,
                          fontWeight: requirement.met
                              ? FontWeight.w700
                              : FontWeight.w600,
                          fontSize:
                              ResponsiveLayout.secondaryBodyFontSize(context),
                        ),
                      ),
                    ],
                  );
                }).toList(),
              ),
            ],
          ),
        );
      },
    );
  }

  String _strengthLabel(int metCount) {
    if (metCount <= 1) return 'Weak';
    if (metCount <= 3) return 'Medium';
    if (metCount == 4) return 'Good';
    return 'Strong';
  }

  Color _strengthColor(BuildContext context, int metCount) {
    if (metCount <= 1) return Colors.redAccent;
    if (metCount <= 3) return const Color(0xFFD18B00);
    if (metCount == 4) return AppTheme.primary;
    return const Color(0xFF178A5B);
  }
}
