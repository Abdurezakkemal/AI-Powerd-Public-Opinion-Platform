import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/error/api_exception.dart';
import '../../../../core/state/request_status.dart';
import '../../domain/entities/citizen_notification.dart';
import '../../domain/repositories/citizen_repository.dart';

part 'notifications_state.dart';

class NotificationsCubit extends Cubit<NotificationsState> {
  NotificationsCubit(this._repository) : super(const NotificationsState());

  final CitizenRepository _repository;

  Future<void> loadNotifications({bool unreadOnly = false}) async {
    emit(state.copyWith(status: RequestStatus.loading, unreadOnly: unreadOnly));
    try {
      final page = await _repository.getNotifications(unreadOnly: unreadOnly);
      emit(
        state.copyWith(
          status: RequestStatus.success,
          notifications: page.notifications,
          total: page.total,
          unreadOnly: unreadOnly,
        ),
      );
    } on ApiException catch (error) {
      emit(
        state.copyWith(status: RequestStatus.failure, message: error.message),
      );
    }
  }

  Future<void> markRead(String id) async {
    try {
      await _repository.markNotificationRead(id);
      final updated =
          state.notifications
              .map(
                (item) =>
                    item.id == id
                        ? CitizenNotification(
                          id: item.id,
                          type: item.type,
                          title: item.title,
                          message: item.message,
                          read: true,
                          data: item.data,
                          createdAt: item.createdAt,
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
      final updated =
          state.notifications
              .map(
                (item) => CitizenNotification(
                  id: item.id,
                  type: item.type,
                  title: item.title,
                  message: item.message,
                  read: true,
                  data: item.data,
                  createdAt: item.createdAt,
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
}
