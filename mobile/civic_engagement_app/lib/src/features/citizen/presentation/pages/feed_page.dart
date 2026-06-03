import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/di/service_locator.dart';
import '../../../../core/localization/app_localizations.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/empty_state.dart';
import '../../../../core/widgets/error_view.dart';
import '../../domain/entities/policy.dart';
import '../../domain/entities/user_interaction.dart';
import '../cubit/comment_cubit.dart';
import '../cubit/feed_cubit.dart';
import '../cubit/feed_state.dart';
import '../cubit/history_cubit.dart';
import '../cubit/policy_cubit.dart';
import '../cubit/vote_cubit.dart';
import '../widgets/feed_policy_card.dart';
import 'policy_detail_page.dart';

class FeedPage extends StatefulWidget {
  const FeedPage({super.key});

  @override
  State<FeedPage> createState() => _FeedPageState();
}

class _FeedPageState extends State<FeedPage> {
  @override
  void initState() {
    super.initState();
    context.read<FeedCubit>().loadFeed();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: BlocConsumer<FeedCubit, FeedState>(
        listener: (context, state) {
          if (state is FeedInteractionError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Failed to record interaction: ${state.message}'),
                backgroundColor: Colors.redAccent,
              ),
            );
          }
        },
        builder: (context, state) {
          if (state is FeedLoading) {
            return const Center(
                child: CircularProgressIndicator(color: AppTheme.primary));
          }

          if (state is FeedError) {
            return ErrorView(
              message: state.message,
              onRetry: () => context.read<FeedCubit>().loadFeed(),
            );
          }

          if (state is FeedLoaded) {
            if (state.policies.isEmpty) {
              return EmptyState(
                icon: Icons.explore_rounded,
                title: AppLocalizations.of(context).t('feed.empty'),
                message: AppLocalizations.of(context).t('feed.empty_message'),
              );
            }

            return RefreshIndicator(
              color: AppTheme.primary,
              backgroundColor: Colors.white,
              onRefresh: () async {
                context.read<FeedCubit>().refresh();
              },
              child: CustomScrollView(
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
                              Text(
                                AppLocalizations.of(context)
                                    .t('personalized_feed'),
                                style: const TextStyle(
                                  fontSize: 28,
                                  fontWeight: FontWeight.w900,
                                  color: AppTheme.text,
                                  letterSpacing: 0,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color:
                                      AppTheme.primary.withValues(alpha: 0.1),
                                  shape: BoxShape.circle,
                                ),
                                child: IconButton(
                                  tooltip: 'Refresh',
                                  onPressed: () =>
                                      context.read<FeedCubit>().refresh(),
                                  icon: const Icon(
                                    Icons.refresh_rounded,
                                    color: AppTheme.primary,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                  // Content
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
                    sliver: SliverList.builder(
                      itemCount: state.policies.length,
                      itemBuilder: (context, index) {
                        final feedPolicy = state.policies[index];
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: FeedPolicyCard(
                            policy: feedPolicy,
                            onTap: () {
                              // Record view interaction (fire and forget)
                              context.read<FeedCubit>().recordInteraction(
                                    policyId: feedPolicy.id,
                                    type: InteractionType.view,
                                  );

                              // Convert FeedPolicy to minimal Policy for initial display
                              final initialPolicy = Policy(
                                id: feedPolicy.id,
                                title: feedPolicy.title,
                                description: feedPolicy.description,
                                policyCode: feedPolicy.policyCode,
                                targetRegions: feedPolicy.targetRegions,
                                startDate: feedPolicy.startDate,
                                endDate: feedPolicy.endDate,
                                status:
                                    'active', // Feed only shows active policies
                                pollType: feedPolicy.pollType,
                                totalVotes: 0,
                              );

                              // Navigate to policy detail
                              Navigator.of(context).push(
                                MaterialPageRoute<void>(
                                  builder: (_) => MultiBlocProvider(
                                    providers: [
                                      BlocProvider(
                                        create: (_) =>
                                            PolicyCubit(serviceLocator()),
                                      ),
                                      BlocProvider(
                                        create: (_) =>
                                            VoteCubit(serviceLocator()),
                                      ),
                                      BlocProvider(
                                        create: (_) =>
                                            HistoryCubit(serviceLocator())
                                              ..loadHistory(),
                                      ),
                                      BlocProvider(
                                        create: (_) =>
                                            CommentCubit(serviceLocator()),
                                      ),
                                    ],
                                    child: PolicyDetailPage(
                                      policyId: feedPolicy.id,
                                      initialPolicy: initialPolicy,
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            );
          }

          return const SizedBox.shrink();
        },
      ),
    );
  }
}
