import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/di/service_locator.dart';
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
  final _organizationController = TextEditingController();
  final _reasonController = TextEditingController();

  @override
  void dispose() {
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
          );
    }
  }

  @override
  Widget build(BuildContext context) {
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
                backgroundColor: Colors.green,
              ),
            );
            Navigator.of(context).pop();
          } else if (state is PlannerRequestError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Colors.red,
              ),
            );
          }
        },
        builder: (context, state) {
          final isLoading = state is PlannerRequestLoading;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'Apply to become a policy planner',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Planners can create and manage policy proposals. Your request will be reviewed by administrators.',
                    style: TextStyle(color: Colors.grey),
                  ),
                  const SizedBox(height: 24),
                  TextFormField(
                    controller: _organizationController,
                    decoration: const InputDecoration(
                      labelText: 'Organization (Optional)',
                      hintText: 'e.g., Ministry of Education',
                      border: OutlineInputBorder(),
                      helperText:
                          'Name of your affiliated organization, if any',
                    ),
                    enabled: !isLoading,
                    maxLength: 100,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _reasonController,
                    decoration: const InputDecoration(
                      labelText: 'Reason *',
                      hintText:
                          'Explain why you need planner privileges...',
                      border: OutlineInputBorder(),
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
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: isLoading ? null : _submitRequest,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: isLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                            ),
                          )
                        : const Text('Submit Request'),
                  ),
                  const SizedBox(height: 16),
                  if (state is PlannerRequestError &&
                      state.code == 'DUPLICATE_ENTRY')
                    Card(
                      color: Colors.orange.shade50,
                      child: Padding(
                        padding: const EdgeInsets.all(12.0),
                        child: Row(
                          children: [
                            Icon(
                              Icons.info_outline,
                              color: Colors.orange.shade700,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                'You already have a pending request. Please wait for admin review.',
                                style: TextStyle(
                                  color: Colors.orange.shade900,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  if (state is PlannerRequestError &&
                      state.code == 'RATE_LIMIT_EXCEEDED')
                    Card(
                      color: Colors.red.shade50,
                      child: Padding(
                        padding: const EdgeInsets.all(12.0),
                        child: Row(
                          children: [
                            Icon(
                              Icons.timer_outlined,
                              color: Colors.red.shade700,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                'You can only submit one request per day. Please try again later.',
                                style: TextStyle(
                                  color: Colors.red.shade900,
                                ),
                              ),
                            ),
                          ],
                        ),
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
