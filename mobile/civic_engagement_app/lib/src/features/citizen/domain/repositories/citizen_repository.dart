import '../entities/comment_page.dart';
import '../entities/notification_page.dart';
import '../entities/policy.dart';
import '../entities/policy_page.dart';
import '../entities/user_profile.dart';
import '../entities/vote_history.dart';
import '../entities/vote_receipt.dart';

abstract class CitizenRepository {
  Future<UserProfile> getProfile();

  Future<UserProfile> updateRegion(String region);

  Future<String> changePassword({
    required String currentPassword,
    required String newPassword,
  });

  Future<String> requestEmailChange(String newEmail);

  Future<String> verifyEmailChange(String code);

  Future<String> requestPhoneChange(String newPhone);

  Future<String> verifyPhoneChange({
    required String newPhone,
    required String code,
  });

  Future<String> deleteAccount();

  Future<PolicyPage> getPolicies({
    String? status,
    String? topic,
    int page = 1,
    int limit = 20,
  });

  Future<Policy> getPolicy(String id);

  Future<VoteReceipt> submitVote({
    required String policyId,
    required dynamic value, // Can be int, String, or List<String> based on poll type
    String? comment,
  });

  Future<String> addComment({required String policyId, required String comment});

  // Comment endpoints (Section 4.2-4.8)
  Future<String> postComment({
    required String policyId,
    required String text,
    String? parentCommentId,
  });

  Future<String> reportComment({
    required String commentId,
    required String reason,
  });

  Future<String> editComment({
    required String commentId,
    required String text,
  });

  Future<String> appealComment({
    required String commentId,
    required String reason,
  });

  Future<CommentPage> getPolicyComments({
    required String policyId,
    int page = 1,
    int limit = 20,
    String? sentiment,
    String? status,
  });

  Future<List<VoteHistory>> getHistory();

  Future<NotificationPage> getNotifications({
    int page = 1,
    int limit = 20,
    bool unreadOnly = false,
  });

  Future<void> markNotificationRead(String id);

  Future<int> markAllNotificationsRead();
}
