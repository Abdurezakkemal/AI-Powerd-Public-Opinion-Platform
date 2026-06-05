import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import '../core/di/service_locator.dart';
import '../core/localization/app_localizations.dart';
import '../core/localization/fallback_localization_delegates.dart';
import '../core/settings/app_settings_controller.dart';
import '../core/settings/app_settings_scope.dart';
import '../core/theme/app_theme.dart';
import '../features/auth/presentation/cubit/auth_cubit.dart';
import '../features/auth/presentation/pages/auth_page.dart';
import '../features/auth/presentation/pages/landing_page.dart';
import '../features/citizen/presentation/cubit/history_cubit.dart';
import '../features/citizen/presentation/cubit/notifications_cubit.dart';
import '../features/citizen/presentation/cubit/policy_cubit.dart';
import '../features/citizen/presentation/cubit/profile_cubit.dart';
import '../features/citizen/presentation/cubit/vote_cubit.dart';
import '../features/citizen/presentation/pages/citizen_home_shell.dart';

class CivicApp extends StatelessWidget {
  const CivicApp({super.key});

  @override
  Widget build(BuildContext context) {
    final settings = serviceLocator<AppSettingsController>();

    return AppSettingsScope(
      controller: settings,
      child: AnimatedBuilder(
        animation: settings,
        builder: (context, _) => BlocProvider(
          create: (_) => serviceLocator<AuthCubit>()..restoreSession(),
          child: MaterialApp(
            title: 'Civic Voice',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.light(),
            darkTheme: AppTheme.dark(),
            themeMode: settings.themeMode,
            locale: settings.locale,
            builder: (context, child) {
              final mediaQuery = MediaQuery.of(context);
              return MediaQuery(
                data: mediaQuery.copyWith(
                  textScaler: mediaQuery.textScaler.clamp(
                    minScaleFactor: 0.95,
                    maxScaleFactor: 1.15,
                  ),
                ),
                child: child ?? const SizedBox.shrink(),
              );
            },
            supportedLocales: AppLocalizations.supportedLocales,
            localizationsDelegates: const [
              AppLocalizations.delegate,
              FallbackMaterialLocalizationsDelegate(),
              FallbackWidgetsLocalizationsDelegate(),
              FallbackCupertinoLocalizationsDelegate(),
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            home: BlocBuilder<AuthCubit, AuthState>(
              builder: (context, state) {
                if (state.status == AuthStatus.checking) {
                  return const _SplashScreen();
                }

                if (state.status == AuthStatus.authenticated) {
                  return MultiBlocProvider(
                    providers: [
                      BlocProvider(
                        create: (_) =>
                            serviceLocator<ProfileCubit>()..loadProfile(),
                      ),
                      BlocProvider(
                        create: (_) =>
                            serviceLocator<PolicyCubit>()..loadPolicies(),
                      ),
                      BlocProvider(
                        create: (_) =>
                            serviceLocator<HistoryCubit>()..loadHistory(),
                      ),
                      BlocProvider(
                        create: (_) {
                          return serviceLocator<NotificationsCubit>()
                            ..loadNotifications();
                        },
                      ),
                      BlocProvider(create: (_) => serviceLocator<VoteCubit>()),
                    ],
                    child: const CitizenHomeShell(),
                  );
                }

                return const _UnauthenticatedShell();
              },
            ),
          ),
        ),
      ),
    );
  }
}

class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: CircularProgressIndicator()));
  }
}

class _UnauthenticatedShell extends StatefulWidget {
  const _UnauthenticatedShell();

  @override
  State<_UnauthenticatedShell> createState() => _UnauthenticatedShellState();
}

class _UnauthenticatedShellState extends State<_UnauthenticatedShell> {
  bool _showLanding = true;
  bool _initialRegister = false;

  @override
  Widget build(BuildContext context) {
    if (_showLanding) {
      return LandingPage(
        onLogin: () => setState(() {
          _showLanding = false;
          _initialRegister = false;
        }),
        onRegister: () => setState(() {
          _showLanding = false;
          _initialRegister = true;
        }),
      );
    }
    return AuthPage(
      initialRegister: _initialRegister,
      onBack: () => setState(() => _showLanding = true),
    );
  }
}
