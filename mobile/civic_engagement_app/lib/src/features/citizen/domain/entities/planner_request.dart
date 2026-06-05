class PlannerRequest {
  const PlannerRequest({
    required this.requestId,
    this.userId,
    this.applicantType,
    this.fullName,
    this.email,
    this.phone,
    this.region,
    this.ageRange,
    this.gender,
    this.occupation,
    this.education,
    this.preferredLanguage,
    this.languagesSpoken,
    this.organization,
    this.reason,
    this.proofFile,
    this.status,
    this.reviewedBy,
    this.reviewedAt,
    this.rejectionReason,
    this.createdAt,
  });

  final String requestId;
  final String? userId;
  final String? applicantType;
  final String? fullName;
  final String? email;
  final String? phone;
  final String? region;
  final String? ageRange;
  final String? gender;
  final String? occupation;
  final String? education;
  final String? preferredLanguage;
  final List<String>? languagesSpoken;
  final String? organization;
  final String? reason;
  final String? proofFile;
  final String? status;
  final String? reviewedBy;
  final DateTime? reviewedAt;
  final String? rejectionReason;
  final DateTime? createdAt;
}
