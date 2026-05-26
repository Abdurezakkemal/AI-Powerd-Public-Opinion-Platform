import '../../domain/entities/comment.dart';

class CommentModel extends Comment {
  const CommentModel({
    required super.id,
    required super.policyId,
    required super.text,
    required super.visibility,
    required super.moderationStatus,
    required super.createdAt,
    super.parentCommentId,
    super.userId,
    super.userEmail,
    super.hiddenReason,
    super.moderationReason,
    super.aiStatus,
    super.reportState,
    super.reviewFlags,
    super.originalCommentId,
    super.versionNumber,
    super.editCount,
    super.editedAt,
    super.updatedAt,
    super.lastAnalyzedAt,
    super.sentiment,
    super.keywords,
    super.isOfficialReply,
    super.isEdited,
    super.reportCount,
    super.appeal,
    super.flaggedSnapshot,
    super.replyCount,
  });

  factory CommentModel.fromJson(Map<String, dynamic> json) {
    print('[CommentModel] Parsing comment from JSON');
    print('  - Raw JSON keys: ${json.keys.toList()}');
    
    final user = json['user'];
    print('  - user field type: ${user.runtimeType}');
    if (user != null) {
      print('  - user content: $user');
    }
    
    final comment = CommentModel(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      policyId: _parseId(json['policyId']) ?? '',
      parentCommentId: _parseId(json['parentCommentId']),
      text: json['text']?.toString() ?? '',
      userId: _parseId(json['userId']) ?? _parseId(user),
      userEmail: json['userEmail']?.toString() ?? _parseUserEmail(user),
      visibility: json['visibility']?.toString() ?? 'visible',
      hiddenReason: json['hiddenReason']?.toString(),
      moderationStatus:
          json['moderationStatus']?.toString() ?? _legacyModerationStatus(json),
      moderationReason: json['moderationReason']?.toString(),
      aiStatus: json['aiStatus']?.toString() ?? _legacyAiStatus(json),
      reportState: json['reportState']?.toString() ?? 'clean',
      reviewFlags: _parseReviewFlags(json['reviewFlags']),
      originalCommentId: _parseId(json['originalCommentId']),
      versionNumber: _toInt(json['versionNumber'], fallback: 1),
      editCount: _toInt(json['editCount']),
      editedAt: DateTime.tryParse(json['editedAt']?.toString() ?? ''),
      updatedAt: DateTime.tryParse(json['updatedAt']?.toString() ?? ''),
      lastAnalyzedAt:
          DateTime.tryParse(json['lastAnalyzedAt']?.toString() ?? ''),
      sentiment: _parseSentiment(json['sentiment']),
      keywords: _parseKeywords(json['keywords']),
      isOfficialReply: json['isOfficialReply'] == true,
      isEdited: json['isEdited'] == true ||
          json['editedAt'] != null ||
          _toInt(json['editCount']) > 0 ||
          _toInt(json['versionNumber'], fallback: 1) > 1,
      reportCount: _toInt(json['reportCount']),
      appeal: _parseAppeal(json['appeal']),
      flaggedSnapshot: _parseFlaggedSnapshot(json['flaggedSnapshot']),
      replyCount: _toInt(json['replyCount']),
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
    );
    
    print('[CommentModel] Parsed comment:');
    print('  - ID: ${comment.id}');
    print('  - userId: ${comment.userId}');
    print('  - userEmail: ${comment.userEmail}');
    print('  - visibility: ${comment.visibility}');
    print('  - parentCommentId: ${comment.parentCommentId}');
    
    return comment;
  }

  static String _legacyModerationStatus(Map<String, dynamic> json) {
    final aiStatus = json['aiStatus']?.toString();
    if (aiStatus == 'pending') return 'pending_ai';
    if (json['reportState']?.toString() == 'under_review') {
      return 'needs_review';
    }
    return 'none';
  }

  static String _legacyAiStatus(Map<String, dynamic> json) {
    switch (json['moderationStatus']?.toString()) {
      case 'pending_ai':
        return 'pending';
      case 'needs_review':
        return 'failed';
      default:
        return 'processed';
    }
  }

  static CommentReviewFlags? _parseReviewFlags(dynamic value) {
    if (value is! Map<String, dynamic>) return null;
    return CommentReviewFlags(
      sentimentReviewNeeded: value['sentimentReviewNeeded'] == true,
      moderationReviewNeeded: value['moderationReviewNeeded'] == true,
    );
  }

  static CommentSentiment? _parseSentiment(dynamic value) {
    if (value is String) {
      final label = value.trim().toLowerCase();
      if (label == 'positive' || label == 'negative' || label == 'neutral') {
        return CommentSentiment(label: label, confidence: 0);
      }
      return null;
    }
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
      submittedAt: DateTime.tryParse(
            (value['submittedAt'] ?? value['createdAt'])?.toString() ?? '',
          ) ??
          DateTime.now(),
      details: value['details']?.toString(),
      resolvedAt: DateTime.tryParse(value['resolvedAt']?.toString() ?? ''),
      resolution: value['resolution']?.toString(),
      note: value['note']?.toString() ??
          value['resolutionNote']?.toString() ??
          value['moderatorNotes']?.toString(),
    );
  }

  static double _toDouble(dynamic value) {
    if (value is num) return value.toDouble();
    return double.tryParse(value?.toString() ?? '') ?? 0.0;
  }

  static int _toInt(dynamic value, {int fallback = 0}) {
    if (value is num) return value.toInt();
    return int.tryParse(value?.toString() ?? '') ?? fallback;
  }

  static FlaggedSnapshot? _parseFlaggedSnapshot(dynamic value) {
    if (value is! Map<String, dynamic>) return null;
    return FlaggedSnapshot(
      text: value['text']?.toString() ?? '',
      timestamp: DateTime.tryParse(
            (value['timestamp'] ?? value['capturedAt'])?.toString() ?? '',
          ) ??
          DateTime.now(),
      reportCountAtCapture: _toInt(value['reportCountAtCapture']),
      sentiment: _parseSentiment(value['sentiment']),
      keywords: _parseKeywords(value['keywords']),
    );
  }

  static String? _parseId(dynamic value) {
    if (value == null) return null;
    if (value is Map<String, dynamic>) {
      return (value['_id'] ?? value['id'])?.toString();
    }
    return value.toString();
  }

  static String? _parseUserEmail(dynamic value) {
    if (value is Map<String, dynamic>) {
      return value['email']?.toString();
    }
    return null;
  }
}
