import '../../domain/entities/policy.dart';

class PolicyModel extends Policy {
  const PolicyModel({
    required super.id,
    required super.title,
    required super.description,
    required super.policyCode,
    required super.targetRegions,
    required super.status,
    required super.averageRating,
    required super.totalVotes,
    super.startDate,
    super.endDate,
    super.createdBy,
    super.createdAt,
  });

  factory PolicyModel.fromJson(Map<String, dynamic> json) {
    return PolicyModel(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      title: json['title']?.toString() ?? 'Untitled policy',
      description: json['description']?.toString() ?? '',
      policyCode: json['policyCode']?.toString() ?? '',
      targetRegions: _strings(json['targetRegions']),
      startDate: DateTime.tryParse(json['startDate']?.toString() ?? ''),
      endDate: DateTime.tryParse(json['endDate']?.toString() ?? ''),
      status: json['status']?.toString() ?? '',
      averageRating: _toDouble(json['averageRating']),
      totalVotes: _toInt(json['totalVotes']),
      createdBy: json['createdBy']?.toString(),
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? ''),
    );
  }

  static List<String> _strings(dynamic value) {
    if (value is List) {
      return value.map((item) => item.toString()).toList();
    }
    return const [];
  }

  static double _toDouble(dynamic value) {
    if (value is num) return value.toDouble();
    return double.tryParse(value?.toString() ?? '') ?? 0;
  }

  static int _toInt(dynamic value) {
    if (value is num) return value.toInt();
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }
}
