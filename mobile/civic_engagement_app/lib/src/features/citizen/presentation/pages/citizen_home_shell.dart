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
      extendBody: true,
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
            margin: const EdgeInsets.only(left: 20, right: 20, bottom: 24),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(40),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.08),
                  blurRadius: 30,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(40),
              child: NavigationBar(
                selectedIndex: _selectedIndex,
                onDestinationSelected: (index) =>
                    setState(() => _selectedIndex = index),
                backgroundColor: Colors.white,
                elevation: 0,
                height: 70,
                indicatorColor: AppTheme.primary.withValues(alpha: 0.15),
                labelBehavior: NavigationDestinationLabelBehavior.alwaysHide,
                destinations: [
                  const NavigationDestination(
                    icon: Icon(Icons.policy_outlined, size: 30),
                    selectedIcon: Icon(Icons.policy_rounded,
                        color: AppTheme.primary, size: 30),
                    label: 'Policies',
                  ),
                  const NavigationDestination(
                    icon: Icon(Icons.dynamic_feed_outlined, size: 30),
                    selectedIcon: Icon(
                      Icons.dynamic_feed_rounded,
                      color: AppTheme.primary,
                      size: 30,
                    ),
                    label: 'For You',
                  ),
                  const NavigationDestination(
                    icon: Icon(Icons.history_outlined, size: 30),
                    selectedIcon: Icon(Icons.history_rounded,
                        color: AppTheme.primary, size: 30),
                    label: 'History',
                  ),
                  NavigationDestination(
                    icon: _BadgeIcon(
                      icon: Icons.notifications_none_rounded,
                      count: state.unreadCount,
                    ),
                    selectedIcon: _BadgeIcon(
                      icon: Icons.notifications_rounded,
                      count: state.unreadCount,
                      color: AppTheme.primary,
                    ),
                    label: 'Alerts',
                  ),
                  const NavigationDestination(
                    icon: Icon(Icons.person_outline_rounded, size: 30),
                    selectedIcon: Icon(Icons.person_rounded,
                        color: AppTheme.primary, size: 30),
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
  const _BadgeIcon({required this.icon, required this.count, this.color});

  final IconData icon;
  final int count;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Icon(icon, color: color, size: 30),
        if (count > 0)
          Positioned(
            right: -6,
            top: -4,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.redAccent,
                borderRadius: BorderRadius.circular(99),
                border: Border.all(color: Colors.white, width: 1.5),
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
