import 'package:equatable/equatable.dart';

class Policy extends Equatable {
  const Policy({
    required this.id,
    required this.title,
    required this.description,
    required this.policyCode,
    required this.targetRegions,
    required this.status,
    required this.averageRating,
    required this.totalVotes,
    this.startDate,
    this.endDate,
    this.createdBy,
    this.createdAt,
  });

  final String id;
  final String title;
  final String description;
  final String policyCode;
  final List<String> targetRegions;
  final DateTime? startDate;
  final DateTime? endDate;
  final String status;
  final double averageRating;
  final int totalVotes;
  final String? createdBy;
  final DateTime? createdAt;

  bool get canVote => status == 'active';
  bool get isPaused => status == 'paused';

  @override
  List<Object?> get props => [
    id,
    title,
    description,
    policyCode,
    targetRegions,
    startDate,
    endDate,
    status,
    averageRating,
    totalVotes,
    createdBy,
    createdAt,
  ];
}
