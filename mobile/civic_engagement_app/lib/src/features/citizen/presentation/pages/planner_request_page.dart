import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/di/service_locator.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../auth/domain/repositories/auth_repository.dart';
import '../../domain/repositories/citizen_repository.dart';
import '../cubit/planner_request_cubit.dart';
import '../cubit/planner_request_state.dart';

class PlannerRequestPage extends StatelessWidget {
  const PlannerRequestPage({super.key});

  static const routeName = '/planner-request';

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => PlannerRequestCubit(
        serviceLocator<CitizenRepository>(),
      ),
      child: const _PlannerRequestView(),
    );
  }
}

class _PlannerRequestView extends StatefulWidget {
  const _PlannerRequestView();

  @override
  State<_PlannerRequestView> createState() => _PlannerRequestViewState();
}

class _PlannerRequestViewState extends State<_PlannerRequestView> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _regionController = TextEditingController();
  final _organizationController = TextEditingController();
  final _reasonController = TextEditingController();
  late final bool _hasSession;
  String _applicantType = 'nonCitizen';

  @override
  void initState() {
    super.initState();
    _hasSession = serviceLocator<AuthRepository>().restoreSession() != null;
    if (_hasSession) {
      _applicantType = 'citizen';
    }
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _regionController.dispose();
    _organizationController.dispose();
    _reasonController.dispose();
    super.dispose();
  }

  void _submitRequest() {
    if (_formKey.currentState?.validate() ?? false) {
      context.read<PlannerRequestCubit>().submitRequest(
            organization: _organizationController.text.trim().isEmpty
                ? null
                : _organizationController.text.trim(),
            reason: _reasonController.text.trim(),
            applicantType: _applicantType,
            fullName: _hasSession ? null : _fullNameController.text.trim(),
            email: _hasSession ? null : _emailController.text.trim(),
            phone: _hasSession || _phoneController.text.trim().isEmpty
                ? null
                : _phoneController.text.trim(),
            region: _hasSession ? null : _regionController.text.trim(),
          );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Request Planner Status'),
      ),
      body: BlocConsumer<PlannerRequestCubit, PlannerRequestState>(
        listener: (context, state) {
          if (state is PlannerRequestSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Colors.green.shade600,
              ),
            );
            Navigator.of(context).pop();
          } else if (state is PlannerRequestError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Colors.redAccent,
              ),
            );
          }
        },
        builder: (context, state) {
          final isLoading = state is PlannerRequestLoading;

          return SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Apply to become a policy planner',
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Planners can create and manage policy proposals. You can submit this request with or without a citizen login.',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 32),
                  if (!_hasSession) ...[
                    DropdownButtonFormField<String>(
                      value: _applicantType,
                      decoration: const InputDecoration(
                        labelText: 'I am applying as',
                      ),
                      icon: const Icon(Icons.keyboard_arrow_down_rounded),
                      items: const [
                        DropdownMenuItem(
                          value: 'nonCitizen',
                          child: Text('Not a registered citizen'),
                        ),
                        DropdownMenuItem(
                          value: 'citizen',
                          child: Text('Registered citizen, not logged in'),
                        ),
                      ],
                      onChanged: isLoading
                          ? null
                          : (value) {
                              if (value != null) {
                                setState(() => _applicantType = value);
                              }
                            },
                    ),
                    const SizedBox(height: 20),
                    TextFormField(
                      controller: _fullNameController,
                      decoration: const InputDecoration(
                        labelText: 'Full name *',
                        prefixIcon: Icon(Icons.person_outline_rounded),
                      ),
                      enabled: !isLoading,
                      maxLength: 100,
                      validator: (value) {
                        if (_hasSession) return null;
                        if ((value ?? '').trim().isEmpty) {
                          return 'Full name is required';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _emailController,
                      decoration: const InputDecoration(
                        labelText: 'Email *',
                        prefixIcon: Icon(Icons.email_outlined),
                      ),
                      keyboardType: TextInputType.emailAddress,
                      enabled: !isLoading,
                      validator: (value) {
                        if (_hasSession) return null;
                        final trimmed = (value ?? '').trim();
                        if (trimmed.isEmpty) return 'Email is required';
                        if (!trimmed.contains('@')) {
                          return 'Enter a valid email';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 20),
                    TextFormField(
                      controller: _phoneController,
                      decoration: const InputDecoration(
                        labelText: 'Phone (Optional)',
                        hintText: '+251912345678',
                        prefixIcon: Icon(Icons.phone_outlined),
                      ),
                      keyboardType: TextInputType.phone,
                      enabled: !isLoading,
                    ),
                    const SizedBox(height: 20),
                    TextFormField(
                      controller: _regionController,
                      decoration: const InputDecoration(
                        labelText: 'Region *',
                        prefixIcon: Icon(Icons.map_outlined),
                      ),
                      enabled: !isLoading,
                      maxLength: 80,
                      validator: (value) {
                        if (_hasSession) return null;
                        if ((value ?? '').trim().isEmpty) {
                          return 'Region is required';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 8),
                  ],
                  TextFormField(
                    controller: _organizationController,
                    decoration: const InputDecoration(
                      labelText: 'Organization (Optional)',
                      hintText: 'e.g., Ministry of Education',
                      prefixIcon: Icon(Icons.business_outlined),
                      helperText: 'Name of your affiliated organization, if any',
                    ),
                    enabled: !isLoading,
                    maxLength: 100,
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _reasonController,
                    decoration: const InputDecoration(
                      labelText: 'Reason *',
                      hintText: 'Explain why you need planner privileges...',
                      alignLabelWithHint: true,
                      helperText: 'Minimum 50 characters required',
                    ),
                    maxLines: 5,
                    maxLength: 500,
                    enabled: !isLoading,
                    validator: (value) {
                      final trimmed = value?.trim() ?? '';
                      if (trimmed.isEmpty) {
                        return 'Please provide a reason';
                      }
                      if (trimmed.length < 50) {
                        return 'Reason must be at least 50 characters (${trimmed.length}/50)';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 32),
                  AppButton(
                    label: 'Submit Request',
                    icon: Icons.send_rounded,
                    loading: isLoading,
                    onPressed: _submitRequest,
                  ),
                  const SizedBox(height: 24),
                  if (state is PlannerRequestError &&
                      state.code == 'DUPLICATE_ENTRY')
                    AppCard(
                      color: Colors.orange.shade50,
                      padding: const EdgeInsets.all(16.0),
                      child: Row(
                        children: [
                          Icon(
                            Icons.info_outline_rounded,
                            color: Colors.orange.shade800,
                            size: 28,
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Text(
                              'You already have a pending request. Please wait for admin review.',
                              style: TextStyle(
                                color: Colors.orange.shade900,
                                fontWeight: FontWeight.w600,
                                height: 1.4,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  if (state is PlannerRequestError &&
                      state.code == 'RATE_LIMIT_EXCEEDED')
                    AppCard(
                      color: Colors.red.shade50,
                      padding: const EdgeInsets.all(16.0),
                      child: Row(
                        children: [
                          Icon(
                            Icons.timer_outlined,
                            color: Colors.red.shade800,
                            size: 28,
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Text(
                              'You can only submit one request per day. Please try again later.',
                              style: TextStyle(
                                color: Colors.red.shade900,
                                fontWeight: FontWeight.w600,
                                height: 1.4,
                              ),
                            ),
                          ),
                        ],
                      ),
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
