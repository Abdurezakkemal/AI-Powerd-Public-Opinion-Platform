import 'package:equatable/equatable.dart';

/// Represents a comment on a policy
class Comment extends Equatable {
  const Comment({
    required this.id,
    required this.policyId,
    required this.text,
    required this.visibility,
    required this.moderationStatus,
    required this.createdAt,
    this.parentCommentId,
    this.userId,
    this.userEmail,
    this.hiddenReason,
    this.moderationReason,
    this.aiStatus = 'processed',
    this.reportState = 'clean',
    this.reviewFlags,
    this.originalCommentId,
    this.versionNumber = 1,
    this.editCount = 0,
    this.editedAt,
    this.updatedAt,
    this.lastAnalyzedAt,
    this.sentiment,
    this.keywords,
    this.isOfficialReply = false,
    this.isEdited = false,
    this.reportCount = 0,
    this.appeal,
    this.flaggedSnapshot,
    this.replyCount = 0,
  });

  final String id;
  final String policyId;
  final String? parentCommentId;
  final String text;
  final String? userId;
  final String? userEmail;
  final String visibility; // "visible" or "hidden"
  final String? hiddenReason; // null, "profanity", "reports", "moderator"
  final String
      moderationStatus; // "pending_ai", "needs_review", "reviewed", "none"
  final String?
      moderationReason; // "pending_ai", "low_confidence", "reports", "moderator_flag"
  final String aiStatus; // "pending", "processed", "failed", "stale"
  final String reportState; // "clean", "reported", "under_review", "actioned"
  final CommentReviewFlags? reviewFlags;
  final String? originalCommentId;
  final int versionNumber;
  final int editCount;
  final DateTime? editedAt;
  final DateTime? updatedAt;
  final DateTime? lastAnalyzedAt;
  final CommentSentiment? sentiment;
  final List<String>? keywords;
  final bool isOfficialReply;
  final bool isEdited;
  final int reportCount;
  final CommentAppeal? appeal;
  final FlaggedSnapshot? flaggedSnapshot;
  final int replyCount;
  final DateTime createdAt;

  bool get isVisible => visibility == 'visible';
  bool get isHidden => visibility == 'hidden';
  bool get isDeleted => visibility == 'deleted';
  bool get isPendingAI =>
      aiStatus == 'pending' || moderationStatus == 'pending_ai';
  bool get needsReview =>
      reportState == 'under_review' ||
      reviewFlags?.moderationReviewNeeded == true ||
      reviewFlags?.sentimentReviewNeeded == true ||
      moderationStatus == 'needs_review';
  bool get isReviewed => moderationStatus == 'reviewed';
  bool get canAppeal => isHidden && appeal?.isPending != true;
  bool get hasAppeal => appeal != null;
  bool get hasVersions => versionNumber > 1 || editCount > 0 || isEdited;

  @override
  List<Object?> get props => [
        id,
        policyId,
        parentCommentId,
        text,
        userId,
        userEmail,
        visibility,
        hiddenReason,
        moderationStatus,
        moderationReason,
        aiStatus,
        reportState,
        reviewFlags,
        originalCommentId,
        versionNumber,
        editCount,
        editedAt,
        updatedAt,
        lastAnalyzedAt,
        sentiment,
        keywords,
        isOfficialReply,
        isEdited,
        reportCount,
        appeal,
        flaggedSnapshot,
        replyCount,
        createdAt,
      ];
}

class CommentReviewFlags extends Equatable {
  const CommentReviewFlags({
    this.sentimentReviewNeeded = false,
    this.moderationReviewNeeded = false,
  });

  final bool sentimentReviewNeeded;
  final bool moderationReviewNeeded;

  bool get any => sentimentReviewNeeded || moderationReviewNeeded;

  @override
  List<Object?> get props => [sentimentReviewNeeded, moderationReviewNeeded];
}

/// Immutable snapshot taken when a comment is flagged (reportCount >= 3)
class FlaggedSnapshot extends Equatable {
  const FlaggedSnapshot({
    required this.text,
    required this.timestamp,
    required this.reportCountAtCapture,
    this.sentiment,
    this.keywords,
  });

  final String text;
  final DateTime timestamp;
  final int reportCountAtCapture;
  final CommentSentiment? sentiment;
  final List<String>? keywords;

  @override
  List<Object?> get props => [
        text,
        timestamp,
        reportCountAtCapture,
        sentiment,
        keywords,
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
    this.details,
    this.resolvedAt,
    this.resolution,
    this.note,
  });

  final String reason;
  final String status; // pending, approved/rejected, or old resolved_* values
  final DateTime submittedAt;
  final String? details;
  final DateTime? resolvedAt;
  final String? resolution; // approve, reject
  final String? note;

  bool get isPending => status == 'pending';
  bool get isResolved =>
      status == 'approved' ||
      status == 'rejected' ||
      status.startsWith('resolved_');
  bool get wasApproved => status == 'approved' || status == 'resolved_approved';

  @override
  List<Object?> get props => [
        reason,
        status,
        submittedAt,
        details,
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
