import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/di/service_locator.dart';
import '../../../../core/layout/responsive_layout.dart';
import '../../../../core/localization/app_localizations.dart';
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
    final l10n = AppLocalizations.of(context);
    final useSideNavigation = ResponsiveLayout.useSideNavigation(context);
    final pages = [
      const PolicyListPage(),
      const NotificationsPage(),
      BlocProvider(
        create: (_) => FeedCubit(serviceLocator<CitizenRepository>()),
        child: const FeedPage(),
      ),
      const HistoryPage(),
      const AccountPage(),
    ];

    return Scaffold(
      extendBody: true,
      body: BlocBuilder<NotificationsCubit, NotificationsState>(
        builder: (context, state) {
          if (useSideNavigation) {
            return Row(
              children: [
                NavigationRail(
                  selectedIndex: _selectedIndex,
                  onDestinationSelected: (index) =>
                      setState(() => _selectedIndex = index),
                  extended: ResponsiveLayout.width(context) >= 1120,
                  backgroundColor: AppTheme.surfaceFor(context),
                  indicatorColor: AppTheme.primary.withValues(alpha: 0.12),
                  selectedIconTheme: const IconThemeData(
                    color: AppTheme.primary,
                    size: 24,
                  ),
                  unselectedIconTheme: IconThemeData(
                    color: AppTheme.mutedTextFor(context),
                    size: 22,
                  ),
                  selectedLabelTextStyle: const TextStyle(
                    color: AppTheme.primary,
                    fontWeight: FontWeight.w700,
                  ),
                  unselectedLabelTextStyle: TextStyle(
                    color: AppTheme.mutedTextFor(context),
                    fontWeight: FontWeight.w600,
                  ),
                  leading: Padding(
                    padding: const EdgeInsets.only(top: 16),
                    child: Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(18),
                      ),
                      child: const Icon(
                        Icons.forum_rounded,
                        color: AppTheme.primary,
                      ),
                    ),
                  ),
                  destinations: [
                    NavigationRailDestination(
                      icon: const Icon(Icons.policy_outlined),
                      selectedIcon: const Icon(Icons.policy_rounded),
                      label: Text(l10n.t('nav.policies')),
                    ),
                    NavigationRailDestination(
                      icon: _RailBadgeIcon(
                        icon: Icons.notifications_none_rounded,
                        count: state.unreadCount,
                      ),
                      selectedIcon: _RailBadgeIcon(
                        icon: Icons.notifications_rounded,
                        count: state.unreadCount,
                        selected: true,
                      ),
                      label: Text(l10n.t('nav.notifications')),
                    ),
                    NavigationRailDestination(
                      icon: const Icon(Icons.auto_awesome_outlined),
                      selectedIcon: const Icon(Icons.auto_awesome_rounded),
                      label: Text(l10n.t('nav.feed')),
                    ),
                    NavigationRailDestination(
                      icon: const Icon(Icons.history_outlined),
                      selectedIcon: const Icon(Icons.history_rounded),
                      label: Text(l10n.t('nav.history')),
                    ),
                    NavigationRailDestination(
                      icon: const Icon(Icons.person_outline_rounded),
                      selectedIcon: const Icon(Icons.person_rounded),
                      label: Text(l10n.t('nav.account')),
                    ),
                  ],
                ),
                const VerticalDivider(width: 1),
                Expanded(
                  child: IndexedStack(
                    index: _selectedIndex,
                    children: pages,
                  ),
                ),
              ],
            );
          }

          return IndexedStack(
            index: _selectedIndex,
            children: pages,
          );
        },
      ),
      bottomNavigationBar: useSideNavigation
          ? null
          : BlocBuilder<NotificationsCubit, NotificationsState>(
              builder: (context, state) {
                final navHeight = ResponsiveLayout.navHeight(context);
                final centerButtonSize =
                    ResponsiveLayout.navCenterButtonSize(context);
                final horizontalPadding = ResponsiveLayout.pagePadding(context);
                final verticalPadding =
                    ResponsiveLayout.isLandscape(context) ? 6.0 : 8.0;

                return Container(
                  height: navHeight,
                  decoration: BoxDecoration(
                    color: AppTheme.primary,
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(
                        ResponsiveLayout.isCompact(context) ? 24 : 30,
                      ),
                      topRight: Radius.circular(
                        ResponsiveLayout.isCompact(context) ? 24 : 30,
                      ),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.primary.withValues(alpha: 0.3),
                        blurRadius: 20,
                        offset: const Offset(0, -5),
                      ),
                    ],
                  ),
                  child: SafeArea(
                    child: Padding(
                      padding: EdgeInsets.symmetric(
                        horizontal: horizontalPadding,
                        vertical: verticalPadding,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _NavBarItem(
                            icon: Icons.policy_outlined,
                            selectedIcon: Icons.policy_rounded,
                            label: l10n.t('nav.policies'),
                            isSelected: _selectedIndex == 0,
                            onTap: () => setState(() => _selectedIndex = 0),
                          ),
                          _NavBarItem(
                            icon: Icons.notifications_none_rounded,
                            selectedIcon: Icons.notifications_rounded,
                            label: l10n.t('nav.notifications'),
                            isSelected: _selectedIndex == 1,
                            badgeCount: state.unreadCount,
                            onTap: () => setState(() => _selectedIndex = 1),
                          ),
                          Transform.translate(
                            offset: Offset(
                              0,
                              ResponsiveLayout.isLandscape(context) ? -10 : -15,
                            ),
                            child: Container(
                              width: centerButtonSize,
                              height: centerButtonSize,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.15),
                                    blurRadius: 15,
                                    offset: const Offset(0, 5),
                                  ),
                                ],
                              ),
                              child: Material(
                                color: Colors.transparent,
                                child: InkWell(
                                  onTap: () =>
                                      setState(() => _selectedIndex = 2),
                                  borderRadius: BorderRadius.circular(50),
                                  child: Icon(
                                    _selectedIndex == 2
                                        ? Icons.auto_awesome_rounded
                                        : Icons.auto_awesome_outlined,
                                    color: AppTheme.primary,
                                    size: ResponsiveLayout.isCompact(context)
                                        ? 28
                                        : 32,
                                  ),
                                ),
                              ),
                            ),
                          ),
                          _NavBarItem(
                            icon: Icons.history_outlined,
                            selectedIcon: Icons.history_rounded,
                            label: l10n.t('nav.history'),
                            isSelected: _selectedIndex == 3,
                            onTap: () => setState(() => _selectedIndex = 3),
                          ),
                          _NavBarItem(
                            icon: Icons.person_outline_rounded,
                            selectedIcon: Icons.person_rounded,
                            label: l10n.t('nav.account'),
                            isSelected: _selectedIndex == 4,
                            onTap: () => setState(() => _selectedIndex = 4),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
    );
  }
}

class _RailBadgeIcon extends StatelessWidget {
  const _RailBadgeIcon({
    required this.icon,
    required this.count,
    this.selected = false,
  });

  final IconData icon;
  final int count;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Icon(
          icon,
          color: selected ? AppTheme.primary : AppTheme.mutedTextFor(context),
        ),
        if (count > 0)
          Positioned(
            right: -8,
            top: -6,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.redAccent,
                borderRadius: BorderRadius.circular(99),
              ),
              child: Text(
                count > 9 ? '9+' : count.toString(),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 9,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _NavBarItem extends StatelessWidget {
  const _NavBarItem({
    required this.icon,
    required this.selectedIcon,
    required this.label,
    required this.isSelected,
    required this.onTap,
    this.badgeCount = 0,
  });

  final IconData icon;
  final IconData selectedIcon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;
  final int badgeCount;

  @override
  Widget build(BuildContext context) {
    final iconSize = ResponsiveLayout.navIconSize(context);
    final labelSize = ResponsiveLayout.navLabelSize(context);

    return Expanded(
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(15),
          child: Container(
            padding: EdgeInsets.symmetric(
              vertical: ResponsiveLayout.isLandscape(context) ? 6 : 8,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Icon(
                      isSelected ? selectedIcon : icon,
                      color: isSelected
                          ? Colors.white
                          : Colors.white.withValues(alpha: 0.6),
                      size: iconSize,
                    ),
                    if (badgeCount > 0)
                      Positioned(
                        right: -8,
                        top: -4,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 5,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.redAccent,
                            borderRadius: BorderRadius.circular(99),
                            border: Border.all(
                              color: AppTheme.primary,
                              width: 1.5,
                            ),
                          ),
                          child: Text(
                            badgeCount > 9 ? '9+' : badgeCount.toString(),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  label,
                  style: TextStyle(
                    color: isSelected
                        ? Colors.white
                        : Colors.white.withValues(alpha: 0.7),
                    fontSize: labelSize,
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
