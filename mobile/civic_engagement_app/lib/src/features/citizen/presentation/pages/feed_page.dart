import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/di/service_locator.dart';
import '../../domain/entities/policy.dart';
import '../../domain/entities/user_interaction.dart';
import '../../domain/repositories/citizen_repository.dart';
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
      appBar: AppBar(
        title: const Text('Personalized Feed'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => context.read<FeedCubit>().refresh(),
            tooltip: 'Refresh feed',
          ),
        ],
      ),
      body: BlocConsumer<FeedCubit, FeedState>(
        listener: (context, state) {
          if (state is FeedInteractionError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Failed to record interaction: ${state.message}'),
                backgroundColor: Colors.red,
              ),
            );
          }
        },
        builder: (context, state) {
          if (state is FeedLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (state is FeedError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 64, color: Colors.red),
                  const SizedBox(height: 16),
                  Text(
                    'Failed to load feed',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    state.message,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: () => context.read<FeedCubit>().loadFeed(),
                    icon: const Icon(Icons.refresh),
                    label: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          if (state is FeedLoaded) {
            if (state.policies.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.inbox_outlined, size: 64, color: Colors.grey),
                    const SizedBox(height: 16),
                    Text(
                      'No policies available',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Check back later for new policies',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              );
            }

            return RefreshIndicator(
              onRefresh: () async {
                context.read<FeedCubit>().refresh();
              },
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: state.policies.length,
                itemBuilder: (context, index) {
                  final feedPolicy = state.policies[index];
                  return FeedPolicyCard(
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
                        status: 'active', // Feed only shows active policies
                        pollType: feedPolicy.pollType,
                        totalVotes: 0,
                      );
                      
                      // Navigate to policy detail
                      Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) => MultiBlocProvider(
                            providers: [
                              BlocProvider(
                                create: (_) => PolicyCubit(serviceLocator()),
                              ),
                              BlocProvider(
                                create: (_) => VoteCubit(serviceLocator()),
                              ),
                              BlocProvider(
                                create: (_) => HistoryCubit(serviceLocator()),
                              ),
                              BlocProvider(
                                create: (_) => CommentCubit(serviceLocator()),
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
                  );
                },
              ),
            );
          }

          return const SizedBox.shrink();
        },
      ),
    );
  }
}
