import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/state/request_status.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/app_text_field.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/services/location_service.dart';
import '../../../auth/presentation/cubit/auth_cubit.dart';
import '../cubit/profile_cubit.dart';

class AccountPage extends StatefulWidget {
  const AccountPage({super.key});

  @override
  State<AccountPage> createState() => _AccountPageState();
}

class _AccountPageState extends State<AccountPage> {
  final _regionController = TextEditingController();
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _newEmailController = TextEditingController();
  final _emailCodeController = TextEditingController();
  final _locationService = LocationService();
  bool _isDetectingLocation = false;

  @override
  void dispose() {
    _regionController.dispose();
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _newEmailController.dispose();
    _emailCodeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<ProfileCubit, ProfileState>(
      listenWhen:
          (previous, current) =>
              previous.actionStatus != current.actionStatus ||
              previous.profile != current.profile,
      listener: (context, state) {
        if (state.profile != null &&
            _regionController.text != state.profile!.region) {
          _regionController.text = state.profile!.region;
        }
        if (state.actionStatus == RequestStatus.success &&
            state.message != null) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text(state.message!)));
          _currentPasswordController.clear();
          _newPasswordController.clear();
          _emailCodeController.clear();
        }
        if (state.actionStatus == RequestStatus.failure &&
            state.message != null) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text(state.message!)));
        }
      },
      builder: (context, state) {
        return Scaffold(
          appBar: AppBar(
            title: const Text('Account'),
            actions: [
              IconButton(
                tooltip: 'Refresh',
                onPressed: () => context.read<ProfileCubit>().loadProfile(),
                icon: const Icon(Icons.refresh_rounded),
              ),
            ],
          ),
          body: _body(context, state),
        );
      },
    );
  }

  Widget _body(BuildContext context, ProfileState state) {
    if (state.status == RequestStatus.loading && state.profile == null) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.status == RequestStatus.failure && state.profile == null) {
      return ErrorView(
        message: state.message ?? 'Failed to load profile.',
        onRetry: () => context.read<ProfileCubit>().loadProfile(),
      );
    }

    final profile = state.profile;
    if (profile == null) {
      return const Center(child: CircularProgressIndicator());
    }

    final busy = state.actionStatus == RequestStatus.loading;

    return RefreshIndicator(
      onRefresh: () => context.read<ProfileCubit>().loadProfile(),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
        children: [
          AppCard(
            child: Row(
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Icon(
                    Icons.person_rounded,
                    color: AppTheme.primary,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        profile.email,
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w900),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${profile.region} • ${profile.verified ? 'verified' : 'not verified'}',
                        style: const TextStyle(color: AppTheme.mutedText),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _SectionTitle(
                  icon: Icons.location_on_outlined,
                  title: 'Region Update',
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withValues(alpha: 0.05),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: AppTheme.primary.withValues(alpha: 0.2),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.security,
                            color: AppTheme.primary,
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'GPS Verification Required',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: AppTheme.primary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'For security, region updates require GPS verification. Enable location services and tap the button below.',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppTheme.mutedText,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: AppTextField(
                              controller: _regionController,
                              label: 'Current Region',
                              icon: Icons.map_outlined,
                              readOnly: true,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            decoration: BoxDecoration(
                              color: AppTheme.primary,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: IconButton(
                              onPressed: _isDetectingLocation ? null : _detectLocation,
                              icon: _isDetectingLocation
                                  ? const SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: Colors.white,
                                      ),
                                    )
                                  : const Icon(Icons.my_location, color: Colors.white),
                              tooltip: 'Detect my location',
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _SectionTitle(
                  icon: Icons.lock_outline_rounded,
                  title: 'Password',
                ),
                const SizedBox(height: 12),
                AppTextField(
                  controller: _currentPasswordController,
                  label: 'Current password',
                  icon: Icons.lock_outline_rounded,
                  obscureText: true,
                ),
                const SizedBox(height: 12),
                AppTextField(
                  controller: _newPasswordController,
                  label: 'New password',
                  icon: Icons.lock_reset_rounded,
                  obscureText: true,
                ),
                const SizedBox(height: 12),
                AppButton(
                  label: 'Change password',
                  icon: Icons.password_rounded,
                  loading: busy,
                  onPressed: _changePassword,
                ),
              ],
            ),
          ),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _SectionTitle(
                  icon: Icons.alternate_email_rounded,
                  title: 'Email change',
                ),
                const SizedBox(height: 12),
                AppTextField(
                  controller: _newEmailController,
                  label: 'New email',
                  icon: Icons.mail_outline_rounded,
                  keyboardType: TextInputType.emailAddress,
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: busy ? null : _requestEmailChange,
                  icon: const Icon(Icons.mark_email_read_outlined),
                  label: const Text('Send verification code'),
                ),
                const SizedBox(height: 12),
                AppTextField(
                  controller: _emailCodeController,
                  label: 'Verification code',
                  icon: Icons.pin_outlined,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                ),
                const SizedBox(height: 12),
                AppButton(
                  label: 'Verify email',
                  icon: Icons.verified_outlined,
                  loading: busy,
                  onPressed: _verifyEmailChange,
                ),
              ],
            ),
          ),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _SectionTitle(icon: Icons.logout_rounded, title: 'Session'),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: () => context.read<AuthCubit>().logout(),
                  icon: const Icon(Icons.logout_rounded),
                  label: const Text('Logout'),
                ),
                const SizedBox(height: 12),
                TextButton.icon(
                  onPressed: busy ? null : () => _confirmDelete(context),
                  icon: const Icon(Icons.delete_forever_outlined),
                  label: const Text('Delete account'),
                  style: TextButton.styleFrom(
                    foregroundColor: Colors.redAccent,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _changePassword() {
    if (_currentPasswordController.text.trim().isEmpty ||
        _newPasswordController.text.trim().isEmpty) {
      _showMessage('Current and new password are required.');
      return;
    }
    context.read<ProfileCubit>().changePassword(
      currentPassword: _currentPasswordController.text,
      newPassword: _newPasswordController.text,
    );
  }

  void _requestEmailChange() {
    if (_newEmailController.text.trim().isEmpty) {
      _showMessage('New email is required.');
      return;
    }
    context.read<ProfileCubit>().requestEmailChange(_newEmailController.text);
  }

  void _verifyEmailChange() {
    if (_emailCodeController.text.trim().isEmpty) {
      _showMessage('Verification code is required.');
      return;
    }
    context.read<ProfileCubit>().verifyEmailChange(_emailCodeController.text);
  }

  Future<void> _confirmDelete(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder:
          (dialogContext) => AlertDialog(
            title: const Text('Delete account?'),
            content: const Text(
              'Your account will be anonymized and deactivated. This cannot be undone.',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(dialogContext).pop(false),
                child: const Text('Cancel'),
              ),
              TextButton(
                onPressed: () => Navigator.of(dialogContext).pop(true),
                style: TextButton.styleFrom(foregroundColor: Colors.redAccent),
                child: const Text('Delete'),
              ),
            ],
          ),
    );

    if (confirmed != true || !context.mounted) return;
    final error = await context.read<ProfileCubit>().deleteAccount();
    if (!context.mounted || error != null) return;
    context.read<AuthCubit>().logout();
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _detectLocation() async {
    setState(() => _isDetectingLocation = true);
    final region = await _locationService.getCurrentRegion();
    if (region != null && mounted) {
      final oldRegion = _regionController.text;
      _regionController.text = region;
      
      // Automatically update region after detection
      if (oldRegion != region) {
        context.read<ProfileCubit>().updateRegion(region);
        _showMessage('✅ Location detected and updated: $region');
      } else {
        _showMessage('✅ Location detected: $region (no change)');
      }
    } else if (mounted) {
      _showMessage('📱 Please enable location in settings, then return and tap the location button again');
    }
    if (mounted) {
      setState(() => _isDetectingLocation = false);
    }
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.icon, required this.title});

  final IconData icon;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: AppTheme.primary),
        const SizedBox(width: 8),
        Text(
          title,
          style: Theme.of(
            context,
          ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900),
        ),
      ],
    );
  }
}
