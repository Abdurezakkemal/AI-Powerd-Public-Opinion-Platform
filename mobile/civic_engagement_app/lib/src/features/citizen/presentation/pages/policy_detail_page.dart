import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/di/service_locator.dart';
import '../../../../core/state/request_status.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/date_formatters.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/app_text_field.dart';
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
    // Load policy immediately without waiting for post frame callback
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
        final selected =
            state.selectedPolicy?.id == widget.policyId
                ? state.selectedPolicy
                : null;
        final policy = selected ?? widget.initialPolicy;
        final failed =
            state.detailStatus == RequestStatus.failure && selected == null;

        return DefaultTabController(
          length: 2,
          child: Scaffold(
            appBar: AppBar(
              title: const Text('Policy details'),
              bottom: const TabBar(
                tabs: [
                  Tab(text: 'Details', icon: Icon(Icons.info_outline)),
                  Tab(text: 'Comments', icon: Icon(Icons.comment_outlined)),
                ],
              ),
            ),
            body:
                failed
                    ? ErrorView(
                      message: state.message ?? 'Policy could not be loaded.',
                      onRetry:
                          () => context.read<PolicyCubit>().loadPolicy(
                            widget.policyId,
                          ),
                    )
                    : TabBarView(
                      children: [
                        // Tab 1: Policy Details
                        RefreshIndicator(
                          onRefresh:
                              () => context.read<PolicyCubit>().loadPolicy(
                                widget.policyId,
                              ),
                          child: ListView(
                            padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                            children: [
                              if (state.detailStatus == RequestStatus.loading)
                                const LinearProgressIndicator(minHeight: 2),
                              const SizedBox(height: 12),
                              _DetailHeader(policy: policy),
                              const SizedBox(height: 12),
                              _DescriptionCard(policy: policy),
                              const SizedBox(height: 12),
                              _VotingCard(
                                policy: policy,
                                onVote: () => _showVoteSheet(context, policy),
                              ),
                            ],
                          ),
                        ),
                        // Tab 2: Comments
                        _CommentsTab(policy: policy),
                      ],
                    ),
          ),
        );
      },
    );
  }

  Future<void> _showVoteSheet(BuildContext context, Policy policy) async {
    final policyCubit = context.read<PolicyCubit>();
    final historyCubit = context.read<HistoryCubit>();
    final voted = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder:
          (_) => BlocProvider.value(
            value: context.read<VoteCubit>(),
            child: _VoteSheet(policy: policy),
          ),
    );

    if (!mounted || voted != true) return;
    policyCubit.loadPolicy(policy.id);
    policyCubit.loadPolicies();
    historyCubit.loadHistory();
  }
}

class _DetailHeader extends StatelessWidget {
  const _DetailHeader({required this.policy});

  final Policy policy;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      margin: EdgeInsets.zero,
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
                  ),
                ),
              ),
              const SizedBox(width: 8),
              StatusPill(status: policy.status),
            ],
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _InfoChip(
                icon: Icons.qr_code_2_rounded,
                label: policy.policyCode,
              ),
              if (policy.averageRating != null)
                _InfoChip(
                  icon: Icons.star_rounded,
                  label: '${policy.averageRating!.toStringAsFixed(1)} average',
                ),
              _InfoChip(
                icon: Icons.how_to_vote_outlined,
                label: '${policy.totalVotes} votes',
              ),
              if (policy.topics != null && policy.topics!.isNotEmpty)
                ...policy.topics!.take(2).map(
                      (topic) => _InfoChip(
                        icon: Icons.label_outline,
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'About this policy',
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 8),
          Text(
            policy.description,
            style: const TextStyle(
              color: AppTheme.mutedText,
              height: 1.45,
              fontSize: 15,
            ),
          ),
          const SizedBox(height: 16),
          _DetailRow(
            icon: Icons.map_outlined,
            label: 'Regions',
            value:
                policy.targetRegions.isEmpty
                    ? 'Not specified'
                    : policy.targetRegions.join(', '),
          ),
          _DetailRow(
            icon: Icons.event_available_outlined,
            label: 'Starts',
            value: DateFormatters.short(policy.startDate),
          ),
          _DetailRow(
            icon: Icons.event_busy_outlined,
            label: 'Ends',
            value: DateFormatters.short(policy.endDate),
          ),
        ],
      ),
    );
  }
}

class _VotingCard extends StatelessWidget {
  const _VotingCard({required this.policy, required this.onVote});

  final Policy policy;
  final VoidCallback onVote;

  @override
  Widget build(BuildContext context) {
    final title = policy.canVote ? 'Ready for your feedback' : 'Voting paused';
    final message =
        policy.canVote
            ? 'Submit one rating for this policy. A comment is optional.'
            : 'This policy is visible, but voting is temporarily paused.';

    return AppCard(
      margin: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 6),
          Text(message, style: const TextStyle(color: AppTheme.mutedText)),
          const SizedBox(height: 16),
          AppButton(
            label: 'Vote on policy',
            icon: Icons.how_to_vote_rounded,
            onPressed: policy.canVote ? onVote : null,
          ),
        ],
      ),
    );
  }
}

class _VoteSheet extends StatefulWidget {
  const _VoteSheet({required this.policy});

  final Policy policy;

  @override
  State<_VoteSheet> createState() => _VoteSheetState();
}

class _VoteSheetState extends State<_VoteSheet> {
  dynamic _voteValue;
  final _commentController = TextEditingController();

  @override
  void initState() {
    super.initState();
    // Initialize default values based on poll type
    switch (widget.policy.pollType) {
      case 'rating':
      case 'likert':
        _voteValue = 5;
        break;
      case 'binary':
        _voteValue = null;
        break;
      case 'approval':
        _voteValue = null;
        break;
      case 'multipleChoice':
        _voteValue = <String>[];
        break;
      case 'rankedChoice':
        _voteValue = <String>[];
        break;
    }
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
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
        return 'Select options';
      case 'likert':
        return 'Rate on scale';
      case 'approval':
        return 'Approve or reject';
      case 'rating':
        return 'Rate policy';
      case 'rankedChoice':
        return 'Rank your choices';
      default:
        return 'Vote on policy';
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    return BlocConsumer<VoteCubit, VoteState>(
      listener: (context, state) {
        if (state.status == RequestStatus.success) {
          final message = state.message ?? 'Vote submitted successfully!';
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(message),
              backgroundColor: Colors.green,
              duration: const Duration(seconds: 3),
            ),
          );
          Navigator.of(context).pop(true);
        } else if (state.status == RequestStatus.failure) {
          final errorMessage = state.message ?? 'Failed to submit vote. Please try again.';
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(errorMessage),
              backgroundColor: Colors.red,
              duration: const Duration(seconds: 4),
            ),
          );
        }
      },
      builder: (context, state) {
        return Container(
          margin: EdgeInsets.only(bottom: bottom),
          padding: const EdgeInsets.fromLTRB(18, 16, 18, 22),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 44,
                  height: 5,
                  decoration: BoxDecoration(
                    color: const Color(0xFFD8E2EA),
                    borderRadius: BorderRadius.circular(99),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              Text(
                _pollTypeLabel,
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 4),
              Text(
                widget.policy.title,
                style: const TextStyle(color: AppTheme.mutedText),
              ),
              const SizedBox(height: 18),
              _buildVoteWidget(),
              const SizedBox(height: 16),
              AppTextField(
                controller: _commentController,
                label: 'Comment (optional)',
                icon: Icons.chat_bubble_outline_rounded,
                maxLines: 4,
                maxLength: 2000,
              ),
              const SizedBox(height: 12),
              AppButton(
                label: 'Submit vote',
                icon: Icons.send_rounded,
                loading: state.status == RequestStatus.loading,
                onPressed: _canSubmit
                    ? () => context.read<VoteCubit>().submitVote(
                          policyId: widget.policy.id,
                          value: _voteValue,
                          comment: _commentController.text,
                        )
                    : null,
              ),
            ],
          ),
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
            size: 34,
          ),
        );
    }
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: AppTheme.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 17, color: AppTheme.primary),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(
              color: AppTheme.primary,
              fontWeight: FontWeight.w800,
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
    return Padding(
      padding: const EdgeInsets.only(top: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 19, color: AppTheme.primary),
          const SizedBox(width: 10),
          SizedBox(
            width: 72,
            child: Text(
              label,
              style: const TextStyle(
                color: AppTheme.mutedText,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w800),
            ),
          ),
        ],
      ),
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
      child: Column(
        children: [
          PostCommentWidget(
            policyId: policy.id,
            onCommentPosted: () {
              // Refresh comments after posting
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
    );
  }
}
