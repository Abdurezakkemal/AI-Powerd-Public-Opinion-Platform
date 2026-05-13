import '../../domain/entities/notification.dart';

class NotificationModel extends NotificationEntity {
  const NotificationModel({
    required super.id,
    required super.userId,
    required super.userRole,
    required super.type,
    required super.title,
    required super.message,
    super.data,
    required super.read,
    required super.severity,
    required super.source,
    required super.createdAt,
  });

  /// Create from JSON (backend API response format)
  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['_id'] as String,
      userId: json['userId'] as String,
      userRole: json['userRole'] as String,
      type: NotificationType.fromString(json['type'] as String),
      title: json['title'] as String,
      message: json['message'] as String,
      data: json['data'] as Map<String, dynamic>?,
      read: json['read'] as bool,
      severity: NotificationSeverity.fromString(json['severity'] as String),
      source: NotificationSource.fromString(json['source'] as String),
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  /// Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'userId': userId,
      'userRole': userRole,
      'type': type.value,
      'title': title,
      'message': message,
      'data': data,
      'read': read,
      'severity': severity.value,
      'source': source.value,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  /// Create a copy with updated fields
  NotificationModel copyWith({
    String? id,
    String? userId,
    String? userRole,
    NotificationType? type,
    String? title,
    String? message,
    Map<String, dynamic>? data,
    bool? read,
    NotificationSeverity? severity,
    NotificationSource? source,
    DateTime? createdAt,
  }) {
    return NotificationModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      userRole: userRole ?? this.userRole,
      type: type ?? this.type,
      title: title ?? this.title,
      message: message ?? this.message,
      data: data ?? this.data,
      read: read ?? this.read,
      severity: severity ?? this.severity,
      source: source ?? this.source,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
