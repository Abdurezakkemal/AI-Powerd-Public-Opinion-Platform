import 'package:equatable/equatable.dart';

class VoteHistory extends Equatable {
  const VoteHistory({
    required this.id,
    required this.rating,
    required this.channel,
    this.policyId,
    this.policyTitle,
    this.policyCode,
    this.comment,
    this.sentiment,
    this.createdAt,
  });

  final String id;
  final String? policyId;
  final String? policyTitle;
  final String? policyCode;
  final int rating;
  final String? comment;
  final String channel;
  final String? sentiment;
  final DateTime? createdAt;

  bool get hasComment => comment != null && comment!.trim().isNotEmpty;

  @override
  List<Object?> get props => [
    id,
    policyId,
    policyTitle,
    policyCode,
    rating,
    comment,
    channel,
    sentiment,
    createdAt,
  ];
}
