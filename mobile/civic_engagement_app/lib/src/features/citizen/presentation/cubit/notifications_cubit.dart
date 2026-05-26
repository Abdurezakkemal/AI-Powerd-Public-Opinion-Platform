import 'dart:async';
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/error/api_exception.dart';
import '../../../../core/services/notification_socket_service.dart';
import '../../../../core/state/request_status.dart';
import '../../data/models/citizen_notification_model.dart';
import '../../domain/entities/citizen_notification.dart';
import '../../domain/repositories/citizen_repository.dart';

part 'notifications_state.dart';

class NotificationsCubit extends Cubit<NotificationsState> {
  NotificationsCubit(
    this._repository,
    this._socketService,
  ) : super(const NotificationsState()) {
    _initializeSocketListener();
  }

  final CitizenRepository _repository;
  final NotificationSocketService _socketService;
  StreamSubscription? _socketSubscription;

  /// Initialize WebSocket listener for real-time notifications
  void _initializeSocketListener() {
    print('[NotificationsCubit] Initializing socket listener');
    _socketSubscription = _socketService.notificationStream.listen(
      (notification) {
        print('[NotificationsCubit] Received notification via socket:');
        print('  - type: ${notification.type}');
        print('  - title: ${notification.title}');
        // Convert to CitizenNotification and add to list
        final citizenNotification = CitizenNotificationModel.fromJson(
          notification.toJson(),
        );
        _addNewNotification(citizenNotification);
      },
      onError: (error) {
        print('[NotificationsCubit] Socket notification error: $error');
      },
    );
    print('[NotificationsCubit] Socket listener initialized');
  }

  /// Add a new notification received via WebSocket to the top of the list
  void _addNewNotification(CitizenNotification notification) {
    print('[NotificationsCubit] Adding new notification to list');
    print('  - Current count: ${state.notifications.length}');
    final updatedList = [notification, ...state.notifications];
    print('  - New count: ${updatedList.length}');
    emit(
      state.copyWith(
        notifications: updatedList,
        total: state.total + 1,
        hasNewNotification: true,
      ),
    );
    print('[NotificationsCubit] Notification added, state emitted');
  }

  /// Clear the new notification flag
  void clearNewNotificationFlag() {
    emit(state.copyWith(hasNewNotification: false));
  }

  Future<void> loadNotifications({bool unreadOnly = false}) async {
    print('[NotificationsCubit] loadNotifications called');
    print('  - unreadOnly: $unreadOnly');
    print('  - Current state: ${state.status}');
    
    emit(state.copyWith(status: RequestStatus.loading, unreadOnly: unreadOnly));
    
    try {
      print('[NotificationsCubit] Fetching notifications from repository...');
      final page = await _repository.getNotifications(unreadOnly: unreadOnly);
      
      print('[NotificationsCubit] Received notifications:');
      print('  - Count: ${page.notifications.length}');
      print('  - Total: ${page.total}');
      print('  - Page: ${page.page}');
      
      if (page.notifications.isNotEmpty) {
        final first = page.notifications.first;
        print('[NotificationsCubit] First notification sample:');
        print('  - ID: ${first.id}');
        print('  - Type: ${first.type}');
        print('  - Title: ${first.title}');
        print('  - Read: ${first.read}');
        print('  - Created: ${first.createdAt}');
      }
      
      emit(
        state.copyWith(
          status: RequestStatus.success,
          notifications: page.notifications,
          total: page.total,
          unreadOnly: unreadOnly,
        ),
      );
      
      print('[NotificationsCubit] State updated with ${page.notifications.length} notifications');
    } on ApiException catch (error) {
      print('[NotificationsCubit] ERROR loading notifications: ${error.message}');
      print('[NotificationsCubit] Error code: ${error.code}');
      emit(
        state.copyWith(status: RequestStatus.failure, message: error.message),
      );
    } catch (e) {
      print('[NotificationsCubit] UNEXPECTED ERROR: $e');
      print('[NotificationsCubit] Error type: ${e.runtimeType}');
      emit(
        state.copyWith(status: RequestStatus.failure, message: e.toString()),
      );
    }
  }

  Future<void> markRead(String id) async {
    try {
      await _repository.markNotificationRead(id);
      final updated = state.notifications
          .map(
            (item) => item.id == id
                ? CitizenNotification(
                    id: item.id,
                    type: item.type,
                    title: item.title,
                    message: item.message,
                    read: true,
                    data: item.data,
                    createdAt: item.createdAt,
                    userId: item.userId,
                    userRole: item.userRole,
                    severity: item.severity,
                    source: item.source,
                  )
                : item,
          )
          .toList();
      emit(state.copyWith(notifications: updated));
    } on ApiException catch (error) {
      emit(state.copyWith(message: error.message));
    }
  }

  Future<void> markAllRead() async {
    emit(state.copyWith(actionStatus: RequestStatus.loading));
    try {
      final count = await _repository.markAllNotificationsRead();
      final updated = state.notifications
          .map(
            (item) => CitizenNotification(
              id: item.id,
              type: item.type,
              title: item.title,
              message: item.message,
              read: true,
              data: item.data,
              createdAt: item.createdAt,
              userId: item.userId,
              userRole: item.userRole,
              severity: item.severity,
              source: item.source,
            ),
          )
          .toList();
      emit(
        state.copyWith(
          actionStatus: RequestStatus.success,
          notifications: updated,
          message: '$count notification(s) marked as read.',
        ),
      );
    } on ApiException catch (error) {
      emit(
        state.copyWith(
          actionStatus: RequestStatus.failure,
          message: error.message,
        ),
      );
    }
  }

  Future<void> submitCommentAppeal({
    required String notificationId,
    required String commentId,
    required String reason,
  }) async {
    emit(state.copyWith(actionStatus: RequestStatus.loading));
    try {
      final message = await _repository.appealComment(
        commentId: commentId,
        reason: reason,
      );
      await markRead(notificationId);
      emit(
        state.copyWith(
          actionStatus: RequestStatus.success,
          message: message,
        ),
      );
    } on ApiException catch (error) {
      emit(
        state.copyWith(
          actionStatus: RequestStatus.failure,
          message: error.message,
        ),
      );
    }
  }

  @override
  Future<void> close() {
    _socketSubscription?.cancel();
    return super.close();
  }
}
