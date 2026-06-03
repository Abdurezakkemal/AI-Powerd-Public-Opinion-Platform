import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/state/request_status.dart';
import '../../../../core/di/service_locator.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_text_field.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/services/location_service.dart';
import '../../../../core/localization/app_localizations.dart';
import '../../../../core/settings/app_settings_controller.dart';
import '../../../../core/settings/app_settings_scope.dart';
import '../../../auth/presentation/cubit/auth_cubit.dart';
import '../cubit/profile_cubit.dart';
import 'planner_request_page.dart';

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
  final _newPhoneController = TextEditingController();
  final _phoneCodeController = TextEditingController();
  final _locationService = LocationService();
  bool _isDetectingLocation = false;
  bool _logoutAfterPhoneVerify = false;
  bool _hasManuallySelectedLanguage = false;
  String _selectedLanguage = 'en';

  @override
  void dispose() {
    _regionController.dispose();
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _newEmailController.dispose();
    _emailCodeController.dispose();
    _newPhoneController.dispose();
    _phoneCodeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<ProfileCubit, ProfileState>(
      listenWhen: (previous, current) =>
          previous.actionStatus != current.actionStatus ||
          previous.profile != current.profile,
      listener: (context, state) {
        if (state.profile != null &&
            _regionController.text != state.profile!.region) {
          _regionController.text = state.profile!.region;
        }
        // Only set language from profile if user hasn't manually selected one
        if (state.profile != null &&
            _selectedLanguage != state.profile!.preferredLanguage &&
            !_hasManuallySelectedLanguage) {
          _selectedLanguage = state.profile!.preferredLanguage;
        }
        if (state.actionStatus == RequestStatus.success &&
            state.message != null) {
          if (state.message!.startsWith('Your data export')) {
            _showExportSuccess(context, state.message!);
          }
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
              content: Text(state.message!),
              backgroundColor: Colors.green.shade600,
              duration: state.message!.startsWith('Your data export')
                  ? const Duration(seconds: 8)
                  : const Duration(seconds: 4)));
          _currentPasswordController.clear();
          _newPasswordController.clear();
          _emailCodeController.clear();
          _phoneCodeController.clear();
          if (_logoutAfterPhoneVerify) {
            _logoutAfterPhoneVerify = false;
            context.read<AuthCubit>().logout();
          }
        }
        if (state.actionStatus == RequestStatus.failure &&
            state.message != null) {
          _logoutAfterPhoneVerify = false;
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
              content: Text(state.message!),
              backgroundColor: Colors.redAccent));
        }
      },
      builder: (context, state) {
        return Scaffold(
          backgroundColor: AppTheme.background,
          body: _body(context, state),
        );
      },
    );
  }

  Widget _body(BuildContext context, ProfileState state) {
    if (state.status == RequestStatus.loading && state.profile == null) {
      return const Center(
          child: CircularProgressIndicator(color: AppTheme.primary));
    }

    if (state.status == RequestStatus.failure && state.profile == null) {
      return ErrorView(
        message: state.message ?? 'Failed to load profile.',
        onRetry: () => context.read<ProfileCubit>().loadProfile(),
      );
    }

    final profile = state.profile;
    if (profile == null) {
      return const Center(
          child: CircularProgressIndicator(color: AppTheme.primary));
    }

    final busy = state.actionStatus == RequestStatus.loading;
    final l10n = AppLocalizations.of(context);

    return RefreshIndicator(
      color: AppTheme.primary,
      backgroundColor: Colors.white,
      onRefresh: () => context.read<ProfileCubit>().loadProfile(),
      child: CustomScrollView(
        slivers: [
          // Custom Header with elevation
          SliverToBoxAdapter(
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.06),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: SafeArea(
                bottom: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        l10n.t('account'),
                        style: const TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.w900,
                          color: AppTheme.text,
                          letterSpacing: 0,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: AppTheme.primary.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: IconButton(
                          tooltip: 'Refresh',
                          onPressed: () =>
                              context.read<ProfileCubit>().loadProfile(),
                          icon: const Icon(
                            Icons.refresh_rounded,
                            color: AppTheme.primary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Content
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // Profile Card - Larger height
                _buildElevatedCard(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Row(
                      children: [
                        Container(
                          width: 72,
                          height: 72,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                AppTheme.primary.withValues(alpha: 0.2),
                                AppTheme.primary.withValues(alpha: 0.1),
                              ],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Icon(
                            Icons.person_rounded,
                            color: AppTheme.primary,
                            size: 36,
                          ),
                        ),
                        const SizedBox(width: 20),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                profile.email,
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w900,
                                  color: AppTheme.text,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  Icon(Icons.location_on_rounded,
                                      size: 16,
                                      color: AppTheme.mutedText
                                          .withValues(alpha: 0.8)),
                                  const SizedBox(width: 4),
                                  Text(
                                    profile.region,
                                    style: const TextStyle(
                                        color: AppTheme.mutedText,
                                        fontWeight: FontWeight.w600,
                                        fontSize: 14),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  if (profile.verified) ...[
                                    Icon(Icons.verified_rounded,
                                        size: 16, color: Colors.blue.shade600),
                                    const SizedBox(width: 4),
                                    Text(l10n.t('account.verified'),
                                        style: TextStyle(
                                            color: Colors.blue.shade600,
                                            fontWeight: FontWeight.w700,
                                            fontSize: 14)),
                                  ] else ...[
                                    Icon(Icons.pending_actions_rounded,
                                        size: 16,
                                        color: Colors.orange.shade600),
                                    const SizedBox(width: 4),
                                    Text(l10n.t('account.unverified'),
                                        style: TextStyle(
                                            color: Colors.orange.shade600,
                                            fontWeight: FontWeight.w700,
                                            fontSize: 14)),
                                  ],
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Preferences Card (Language + Theme combined)
                _buildElevatedCard(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _SectionTitle(
                          icon: Icons.tune_rounded,
                          title: l10n.t('account.preferences'),
                        ),
                        const SizedBox(height: 20),

                        // Language Section
                        Row(
                          children: [
                            Icon(Icons.translate_rounded,
                                color: AppTheme.mutedText, size: 20),
                            const SizedBox(width: 12),
                            Text(
                              l10n.t('account.language'),
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.text,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        DropdownButtonFormField<String>(
                          value: _selectedLanguage,
                          decoration: InputDecoration(
                            labelText: l10n.t('preferred_language'),
                            prefixIcon: const Icon(Icons.language_rounded),
                            contentPadding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 14),
                          ),
                          icon: const Icon(Icons.keyboard_arrow_down_rounded),
                          items: AppLocalizations.supportedLocales
                              .map(
                                (locale) => DropdownMenuItem(
                                  value: locale.languageCode,
                                  child: Text(
                                    AppLocalizations.languageName(
                                        locale.languageCode),
                                  ),
                                ),
                              )
                              .toList(),
                          onChanged: busy
                              ? null
                              : (value) {
                                  if (value == null ||
                                      value == _selectedLanguage) {
                                    return;
                                  }
                                  setState(() {
                                    _selectedLanguage = value;
                                    _hasManuallySelectedLanguage = true;
                                  });
                                  serviceLocator<AppSettingsController>()
                                      .setLocale(value);
                                  context
                                      .read<ProfileCubit>()
                                      .updatePreferredLanguage(value);
                                },
                        ),

                        const SizedBox(height: 24),
                        const Divider(height: 1),
                        const SizedBox(height: 24),

                        // Theme Section
                        Row(
                          children: [
                            Icon(Icons.dark_mode_outlined,
                                color: AppTheme.mutedText, size: 20),
                            const SizedBox(width: 12),
                            Text(
                              l10n.t('account.theme'),
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.text,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        AnimatedBuilder(
                          animation: AppSettingsScope.of(context),
                          builder: (context, _) {
                            final settings = AppSettingsScope.of(context);
                            return SegmentedButton<ThemeMode>(
                              segments: [
                                ButtonSegment(
                                  value: ThemeMode.system,
                                  icon: const Icon(
                                      Icons.settings_suggest_outlined,
                                      size: 18),
                                  label: Text(l10n.t('theme.system')),
                                ),
                                ButtonSegment(
                                  value: ThemeMode.light,
                                  icon: const Icon(Icons.light_mode_outlined,
                                      size: 18),
                                  label: Text(l10n.t('theme.light')),
                                ),
                                ButtonSegment(
                                  value: ThemeMode.dark,
                                  icon: const Icon(Icons.dark_mode_outlined,
                                      size: 18),
                                  label: Text(l10n.t('theme.dark')),
                                ),
                              ],
                              selected: {settings.themeMode},
                              onSelectionChanged: (selection) {
                                settings.setThemeMode(selection.first);
                              },
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Become Planner Card
                _buildElevatedCard(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _SectionTitle(
                          icon: Icons.work_outline_rounded,
                          title: l10n.t('account.become_planner'),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          l10n.t('account.planner_description'),
                          style: const TextStyle(
                            fontSize: 14,
                            color: AppTheme.mutedText,
                            height: 1.5,
                          ),
                        ),
                        const SizedBox(height: 20),
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton.icon(
                            onPressed: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (context) =>
                                      const PlannerRequestPage(),
                                ),
                              );
                            },
                            icon: const Icon(Icons.send_rounded, size: 18),
                            label: Text(l10n.t('account.request_planner')),
                            style: _outlinedButtonStyle(),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Security & Account Card (Region, Password, Email, Settings)
                _buildElevatedCard(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _SectionTitle(
                          icon: Icons.security_rounded,
                          title: l10n.t('account.security'),
                        ),
                        const SizedBox(height: 20),

                        // Region Section
                        Row(
                          children: [
                            Icon(Icons.location_on_rounded,
                                color: AppTheme.mutedText, size: 20),
                            const SizedBox(width: 12),
                            Text(
                              l10n.t('account.region'),
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.text,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withValues(alpha: 0.03),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: AppTheme.primary.withValues(alpha: 0.15),
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(
                                    Icons.info_outline_rounded,
                                    color: AppTheme.primary,
                                    size: 18,
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      l10n.t('account.gps_description'),
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: AppTheme.primary
                                            .withValues(alpha: 0.8),
                                        height: 1.4,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Expanded(
                                    child: AppTextField(
                                      controller: _regionController,
                                      label: l10n.t('account.current_region'),
                                      icon: Icons.map_rounded,
                                      readOnly: true,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Container(
                                    height: 56,
                                    width: 56,
                                    decoration: BoxDecoration(
                                      color: AppTheme.primary,
                                      borderRadius: BorderRadius.circular(16),
                                      boxShadow: [
                                        BoxShadow(
                                          color: AppTheme.primary
                                              .withValues(alpha: 0.3),
                                          blurRadius: 8,
                                          offset: const Offset(0, 4),
                                        )
                                      ],
                                    ),
                                    child: IconButton(
                                      onPressed: _isDetectingLocation
                                          ? null
                                          : _detectLocation,
                                      icon: _isDetectingLocation
                                          ? const SizedBox(
                                              width: 24,
                                              height: 24,
                                              child: CircularProgressIndicator(
                                                strokeWidth: 2.5,
                                                color: Colors.white,
                                              ),
                                            )
                                          : const Icon(
                                              Icons.my_location_rounded,
                                              color: Colors.white),
                                      tooltip:
                                          l10n.t('account.detect_location'),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 24),
                        const Divider(height: 1),
                        const SizedBox(height: 24),

                        // Password Section
                        Row(
                          children: [
                            Icon(Icons.lock_outline_rounded,
                                color: AppTheme.mutedText, size: 20),
                            const SizedBox(width: 12),
                            Text(
                              l10n.t('login.password'),
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.text,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        AppTextField(
                          controller: _currentPasswordController,
                          label: l10n.t('account.current_password'),
                          icon: Icons.lock_outline_rounded,
                          obscureText: true,
                        ),
                        const SizedBox(height: 12),
                        AppTextField(
                          controller: _newPasswordController,
                          label: l10n.t('account.new_password'),
                          icon: Icons.lock_reset_rounded,
                          obscureText: true,
                        ),
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          child: AppButton(
                            label: l10n.t('account.change_password'),
                            icon: Icons.password_rounded,
                            loading: busy,
                            onPressed: _changePassword,
                          ),
                        ),

                        const SizedBox(height: 24),
                        const Divider(height: 1),
                        const SizedBox(height: 24),

                        // Email Section
                        Row(
                          children: [
                            Icon(Icons.alternate_email_rounded,
                                color: AppTheme.mutedText, size: 20),
                            const SizedBox(width: 12),
                            Text(
                              l10n.t('account.email'),
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.text,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        AppTextField(
                          controller: _newEmailController,
                          label: l10n.t('account.new_email'),
                          icon: Icons.mail_outline_rounded,
                          keyboardType: TextInputType.emailAddress,
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton.icon(
                            onPressed: busy ? null : _requestEmailChange,
                            icon: const Icon(Icons.mark_email_read_outlined,
                                size: 18),
                            label: Text(l10n.t('account.send_code')),
                            style: _outlinedButtonStyle(),
                          ),
                        ),
                        const SizedBox(height: 16),
                        AppTextField(
                          controller: _emailCodeController,
                          label: l10n.t('account.verification_code'),
                          icon: Icons.pin_outlined,
                          keyboardType: TextInputType.number,
                          maxLength: 6,
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: AppButton(
                            label: l10n.t('account.verify_email'),
                            icon: Icons.verified_rounded,
                            loading: busy,
                            onPressed: _verifyEmailChange,
                          ),
                        ),

                        const SizedBox(height: 24),
                        const Divider(height: 1),
                        const SizedBox(height: 24),

                        // Settings Section
                        Row(
                          children: [
                            Icon(Icons.settings_rounded,
                                color: AppTheme.mutedText, size: 20),
                            const SizedBox(width: 12),
                            Text(
                              l10n.t('account.settings'),
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.text,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton.icon(
                            onPressed: () => _confirmLogout(context),
                            icon: const Icon(Icons.logout_rounded, size: 18),
                            label: Text(l10n.t('account.logout')),
                            style: _outlinedButtonStyle(),
                          ),
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton.icon(
                            onPressed: busy
                                ? null
                                : () => context
                                    .read<ProfileCubit>()
                                    .exportUserData(),
                            icon: const Icon(Icons.file_download_outlined,
                                size: 18),
                            label: Text(l10n.t('account.export_data')),
                            style: _outlinedButtonStyle(),
                          ),
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: TextButton.icon(
                            onPressed:
                                busy ? null : () => _confirmDelete(context),
                            icon: const Icon(Icons.delete_forever_rounded,
                                size: 18),
                            label: Text(l10n.t('account.delete_account')),
                            style: TextButton.styleFrom(
                              foregroundColor: Colors.redAccent,
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 24, vertical: 16),
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16)),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildElevatedCard({required Widget child}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
          BoxShadow(
            color: AppTheme.primary.withValues(alpha: 0.03),
            blurRadius: 40,
            offset: const Offset(0, 16),
          ),
        ],
      ),
      child: child,
    );
  }

  ButtonStyle _outlinedButtonStyle() {
    return OutlinedButton.styleFrom(
      foregroundColor: AppTheme.primary,
      side: BorderSide(color: AppTheme.primary.withValues(alpha: 0.3)),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
    );
  }

  void _changePassword() {
    if (_currentPasswordController.text.trim().isEmpty ||
        _newPasswordController.text.trim().isEmpty) {
      _showMessage('Current and new password are required.', isError: true);
      return;
    }
    context.read<ProfileCubit>().changePassword(
          currentPassword: _currentPasswordController.text,
          newPassword: _newPasswordController.text,
        );
  }

  void _requestEmailChange() {
    if (_newEmailController.text.trim().isEmpty) {
      _showMessage('New email is required.', isError: true);
      return;
    }
    context.read<ProfileCubit>().requestEmailChange(_newEmailController.text);
  }

  void _verifyEmailChange() {
    if (_emailCodeController.text.trim().isEmpty) {
      _showMessage('Verification code is required.', isError: true);
      return;
    }
    context.read<ProfileCubit>().verifyEmailChange(_emailCodeController.text);
  }

  void _requestPhoneChange() {
    if (_newPhoneController.text.trim().isEmpty) {
      _showMessage('New phone is required.', isError: true);
      return;
    }
    context.read<ProfileCubit>().requestPhoneChange(_newPhoneController.text);
  }

  void _verifyPhoneChange() {
    if (_newPhoneController.text.trim().isEmpty ||
        _phoneCodeController.text.trim().isEmpty) {
      _showMessage('New phone and OTP are required.', isError: true);
      return;
    }
    _logoutAfterPhoneVerify = true;
    context.read<ProfileCubit>().verifyPhoneChange(
          newPhone: _newPhoneController.text,
          code: _phoneCodeController.text,
        );
  }

  Future<void> _confirmDelete(BuildContext context) async {
    final l10n = AppLocalizations.of(context);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text(l10n.t('account.delete_confirm'),
            style: const TextStyle(fontWeight: FontWeight.w800)),
        content: Text(
          l10n.t('account.delete_warning'),
          style: const TextStyle(color: AppTheme.mutedText),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: Text(l10n.t('cancel'),
                style: const TextStyle(fontWeight: FontWeight.w700)),
          ),
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            style: TextButton.styleFrom(foregroundColor: Colors.redAccent),
            child: Text(l10n.t('account.delete_account'),
                style: const TextStyle(fontWeight: FontWeight.w800)),
          ),
        ],
      ),
    );

    if (confirmed != true || !context.mounted) return;
    final error = await context.read<ProfileCubit>().deleteAccount();
    if (!context.mounted || error != null) return;
    context.read<AuthCubit>().logout();
  }

  Future<void> _confirmLogout(BuildContext context) async {
    final l10n = AppLocalizations.of(context);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text(l10n.t('account.logout_confirm'),
            style: const TextStyle(fontWeight: FontWeight.w800)),
        content: Text(
          l10n.t('account.logout_confirm'),
          style: const TextStyle(color: AppTheme.mutedText),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: Text(l10n.t('account.logout_no'),
                style: const TextStyle(fontWeight: FontWeight.w700)),
          ),
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            style: TextButton.styleFrom(foregroundColor: Colors.redAccent),
            child: Text(l10n.t('account.logout_yes'),
                style: const TextStyle(fontWeight: FontWeight.w800)),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      context.read<AuthCubit>().logout();
    }
  }

  Future<void> _showExportSuccess(BuildContext context, String message) {
    final l10n = AppLocalizations.of(context);
    return showDialog<void>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text(
          l10n.t('account.export_saved'),
          style: const TextStyle(fontWeight: FontWeight.w800),
        ),
        content: SelectableText(
          message,
          style: const TextStyle(color: AppTheme.mutedText, height: 1.4),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: Text(
              l10n.t('account.done'),
              style: const TextStyle(fontWeight: FontWeight.w800),
            ),
          ),
        ],
      ),
    );
  }

  void _showMessage(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.redAccent : null,
      ),
    );
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
        _showMessage('Location detected and updated: $region');
      } else {
        _showMessage('Location detected: $region (no change)');
      }
    } else if (mounted) {
      _showMessage(
        'Please enable location in settings, then return and tap the location button again',
        isError: true,
      );
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
        Icon(icon, color: AppTheme.primary, size: 22),
        const SizedBox(width: 8),
        Text(
          title,
          style: Theme.of(context)
              .textTheme
              .titleMedium
              ?.copyWith(fontWeight: FontWeight.w900, fontSize: 18),
        ),
      ],
    );
  }
}
