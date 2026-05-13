import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../domain/entities/feed_policy.dart';

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
    final theme = Theme.of(context);
    final dateFormat = DateFormat('MMM dd, yyyy');

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header with relevance badge
              Row(
                children: [
                  Expanded(
                    child: Text(
                      policy.title,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  _RelevanceBadge(score: policy.relevanceScore),
                ],
              ),
              const SizedBox(height: 8),

              // Policy code
              Text(
                policy.policyCode,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.primary,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 8),

              // Description
              Text(
                policy.description,
                style: theme.textTheme.bodyMedium,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 12),

              // Poll type and dates
              Wrap(
                spacing: 12,
                runSpacing: 8,
                children: [
                  _InfoChip(
                    icon: Icons.how_to_vote,
                    label: _formatPollType(policy.pollType),
                  ),
                  _InfoChip(
                    icon: Icons.calendar_today,
                    label: 'Ends ${dateFormat.format(policy.endDate)}',
                  ),
                ],
              ),

              // Regions
              if (policy.targetRegions.isNotEmpty) ...[
                const SizedBox(height: 8),
                Wrap(
                  spacing: 4,
                  runSpacing: 4,
                  children: policy.targetRegions
                      .map((region) => Chip(
                            label: Text(
                              region,
                              style: theme.textTheme.bodySmall,
                            ),
                            visualDensity: VisualDensity.compact,
                            materialTapTargetSize:
                                MaterialTapTargetSize.shrinkWrap,
                          ))
                      .toList(),
                ),
              ],
            ],
          ),
        ),
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

class _RelevanceBadge extends StatelessWidget {
  const _RelevanceBadge({required this.score});

  final double score;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = _getColorForScore(score);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color, width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.star, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            score.toStringAsFixed(1),
            style: theme.textTheme.bodySmall?.copyWith(
              color: color,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Color _getColorForScore(double score) {
    if (score >= 5.0) return Colors.green;
    if (score >= 3.0) return Colors.orange;
    return Colors.grey;
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
    final theme = Theme.of(context);

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: theme.colorScheme.secondary),
        const SizedBox(width: 4),
        Text(
          label,
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.secondary,
          ),
        ),
      ],
    );
  }
}
