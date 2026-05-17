import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../domain/entities/feed_policy.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/app_card.dart';

class FeedPolicyCard extends StatelessWidget {
  const FeedPolicyCard({
    required this.policy,
    required this.onTap,
    super.key,
  });

  final FeedPolicy policy;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('MMM dd, yyyy');

    return AppCard(
      onTap: onTap,
      margin: EdgeInsets.zero,
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  policy.title,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                        fontSize: 18,
                        height: 1.3,
                        letterSpacing: -0.3,
                      ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            policy.description,
            style: TextStyle(
              color: AppTheme.text.withValues(alpha: 0.7),
              height: 1.5,
              fontSize: 14,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 20),
          const Divider(height: 1),
          const SizedBox(height: 16),
          Wrap(
            spacing: 16,
            runSpacing: 12,
            children: [
              _InfoChip(
                icon: Icons.tag_rounded,
                label: policy.policyCode,
              ),
              _InfoChip(
                icon: Icons.how_to_vote_rounded,
                label: _formatPollType(policy.pollType),
              ),
              _InfoChip(
                icon: Icons.event_rounded,
                label: 'Ends ${dateFormat.format(policy.endDate)}',
              ),
            ],
          ),
          if (policy.targetRegions.isNotEmpty) ...[
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: policy.targetRegions
                  .map((region) => Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppTheme.background,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppTheme.border),
                        ),
                        child: Text(
                          region,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.mutedText,
                          ),
                        ),
                      ))
                  .toList(),
            ),
          ],
        ],
      ),
    );
  }

  String _formatPollType(String pollType) {
    switch (pollType) {
      case 'binary':
        return 'Yes/No';
      case 'multipleChoice':
        return 'Multiple Choice';
      case 'likert':
        return 'Likert Scale';
      case 'approval':
        return 'Approval';
      case 'rating':
        return 'Rating';
      case 'rankedChoice':
        return 'Ranked Choice';
      default:
        return pollType;
    }
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({
    required this.icon,
    required this.label,
  });

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 18, color: AppTheme.primary),
        const SizedBox(width: 6),
        Text(
          label,
          style: const TextStyle(
            color: AppTheme.text,
            fontWeight: FontWeight.w600,
            fontSize: 13,
          ),
        ),
      ],
    );
  }
}
