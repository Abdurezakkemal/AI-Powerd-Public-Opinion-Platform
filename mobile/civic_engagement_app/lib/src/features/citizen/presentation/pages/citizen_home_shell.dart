import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/di/service_locator.dart';
import '../../../../core/theme/app_theme.dart';
import '../../domain/repositories/citizen_repository.dart';
import '../cubit/feed_cubit.dart';
import '../cubit/notifications_cubit.dart';
import 'account_page.dart';
import 'feed_page.dart';
import 'history_page.dart';
import 'notifications_page.dart';
import 'policy_list_page.dart';

class CitizenHomeShell extends StatefulWidget {
  const CitizenHomeShell({super.key});

  @override
  State<CitizenHomeShell> createState() => _CitizenHomeShellState();
}

class _CitizenHomeShellState extends State<CitizenHomeShell> {
  int _selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _selectedIndex,
        children: [
          const PolicyListPage(),
          BlocProvider(
            create: (_) => FeedCubit(serviceLocator<CitizenRepository>()),
            child: const FeedPage(),
          ),
          const HistoryPage(),
          const NotificationsPage(),
          const AccountPage(),
        ],
      ),
      bottomNavigationBar: BlocBuilder<NotificationsCubit, NotificationsState>(
        builder: (context, state) {
          return Container(
            decoration: BoxDecoration(
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 30,
                  offset: const Offset(0, -10),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              child: BottomNavigationBar(
                currentIndex: _selectedIndex,
                onTap: (index) => setState(() => _selectedIndex = index),
                items: [
                  const BottomNavigationBarItem(
                    icon: Icon(Icons.policy_outlined),
                    activeIcon: Icon(Icons.policy_rounded),
                    label: 'Policies',
                  ),
                  const BottomNavigationBarItem(
                    icon: Icon(Icons.recommend_outlined),
                    activeIcon: Icon(Icons.recommend_rounded),
                    label: 'For You',
                  ),
                  const BottomNavigationBarItem(
                    icon: Icon(Icons.history_outlined),
                    activeIcon: Icon(Icons.history_rounded),
                    label: 'History',
                  ),
                  BottomNavigationBarItem(
                    icon: _BadgeIcon(
                      icon: Icons.notifications_none_rounded,
                      count: state.unreadCount,
                    ),
                    activeIcon: _BadgeIcon(
                      icon: Icons.notifications_rounded,
                      count: state.unreadCount,
                    ),
                    label: 'Alerts',
                  ),
                  const BottomNavigationBarItem(
                    icon: Icon(Icons.person_outline_rounded),
                    activeIcon: Icon(Icons.person_rounded),
                    label: 'Account',
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _BadgeIcon extends StatelessWidget {
  const _BadgeIcon({required this.icon, required this.count});

  final IconData icon;
  final int count;

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Icon(icon),
        if (count > 0)
          Positioned(
            right: -6,
            top: -4,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
              decoration: BoxDecoration(
                color: AppTheme.primary,
                borderRadius: BorderRadius.circular(99),
              ),
              child: Text(
                count > 9 ? '9+' : count.toString(),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
      ],
    );
  }
}
