import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/app_text_field.dart';
import '../cubit/auth_cubit.dart';

enum _AuthMode { login, register, verify, reset }

class AuthPage extends StatefulWidget {
  const AuthPage({super.key});

  @override
  State<AuthPage> createState() => _AuthPageState();
}

class _AuthPageState extends State<AuthPage> {
  _AuthMode _mode = _AuthMode.login;

  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _phoneController = TextEditingController();
  final _regionController = TextEditingController(text: 'Addis Ababa');
  final _otpController = TextEditingController();
  final _resetTokenController = TextEditingController();
  final _newPasswordController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _phoneController.dispose();
    _regionController.dispose();
    _otpController.dispose();
    _resetTokenController.dispose();
    _newPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<AuthCubit, AuthState>(
      listener: (context, state) {
        if (state.status == AuthStatus.otpPending) {
          _emailController.text = state.email ?? _emailController.text;
          setState(() => _mode = _AuthMode.verify);
        }
        if (state.message != null &&
            state.status != AuthStatus.authenticated &&
            state.status != AuthStatus.loading) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text(state.message!)));
        }
      },
      builder: (context, state) {
        return Scaffold(
          body: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 22, 20, 28),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const _AuthHeader(),
                  const SizedBox(height: 26),
                  _ModeSelector(
                    mode: _mode,
                    onChanged: (mode) => setState(() => _mode = mode),
                  ),
                  const SizedBox(height: 16),
                  AppCard(
                    margin: EdgeInsets.zero,
                    padding: const EdgeInsets.all(18),
                    child: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 180),
                      child: switch (_mode) {
                        _AuthMode.login => _LoginForm(
                          key: const ValueKey('login'),
                          emailController: _emailController,
                          passwordController: _passwordController,
                          loading: state.isBusy,
                          onSubmit: _login,
                        ),
                        _AuthMode.register => _RegisterForm(
                          key: const ValueKey('register'),
                          emailController: _emailController,
                          passwordController: _passwordController,
                          phoneController: _phoneController,
                          regionController: _regionController,
                          loading: state.isBusy,
                          onSubmit: _register,
                        ),
                        _AuthMode.verify => _VerifyForm(
                          key: const ValueKey('verify'),
                          emailController: _emailController,
                          otpController: _otpController,
                          loading: state.isBusy,
                          onVerify: _verifyOtp,
                          onResend: _sendOtp,
                        ),
                        _AuthMode.reset => _ResetForm(
                          key: const ValueKey('reset'),
                          emailController: _emailController,
                          tokenController: _resetTokenController,
                          newPasswordController: _newPasswordController,
                          loading: state.isBusy,
                          onRequest: _forgotPassword,
                          onReset: _resetPassword,
                        ),
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  void _login() {
    if (!_ensure(_emailController, 'Email is required') ||
        !_ensure(_passwordController, 'Password is required')) {
      return;
    }
    context.read<AuthCubit>().login(
      email: _emailController.text,
      password: _passwordController.text,
    );
  }

  void _register() {
    if (!_ensure(_emailController, 'Email is required') ||
        !_ensure(_passwordController, 'Password is required') ||
        !_ensure(_phoneController, 'Phone is required') ||
        !_ensure(_regionController, 'Region is required')) {
      return;
    }
    context.read<AuthCubit>().register(
      email: _emailController.text,
      password: _passwordController.text,
      phone: _phoneController.text,
      region: _regionController.text,
    );
  }

  void _verifyOtp() {
    if (!_ensure(_emailController, 'Email is required') ||
        !_ensure(_otpController, 'OTP code is required')) {
      return;
    }
    context.read<AuthCubit>().verifyOtp(
      email: _emailController.text,
      code: _otpController.text,
    );
  }

  void _sendOtp() {
    if (!_ensure(_emailController, 'Email is required')) return;
    context.read<AuthCubit>().sendOtp(_emailController.text);
  }

  void _forgotPassword() {
    if (!_ensure(_emailController, 'Email is required')) return;
    context.read<AuthCubit>().forgotPassword(_emailController.text);
  }

  void _resetPassword() {
    if (!_ensure(_resetTokenController, 'Reset token is required') ||
        !_ensure(_newPasswordController, 'New password is required')) {
      return;
    }
    context.read<AuthCubit>().resetPassword(
      token: _resetTokenController.text,
      newPassword: _newPasswordController.text,
    );
  }

  bool _ensure(TextEditingController controller, String message) {
    if (controller.text.trim().isNotEmpty) return true;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
    return false;
  }
}

class _AuthHeader extends StatelessWidget {
  const _AuthHeader();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 54,
          height: 54,
          decoration: BoxDecoration(
            color: AppTheme.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Icon(Icons.how_to_vote_rounded, color: AppTheme.primary),
        ),
        const SizedBox(height: 18),
        Text(
          'Civic Voice',
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
            fontWeight: FontWeight.w900,
            color: AppTheme.text,
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'Review active public policies, vote once, and track your feedback.',
          style: TextStyle(color: AppTheme.mutedText, fontSize: 15),
        ),
      ],
    );
  }
}

class _ModeSelector extends StatelessWidget {
  const _ModeSelector({required this.mode, required this.onChanged});

  final _AuthMode mode;
  final ValueChanged<_AuthMode> onChanged;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        _chip('Login', _AuthMode.login),
        _chip('Register', _AuthMode.register),
        _chip('Verify OTP', _AuthMode.verify),
        _chip('Reset', _AuthMode.reset),
      ],
    );
  }

  Widget _chip(String label, _AuthMode value) {
    final selected = mode == value;
    return ChoiceChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onChanged(value),
      selectedColor: AppTheme.primary.withValues(alpha: 0.14),
      labelStyle: TextStyle(
        color: selected ? AppTheme.primary : AppTheme.mutedText,
        fontWeight: FontWeight.w800,
      ),
      side: BorderSide(
        color: selected ? AppTheme.primary : const Color(0xFFE5EDF3),
      ),
      showCheckmark: false,
    );
  }
}

class _LoginForm extends StatelessWidget {
  const _LoginForm({
    required this.emailController,
    required this.passwordController,
    required this.loading,
    required this.onSubmit,
    super.key,
  });

  final TextEditingController emailController;
  final TextEditingController passwordController;
  final bool loading;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    return Column(
      key: key,
      children: [
        AppTextField(
          controller: emailController,
          label: 'Email',
          icon: Icons.mail_outline_rounded,
          keyboardType: TextInputType.emailAddress,
          textInputAction: TextInputAction.next,
        ),
        const SizedBox(height: 12),
        AppTextField(
          controller: passwordController,
          label: 'Password',
          icon: Icons.lock_outline_rounded,
          obscureText: true,
        ),
        const SizedBox(height: 18),
        AppButton(
          label: 'Login',
          icon: Icons.login_rounded,
          loading: loading,
          onPressed: onSubmit,
        ),
      ],
    );
  }
}

class _RegisterForm extends StatelessWidget {
  const _RegisterForm({
    required this.emailController,
    required this.passwordController,
    required this.phoneController,
    required this.regionController,
    required this.loading,
    required this.onSubmit,
    super.key,
  });

  final TextEditingController emailController;
  final TextEditingController passwordController;
  final TextEditingController phoneController;
  final TextEditingController regionController;
  final bool loading;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    return Column(
      key: key,
      children: [
        AppTextField(
          controller: emailController,
          label: 'Email',
          icon: Icons.mail_outline_rounded,
          keyboardType: TextInputType.emailAddress,
        ),
        const SizedBox(height: 12),
        AppTextField(
          controller: passwordController,
          label: 'Password',
          icon: Icons.lock_outline_rounded,
          obscureText: true,
        ),
        const SizedBox(height: 12),
        AppTextField(
          controller: phoneController,
          label: 'Phone',
          hint: '+251912345678',
          icon: Icons.phone_iphone_rounded,
          keyboardType: TextInputType.phone,
        ),
        const SizedBox(height: 12),
        AppTextField(
          controller: regionController,
          label: 'Region',
          icon: Icons.location_on_outlined,
        ),
        const SizedBox(height: 18),
        AppButton(
          label: 'Create account',
          icon: Icons.person_add_alt_1_rounded,
          loading: loading,
          onPressed: onSubmit,
        ),
      ],
    );
  }
}

class _VerifyForm extends StatelessWidget {
  const _VerifyForm({
    required this.emailController,
    required this.otpController,
    required this.loading,
    required this.onVerify,
    required this.onResend,
    super.key,
  });

  final TextEditingController emailController;
  final TextEditingController otpController;
  final bool loading;
  final VoidCallback onVerify;
  final VoidCallback onResend;

  @override
  Widget build(BuildContext context) {
    return Column(
      key: key,
      children: [
        AppTextField(
          controller: emailController,
          label: 'Email',
          icon: Icons.mail_outline_rounded,
          keyboardType: TextInputType.emailAddress,
        ),
        const SizedBox(height: 12),
        AppTextField(
          controller: otpController,
          label: '6-digit OTP',
          icon: Icons.pin_outlined,
          keyboardType: TextInputType.number,
          maxLength: 6,
        ),
        const SizedBox(height: 12),
        AppButton(
          label: 'Verify and continue',
          icon: Icons.verified_user_outlined,
          loading: loading,
          onPressed: onVerify,
        ),
        const SizedBox(height: 8),
        TextButton.icon(
          onPressed: loading ? null : onResend,
          icon: const Icon(Icons.refresh_rounded),
          label: const Text('Send OTP again'),
        ),
      ],
    );
  }
}

class _ResetForm extends StatelessWidget {
  const _ResetForm({
    required this.emailController,
    required this.tokenController,
    required this.newPasswordController,
    required this.loading,
    required this.onRequest,
    required this.onReset,
    super.key,
  });

  final TextEditingController emailController;
  final TextEditingController tokenController;
  final TextEditingController newPasswordController;
  final bool loading;
  final VoidCallback onRequest;
  final VoidCallback onReset;

  @override
  Widget build(BuildContext context) {
    return Column(
      key: key,
      children: [
        AppTextField(
          controller: emailController,
          label: 'Email',
          icon: Icons.mail_outline_rounded,
          keyboardType: TextInputType.emailAddress,
        ),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: loading ? null : onRequest,
          icon: const Icon(Icons.mark_email_read_outlined),
          label: const Text('Request reset email'),
        ),
        const SizedBox(height: 16),
        AppTextField(
          controller: tokenController,
          label: 'Reset token',
          icon: Icons.key_rounded,
        ),
        const SizedBox(height: 12),
        AppTextField(
          controller: newPasswordController,
          label: 'New password',
          icon: Icons.lock_reset_rounded,
          obscureText: true,
        ),
        const SizedBox(height: 18),
        AppButton(
          label: 'Reset password',
          icon: Icons.save_rounded,
          loading: loading,
          onPressed: onReset,
        ),
      ],
    );
  }
}
