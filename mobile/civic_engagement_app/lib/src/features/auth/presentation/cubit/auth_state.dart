part of 'auth_cubit.dart';

enum AuthStatus {
  checking,
  unauthenticated,
  loading,
  authenticated,
  otpPending,
  message,
  failure,
}

class AuthState extends Equatable {
  const AuthState({
    required this.status,
    this.session,
    this.message,
    this.email,
  });

  const AuthState.checking() : this(status: AuthStatus.checking);

  const AuthState.unauthenticated() : this(status: AuthStatus.unauthenticated);

  const AuthState.loading() : this(status: AuthStatus.loading);

  const AuthState.authenticated(AuthSession session)
    : this(status: AuthStatus.authenticated, session: session);

  const AuthState.otpPending({required String email, required String message})
    : this(status: AuthStatus.otpPending, email: email, message: message);

  const AuthState.message(String message)
    : this(status: AuthStatus.message, message: message);

  const AuthState.failure(String message)
    : this(status: AuthStatus.failure, message: message);

  final AuthStatus status;
  final AuthSession? session;
  final String? message;
  final String? email;

  bool get isBusy => status == AuthStatus.loading;

  @override
  List<Object?> get props => [status, session, message, email];
}
