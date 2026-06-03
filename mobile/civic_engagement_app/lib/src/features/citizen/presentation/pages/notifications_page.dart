import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/state/request_status.dart';
import '../../../../core/localization/app_localizations.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/date_formatters.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/empty_state.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/widgets/translatable_text.dart';
import '../../domain/entities/citizen_notification.dart';
import '../cubit/notifications_cubit.dart';
import '../widgets/appeal_comment_dialog.dart';

class NotificationsPage extends StatelessWidget {
  const NotificationsPage({super.key});

  @override
  Widget build(BuildContext context) {
    print('[NotificationsPage] Building page');

    return BlocListener<NotificationsCubit, NotificationsState>(
      listenWhen: (previous, current) {
        print('[NotificationsPage] State changed:');
        print('  - Previous status: ${previous.status}');
        print('  - Current status: ${current.status}');
        print('  - Previous count: ${previous.notifications.length}');
        print('  - Current count: ${current.notifications.length}');
        return previous.actionStatus != current.actionStatus &&
            current.message != null;
      },
      listener: (context, state) {
        print(
            '[NotificationsPage] Action status changed: ${state.actionStatus}');
        if (state.message != null) {
          print('[NotificationsPage] Showing message: ${state.message}');
        }
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(state.message!)));
      },
      child: Scaffold(
        backgroundColor: AppTheme.background,
        body: BlocBuilder<NotificationsCubit, NotificationsState>(
          builder: (context, state) {
            print('[NotificationsPage] Building body');
            print('  - Status: ${state.status}');
            print('  - Notifications count: ${state.notifications.length}');
            print('  - Total: ${state.total}');
            print('  - UnreadOnly: ${state.unreadOnly}');

            if (state.status == RequestStatus.loading &&
                state.notifications.isEmpty) {
              print('[NotificationsPage] Showing loading indicator');
              return const Center(
                  child: CircularProgressIndicator(color: AppTheme.primary));
            }

            if (state.status == RequestStatus.failure &&
                state.notifications.isEmpty) {
              print('[NotificationsPage] Showing error view: ${state.message}');
              return ErrorView(
                message: state.message ?? 'Failed to load notifications.',
                onRetry: () =>
                    context.read<NotificationsCubit>().loadNotifications(),
              );
            }

            print('[NotificationsPage] Showing notifications list');
            return RefreshIndicator(
              onRefresh: () =>
                  context.read<NotificationsCubit>().loadNotifications(
                        unreadOnly: state.unreadOnly,
                      ),
              color: AppTheme.primary,
              backgroundColor: Colors.white,
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  // Custom Elevated Header
                  SliverToBoxAdapter(
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.06),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: SafeArea(
                        bottom: false,
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  AppLocalizations.of(context)
                                      .t('notifications'),
                                  style: const TextStyle(
                                    fontSize: 28,
                                    fontWeight: FontWeight.w900,
                                    color: AppTheme.text,
                                    letterSpacing: 0,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Row(
                                children: [
                                  Container(
                                    width: 44,
                                    height: 44,
                                    decoration: BoxDecoration(
                                      color: AppTheme.primary
                                          .withValues(alpha: 0.1),
                                      shape: BoxShape.circle,
                                    ),
                                    child: IconButton(
                                      tooltip: 'Mark all read',
                                      onPressed: () => context
                                          .read<NotificationsCubit>()
                                          .markAllRead(),
                                      icon: const Icon(
                                        Icons.done_all_rounded,
                                        color: AppTheme.primary,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Container(
                                    width: 44,
                                    height: 44,
                                    decoration: BoxDecoration(
                                      color: AppTheme.primary
                                          .withValues(alpha: 0.1),
                                      shape: BoxShape.circle,
                                    ),
                                    child: IconButton(
                                      tooltip: 'Refresh',
                                      onPressed: () => context
                                          .read<NotificationsCubit>()
                                          .loadNotifications(),
                                      icon: const Icon(
                                        Icons.refresh_rounded,
                                        color: AppTheme.primary,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                  SliverToBoxAdapter(child: _NotificationFilters(state: state)),
                  if (state.notifications.isEmpty)
                    const SliverFillRemaining(
                      child: EmptyState(
                        icon: Icons.notifications_none_rounded,
                        title: 'No alerts',
                        message:
                            'Policy closure and result updates will appear here.',
                      ),
                    )
                  else
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                      sliver: SliverList.builder(
                        itemCount: state.notifications.length,
                        itemBuilder: (context, index) {
                          final item = state.notifications[index];
                          return _NotificationCard(
                            item: item,
                            onTap: () {
                              if (!item.read) {
                                context.read<NotificationsCubit>().markRead(
                                      item.id,
                                    );
                              }
                            },
                            onAppeal: item.canAppealComment
                                ? () => _showAppealDialog(context, item)
                                : null,
                          );
                        },
                      ),
                    ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  void _showAppealDialog(BuildContext context, CitizenNotification item) {
    final commentId = item.commentId;
    if (commentId == null) return;
    final cubit = context.read<NotificationsCubit>();
    showDialog<void>(
      context: context,
      builder: (_) => AppealCommentDialog(
        onSubmit: (reason) {
          cubit.submitCommentAppeal(
            notificationId: item.id,
            commentId: commentId,
            reason: reason,
          );
        },
      ),
    );
  }
}

class _NotificationFilters extends StatelessWidget {
  const _NotificationFilters({required this.state});

  final NotificationsState state;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.fromLTRB(16, 2, 16, 8),
      child: Row(
        children: [
          _chip(
            context,
            label: 'All',
            selected: !state.unreadOnly,
            unreadOnly: false,
          ),
          const SizedBox(width: 8),
          _chip(
            context,
            label: 'Unread',
            selected: state.unreadOnly,
            unreadOnly: true,
          ),
        ],
      ),
    );
  }

  Widget _chip(
    BuildContext context, {
    required String label,
    required bool selected,
    required bool unreadOnly,
  }) {
    return ChoiceChip(
      label: Text(label),
      selected: selected,
      showCheckmark: false,
      onSelected: (_) => context.read<NotificationsCubit>().loadNotifications(
            unreadOnly: unreadOnly,
          ),
      selectedColor: AppTheme.primary.withValues(alpha: 0.14),
      labelStyle: TextStyle(
        color: selected ? AppTheme.primary : AppTheme.mutedText,
        fontWeight: FontWeight.w800,
      ),
      side: BorderSide(
        color: selected ? AppTheme.primary : const Color(0xFFE5EDF3),
      ),
    );
  }
}

class _NotificationCard extends StatelessWidget {
  const _NotificationCard({
    required this.item,
    required this.onTap,
    this.onAppeal,
  });

  final CitizenNotification item;
  final VoidCallback onTap;
  final VoidCallback? onAppeal;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      onTap: onTap,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: item.read
                  ? const Color(0xFFF1F5F9)
                  : _colorForItem(item).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(
              _iconForType(item.type, item.read),
              color: item.read ? AppTheme.mutedText : _colorForItem(item),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: TranslatableText(
                        text: item.title,
                        showControls: false,
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w900,
                            ),
                      ),
                    ),
                    if (!item.read)
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: AppTheme.primary,
                          shape: BoxShape.circle,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 6),
                TranslatableText(
                  text: item.message,
                  style: TextStyle(
                    color: Theme.of(context).textTheme.bodySmall?.color,
                    height: 1.35,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  DateFormatters.compact(item.createdAt),
                  style: const TextStyle(
                    color: AppTheme.mutedText,
                    fontWeight: FontWeight.w700,
                    fontSize: 12,
                  ),
                ),
                if (onAppeal != null) ...[
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    onPressed: onAppeal,
                    icon: const Icon(Icons.gavel_rounded, size: 18),
                    label: const Text('Appeal decision'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.primary,
                      side: BorderSide(
                        color: AppTheme.primary.withValues(alpha: 0.35),
                      ),
                      textStyle: const TextStyle(fontWeight: FontWeight.w800),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

IconData _iconForType(String type, bool read) {
  switch (type) {
    case 'POLICY_ACTIVATED':
    case 'POLICY_AUTO_ACTIVATED':
      return Icons.play_circle_outline_rounded;
    case 'POLICY_CLOSED':
    case 'POLICY_AUTO_CLOSED':
      return Icons.lock_clock_rounded;
    case 'POLICY_EXTENDED':
    case 'POLICY_LIFECYCLE':
      return Icons.event_repeat_rounded;
    case 'ASSOCIATE_ASSIGNED':
    case 'ASSOCIATE_PERMISSIONS_UPDATED':
    case 'ASSOCIATE_REVOKED':
      return Icons.group_add_outlined;
    case 'COMMENT_REPLY':
      return Icons.reply_rounded;
    case 'COMMENT_FLAGGED':
      return Icons.flag_outlined;
    case 'COMMENT_HIDDEN':
      return Icons.visibility_off_outlined;
    case 'COMMENT_APPEAL':
      return Icons.rate_review_outlined;
    case 'APPEAL_RESOLVED':
      return Icons.gavel_rounded;
    case 'PLANNER_APPROVED':
    case 'PLANNER_REQUEST_APPROVED':
      return Icons.verified_user_outlined;
    case 'VOTE_SURGE':
    case 'RATING_DROP':
    case 'EMERGING_TOPIC':
      return Icons.monitor_heart_outlined;
    default:
      return read
          ? Icons.notifications_none_rounded
          : Icons.notifications_active_rounded;
  }
}

Color _colorForItem(CitizenNotification item) {
  if (item.isCritical) return const Color(0xFFE53E3E);
  if (item.isWarning) return const Color(0xFFB7791F);
  return AppTheme.primary;
}
