import '../../domain/entities/vote_history.dart';

class VoteHistoryModel extends VoteHistory {
  const VoteHistoryModel({
    required super.id,
    required super.value,
    required super.channel,
    super.policyId,
    super.policyTitle,
    super.policyCode,
    super.pollType,
    super.comment,
    super.sentiment,
    super.createdAt,
  });

  factory VoteHistoryModel.fromJson(Map<String, dynamic> json) {
    final policy = json['policy'];
    final policyMap = policy is Map<String, dynamic> ? policy : null;
    return VoteHistoryModel(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      policyId: policyMap?['id']?.toString() ?? policyMap?['_id']?.toString(),
      policyTitle: policyMap?['title']?.toString(),
      policyCode: policyMap?['policyCode']?.toString(),
      pollType: policyMap?['pollType']?.toString(),
      value: json['value'] ?? json['rating'], // Support both old and new format
      comment: json['comment']?.toString(),
      channel: json['channel']?.toString() ?? 'app',
      sentiment: json['sentiment']?.toString(),
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? ''),
    );
  }
}
