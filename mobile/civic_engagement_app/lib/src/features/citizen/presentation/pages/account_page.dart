import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/state/request_status.dart';
import '../../../../core/di/service_locator.dart';
import '../../../../core/layout/responsive_layout.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/app_text_field.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/services/location_service.dart';
import '../../../../core/localization/app_localizations.dart';
import '../../../../core/settings/app_settings_controller.dart';
import '../../../../core/settings/app_settings_scope.dart';
import '../../../auth/presentation/cubit/auth_cubit.dart';
import '../../domain/entities/user_profile.dart';
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
  final _locationService = LocationService();
  bool _isDetectingLocation = false;
  bool _hasManuallySelectedLanguage = false;
  String _selectedLanguage = 'en';

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
        }
        if (state.actionStatus == RequestStatus.failure &&
            state.message != null) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
              content: Text(state.message!),
              backgroundColor: Colors.redAccent));
        }
      },
      builder: (context, state) {
        return Scaffold(
          backgroundColor: Theme.of(context).scaffoldBackgroundColor,
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
    final pagePadding = ResponsiveLayout.pagePadding(context);
    final maxWidth = ResponsiveLayout.contentMaxWidth(context);
    final headerButtonSize = ResponsiveLayout.circularButtonSize(context);

    return RefreshIndicator(
      color: AppTheme.primary,
      backgroundColor: AppTheme.surfaceFor(context),
      onRefresh: () => context.read<ProfileCubit>().loadProfile(),
      child: CustomScrollView(
        slivers: [
          // Custom Header with elevation
          SliverToBoxAdapter(
            child: Container(
              decoration: BoxDecoration(
                color: AppTheme.surfaceFor(context),
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
                  padding: EdgeInsets.fromLTRB(
                    pagePadding,
                    8,
                    pagePadding,
                    12,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        l10n.t('account'),
                        style: TextStyle(
                          fontSize: ResponsiveLayout.headerTitleSize(context),
                          fontWeight: FontWeight.w900,
                          color: AppTheme.textFor(context),
                          letterSpacing: 0,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Container(
                        width: headerButtonSize,
                        height: headerButtonSize,
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
            padding: EdgeInsets.fromLTRB(
              pagePadding,
              20,
              pagePadding,
              100,
            ),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                Center(
                  child: ConstrainedBox(
                    constraints: BoxConstraints(maxWidth: maxWidth),
                    child: Column(
                      children: [
                        // Profile Card - Larger height
                        _buildElevatedCard(
                          child: _buildProfileSummaryCard(context, profile),
                        ),
                        const SizedBox(height: 16),
                      ],
                    ),
                  ),
                ),

                // Preferences Card (Language + Theme combined)
                Center(
                  child: ConstrainedBox(
                    constraints: BoxConstraints(maxWidth: maxWidth),
                    child: _buildElevatedCard(
                      child: Padding(
                        padding: EdgeInsets.all(
                          ResponsiveLayout.cardPadding(context),
                        ),
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
                                Icon(
                                  Icons.translate_rounded,
                                  color: AppTheme.mutedTextFor(context),
                                  size: 20,
                                ),
                                const SizedBox(width: 12),
                                Text(
                                  l10n.t('account.language'),
                                  style: TextStyle(
                                    fontSize:
                                        ResponsiveLayout.bodyFontSize(context),
                                    fontWeight: FontWeight.w600,
                                    color: AppTheme.textFor(context),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Padding(
                              padding:
                                  const EdgeInsets.only(left: 2, bottom: 8),
                              child: Text(
                                l10n.t('preferred_language'),
                                style: TextStyle(
                                  fontSize:
                                      ResponsiveLayout.secondaryBodyFontSize(
                                    context,
                                  ),
                                  color: AppTheme.mutedTextFor(context),
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            DropdownButtonFormField<String>(
                              value: _selectedLanguage,
                              decoration: InputDecoration(
                                prefixIcon: const Icon(Icons.language_rounded),
                                contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 14,
                                ),
                              ),
                              icon: const Icon(
                                Icons.keyboard_arrow_down_rounded,
                              ),
                              items: AppLocalizations.supportedLocales
                                  .map(
                                    (locale) => DropdownMenuItem(
                                      value: locale.languageCode,
                                      child: Text(
                                        AppLocalizations.languageName(
                                          locale.languageCode,
                                        ),
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
                                Icon(
                                  Icons.dark_mode_outlined,
                                  color: AppTheme.mutedTextFor(context),
                                  size: 20,
                                ),
                                const SizedBox(width: 12),
                                Text(
                                  l10n.t('account.theme'),
                                  style: TextStyle(
                                    fontSize:
                                        ResponsiveLayout.bodyFontSize(context),
                                    fontWeight: FontWeight.w600,
                                    color: AppTheme.textFor(context),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            AnimatedBuilder(
                              animation: AppSettingsScope.of(context),
                              builder: (context, _) {
                                final settings = AppSettingsScope.of(context);
                                final selectedMode =
                                    settings.themeMode == ThemeMode.dark
                                        ? ThemeMode.dark
                                        : ThemeMode.light;
                                return LayoutBuilder(
                                  builder: (context, constraints) {
                                    final useVerticalLayout =
                                        constraints.maxWidth < 320;
                                    return Wrap(
                                      spacing: 10,
                                      runSpacing: 10,
                                      direction: useVerticalLayout
                                          ? Axis.vertical
                                          : Axis.horizontal,
                                      children: [
                                        _ThemeChoiceButton(
                                          icon: Icons.light_mode_outlined,
                                          label: l10n.t('theme.light'),
                                          selected:
                                              selectedMode == ThemeMode.light,
                                          onTap: () => settings.setThemeMode(
                                            ThemeMode.light,
                                          ),
                                        ),
                                        _ThemeChoiceButton(
                                          icon: Icons.dark_mode_outlined,
                                          label: l10n.t('theme.dark'),
                                          selected:
                                              selectedMode == ThemeMode.dark,
                                          onTap: () => settings.setThemeMode(
                                            ThemeMode.dark,
                                          ),
                                        ),
                                      ],
                                    );
                                  },
                                );
                              },
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Become Planner Card
                Center(
                  child: ConstrainedBox(
                    constraints: BoxConstraints(maxWidth: maxWidth),
                    child: _buildElevatedCard(
                      child: Padding(
                        padding: EdgeInsets.all(
                          ResponsiveLayout.cardPadding(context),
                        ),
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
                              style: TextStyle(
                                fontSize:
                                    ResponsiveLayout.secondaryBodyFontSize(
                                  context,
                                ),
                                color: AppTheme.mutedTextFor(context),
                                height: 1.5,
                              ),
                            ),
                            const SizedBox(height: 16),
                            Align(
                              alignment: Alignment.centerLeft,
                              child: OutlinedButton.icon(
                                onPressed: () {
                                  Navigator.of(context).push(
                                    MaterialPageRoute(
                                      builder: (context) =>
                                          const PlannerRequestPage(),
                                    ),
                                  );
                                },
                                icon: const Icon(Icons.send_rounded, size: 16),
                                label: const Text('Request Planner'),
                                style: _compactOutlinedButtonStyle(context),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Region Card
                Center(
                  child: ConstrainedBox(
                    constraints: BoxConstraints(maxWidth: maxWidth),
                    child: _buildElevatedCard(
                      child: Padding(
                        padding: EdgeInsets.all(
                          ResponsiveLayout.cardPadding(context),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _SectionTitle(
                              icon: Icons.location_on_rounded,
                              title: l10n.t('account.region'),
                            ),
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: AppTheme.primary.withValues(alpha: 0.03),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: AppTheme.primary.withValues(
                                    alpha: 0.15,
                                  ),
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
                                            fontSize: ResponsiveLayout
                                                .secondaryBodyFontSize(
                                              context,
                                            ),
                                            color: AppTheme.primary.withValues(
                                              alpha: 0.8,
                                            ),
                                            height: 1.4,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  LayoutBuilder(
                                    builder: (context, constraints) {
                                      final stackVertically =
                                          constraints.maxWidth < 430;
                                      final detectButton = Container(
                                        height: ResponsiveLayout
                                                .compactControlHeight(context) +
                                            4,
                                        width: ResponsiveLayout
                                                .compactControlHeight(context) +
                                            4,
                                        decoration: BoxDecoration(
                                          color: AppTheme.primary,
                                          borderRadius:
                                              BorderRadius.circular(14),
                                          boxShadow: [
                                            BoxShadow(
                                              color: AppTheme.primary
                                                  .withValues(alpha: 0.3),
                                              blurRadius: 8,
                                              offset: const Offset(0, 4),
                                            ),
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
                                                  child:
                                                      CircularProgressIndicator(
                                                    strokeWidth: 2.3,
                                                    color: Colors.white,
                                                  ),
                                                )
                                              : const Icon(
                                                  Icons.my_location_rounded,
                                                  color: Colors.white,
                                                ),
                                          tooltip: l10n.t(
                                            'account.detect_location',
                                          ),
                                        ),
                                      );

                                      if (stackVertically) {
                                        return Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.stretch,
                                          children: [
                                            _RegionDisplayField(
                                              label: l10n.t(
                                                'account.current_region',
                                              ),
                                              value: _regionController.text,
                                            ),
                                            const SizedBox(height: 12),
                                            Align(
                                              alignment: Alignment.centerLeft,
                                              child: detectButton,
                                            ),
                                          ],
                                        );
                                      }

                                      return Row(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.end,
                                        children: [
                                          Expanded(
                                            child: _RegionDisplayField(
                                              label: l10n.t(
                                                'account.current_region',
                                              ),
                                              value: _regionController.text,
                                            ),
                                          ),
                                          const SizedBox(width: 12),
                                          detectButton,
                                        ],
                                      );
                                    },
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Password Card
                Center(
                  child: ConstrainedBox(
                    constraints: BoxConstraints(maxWidth: maxWidth),
                    child: _buildElevatedCard(
                      child: Padding(
                        padding: EdgeInsets.all(
                          ResponsiveLayout.cardPadding(context),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _SectionTitle(
                              icon: Icons.lock_outline_rounded,
                              title: l10n.t('login.password'),
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
                            const SizedBox(height: 14),
                            Align(
                              alignment: Alignment.centerLeft,
                              child: FilledButton.icon(
                                onPressed: busy ? null : _changePassword,
                                icon: busy
                                    ? const SizedBox(
                                        width: 16,
                                        height: 16,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                        ),
                                      )
                                    : const Icon(
                                        Icons.password_rounded,
                                        size: 16,
                                      ),
                                label: Text(l10n.t('account.change_password')),
                                style: _compactFilledButtonStyle(context),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Email Card
                Center(
                  child: ConstrainedBox(
                    constraints: BoxConstraints(maxWidth: maxWidth),
                    child: _buildElevatedCard(
                      child: Padding(
                        padding: EdgeInsets.all(
                          ResponsiveLayout.cardPadding(context),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _SectionTitle(
                              icon: Icons.alternate_email_rounded,
                              title: l10n.t('account.email'),
                            ),
                            const SizedBox(height: 12),
                            AppTextField(
                              controller: _newEmailController,
                              label: l10n.t('account.new_email'),
                              icon: Icons.mail_outline_rounded,
                              keyboardType: TextInputType.emailAddress,
                            ),
                            const SizedBox(height: 12),
                            Align(
                              alignment: Alignment.centerLeft,
                              child: OutlinedButton.icon(
                                onPressed: busy ? null : _requestEmailChange,
                                icon: const Icon(
                                  Icons.mark_email_read_outlined,
                                  size: 16,
                                ),
                                label: Text(l10n.t('account.send_code')),
                                style: _compactOutlinedButtonStyle(context),
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
                            const SizedBox(height: 14),
                            Align(
                              alignment: Alignment.centerLeft,
                              child: FilledButton.icon(
                                onPressed: busy ? null : _verifyEmailChange,
                                icon: busy
                                    ? const SizedBox(
                                        width: 16,
                                        height: 16,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                        ),
                                      )
                                    : const Icon(
                                        Icons.verified_rounded,
                                        size: 16,
                                      ),
                                label: Text(l10n.t('account.verify_email')),
                                style: _compactFilledButtonStyle(context),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Account Actions Card
                Center(
                  child: ConstrainedBox(
                    constraints: BoxConstraints(maxWidth: maxWidth),
                    child: _buildElevatedCard(
                      child: Padding(
                        padding: EdgeInsets.all(
                          ResponsiveLayout.cardPadding(context),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _SectionTitle(
                              icon: Icons.settings_rounded,
                              title: l10n.t('account.settings'),
                            ),
                            const SizedBox(height: 14),
                            Wrap(
                              spacing: 10,
                              runSpacing: 10,
                              children: [
                                OutlinedButton.icon(
                                  onPressed: () => _confirmLogout(context),
                                  icon: const Icon(
                                    Icons.logout_rounded,
                                    size: 16,
                                  ),
                                  label: Text(l10n.t('account.logout')),
                                  style: _compactOutlinedButtonStyle(context),
                                ),
                                OutlinedButton.icon(
                                  onPressed: busy
                                      ? null
                                      : () => context
                                          .read<ProfileCubit>()
                                          .exportUserData(),
                                  icon: const Icon(
                                    Icons.file_download_outlined,
                                    size: 16,
                                  ),
                                  label: Text(l10n.t('account.export_data')),
                                  style: _compactOutlinedButtonStyle(context),
                                ),
                                TextButton.icon(
                                  onPressed: busy
                                      ? null
                                      : () => _confirmDelete(context),
                                  icon: const Icon(
                                    Icons.delete_forever_rounded,
                                    size: 16,
                                  ),
                                  label: Text(
                                    l10n.t('account.delete_account'),
                                  ),
                                  style: _compactDangerButtonStyle(context),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
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
      decoration: AppTheme.elevatedCardDecoration(context),
      child: child,
    );
  }

  Widget _buildProfileSummaryCard(BuildContext context, UserProfile profile) {
    final muted = AppTheme.mutedTextFor(context);
    final bodySize = ResponsiveLayout.bodyFontSize(context);
    final secondarySize = ResponsiveLayout.secondaryBodyFontSize(context);
    final avatarSize = ResponsiveLayout.isTablet(context) ? 80.0 : 72.0;
    final isVerified = profile.verified;

    return Padding(
      padding: EdgeInsets.all(ResponsiveLayout.cardPadding(context) + 4),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final stackVertically = constraints.maxWidth < 360;
          final avatar = Container(
            width: avatarSize,
            height: avatarSize,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppTheme.primary.withValues(alpha: 0.18),
                  AppTheme.primary.withValues(alpha: 0.08),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Icon(
              Icons.person_rounded,
              color: AppTheme.primary,
              size: 34,
            ),
          );

          final details = Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                profile.email,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: bodySize + 4,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textFor(context),
                  height: 1.2,
                ),
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 10,
                runSpacing: 8,
                children: [
                  _ProfileMetaChip(
                    icon: Icons.location_on_rounded,
                    label: profile.region,
                    color: muted,
                  ),
                  _ProfileMetaChip(
                    icon: isVerified
                        ? Icons.verified_rounded
                        : Icons.pending_actions_rounded,
                    label: isVerified
                        ? AppLocalizations.of(context).t('account.verified')
                        : AppLocalizations.of(context).t('account.unverified'),
                    color: isVerified
                        ? Colors.blue.shade600
                        : Colors.orange.shade600,
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                'Citizen account',
                style: TextStyle(
                  color: muted,
                  fontSize: secondarySize,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          );

          if (stackVertically) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                avatar,
                const SizedBox(height: 16),
                details,
              ],
            );
          }

          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              avatar,
              const SizedBox(width: 20),
              Expanded(child: details),
            ],
          );
        },
      ),
    );
  }

  ButtonStyle _compactOutlinedButtonStyle(BuildContext context) {
    return OutlinedButton.styleFrom(
      foregroundColor: AppTheme.primary,
      side: BorderSide(color: AppTheme.primary.withValues(alpha: 0.3)),
      minimumSize: Size(0, ResponsiveLayout.compactControlHeight(context)),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      textStyle: TextStyle(
        fontWeight: FontWeight.w700,
        fontSize: ResponsiveLayout.bodyFontSize(context) - 1,
      ),
      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
    );
  }

  ButtonStyle _compactFilledButtonStyle(BuildContext context) {
    return FilledButton.styleFrom(
      backgroundColor: AppTheme.primary,
      foregroundColor: Colors.white,
      minimumSize: Size(0, ResponsiveLayout.compactControlHeight(context)),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      textStyle: TextStyle(
        fontWeight: FontWeight.w700,
        fontSize: ResponsiveLayout.bodyFontSize(context) - 1,
      ),
      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
    );
  }

  ButtonStyle _compactDangerButtonStyle(BuildContext context) {
    return TextButton.styleFrom(
      foregroundColor: Colors.redAccent,
      minimumSize: Size(0, ResponsiveLayout.compactControlHeight(context)),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      textStyle: TextStyle(
        fontWeight: FontWeight.w700,
        fontSize: ResponsiveLayout.bodyFontSize(context) - 1,
      ),
      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
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
          style: TextStyle(color: AppTheme.mutedTextFor(context)),
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
          style: TextStyle(color: AppTheme.mutedTextFor(context)),
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
          style: TextStyle(color: AppTheme.mutedTextFor(context), height: 1.4),
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
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w900,
                fontSize: ResponsiveLayout.sectionTitleSize(context),
              ),
        ),
      ],
    );
  }
}

class _ProfileMetaChip extends StatelessWidget {
  const _ProfileMetaChip({
    required this.icon,
    required this.label,
    required this.color,
  });

  final IconData icon;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 15, color: color),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              label,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.w700,
                fontSize: ResponsiveLayout.secondaryBodyFontSize(context),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ThemeChoiceButton extends StatelessWidget {
  const _ThemeChoiceButton({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: selected
                ? AppTheme.primary.withValues(alpha: 0.12)
                : Theme.of(context)
                    .colorScheme
                    .surfaceContainerHighest
                    .withValues(alpha: AppTheme.isDark(context) ? 0.45 : 0.75),
            borderRadius: BorderRadius.circular(999),
            border: Border.all(
              color: selected
                  ? AppTheme.primary.withValues(alpha: 0.24)
                  : AppTheme.borderFor(context),
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                selected ? Icons.check_rounded : icon,
                size: 18,
                color: selected
                    ? AppTheme.primary
                    : AppTheme.mutedTextFor(context),
              ),
              const SizedBox(width: 8),
              Text(
                label,
                style: TextStyle(
                  color:
                      selected ? AppTheme.primary : AppTheme.textFor(context),
                  fontWeight: FontWeight.w700,
                  fontSize: ResponsiveLayout.bodyFontSize(context) - 1,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RegionDisplayField extends StatelessWidget {
  const _RegionDisplayField({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final fieldColor = Theme.of(context).inputDecorationTheme.fillColor ??
        AppTheme.subtleFillFor(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 2, bottom: 8),
          child: Text(
            label,
            style: TextStyle(
              fontSize: ResponsiveLayout.secondaryBodyFontSize(context),
              color: AppTheme.mutedTextFor(context),
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
          decoration: BoxDecoration(
            color: fieldColor,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            children: [
              Icon(
                Icons.map_rounded,
                size: 20,
                color: AppTheme.mutedTextFor(context),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  value,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: AppTheme.textFor(context),
                    fontSize: ResponsiveLayout.bodyFontSize(context),
                    fontWeight: FontWeight.w600,
                    height: 1.2,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
