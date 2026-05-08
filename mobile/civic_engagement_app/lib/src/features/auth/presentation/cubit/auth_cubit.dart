import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/error/api_exception.dart';
import '../../domain/entities/auth_session.dart';
import '../../domain/repositories/auth_repository.dart';

part 'auth_state.dart';

class AuthCubit extends Cubit<AuthState> {
  AuthCubit(this._repository) : super(const AuthState.checking());

  final AuthRepository _repository;

  Future<void> restoreSession() async {
    final session = _repository.restoreSession();
    if (session == null) {
      emit(const AuthState.unauthenticated());
    } else {
      emit(AuthState.authenticated(session));
    }
  }

  Future<void> register({
    required String email,
    required String password,
    required String phone,
    required String region,
  }) async {
    emit(const AuthState.loading());
    try {
      final result = await _repository.register(
        email: email,
        password: password,
        phone: phone,
        region: region,
      );
      emit(AuthState.otpPending(email: email, message: result.message));
    } on ApiException catch (error) {
      emit(AuthState.failure(error.message));
    }
  }

  Future<void> sendOtp(String email) async {
    emit(const AuthState.loading());
    try {
      final message = await _repository.sendOtp(email);
      emit(AuthState.otpPending(email: email, message: message));
    } on ApiException catch (error) {
      emit(AuthState.failure(error.message));
    }
  }

  Future<void> verifyOtp({required String email, required String code}) async {
    emit(const AuthState.loading());
    try {
      final session = await _repository.verifyOtp(email: email, code: code);
      emit(AuthState.authenticated(session));
    } on ApiException catch (error) {
      emit(AuthState.failure(error.message));
    }
  }

  Future<void> login({required String email, required String password}) async {
    emit(const AuthState.loading());
    try {
      final session = await _repository.login(email: email, password: password);
      emit(AuthState.authenticated(session));
    } on ApiException catch (error) {
      emit(AuthState.failure(error.message));
    }
  }

  Future<void> forgotPassword(String email) async {
    emit(const AuthState.loading());
    try {
      final message = await _repository.forgotPassword(email);
      emit(AuthState.message(message));
    } on ApiException catch (error) {
      emit(AuthState.failure(error.message));
    }
  }

  Future<void> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    emit(const AuthState.loading());
    try {
      final message = await _repository.resetPassword(
        token: token,
        newPassword: newPassword,
      );
      emit(AuthState.message(message));
    } on ApiException catch (error) {
      emit(AuthState.failure(error.message));
    }
  }

  Future<void> logout() async {
    await _repository.logout();
    emit(const AuthState.unauthenticated());
  }
}
