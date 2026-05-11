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

        return const Center(child: Text('No comments available'));
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
      builder: (context) => ReportCommentDialog(commentId: comment.id),
    );
  }

  void _showEditDialog(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (context) => EditCommentDialog(
        commentId: comment.id,
        currentText: comment.text,
        policyId: policyId,
      ),
    );
  }

  void _showReplyDialog(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (context) => ReplyCommentDialog(
        policyId: policyId,
        parentComment: comment,
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
    
    return Card(
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
                _StatusChip(status: comment.status),
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
          ],
        ),
      ),
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

    showModalBottomSheet<void>(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Reply option - available to everyone
            ListTile(
              leading: const Icon(Icons.reply),
              title: const Text('Reply'),
              onTap: () {
                Navigator.pop(context);
                _showReplyDialog(context);
              },
            ),
            // Edit option - only for comment author
            if (isAuthor && comment.isApproved) ...[
              ListTile(
                leading: const Icon(Icons.edit),
                title: const Text('Edit Comment'),
                onTap: () {
                  Navigator.pop(context);
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
                  Navigator.pop(context);
                  _showReportDialog(context);
                },
              ),
            // Appeal option - only for authors of flagged/deleted comments
            if (isAuthor &&
                (comment.status == 'flagged' || comment.status == 'deleted'))
              ListTile(
                leading: const Icon(Icons.gavel),
                title: const Text('Appeal Decision'),
                onTap: () {
                  Navigator.pop(context);
                  _showAppealDialog(context);
                },
              ),
          ],
        ),
      ),
    );
  }

  void _showAppealDialog(BuildContext context) {
    final reasonController = TextEditingController();

    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
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
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              if (reasonController.text.trim().isNotEmpty) {
                context.read<CommentCubit>().appealComment(
                      commentId: comment.id,
                      reason: reasonController.text,
                    );
                Navigator.pop(context);
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
  const _StatusChip({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    Color color;
    String label;

    switch (status) {
      case 'approved':
        color = Colors.green;
        label = 'Approved';
      case 'flagged':
        color = Colors.orange;
        label = 'Flagged';
      case 'deleted':
        color = Colors.red;
        label = 'Deleted';
      case 'processing':
        color = Colors.blue;
        label = 'Processing';
      default:
        color = Colors.grey;
        label = status;
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
