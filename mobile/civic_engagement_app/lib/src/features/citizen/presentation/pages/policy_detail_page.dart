import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/di/service_locator.dart';
import '../../../../core/state/request_status.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/date_formatters.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/error_view.dart';
import '../../domain/entities/policy.dart';
import '../../domain/entities/vote_value.dart';
import '../../domain/repositories/citizen_repository.dart';
import '../cubit/comment_cubit.dart';
import '../cubit/history_cubit.dart';
import '../cubit/policy_cubit.dart';
import '../cubit/vote_cubit.dart';
import '../widgets/approval_vote_widget.dart';
import '../widgets/binary_vote_widget.dart';
import '../widgets/comment_list_widget.dart';
import '../widgets/likert_vote_widget.dart';
import '../widgets/multiple_choice_vote_widget.dart';
import '../widgets/post_comment_widget.dart';
import '../widgets/ranked_choice_vote_widget.dart';
import '../widgets/rating_stars.dart';
import '../widgets/status_pill.dart';

class PolicyDetailPage extends StatefulWidget {
  const PolicyDetailPage({
    required this.policyId,
    required this.initialPolicy,
    super.key,
  });

  final String policyId;
  final Policy initialPolicy;

  @override
  State<PolicyDetailPage> createState() => _PolicyDetailPageState();
}

class _PolicyDetailPageState extends State<PolicyDetailPage> {
  bool _initialLoadAttempted = false;

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      if (mounted && !_initialLoadAttempted) {
        _initialLoadAttempted = true;
        context.read<PolicyCubit>().loadPolicy(widget.policyId);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<PolicyCubit, PolicyState>(
      builder: (context, state) {
        final selected = state.selectedPolicy?.id == widget.policyId
            ? state.selectedPolicy
            : null;
        final policy = selected ?? widget.initialPolicy;
        final failed =
            state.detailStatus == RequestStatus.failure && selected == null;

        return DefaultTabController(
          length: 2,
          child: Scaffold(
            appBar: AppBar(
              title: const Text('Policy Details'),
              elevation: 0,
              bottom: TabBar(
                indicator: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(32),
                ),
                indicatorSize: TabBarIndicatorSize.tab,
                dividerColor: Colors.transparent,
                labelColor: AppTheme.primary,
                unselectedLabelColor: AppTheme.mutedText,
                labelStyle:
                    const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                unselectedLabelStyle:
                    const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                tabs: [
                  Tab(
                    height: 56,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withValues(alpha: 0.1),
                            shape: BoxShape.circle,
                          ),
                          child:
                              const Icon(Icons.info_outline_rounded, size: 18),
                        ),
                        const SizedBox(width: 8),
                        const Text('Overview'),
                      ],
                    ),
                  ),
                  Tab(
                    height: 56,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withValues(alpha: 0.1),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.forum_outlined, size: 18),
                        ),
                        const SizedBox(width: 8),
                        const Text('Discussion'),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            body: failed
                ? ErrorView(
                    message: state.message ?? 'Policy could not be loaded.',
                    onRetry: () => context.read<PolicyCubit>().loadPolicy(
                          widget.policyId,
                        ),
                  )
                : TabBarView(
                    children: [
                      RefreshIndicator(
                        onRefresh: () => context.read<PolicyCubit>().loadPolicy(
                              widget.policyId,
                            ),
                        color: AppTheme.primary,
                        backgroundColor: Colors.white,
                        child: ListView(
                          padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
                          children: [
                            if (state.detailStatus == RequestStatus.loading)
                              const Padding(
                                padding: EdgeInsets.only(bottom: 16),
                                child: LinearProgressIndicator(
                                    minHeight: 3,
                                    borderRadius:
                                        BorderRadius.all(Radius.circular(2))),
                              ),
                            _DetailHeader(policy: policy),
                            const SizedBox(height: 16),
                            _DescriptionCard(policy: policy),
                            const SizedBox(height: 16),
                            _VotingCard(
                              policy: policy,
                            ),
                          ],
                        ),
                      ),
                      _CommentsTab(policy: policy),
                    ],
                  ),
          ),
        );
      },
    );
  }
}

class _DetailHeader extends StatelessWidget {
  const _DetailHeader({required this.policy});

  final Policy policy;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      margin: EdgeInsets.zero,
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  policy.title,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w900,
                        height: 1.25,
                        letterSpacing: -0.5,
                      ),
                ),
              ),
              const SizedBox(width: 16),
              StatusPill(status: policy.status),
            ],
          ),
          const SizedBox(height: 24),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _InfoChip(
                icon: Icons.tag_rounded,
                label: policy.policyCode,
              ),
              if (policy.averageRating != null)
                _InfoChip(
                  icon: Icons.star_rounded,
                  label: '${policy.averageRating!.toStringAsFixed(1)} avg',
                  iconColor: Colors.amber.shade600,
                  backgroundColor: Colors.amber.shade50,
                  textColor: Colors.amber.shade900,
                ),
              _InfoChip(
                icon: Icons.how_to_vote_rounded,
                label: '${policy.totalVotes} votes',
              ),
              if (policy.topics != null && policy.topics!.isNotEmpty)
                ...policy.topics!.take(2).map(
                      (topic) => _InfoChip(
                        icon: Icons.label_outline_rounded,
                        label: topic,
                      ),
                    ),
            ],
          ),
        ],
      ),
    );
  }
}

class _DescriptionCard extends StatelessWidget {
  const _DescriptionCard({required this.policy});

  final Policy policy;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      margin: EdgeInsets.zero,
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'About this policy',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.3,
                ),
          ),
          const SizedBox(height: 12),
          Text(
            policy.description,
            style: const TextStyle(
              color: AppTheme.text,
              height: 1.6,
              fontSize: 15,
            ),
          ),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppTheme.primary.withValues(alpha: 0.03),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              children: [
                _DetailRow(
                  icon: Icons.map_outlined,
                  label: 'Regions',
                  value: policy.targetRegions.isEmpty
                      ? 'Not specified'
                      : policy.targetRegions.join(', '),
                ),
                const SizedBox(height: 12),
                _DetailRow(
                  icon: Icons.event_available_outlined,
                  label: 'Starts',
                  value: DateFormatters.short(policy.startDate),
                ),
                const SizedBox(height: 12),
                _DetailRow(
                  icon: Icons.event_busy_outlined,
                  label: 'Ends',
                  value: DateFormatters.short(policy.endDate),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _VotingCard extends StatefulWidget {
  const _VotingCard({required this.policy});

  final Policy policy;

  @override
  State<_VotingCard> createState() => _VotingCardState();
}

class _VotingCardState extends State<_VotingCard> {
  dynamic _voteValue;
  bool _submitted = false;

  @override
  void initState() {
    super.initState();
    _setInitialVoteValue();
  }

  @override
  void didUpdateWidget(covariant _VotingCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.policy.id != widget.policy.id ||
        oldWidget.policy.pollType != widget.policy.pollType) {
      _submitted = false;
      _setInitialVoteValue();
    }
  }

  void _setInitialVoteValue() {
    switch (widget.policy.pollType) {
      case 'rating':
      case 'likert':
        _voteValue = 5;
        break;
      case 'multipleChoice':
      case 'rankedChoice':
        _voteValue = <String>[];
        break;
      case 'binary':
      case 'approval':
      default:
        _voteValue = null;
        break;
    }
  }

  bool get _canSubmit {
    return VoteValueFormatter.isValid(
      _voteValue,
      widget.policy.pollType,
      maxSelections: widget.policy.maxSelections,
      maxRank: widget.policy.rankedChoiceMaxRank,
    );
  }

  String get _pollTypeLabel {
    switch (widget.policy.pollType) {
      case 'binary':
        return 'Vote Yes or No';
      case 'multipleChoice':
        return 'Select Options';
      case 'likert':
        return 'Rate on Scale';
      case 'approval':
        return 'Approve or Reject';
      case 'rating':
        return 'Rate Policy';
      case 'rankedChoice':
        return 'Rank Choices';
      default:
        return 'Vote on Policy';
    }
  }

  @override
  Widget build(BuildContext context) {
    final policy = widget.policy;
    final title = policy.canVote ? 'Ready for your feedback' : 'Voting paused';
    final message = policy.canVote
        ? 'Submit one vote for this policy. Comments belong in the Discussion tab.'
        : 'This policy is visible, but voting is temporarily paused.';

    return BlocConsumer<VoteCubit, VoteState>(
      listener: (context, state) {
        if (state.status == RequestStatus.success) {
          setState(() => _submitted = true);
          final message = state.message ??
              (state.alreadyVoted
                  ? 'You have already voted on this policy.'
                  : 'Vote submitted successfully!');
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(message),
              backgroundColor: state.alreadyVoted
                  ? Colors.orange.shade700
                  : Colors.green.shade600,
            ),
          );
          context.read<PolicyCubit>().loadPolicy(policy.id);
          context.read<PolicyCubit>().loadPolicies();
          context.read<HistoryCubit>().loadHistory();
        } else if (state.status == RequestStatus.failure) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                state.message ?? 'Failed to submit vote. Please try again.',
              ),
              backgroundColor: Colors.redAccent,
            ),
          );
        }
      },
      builder: (context, voteState) {
        return BlocBuilder<HistoryCubit, HistoryState>(
          builder: (context, historyState) {
            final alreadyVoted = _submitted ||
                historyState.history.any((item) => item.policyId == policy.id);
            final isLoading = voteState.status == RequestStatus.loading;
            final canVote = policy.canVote && !alreadyVoted;

            return AppCard(
              margin: EdgeInsets.zero,
              padding: const EdgeInsets.all(24),
              color: canVote ? AppTheme.primary.withValues(alpha: 0.05) : null,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        alreadyVoted
                            ? Icons.check_circle_rounded
                            : policy.canVote
                                ? Icons.feedback_rounded
                                : Icons.pause_circle_filled_rounded,
                        color: alreadyVoted
                            ? Colors.green.shade600
                            : policy.canVote
                                ? AppTheme.primary
                                : AppTheme.mutedText,
                        size: 24,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          alreadyVoted ? 'Vote submitted' : title,
                          style:
                              Theme.of(context).textTheme.titleLarge?.copyWith(
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: -0.3,
                                  ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    alreadyVoted
                        ? 'You have already voted on this policy.'
                        : message,
                    style: TextStyle(
                      color: AppTheme.text.withValues(alpha: 0.7),
                      height: 1.5,
                      fontSize: 14,
                    ),
                  ),
                  if (canVote) ...[
                    const SizedBox(height: 24),
                    Text(
                      _pollTypeLabel,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w900,
                          ),
                    ),
                    const SizedBox(height: 18),
                    _buildVoteWidget(),
                  ],
                  const SizedBox(height: 24),
                  AppButton(
                    label: alreadyVoted ? 'Already Voted' : 'Submit Vote',
                    icon: alreadyVoted
                        ? Icons.check_circle_outline_rounded
                        : Icons.send_rounded,
                    loading: isLoading,
                    onPressed: canVote && _canSubmit && !isLoading
                        ? () => context.read<VoteCubit>().submitVote(
                              policyId: policy.id,
                              value: _voteValue,
                            )
                        : null,
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildVoteWidget() {
    switch (widget.policy.pollType) {
      case 'binary':
        return BinaryVoteWidget(
          value: _voteValue as String?,
          onChanged: (value) => setState(() => _voteValue = value),
        );
      case 'approval':
        return ApprovalVoteWidget(
          value: _voteValue as String?,
          onChanged: (value) => setState(() => _voteValue = value),
        );
      case 'likert':
        return LikertVoteWidget(
          value: _voteValue as int?,
          labels: widget.policy.likertLabels ?? [],
          onChanged: (value) => setState(() => _voteValue = value),
        );
      case 'multipleChoice':
        return MultipleChoiceVoteWidget(
          options: widget.policy.pollOptions ?? [],
          selectedIds: _voteValue as List<String>,
          maxSelections: widget.policy.maxSelections ?? 1,
          onChanged: (value) => setState(() => _voteValue = value),
        );
      case 'rankedChoice':
        return RankedChoiceVoteWidget(
          options: widget.policy.pollOptions ?? [],
          rankedIds: _voteValue as List<String>,
          maxRank: widget.policy.rankedChoiceMaxRank ?? 3,
          onChanged: (value) => setState(() => _voteValue = value),
        );
      case 'rating':
      default:
        return Center(
          child: RatingStars(
            rating: _voteValue as int? ?? 5,
            onChanged: (value) => setState(() => _voteValue = value),
            size: 40,
          ),
        );
    }
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({
    required this.icon,
    required this.label,
    this.iconColor,
    this.backgroundColor,
    this.textColor,
  });

  final IconData icon;
  final String label;
  final Color? iconColor;
  final Color? backgroundColor;
  final Color? textColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: backgroundColor ?? AppTheme.primary.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: iconColor ?? AppTheme.primary),
          const SizedBox(width: 8),
          Text(
            label,
            style: TextStyle(
              color: textColor ?? AppTheme.primary,
              fontWeight: FontWeight.w700,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: AppTheme.mutedText),
        const SizedBox(width: 12),
        SizedBox(
          width: 80,
          child: Text(
            label,
            style: const TextStyle(
              color: AppTheme.mutedText,
              fontWeight: FontWeight.w600,
              fontSize: 14,
            ),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              color: AppTheme.text,
              fontWeight: FontWeight.w700,
              fontSize: 14,
            ),
          ),
        ),
      ],
    );
  }
}

class _CommentsTab extends StatelessWidget {
  const _CommentsTab({required this.policy});

  final Policy policy;

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => CommentCubit(serviceLocator<CitizenRepository>()),
      child: Builder(
        builder: (context) => Column(
          children: [
            PostCommentWidget(
              policyId: policy.id,
              onCommentPosted: () {
                print('[PolicyDetailPage] onCommentPosted callback triggered');
                print(
                    '[PolicyDetailPage] Reloading comments for policy: ${policy.id}');
                context.read<CommentCubit>().loadComments(
                      policyId: policy.id,
                      refresh: true,
                    );
              },
            ),
            Expanded(
              child: CommentListWidget(policyId: policy.id),
            ),
          ],
        ),
      ),
    );
  }
}
