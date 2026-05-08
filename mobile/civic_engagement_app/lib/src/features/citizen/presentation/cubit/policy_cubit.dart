import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/error/api_exception.dart';
import '../../../../core/state/request_status.dart';
import '../../domain/entities/policy.dart';
import '../../domain/repositories/citizen_repository.dart';

part 'policy_state.dart';

class PolicyCubit extends Cubit<PolicyState> {
  PolicyCubit(this._repository) : super(const PolicyState());

  final CitizenRepository _repository;
  static const _pageSize = 20;

  Future<void> loadPolicies({String? status, bool refresh = true}) async {
    final selectedStatus = status ?? state.filter;
    final nextPage = refresh ? 1 : state.page + 1;
    emit(state.copyWith(status: RequestStatus.loading, filter: selectedStatus));
    try {
      final page = await _repository.getPolicies(
        status: selectedStatus == 'all' ? null : selectedStatus,
        page: nextPage,
        limit: _pageSize,
      );
      final policies =
          refresh
              ? page.policies
              : <Policy>[...state.policies, ...page.policies];
      emit(
        state.copyWith(
          status: RequestStatus.success,
          policies: policies,
          page: page.page,
          total: page.total,
          hasMore: policies.length < page.total,
          filter: selectedStatus,
        ),
      );
    } on ApiException catch (error) {
      emit(
        state.copyWith(status: RequestStatus.failure, message: error.message),
      );
    }
  }

  Future<void> loadPolicy(String id) async {
    emit(state.copyWith(detailStatus: RequestStatus.loading));
    try {
      final policy = await _repository.getPolicy(id);
      emit(
        state.copyWith(
          detailStatus: RequestStatus.success,
          selectedPolicy: policy,
        ),
      );
    } on ApiException catch (error) {
      emit(
        state.copyWith(
          detailStatus: RequestStatus.failure,
          message: error.message,
        ),
      );
    }
  }
}
