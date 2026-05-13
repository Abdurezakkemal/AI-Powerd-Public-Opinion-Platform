import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/di/service_locator.dart';
import '../../../auth/domain/repositories/auth_repository.dart';
import '../../domain/entities/comment.dart';
import '../cubit/comment_cubit.dart';
import '../cubit/comment_state.dart';
import 'edit_comment_dialog.dart';
import 'reply_comment_dialog.dart';
import 'report_comment_dialog.dart';

class CommentListWidget extends StatefulWidget {
  const CommentListWidget({
    required this.policyId,
    super.key,
  });

  final String policyId;

  @override
  State<CommentListWidget> createState() => _CommentListWidgetState();
}

class _CommentListWidgetState extends State<CommentListWidget> {
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    context.read<CommentCubit>().loadComments(
          policyId: widget.policyId,
          refresh: true,
        );
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent * 0.9) {
      final state = context.read<CommentCubit>().state;
      if (state is CommentLoaded && state.hasMore) {
        context.read<CommentCubit>().loadMore(policyId: widget.policyId);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<CommentCubit, CommentState>(
      builder: (context, state) {
        if (state is CommentLoading && state is! CommentLoaded) {
          return const Center(child: CircularProgressIndicator());
        }

        if (state is CommentError) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'Error loading comments',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                Text(state.message),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () {
                    context.read<CommentCubit>().loadComments(
                          policyId: widget.policyId,
                          refresh: true,
                        );
                  },
                  child: const Text('Retry'),
                ),
              ],
            ),
          );
        }

        if (state is CommentLoaded) {
          if (state.comments.isEmpty) {
            return const Center(
              child: Text('No comments yet. Be the first to comment!'),
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              await context.read<CommentCubit>().loadComments(
                    policyId: widget.policyId,
                    refresh: true,
                  );
            },
            child: ListView.builder(
              controller: _scrollController,
              itemCount: state.comments.length + (state.hasMore ? 1 : 0),
              itemBuilder: (context, index) {
                if (index >= state.comments.length) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.all(16),
                      child: CircularProgressIndicator(),
                    ),
                  );
                }

                final comment = state.comments[index];
                return _CommentCard(
                  comment: comment,
                  policyId: widget.policyId,
                );
              },
            ),
          );
        }

        // Handle CommentInitial and other states - show empty state
        return const Center(
          child: Text('No comments yet. Be the first to comment!'),
        );
      },
    );
  }
}

class _CommentCard extends StatelessWidget {
  const _CommentCard({
    required this.comment,
    required this.policyId,
  });

  final Comment comment;
  final String policyId;

  void _showReportDialog(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (dialogContext) => BlocProvider.value(
        value: context.read<CommentCubit>(),
        child: ReportCommentDialog(commentId: comment.id),
      ),
    );
  }

  void _showEditDialog(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (dialogContext) => BlocProvider.value(
        value: context.read<CommentCubit>(),
        child: EditCommentDialog(
          commentId: comment.id,
          currentText: comment.text,
          policyId: policyId,
        ),
      ),
    );
  }

  void _showReplyDialog(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (dialogContext) => BlocProvider.value(
        value: context.read<CommentCubit>(),
        child: ReplyCommentDialog(
          policyId: policyId,
          parentComment: comment,
        ),
      ),
    );
  }

  bool _isCurrentUserAuthor() {
    final authRepo = serviceLocator<AuthRepository>();
    final session = authRepo.restoreSession();
    return session?.userId == comment.userId;
  }

  @override
  Widget build(BuildContext context) {
    final isReply = comment.parentCommentId != null;
    
    return Column(
      children: [
        Card(
          margin: EdgeInsets.only(
            left: isReply ? 32 : 16,  // Indent replies
            right: 16,
            top: 8,
            bottom: 8,
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Reply indicator
                if (isReply) ...[
                  Row(
                    children: [
                      Icon(
                        Icons.subdirectory_arrow_right,
                        size: 16,
                        color: Colors.grey.shade600,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Reply',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade600,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                ],
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        comment.userEmail ?? 'Anonymous',
                        style: Theme.of(context).textTheme.titleSmall,
                      ),
                    ),
                    _StatusChip(comment: comment),
                    IconButton(
                      icon: const Icon(Icons.more_vert, size: 20),
                      onPressed: () => _showCommentMenu(context),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(comment.text),
                const SizedBox(height: 8),
                Row(
                  children: [
                    if (comment.sentiment != null) ...[
                      _SentimentChip(sentiment: comment.sentiment!),
                      const SizedBox(width: 8),
                    ],
                    if (comment.isEdited) ...[
                      const Icon(Icons.edit, size: 16, color: Colors.grey),
                      const SizedBox(width: 4),
                      const Text('Edited', style: TextStyle(color: Colors.grey)),
                      const SizedBox(width: 8),
                    ],
                    if (comment.isOfficialReply) ...[
                      const Icon(Icons.verified, size: 16, color: Colors.blue),
                      const SizedBox(width: 4),
                      const Text('Official', style: TextStyle(color: Colors.blue)),
                    ],
                  ],
                ),
                if (comment.keywords != null && comment.keywords!.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 4,
                    children: comment.keywords!
                        .take(3)
                        .map(
                          (keyword) => Chip(
                            label: Text(keyword),
                            visualDensity: VisualDensity.compact,
                          ),
                        )
                        .toList(),
                  ),
                ],
                const SizedBox(height: 4),
                Text(
                  _formatDate(comment.createdAt),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.grey,
                      ),
                ),
                // Show replies button for top-level comments only
                if (!isReply) ...[
                  const SizedBox(height: 8),
                  _RepliesSection(comment: comment, policyId: policyId),
                ],
              ],
            ),
          ),
        ),
        // Show replies if loaded
        if (!isReply) _RepliesList(comment: comment, policyId: policyId),
      ],
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.inDays > 0) {
      return '${diff.inDays}d ago';
    } else if (diff.inHours > 0) {
      return '${diff.inHours}h ago';
    } else if (diff.inMinutes > 0) {
      return '${diff.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }

  void _showCommentMenu(BuildContext context) {
    final isAuthor = _isCurrentUserAuthor();
    final cubit = context.read<CommentCubit>();

    showModalBottomSheet<void>(
      context: context,
      builder: (bottomSheetContext) => BlocProvider.value(
        value: cubit,
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Reply option - available to everyone
              ListTile(
                leading: const Icon(Icons.reply),
                title: const Text('Reply'),
                onTap: () {
                  Navigator.pop(bottomSheetContext);
                  _showReplyDialog(context);
                },
              ),
              // Edit option - only for comment author and visible comments
              if (isAuthor && comment.isVisible) ...[
                ListTile(
                  leading: const Icon(Icons.edit),
                  title: const Text('Edit Comment'),
                  onTap: () {
                    Navigator.pop(bottomSheetContext);
                    _showEditDialog(context);
                  },
                ),
              ],
              // Report option - only for non-authors
              if (!isAuthor)
                ListTile(
                  leading: const Icon(Icons.flag),
                  title: const Text('Report Comment'),
                  onTap: () {
                    Navigator.pop(bottomSheetContext);
                    _showReportDialog(context);
                  },
                ),
              // Appeal option - only for authors of hidden comments that need review
              if (isAuthor && comment.canAppeal)
                ListTile(
                  leading: const Icon(Icons.gavel),
                  title: const Text('Appeal Decision'),
                  onTap: () {
                    Navigator.pop(bottomSheetContext);
                    _showAppealDialog(context);
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }

  void _showAppealDialog(BuildContext context) {
    final reasonController = TextEditingController();
    final cubit = context.read<CommentCubit>();

    showDialog<void>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Appeal Moderation'),
        content: TextField(
          controller: reasonController,
          decoration: const InputDecoration(
            hintText: 'Explain why this decision should be reconsidered...',
            border: OutlineInputBorder(),
          ),
          maxLines: 4,
          maxLength: 500,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              if (reasonController.text.trim().isNotEmpty) {
                cubit.appealComment(
                  commentId: comment.id,
                  reason: reasonController.text,
                );
                Navigator.pop(dialogContext);
              }
            },
            child: const Text('Submit Appeal'),
          ),
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.comment});

  final Comment comment;

  @override
  Widget build(BuildContext context) {
    Color color;
    String label;

    // Determine status based on visibility and moderation status
    if (comment.isHidden) {
      // Hidden comments
      switch (comment.hiddenReason) {
        case 'profanity':
          color = Colors.red;
          label = 'Blocked';
        case 'reports':
          color = Colors.orange;
          label = 'Flagged';
        case 'moderator':
          color = Colors.red;
          label = 'Deleted';
        default:
          color = Colors.red;
          label = 'Hidden';
      }
    } else {
      // Visible comments - show moderation status
      switch (comment.moderationStatus) {
        case 'pending_ai':
          color = Colors.blue;
          label = 'Processing';
        case 'needs_review':
          color = Colors.orange;
          label = 'Under Review';
        case 'reviewed':
          color = Colors.green;
          label = 'Reviewed';
        case 'none':
          // No chip for normal visible comments
          return const SizedBox.shrink();
        default:
          color = Colors.grey;
          label = comment.moderationStatus;
      }
    }

    return Chip(
      label: Text(label),
      backgroundColor: color.withValues(alpha: 0.2),
      labelStyle: TextStyle(color: color, fontSize: 12),
      visualDensity: VisualDensity.compact,
    );
  }
}

class _SentimentChip extends StatelessWidget {
  const _SentimentChip({required this.sentiment});

  final CommentSentiment sentiment;

  @override
  Widget build(BuildContext context) {
    Color color;
    IconData icon;

    switch (sentiment.label) {
      case 'positive':
        color = Colors.green;
        icon = Icons.sentiment_satisfied;
      case 'negative':
        color = Colors.red;
        icon = Icons.sentiment_dissatisfied;
      default:
        color = Colors.grey;
        icon = Icons.sentiment_neutral;
    }

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: color),
        const SizedBox(width: 4),
        Text(
          sentiment.label,
          style: TextStyle(color: color, fontSize: 12),
        ),
      ],
    );
  }
}

class _RepliesSection extends StatelessWidget {
  const _RepliesSection({
    required this.comment,
    required this.policyId,
  });

  final Comment comment;
  final String policyId;

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<CommentCubit, CommentState>(
      builder: (context, state) {
        final cubit = context.read<CommentCubit>();
        final repliesLoaded = cubit.areRepliesLoaded(comment.id);
        final repliesLoading = cubit.areRepliesLoading(comment.id);
        final replies = cubit.getReplies(comment.id);

        if (repliesLoading) {
          return Row(
            children: [
              const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
              const SizedBox(width: 8),
              Text(
                'Loading replies...',
                style: TextStyle(
                  color: Colors.grey.shade600,
                  fontSize: 12,
                ),
              ),
            ],
          );
        }

        if (!repliesLoaded) {
          return TextButton.icon(
            onPressed: () => cubit.loadReplies(comment.id),
            icon: const Icon(Icons.comment, size: 16),
            label: const Text('Show replies'),
            style: TextButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
          );
        }

        if (replies.isEmpty) {
          return Text(
            'No replies yet',
            style: TextStyle(
              color: Colors.grey.shade600,
              fontSize: 12,
              fontStyle: FontStyle.italic,
            ),
          );
        }

        return TextButton.icon(
          onPressed: () => cubit.loadReplies(comment.id), // Refresh replies
          icon: const Icon(Icons.refresh, size: 16),
          label: Text('${replies.length} ${replies.length == 1 ? 'reply' : 'replies'}'),
          style: TextButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            minimumSize: Size.zero,
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
          ),
        );
      },
    );
  }
}

class _RepliesList extends StatelessWidget {
  const _RepliesList({
    required this.comment,
    required this.policyId,
  });

  final Comment comment;
  final String policyId;

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<CommentCubit, CommentState>(
      builder: (context, state) {
        final cubit = context.read<CommentCubit>();
        final repliesLoaded = cubit.areRepliesLoaded(comment.id);
        final replies = cubit.getReplies(comment.id);

        if (!repliesLoaded || replies.isEmpty) {
          return const SizedBox.shrink();
        }

        return Column(
          children: replies
              .map((reply) => _CommentCard(
                    comment: reply,
                    policyId: policyId,
                  ))
              .toList(),
        );
      },
    );
  }
}
