import '../../domain/entities/citizen_notification.dart';

class CitizenNotificationModel extends CitizenNotification {
  const CitizenNotificationModel({
    required super.id,
    required super.type,
    required super.title,
    required super.message,
    required super.read,
    required super.data,
    super.createdAt,
  });

  factory CitizenNotificationModel.fromJson(Map<String, dynamic> json) {
    final data = json['data'];
    return CitizenNotificationModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      type: json['type']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Notification',
      message: json['message']?.toString() ?? '',
      read: json['read'] == true,
      data: data is Map<String, dynamic> ? data : const {},
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? ''),
    );
  }
}
