import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/state/request_status.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/date_formatters.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/empty_state.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/di/service_locator.dart';
import '../../../auth/domain/repositories/auth_repository.dart';
import '../../domain/repositories/citizen_repository.dart';
import '../../domain/entities/vote_history.dart';
import '../../domain/entities/vote_value.dart';
import '../cubit/history_cubit.dart';
import '../widgets/rating_stars.dart';

class HistoryPage extends StatelessWidget {
  const HistoryPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My votes'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            onPressed: () => context.read<HistoryCubit>().loadHistory(),
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: BlocBuilder<HistoryCubit, HistoryState>(
        builder: (context, state) {
          if (state.status == RequestStatus.loading && state.history.isEmpty) {
            return const Center(
                child: CircularProgressIndicator(color: AppTheme.primary));
          }

          if (state.status == RequestStatus.failure && state.history.isEmpty) {
            return ErrorView(
              message: state.message ?? 'Failed to load vote history.',
              onRetry: () => context.read<HistoryCubit>().loadHistory(),
            );
          }

          if (state.history.isEmpty) {
            return const EmptyState(
              icon: Icons.history_outlined,
              title: 'No votes yet',
              message: 'Your policy votes will be listed here.',
            );
          }

          return RefreshIndicator(
            onRefresh: () => context.read<HistoryCubit>().loadHistory(),
            child: ListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
              itemCount: state.history.length,
              itemBuilder: (context, index) {
                final item = state.history[index];
                return _HistoryCard(item: item);
              },
            ),
          );
        },
      ),
    );
  }
}

class _HistoryCard extends StatelessWidget {
  const _HistoryCard({required this.item});

  final VoteHistory item;

  String _formatVoteValue() {
    // Get the poll type from the item, default to 'rating' if not available
    final pollType = item.pollType ?? 'rating';
    return VoteValueFormatter.format(item.value, pollType);
  }

  Widget _buildVoteDisplay() {
    final pollType = item.pollType ?? 'rating';

    // For rating and likert with numeric values, show stars
    if ((pollType == 'rating' || pollType == 'likert') && item.value is int) {
      return RatingStars(rating: item.value as int, size: 22);
    }

    // For all other types, show formatted text
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: AppTheme.primary.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        _formatVoteValue(),
        style: const TextStyle(
          color: AppTheme.primary,
          fontWeight: FontWeight.w700,
          fontSize: 14,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  item.policyTitle ?? 'Deleted policy',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w900,
                      ),
                ),
              ),
            ],
          ),
          if (item.policyCode != null) ...[
            const SizedBox(height: 5),
            Text(
              item.policyCode!,
              style: const TextStyle(
                color: AppTheme.primary,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              _buildVoteDisplay(),
              const Spacer(),
              Text(
                DateFormatters.compact(item.createdAt),
                style: const TextStyle(color: AppTheme.mutedText),
              ),
            ],
          ),
          if (item.hasComment) ...[
            const SizedBox(height: 12),
            _CommentBubble(text: item.comment!),
          ] else if (item.policyId != null) ...[
            const SizedBox(height: 12),
            _HistoryPolicyComments(policyId: item.policyId!),
          ],
        ],
      ),
    );
  }
}

class _HistoryPolicyComments extends StatefulWidget {
  const _HistoryPolicyComments({required this.policyId});

  final String policyId;

  @override
  State<_HistoryPolicyComments> createState() => _HistoryPolicyCommentsState();
}

class _HistoryPolicyCommentsState extends State<_HistoryPolicyComments> {
  late Future<List<String>> _commentsFuture;

  @override
  void initState() {
    super.initState();
    _commentsFuture = _loadUserComments();
  }

  Future<List<String>> _loadUserComments() async {
    final userId = serviceLocator<AuthRepository>().restoreSession()?.userId;
    if (userId == null) return const [];

    try {
      final page = await serviceLocator<CitizenRepository>().getPolicyComments(
        policyId: widget.policyId,
        limit: 100,
      );

      return page.comments
          .where((comment) => comment.userId == userId)
          .map((comment) => comment.text.trim())
          .where((text) => text.isNotEmpty)
          .toList();
    } catch (_) {
      return const [];
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<String>>(
      future: _commentsFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const SizedBox(
            height: 20,
            width: 20,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: AppTheme.primary,
            ),
          );
        }

        final comments = snapshot.data ?? const [];
        if (comments.isEmpty) return const SizedBox.shrink();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: comments
              .map(
                (comment) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _CommentBubble(text: comment),
                ),
              )
              .toList(),
        );
      },
    );
  }
}

class _CommentBubble extends StatelessWidget {
  const _CommentBubble({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF7F9FB),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        text,
        style: const TextStyle(color: AppTheme.text, height: 1.35),
      ),
    );
  }
}
