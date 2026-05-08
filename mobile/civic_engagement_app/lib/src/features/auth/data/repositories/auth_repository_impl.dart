import '../../../../core/error/api_exception.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/session/session_store.dart';
import '../../domain/entities/auth_session.dart';
import '../../domain/entities/registration_result.dart';
import '../../domain/repositories/auth_repository.dart';

class AuthRepositoryImpl implements AuthRepository {
  AuthRepositoryImpl(this._apiClient, this._sessionStore);

  final ApiClient _apiClient;
  final SessionStore _sessionStore;

  @override
  AuthSession? restoreSession() => _sessionStore.restore();

  @override
  Future<RegistrationResult> register({
    required String email,
    required String password,
    required String phone,
    required String region,
  }) async {
    final response = await _apiClient.post(
      '/auth/register',
      authenticated: false,
      body: {
        'email': email.trim(),
        'password': password,
        'phone': phone.trim(),
        'region': region.trim(),
      },
    );
    final data = response.data as Map<String, dynamic>? ?? {};
    return RegistrationResult(
      userId: data['userId']?.toString() ?? '',
      message: response.message,
    );
  }

  @override
  Future<String> sendOtp(String email) async {
    final response = await _apiClient.post(
      '/auth/send-otp',
      authenticated: false,
      body: {'email': email.trim()},
    );
    return response.message;
  }

  @override
  Future<AuthSession> verifyOtp({
    required String email,
    required String code,
  }) async {
    final response = await _apiClient.post(
      '/auth/verify-otp',
      authenticated: false,
      body: {'email': email.trim(), 'code': code.trim()},
    );
    return _saveSession(response.data as Map<String, dynamic>? ?? {});
  }

  @override
  Future<AuthSession> login({
    required String email,
    required String password,
  }) async {
    final response = await _apiClient.post(
      '/auth/login',
      authenticated: false,
      body: {'email': email.trim(), 'password': password},
    );
    return _saveSession(response.data as Map<String, dynamic>? ?? {});
  }

  @override
  Future<String> forgotPassword(String email) async {
    final response = await _apiClient.post(
      '/auth/forgot-password',
      authenticated: false,
      body: {'email': email.trim()},
    );
    return response.message;
  }

  @override
  Future<String> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    final response = await _apiClient.post(
      '/auth/reset-password',
      authenticated: false,
      body: {'token': token.trim(), 'newPassword': newPassword},
    );
    return response.message;
  }

  @override
  Future<void> logout() => _sessionStore.clear();

  Future<AuthSession> _saveSession(Map<String, dynamic> data) async {
    final session = AuthSession(
      token: data['token']?.toString() ?? '',
      role: data['role']?.toString() ?? '',
      userId: data['userId']?.toString(),
    );

    if (session.token.isEmpty) {
      throw ApiException(message: 'The server did not return a valid token.');
    }
    if (!session.isCitizen) {
      throw ApiException(message: 'Only citizen accounts can use this app.');
    }

    await _sessionStore.save(session);
    return session;
  }
}
