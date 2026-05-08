import '../entities/auth_session.dart';
import '../entities/registration_result.dart';

abstract class AuthRepository {
  AuthSession? restoreSession();

  Future<RegistrationResult> register({
    required String email,
    required String password,
    required String phone,
    required String region,
  });

  Future<String> sendOtp(String email);

  Future<AuthSession> verifyOtp({required String email, required String code});

  Future<AuthSession> login({required String email, required String password});

  Future<String> forgotPassword(String email);

  Future<String> resetPassword({
    required String token,
    required String newPassword,
  });

  Future<void> logout();
}
