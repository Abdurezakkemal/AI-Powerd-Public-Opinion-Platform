import 'package:equatable/equatable.dart';

/// Represents a comment on a policy
class Comment extends Equatable {
  const Comment({
    required this.id,
    required this.policyId,
    required this.text,
    required this.status,
    required this.createdAt,
    this.parentCommentId,
    this.userId,
    this.userEmail,
    this.sentiment,
    this.keywords,
    this.isOfficialReply = false,
    this.isEdited = false,
    this.reportCount = 0,
    this.appeal,
  });

  final String id;
  final String policyId;
  final String? parentCommentId;
  final String text;
  final String? userId;
  final String? userEmail;
  final String status; // processing, approved, flagged, deleted, pending_review
  final CommentSentiment? sentiment;
  final List<String>? keywords;
  final bool isOfficialReply;
  final bool isEdited;
  final int reportCount;
  final CommentAppeal? appeal;
  final DateTime createdAt;

  bool get isApproved => status == 'approved';
  bool get isFlagged => status == 'flagged';
  bool get isDeleted => status == 'deleted';
  bool get isPending => status == 'processing' || status == 'pending_review';
  bool get canAppeal => isFlagged || isDeleted;
  bool get hasAppeal => appeal != null;

  @override
  List<Object?> get props => [
        id,
        policyId,
        parentCommentId,
        text,
        userId,
        userEmail,
        status,
        sentiment,
        keywords,
        isOfficialReply,
        isEdited,
        reportCount,
        appeal,
        createdAt,
      ];
}

/// Sentiment analysis result for a comment
class CommentSentiment extends Equatable {
  const CommentSentiment({
    required this.label,
    required this.confidence,
  });

  final String label; // positive, negative, neutral
  final double confidence;

  @override
  List<Object?> get props => [label, confidence];
}

/// Appeal information for a moderated comment
class CommentAppeal extends Equatable {
  const CommentAppeal({
    required this.reason,
    required this.status,
    required this.submittedAt,
    this.resolvedAt,
    this.resolution,
    this.note,
  });

  final String reason;
  final String status; // pending, resolved_approved, resolved_rejected
  final DateTime submittedAt;
  final DateTime? resolvedAt;
  final String? resolution; // approve, reject
  final String? note;

  bool get isPending => status == 'pending';
  bool get isResolved => status.startsWith('resolved_');
  bool get wasApproved => status == 'resolved_approved';

  @override
  List<Object?> get props => [
        reason,
        status,
        submittedAt,
        resolvedAt,
        resolution,
        note,
      ];
}

/// Page of comments with pagination info
class CommentPage extends Equatable {
  const CommentPage({
    required this.comments,
    required this.total,
    required this.page,
  });

  final List<Comment> comments;
  final int total;
  final int page;

  bool get hasMore => comments.length < total;

  @override
  List<Object?> get props => [comments, total, page];
}
