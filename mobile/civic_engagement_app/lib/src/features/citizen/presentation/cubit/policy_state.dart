part of 'policy_cubit.dart';

class PolicyState extends Equatable {
  const PolicyState({
    this.status = RequestStatus.initial,
    this.detailStatus = RequestStatus.initial,
    this.policies = const [],
    this.selectedPolicy,
    this.filter = 'all',
    this.page = 1,
    this.total = 0,
    this.hasMore = false,
    this.message,
  });

  final RequestStatus status;
  final RequestStatus detailStatus;
  final List<Policy> policies;
  final Policy? selectedPolicy;
  final String filter;
  final int page;
  final int total;
  final bool hasMore;
  final String? message;

  PolicyState copyWith({
    RequestStatus? status,
    RequestStatus? detailStatus,
    List<Policy>? policies,
    Policy? selectedPolicy,
    String? filter,
    int? page,
    int? total,
    bool? hasMore,
    String? message,
  }) {
    return PolicyState(
      status: status ?? this.status,
      detailStatus: detailStatus ?? this.detailStatus,
      policies: policies ?? this.policies,
      selectedPolicy: selectedPolicy ?? this.selectedPolicy,
      filter: filter ?? this.filter,
      page: page ?? this.page,
      total: total ?? this.total,
      hasMore: hasMore ?? this.hasMore,
      message: message,
    );
  }

  @override
  List<Object?> get props => [
    status,
    detailStatus,
    policies,
    selectedPolicy,
    filter,
    page,
    total,
    hasMore,
    message,
  ];
}
