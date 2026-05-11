import '../../domain/entities/comment.dart';

class CommentModel extends Comment {
  const CommentModel({
    required super.id,
    required super.policyId,
    required super.text,
    required super.status,
    required super.createdAt,
    super.parentCommentId,
    super.userId,
    super.userEmail,
    super.sentiment,
    super.keywords,
    super.isOfficialReply,
    super.isEdited,
    super.reportCount,
    super.appeal,
  });

  factory CommentModel.fromJson(Map<String, dynamic> json) {
    return CommentModel(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      policyId: json['policyId']?.toString() ?? '',
      parentCommentId: json['parentCommentId']?.toString(),
      text: json['text']?.toString() ?? '',
      userId: json['userId']?.toString(),
      userEmail: json['userEmail']?.toString(),
      status: json['status']?.toString() ?? 'processing',
      sentiment: _parseSentiment(json['sentiment']),
      keywords: _parseKeywords(json['keywords']),
      isOfficialReply: json['isOfficialReply'] == true,
      isEdited: json['isEdited'] == true,
      reportCount: _toInt(json['reportCount']),
      appeal: _parseAppeal(json['appeal']),
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
    );
  }

  static CommentSentiment? _parseSentiment(dynamic value) {
    if (value is! Map<String, dynamic>) return null;
    return CommentSentiment(
      label: value['label']?.toString() ?? 'neutral',
      confidence: _toDouble(value['confidence']),
    );
  }

  static List<String>? _parseKeywords(dynamic value) {
    if (value is! List) return null;
    return value.map((e) => e.toString()).toList();
  }

  static CommentAppeal? _parseAppeal(dynamic value) {
    if (value is! Map<String, dynamic>) return null;
    return CommentAppeal(
      reason: value['reason']?.toString() ?? '',
      status: value['status']?.toString() ?? 'pending',
      submittedAt: DateTime.tryParse(value['submittedAt']?.toString() ?? '') ??
          DateTime.now(),
      resolvedAt: DateTime.tryParse(value['resolvedAt']?.toString() ?? ''),
      resolution: value['resolution']?.toString(),
      note: value['note']?.toString(),
    );
  }

  static double _toDouble(dynamic value) {
    if (value is num) return value.toDouble();
    return double.tryParse(value?.toString() ?? '') ?? 0.0;
  }

  static int _toInt(dynamic value) {
    if (value is num) return value.toInt();
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }
}
