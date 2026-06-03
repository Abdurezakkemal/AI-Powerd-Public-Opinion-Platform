import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/localization/app_localizations.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_text_field.dart';
import '../../../../core/services/location_service.dart';
import '../../domain/entities/user_demographics.dart';
import '../cubit/auth_cubit.dart';

enum AuthScreen {
  login,
  register,
  forgotPassword,
  verifyOtp,
  createNewPassword
}

class AuthPage extends StatefulWidget {
  const AuthPage({
    this.initialRegister = false,
    this.onBack,
    super.key,
  });

  final bool initialRegister;
  final VoidCallback? onBack;

  @override
  State<AuthPage> createState() => _AuthPageState();
}

class _AuthPageState extends State<AuthPage> with WidgetsBindingObserver {
  late AuthScreen _currentScreen;

  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _phoneController = TextEditingController();
  final _regionController = TextEditingController();
  final _captchaController = TextEditingController();
  final _otpController = TextEditingController();
  final _resetTokenController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _locationService = LocationService();
  bool _isDetectingLocation = false;
  bool _hasRequestedInitialLocation = false;

  // Demographic fields
  String? _selectedAgeRange;
  String? _selectedGender;
  String? _selectedOccupation;
  String? _selectedEducation;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _currentScreen =
        widget.initialRegister ? AuthScreen.register : AuthScreen.login;
    if (_currentScreen == AuthScreen.register) {
      _hasRequestedInitialLocation = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _detectLocation();
      });
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _emailController.dispose();
    _passwordController.dispose();
    _phoneController.dispose();
    _regionController.dispose();
    _captchaController.dispose();
    _otpController.dispose();
    _resetTokenController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed &&
        _currentScreen == AuthScreen.register &&
        _regionController.text.trim().isEmpty) {
      _detectLocation();
    }
  }

  Future<void> _detectLocation() async {
    if (_isDetectingLocation) return;
    setState(() => _isDetectingLocation = true);
    final region = await _locationService.getCurrentRegion();
    if (region != null && mounted) {
      _regionController.text = region;
      final l10n = AppLocalizations.of(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${l10n.t('register.location_detected')}$region'),
          backgroundColor: Colors.green,
        ),
      );
    } else if (mounted) {
      _regionController.text = '';
      final l10n = AppLocalizations.of(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(l10n.t('register.location_enable')),
          backgroundColor: Colors.orange,
          duration: const Duration(seconds: 5),
        ),
      );
    }
    if (mounted) {
      setState(() => _isDetectingLocation = false);
    }
  }

  void _navigateToScreen(AuthScreen screen) {
    setState(() => _currentScreen = screen);
    if (screen == AuthScreen.register && !_hasRequestedInitialLocation) {
      _hasRequestedInitialLocation = true;
      _detectLocation();
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<AuthCubit, AuthState>(
      listener: (context, state) {
        if (state.status == AuthStatus.otpPending) {
          _emailController.text = state.email ?? _emailController.text;
          _navigateToScreen(AuthScreen.verifyOtp);
        }
        if (state.status == AuthStatus.passwordResetSuccess) {
          _resetTokenController.clear();
          _newPasswordController.clear();
          _confirmPasswordController.clear();
          _passwordController.clear();
          _navigateToScreen(AuthScreen.login);
        }
        if (state.message != null &&
            state.status != AuthStatus.authenticated &&
            state.status != AuthStatus.loading) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(state.message!)),
          );
        }
      },
      builder: (context, state) {
        return Scaffold(
          backgroundColor: AppTheme.background,
          body: SafeArea(
            child: Stack(
              children: [
                const _AuthBackdrop(),
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 400),
                  switchInCurve: Curves.easeOutCubic,
                  switchOutCurve: Curves.easeInCubic,
                  transitionBuilder: (child, animation) {
                    // Use slide transition for login/register/forgot password
                    // Use fade transition for OTP and create new password
                    if (_currentScreen == AuthScreen.verifyOtp ||
                        _currentScreen == AuthScreen.createNewPassword) {
                      return FadeTransition(
                        opacity: animation,
                        child: child,
                      );
                    }

                    return SlideTransition(
                      position: Tween<Offset>(
                        begin: const Offset(0.3, 0),
                        end: Offset.zero,
                      ).animate(animation),
                      child: FadeTransition(
                        opacity: animation,
                        child: child,
                      ),
                    );
                  },
                  child: _buildCurrentScreen(state),
                ),
                // Floating back button
                if (widget.onBack != null)
                  Positioned(
                    top: 16,
                    left: 16,
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.1),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: IconButton(
                        icon: const Icon(Icons.arrow_back_ios_new_rounded),
                        onPressed: widget.onBack,
                        color: AppTheme.text,
                        iconSize: 20,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildCurrentScreen(AuthState state) {
    switch (_currentScreen) {
      case AuthScreen.login:
        return LoginScreen(
          key: const ValueKey('login'),
          emailController: _emailController,
          passwordController: _passwordController,
          captchaController: _captchaController,
          loading: state.isBusy,
          onLogin: _login,
          onNavigateToRegister: () => _navigateToScreen(AuthScreen.register),
          onNavigateToForgotPassword: () =>
              _navigateToScreen(AuthScreen.forgotPassword),
          onBack: widget.onBack,
        );
      case AuthScreen.register:
        return RegisterScreen(
          key: const ValueKey('register'),
          emailController: _emailController,
          passwordController: _passwordController,
          phoneController: _phoneController,
          regionController: _regionController,
          captchaController: _captchaController,
          selectedAgeRange: _selectedAgeRange,
          selectedGender: _selectedGender,
          selectedOccupation: _selectedOccupation,
          selectedEducation: _selectedEducation,
          onAgeRangeChanged: (value) =>
              setState(() => _selectedAgeRange = value),
          onGenderChanged: (value) => setState(() => _selectedGender = value),
          onOccupationChanged: (value) =>
              setState(() => _selectedOccupation = value),
          onEducationChanged: (value) =>
              setState(() => _selectedEducation = value),
          loading: state.isBusy,
          isDetectingLocation: _isDetectingLocation,
          onRegister: _register,
          onNavigateToLogin: () => _navigateToScreen(AuthScreen.login),
          onBack: widget.onBack,
        );
      case AuthScreen.forgotPassword:
        return ForgotPasswordScreen(
          key: const ValueKey('forgotPassword'),
          emailController: _emailController,
          loading: state.isBusy,
          onContinue: _forgotPassword,
          onBack: () => _navigateToScreen(AuthScreen.login),
        );
      case AuthScreen.verifyOtp:
        return VerifyOtpScreen(
          key: const ValueKey('verifyOtp'),
          emailController: _emailController,
          otpController: _otpController,
          loading: state.isBusy,
          onVerify: _verifyOtp,
          onResend: _sendOtp,
          onBack: () => _navigateToScreen(AuthScreen.register),
        );
      case AuthScreen.createNewPassword:
        return CreateNewPasswordScreen(
          key: const ValueKey('createNewPassword'),
          tokenController: _resetTokenController,
          newPasswordController: _newPasswordController,
          confirmPasswordController: _confirmPasswordController,
          loading: state.isBusy,
          onContinue: _resetPassword,
          onBack: () => _navigateToScreen(AuthScreen.forgotPassword),
        );
    }
  }

  void _login() {
    final l10n = AppLocalizations.of(context);
    if (!_ensure(_emailController, l10n.t('login.email_required')) ||
        !_ensure(_passwordController, l10n.t('login.password_required'))) {
      return;
    }
    context.read<AuthCubit>().login(
          email: _emailController.text,
          password: _passwordController.text,
        );
  }

  void _register() {
    final l10n = AppLocalizations.of(context);
    if (!_ensure(_emailController, l10n.t('register.email_required')) ||
        !_ensure(_passwordController, l10n.t('register.password_required')) ||
        !_ensure(_phoneController, l10n.t('register.phone_required'))) {
      return;
    }

    if (_regionController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(l10n.t('register.location_required')),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 4),
        ),
      );
      return;
    }

    if (_selectedAgeRange == null) {
      _showError(l10n.t('register.age_required'));
      return;
    }
    if (_selectedGender == null) {
      _showError(l10n.t('register.gender_required'));
      return;
    }
    if (_selectedOccupation == null) {
      _showError(l10n.t('register.occupation_required'));
      return;
    }
    if (_selectedEducation == null) {
      _showError(l10n.t('register.education_required'));
      return;
    }

    context.read<AuthCubit>().register(
          email: _emailController.text,
          password: _passwordController.text,
          phone: _phoneController.text,
          region: _regionController.text,
          demographics: UserDemographics(
            ageRange: _selectedAgeRange!,
            gender: _selectedGender!,
            occupation: _selectedOccupation!,
            education: _selectedEducation!,
          ),
        );
  }

  void _verifyOtp() {
    final l10n = AppLocalizations.of(context);
    if (!_ensure(_emailController, l10n.t('verify.email_required')) ||
        !_ensure(_otpController, l10n.t('verify.otp_required'))) {
      return;
    }
    context.read<AuthCubit>().verifyOtp(
          email: _emailController.text,
          code: _otpController.text,
        );
  }

  void _sendOtp() {
    final l10n = AppLocalizations.of(context);
    if (!_ensure(_emailController, l10n.t('verify.email_required'))) return;
    context.read<AuthCubit>().sendOtp(_emailController.text);
  }

  void _forgotPassword() {
    final l10n = AppLocalizations.of(context);
    if (!_ensure(_emailController, l10n.t('reset.email_required'))) return;
    context.read<AuthCubit>().forgotPassword(_emailController.text);
    // Navigate to create new password screen after requesting reset
    _navigateToScreen(AuthScreen.createNewPassword);
  }

  void _resetPassword() {
    final l10n = AppLocalizations.of(context);
    if (!_ensure(_resetTokenController, l10n.t('reset.token_required')) ||
        !_ensure(_newPasswordController, l10n.t('reset.password_required'))) {
      return;
    }

    if (_newPasswordController.text != _confirmPasswordController.text) {
      _showError('Passwords do not match');
      return;
    }

    context.read<AuthCubit>().resetPassword(
          token: _resetTokenController.text,
          newPassword: _newPasswordController.text,
        );
  }

  bool _ensure(TextEditingController controller, String message) {
    if (controller.text.trim().isNotEmpty) return true;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
    return false;
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }
}

class _AuthBackdrop extends StatelessWidget {
  const _AuthBackdrop();

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Positioned(
          top: -120,
          right: -140,
          child: Container(
            width: 320,
            height: 320,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppTheme.primary.withValues(alpha: 0.08),
            ),
          ),
        ),
        Positioned(
          bottom: -150,
          left: -120,
          child: Container(
            width: 360,
            height: 360,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFF2F80ED).withValues(alpha: 0.06),
            ),
          ),
        ),
      ],
    );
  }
}

// Auth Screen Container Widget
class _AuthScreenContainer extends StatelessWidget {
  const _AuthScreenContainer({
    required this.child,
    this.onBack,
  });

  final Widget child;
  final VoidCallback? onBack;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 72, 20, 28),
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: constraints.maxHeight - 100),
            child: Center(
              child: Container(
                width: double.infinity,
                constraints: const BoxConstraints(maxWidth: double.infinity),
                padding: const EdgeInsets.fromLTRB(22, 26, 22, 26),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(28),
                  border: Border.all(color: Colors.white, width: 1),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.07),
                      blurRadius: 26,
                      offset: const Offset(0, 14),
                    ),
                    BoxShadow(
                      color: AppTheme.primary.withValues(alpha: 0.05),
                      blurRadius: 42,
                      offset: const Offset(0, 22),
                    ),
                  ],
                ),
                child: child,
              ),
            ),
          ),
        );
      },
    );
  }
}

// Auth Logo Widget
class _AuthLogo extends StatelessWidget {
  const _AuthLogo();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        width: 80,
        height: 80,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: AppTheme.primary.withValues(alpha: 0.25),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: Image.asset('assets/logo.png', fit: BoxFit.cover),
        ),
      ),
    );
  }
}

// Login Screen Widget
class LoginScreen extends StatelessWidget {
  const LoginScreen({
    required this.emailController,
    required this.passwordController,
    required this.captchaController,
    required this.loading,
    required this.onLogin,
    required this.onNavigateToRegister,
    required this.onNavigateToForgotPassword,
    this.onBack,
    super.key,
  });

  final TextEditingController emailController;
  final TextEditingController passwordController;
  final TextEditingController captchaController;
  final bool loading;
  final VoidCallback onLogin;
  final VoidCallback onNavigateToRegister;
  final VoidCallback onNavigateToForgotPassword;
  final VoidCallback? onBack;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return _AuthScreenContainer(
      onBack: onBack,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 20),
          const _AuthLogo(),
          const SizedBox(height: 24),
          Text(
            l10n.t('auth.app_name'),
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w900,
              color: AppTheme.text,
              letterSpacing: 0,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            l10n.t('auth.tagline'),
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: AppTheme.mutedText,
              fontSize: 15,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 32),
          Text(
            l10n.t('auth.login'),
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w800,
              color: AppTheme.text,
              letterSpacing: 0,
            ),
          ),
          const SizedBox(height: 24),
          AppTextField(
            controller: emailController,
            label: l10n.t('login.email'),
            icon: Icons.mail_outline_rounded,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 16),
          AppTextField(
            controller: passwordController,
            label: l10n.t('login.password'),
            icon: Icons.lock_outline_rounded,
            obscureText: true,
            textInputAction: TextInputAction.done,
          ),
          const SizedBox(height: 12),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: onNavigateToForgotPassword,
              child: Text(
                l10n.t('auth.forgot_password'),
                style: const TextStyle(
                  color: AppTheme.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
          const SizedBox(height: 24),
          AppButton(
            label: l10n.t('login.button'),
            icon: Icons.login_rounded,
            loading: loading,
            onPressed: onLogin,
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                l10n.t('auth.no_account'),
                style: const TextStyle(color: AppTheme.mutedText),
              ),
              TextButton(
                onPressed: onNavigateToRegister,
                child: Text(
                  l10n.t('auth.register'),
                  style: const TextStyle(
                    color: AppTheme.primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// Register Screen Widget
class RegisterScreen extends StatelessWidget {
  const RegisterScreen({
    required this.emailController,
    required this.passwordController,
    required this.phoneController,
    required this.regionController,
    required this.captchaController,
    required this.selectedAgeRange,
    required this.selectedGender,
    required this.selectedOccupation,
    required this.selectedEducation,
    required this.onAgeRangeChanged,
    required this.onGenderChanged,
    required this.onOccupationChanged,
    required this.onEducationChanged,
    required this.loading,
    required this.isDetectingLocation,
    required this.onRegister,
    required this.onNavigateToLogin,
    this.onBack,
    super.key,
  });

  final TextEditingController emailController;
  final TextEditingController passwordController;
  final TextEditingController phoneController;
  final TextEditingController regionController;
  final TextEditingController captchaController;
  final String? selectedAgeRange;
  final String? selectedGender;
  final String? selectedOccupation;
  final String? selectedEducation;
  final ValueChanged<String?> onAgeRangeChanged;
  final ValueChanged<String?> onGenderChanged;
  final ValueChanged<String?> onOccupationChanged;
  final ValueChanged<String?> onEducationChanged;
  final bool loading;
  final bool isDetectingLocation;
  final VoidCallback onRegister;
  final VoidCallback onNavigateToLogin;
  final VoidCallback? onBack;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return _AuthScreenContainer(
      onBack: onBack,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 20),
          const _AuthLogo(),
          const SizedBox(height: 24),
          Text(
            l10n.t('auth.register'),
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w800,
              color: AppTheme.text,
              letterSpacing: 0,
            ),
          ),
          const SizedBox(height: 24),
          AppTextField(
            controller: emailController,
            label: l10n.t('register.email'),
            icon: Icons.mail_outline_rounded,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 16),
          AppTextField(
            controller: passwordController,
            label: l10n.t('register.password'),
            icon: Icons.lock_outline_rounded,
            obscureText: true,
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 16),
          AppTextField(
            controller: phoneController,
            label: l10n.t('register.phone'),
            hint: l10n.t('register.phone_hint'),
            icon: Icons.phone_iphone_rounded,
            keyboardType: TextInputType.phone,
            textInputAction: TextInputAction.done,
          ),
          const SizedBox(height: 16),
          // Location Section
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.primary.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: AppTheme.primary.withValues(alpha: 0.2),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(
                      Icons.location_on,
                      color: AppTheme.primary,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      l10n.t('register.location_title'),
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AppTheme.primary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  isDetectingLocation
                      ? l10n.t('register.location_detecting')
                      : l10n.t('register.location_info'),
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppTheme.mutedText,
                  ),
                ),
                const SizedBox(height: 12),
                Stack(
                  alignment: Alignment.centerRight,
                  children: [
                    AppTextField(
                      controller: regionController,
                      label: l10n.t('register.region'),
                      icon: Icons.map_outlined,
                      readOnly: true,
                    ),
                    if (isDetectingLocation)
                      const Padding(
                        padding: EdgeInsets.only(right: 14),
                        child: SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: AppTheme.primary,
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Demographics Section
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.blue.shade200),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.person_outline,
                        color: Colors.blue.shade700, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      l10n.t('register.demographics_title'),
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.blue.shade700,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  l10n.t('register.demographics_info'),
                  style:
                      const TextStyle(fontSize: 12, color: AppTheme.mutedText),
                ),
                const SizedBox(height: 12),
                _DemographicDropdown(
                  label: l10n.t('register.age_range'),
                  icon: Icons.cake_outlined,
                  value: selectedAgeRange,
                  items: AgeRange.all,
                  getLabel: AgeRange.getLabel,
                  onChanged: onAgeRangeChanged,
                ),
                const SizedBox(height: 12),
                _DemographicDropdown(
                  label: l10n.t('register.gender'),
                  icon: Icons.wc_outlined,
                  value: selectedGender,
                  items: Gender.all,
                  getLabel: Gender.getLabel,
                  onChanged: onGenderChanged,
                ),
                const SizedBox(height: 12),
                _DemographicDropdown(
                  label: l10n.t('register.occupation'),
                  icon: Icons.work_outline,
                  value: selectedOccupation,
                  items: Occupation.all,
                  getLabel: Occupation.getLabel,
                  onChanged: onOccupationChanged,
                ),
                const SizedBox(height: 12),
                _DemographicDropdown(
                  label: l10n.t('register.education'),
                  icon: Icons.school_outlined,
                  value: selectedEducation,
                  items: Education.all,
                  getLabel: Education.getLabel,
                  onChanged: onEducationChanged,
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          AppButton(
            label: l10n.t('register.button'),
            icon: Icons.person_add_alt_1_rounded,
            loading: loading,
            onPressed: onRegister,
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                l10n.t('auth.have_account'),
                style: const TextStyle(color: AppTheme.mutedText),
              ),
              TextButton(
                onPressed: onNavigateToLogin,
                child: Text(
                  l10n.t('auth.login'),
                  style: const TextStyle(
                    color: AppTheme.primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// Forgot Password Screen Widget
class ForgotPasswordScreen extends StatelessWidget {
  const ForgotPasswordScreen({
    required this.emailController,
    required this.loading,
    required this.onContinue,
    required this.onBack,
    super.key,
  });

  final TextEditingController emailController;
  final bool loading;
  final VoidCallback onContinue;
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return _AuthScreenContainer(
      onBack: onBack,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 20),
          Center(
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppTheme.primary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.lock_reset_rounded,
                size: 40,
                color: AppTheme.primary,
              ),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            l10n.t('auth.forgot_password'),
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w800,
              color: AppTheme.text,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            l10n.t('reset.description'),
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: AppTheme.mutedText,
              fontSize: 15,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 32),
          AppTextField(
            controller: emailController,
            label: l10n.t('reset.email'),
            icon: Icons.mail_outline_rounded,
            keyboardType: TextInputType.emailAddress,
          ),
          const SizedBox(height: 24),
          AppButton(
            label: l10n.t('reset.request_button'),
            icon: Icons.send_rounded,
            loading: loading,
            onPressed: onContinue,
          ),
        ],
      ),
    );
  }
}

// Verify OTP Screen Widget
class VerifyOtpScreen extends StatelessWidget {
  const VerifyOtpScreen({
    required this.emailController,
    required this.otpController,
    required this.loading,
    required this.onVerify,
    required this.onResend,
    required this.onBack,
    super.key,
  });

  final TextEditingController emailController;
  final TextEditingController otpController;
  final bool loading;
  final VoidCallback onVerify;
  final VoidCallback onResend;
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return _AuthScreenContainer(
      onBack: onBack,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 20),
          Center(
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppTheme.primary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.verified_user_outlined,
                size: 40,
                color: AppTheme.primary,
              ),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            l10n.t('verify.title'),
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w800,
              color: AppTheme.text,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            l10n.t('verify.description'),
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: AppTheme.mutedText,
              fontSize: 15,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 32),
          AppTextField(
            controller: emailController,
            label: l10n.t('verify.email'),
            icon: Icons.mail_outline_rounded,
            keyboardType: TextInputType.emailAddress,
            readOnly: true,
          ),
          const SizedBox(height: 16),
          AppTextField(
            controller: otpController,
            label: l10n.t('verify.otp'),
            icon: Icons.pin_outlined,
            keyboardType: TextInputType.number,
            maxLength: 6,
          ),
          const SizedBox(height: 24),
          AppButton(
            label: l10n.t('verify.button'),
            icon: Icons.check_circle_outline_rounded,
            loading: loading,
            onPressed: onVerify,
          ),
          const SizedBox(height: 16),
          Center(
            child: TextButton.icon(
              onPressed: loading ? null : onResend,
              icon: const Icon(Icons.refresh_rounded),
              label: Text(l10n.t('verify.resend')),
            ),
          ),
        ],
      ),
    );
  }
}

// Create New Password Screen Widget
class CreateNewPasswordScreen extends StatelessWidget {
  const CreateNewPasswordScreen({
    required this.tokenController,
    required this.newPasswordController,
    required this.confirmPasswordController,
    required this.loading,
    required this.onContinue,
    required this.onBack,
    super.key,
  });

  final TextEditingController tokenController;
  final TextEditingController newPasswordController;
  final TextEditingController confirmPasswordController;
  final bool loading;
  final VoidCallback onContinue;
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return _AuthScreenContainer(
      onBack: onBack,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 20),
          Center(
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppTheme.primary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.lock_open_rounded,
                size: 40,
                color: AppTheme.primary,
              ),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            l10n.t('reset.create_password'),
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w800,
              color: AppTheme.text,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            l10n.t('reset.create_description'),
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: AppTheme.mutedText,
              fontSize: 15,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 32),
          AppTextField(
            controller: tokenController,
            label: l10n.t('reset.token'),
            icon: Icons.key_rounded,
          ),
          const SizedBox(height: 16),
          AppTextField(
            controller: newPasswordController,
            label: l10n.t('reset.new_password'),
            icon: Icons.lock_reset_rounded,
            obscureText: true,
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 16),
          AppTextField(
            controller: confirmPasswordController,
            label: l10n.t('reset.confirm_password'),
            icon: Icons.lock_outline_rounded,
            obscureText: true,
          ),
          const SizedBox(height: 24),
          AppButton(
            label: l10n.t('reset.button'),
            icon: Icons.save_rounded,
            loading: loading,
            onPressed: onContinue,
          ),
        ],
      ),
    );
  }
}

// Demographic Dropdown Widget
class _DemographicDropdown extends StatelessWidget {
  const _DemographicDropdown({
    required this.label,
    required this.icon,
    required this.value,
    required this.items,
    required this.getLabel,
    required this.onChanged,
  });

  final String label;
  final IconData icon;
  final String? value;
  final List<String> items;
  final String Function(String) getLabel;
  final ValueChanged<String?> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5EDF3)),
      ),
      child: DropdownButtonFormField<String>(
        value: value,
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: Icon(icon, color: AppTheme.primary),
          border: InputBorder.none,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        ),
        items: items.map((item) {
          return DropdownMenuItem(
            value: item,
            child: Text(getLabel(item)),
          );
        }).toList(),
        onChanged: onChanged,
        dropdownColor: Colors.white,
        style: const TextStyle(color: AppTheme.text, fontSize: 16),
      ),
    );
  }
}
