import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/state/request_status.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/date_formatters.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/app_text_field.dart';
import '../../../../core/widgets/error_view.dart';
import '../../domain/entities/policy.dart';
import '../cubit/history_cubit.dart';
import '../cubit/policy_cubit.dart';
import '../cubit/vote_cubit.dart';
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
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PolicyCubit>().loadPolicy(widget.policyId);
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

        return Scaffold(
          appBar: AppBar(title: const Text('Policy details')),
          body:
              failed
                  ? ErrorView(
                    message: state.message ?? 'Policy could not be loaded.',
                    onRetry:
                        () => context.read<PolicyCubit>().loadPolicy(
                          widget.policyId,
                        ),
                  )
                  : RefreshIndicator(
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
              _InfoChip(
                icon: Icons.star_rounded,
                label: '${policy.averageRating.toStringAsFixed(1)} average',
              ),
              _InfoChip(
                icon: Icons.how_to_vote_outlined,
                label: '${policy.totalVotes} votes',
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
  int _rating = 5;
  final _commentController = TextEditingController();

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    return BlocConsumer<VoteCubit, VoteState>(
      listener: (context, state) {
        if (state.status == RequestStatus.success) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(state.message ?? 'Vote submitted.')),
          );
          Navigator.of(context).pop(true);
        }
        if (state.status == RequestStatus.failure && state.message != null) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text(state.message!)));
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
                'Rate policy',
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
              Center(
                child: RatingStars(
                  rating: _rating,
                  onChanged: (value) => setState(() => _rating = value),
                  size: 34,
                ),
              ),
              const SizedBox(height: 16),
              AppTextField(
                controller: _commentController,
                label: 'Comment (optional)',
                icon: Icons.chat_bubble_outline_rounded,
                maxLines: 4,
                maxLength: 500,
              ),
              const SizedBox(height: 12),
              AppButton(
                label: 'Submit vote',
                icon: Icons.send_rounded,
                loading: state.status == RequestStatus.loading,
                onPressed:
                    () => context.read<VoteCubit>().submitVote(
                      policyId: widget.policy.id,
                      rating: _rating,
                      comment: _commentController.text,
                    ),
              ),
            ],
          ),
        );
      },
    );
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
