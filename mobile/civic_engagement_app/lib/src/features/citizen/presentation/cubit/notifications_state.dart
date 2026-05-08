part of 'notifications_cubit.dart';

class NotificationsState extends Equatable {
  const NotificationsState({
    this.status = RequestStatus.initial,
    this.actionStatus = RequestStatus.initial,
    this.notifications = const [],
    this.total = 0,
    this.unreadOnly = false,
    this.message,
  });

  final RequestStatus status;
  final RequestStatus actionStatus;
  final List<CitizenNotification> notifications;
  final int total;
  final bool unreadOnly;
  final String? message;

  int get unreadCount => notifications.where((item) => !item.read).length;

  NotificationsState copyWith({
    RequestStatus? status,
    RequestStatus? actionStatus,
    List<CitizenNotification>? notifications,
    int? total,
    bool? unreadOnly,
    String? message,
  }) {
    return NotificationsState(
      status: status ?? this.status,
      actionStatus: actionStatus ?? this.actionStatus,
      notifications: notifications ?? this.notifications,
      total: total ?? this.total,
      unreadOnly: unreadOnly ?? this.unreadOnly,
      message: message,
    );
  }

  @override
  List<Object?> get props => [
    status,
    actionStatus,
    notifications,
    total,
    unreadOnly,
    message,
  ];
}
