import '../../domain/entities/planner_request.dart';

class PlannerRequestModel extends PlannerRequest {
  const PlannerRequestModel({
    required super.requestId,
    super.userId,
    super.applicantType,
    super.fullName,
    super.email,
    super.phone,
    super.region,
    super.ageRange,
    super.gender,
    super.occupation,
    super.education,
    super.preferredLanguage,
    super.languagesSpoken,
    super.organization,
    super.reason,
    super.proofFile,
    super.status,
    super.reviewedBy,
    super.reviewedAt,
    super.rejectionReason,
    super.createdAt,
  });

  factory PlannerRequestModel.fromJson(Map<String, dynamic> json) {
    return PlannerRequestModel(
      requestId: json['_id']?.toString() ?? json['requestId']?.toString() ?? '',
      userId: json['userId']?.toString(),
      applicantType: json['applicantType']?.toString(),
      fullName: json['fullName']?.toString(),
      email: json['email']?.toString(),
      phone: json['phone']?.toString(),
      region: json['region']?.toString(),
      ageRange: json['ageRange']?.toString(),
      gender: json['gender']?.toString(),
      occupation: json['occupation']?.toString(),
      education: json['education']?.toString(),
      preferredLanguage: json['preferredLanguage']?.toString(),
      languagesSpoken: json['languagesSpoken'] is List
          ? (json['languagesSpoken'] as List).map((e) => e.toString()).toList()
          : null,
      organization: json['organization']?.toString(),
      reason: json['reason']?.toString(),
      proofFile: json['proofFile']?.toString(),
      status: json['status']?.toString(),
      reviewedBy: json['reviewedBy']?.toString(),
      reviewedAt: json['reviewedAt'] != null
          ? DateTime.tryParse(json['reviewedAt'].toString())
          : null,
      rejectionReason: json['rejectionReason']?.toString(),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'requestId': requestId,
      if (userId != null) 'userId': userId,
      if (applicantType != null) 'applicantType': applicantType,
      if (fullName != null) 'fullName': fullName,
      if (email != null) 'email': email,
      if (phone != null) 'phone': phone,
      if (region != null) 'region': region,
      if (ageRange != null) 'ageRange': ageRange,
      if (gender != null) 'gender': gender,
      if (occupation != null) 'occupation': occupation,
      if (education != null) 'education': education,
      if (preferredLanguage != null) 'preferredLanguage': preferredLanguage,
      if (languagesSpoken != null) 'languagesSpoken': languagesSpoken,
      if (organization != null) 'organization': organization,
      if (reason != null) 'reason': reason,
      if (proofFile != null) 'proofFile': proofFile,
      if (status != null) 'status': status,
      if (reviewedBy != null) 'reviewedBy': reviewedBy,
      if (reviewedAt != null) 'reviewedAt': reviewedAt?.toIso8601String(),
      if (rejectionReason != null) 'rejectionReason': rejectionReason,
      if (createdAt != null) 'createdAt': createdAt?.toIso8601String(),
    };
  }
}
