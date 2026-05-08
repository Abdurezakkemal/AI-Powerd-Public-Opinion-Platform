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

  Future<String> deleteAccount();

  Future<PolicyPage> getPolicies({
    String? status,
    int page = 1,
    int limit = 20,
  });

  Future<Policy> getPolicy(String id);

  Future<VoteReceipt> submitVote({
    required String policyId,
    required int rating,
    String? comment,
  });

  Future<String> addComment({required String voteId, required String comment});

  Future<List<VoteHistory>> getHistory();

  Future<NotificationPage> getNotifications({
    int page = 1,
    int limit = 20,
    bool unreadOnly = false,
  });

  Future<void> markNotificationRead(String id);

  Future<int> markAllNotificationsRead();
}
