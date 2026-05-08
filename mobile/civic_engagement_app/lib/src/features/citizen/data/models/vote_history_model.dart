import '../../domain/entities/vote_history.dart';

class VoteHistoryModel extends VoteHistory {
  const VoteHistoryModel({
    required super.id,
    required super.rating,
    required super.channel,
    super.policyId,
    super.policyTitle,
    super.policyCode,
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
      rating: _toInt(json['rating']),
      comment: json['comment']?.toString(),
      channel: json['channel']?.toString() ?? 'app',
      sentiment: json['sentiment']?.toString(),
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? ''),
    );
  }

  static int _toInt(dynamic value) {
    if (value is num) return value.toInt();
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }
}
