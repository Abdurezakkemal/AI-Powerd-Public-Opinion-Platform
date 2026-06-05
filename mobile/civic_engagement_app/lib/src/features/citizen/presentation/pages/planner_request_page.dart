import 'dart:typed_data';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/di/service_locator.dart';
import '../../../../core/services/location_service.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../auth/domain/repositories/auth_repository.dart';
import '../../domain/entities/planner_request.dart';
import '../../domain/repositories/citizen_repository.dart';
import '../cubit/planner_request_cubit.dart';
import '../cubit/planner_request_state.dart';
import '../cubit/profile_cubit.dart';

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

class _HeaderCard extends StatelessWidget {
  const _HeaderCard({required this.theme});

  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: AppTheme.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(
              Icons.assignment_turned_in_outlined,
              color: AppTheme.primary,
              size: 28,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Apply to become a policy planner',
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Submit your applicant details, verified region, reason, and a supporting proof document for review.',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: AppTheme.mutedTextFor(context),
                    height: 1.45,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.icon, required this.title});

  final IconData icon;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: AppTheme.primary, size: 22),
        const SizedBox(width: 8),
        Text(
          title,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w900,
              ),
        ),
      ],
    );
  }
}

class _RegionVerifier extends StatelessWidget {
  const _RegionVerifier({
    required this.controller,
    required this.isLoading,
    required this.isDetectingLocation,
    required this.regionResolved,
    required this.onDetectLocation,
  });

  final TextEditingController controller;
  final bool isLoading;
  final bool isDetectingLocation;
  final bool regionResolved;
  final VoidCallback onDetectLocation;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.primary.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: regionResolved
              ? AppTheme.primary.withValues(alpha: 0.25)
              : Colors.orange.withValues(alpha: 0.35),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                regionResolved
                    ? Icons.verified_user_outlined
                    : Icons.location_searching_rounded,
                color: regionResolved ? AppTheme.primary : Colors.orange,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                regionResolved ? 'Region verified' : 'Region verification',
                style: TextStyle(
                  color: regionResolved ? AppTheme.primary : Colors.orange,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: controller,
                  readOnly: true,
                  decoration: const InputDecoration(
                    labelText: 'Region *',
                    prefixIcon: Icon(Icons.map_outlined),
                  ),
                  validator: (value) {
                    if ((value ?? '').trim().isEmpty) {
                      return 'Verify your region before submitting';
                    }
                    return null;
                  },
                ),
              ),
              const SizedBox(width: 10),
              SizedBox(
                width: 56,
                height: 56,
                child: FilledButton(
                  onPressed: isLoading || isDetectingLocation
                      ? null
                      : onDetectLocation,
                  style: FilledButton.styleFrom(
                    padding: EdgeInsets.zero,
                    backgroundColor: AppTheme.primary,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(18),
                    ),
                  ),
                  child: isDetectingLocation
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.4,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.my_location_rounded),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _PlannerRequestView extends StatefulWidget {
  const _PlannerRequestView();

  @override
  State<_PlannerRequestView> createState() => _PlannerRequestViewState();
}

class _PlannerRequestViewState extends State<_PlannerRequestView>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _regionController = TextEditingController();
  final _organizationController = TextEditingController();
  final _reasonController = TextEditingController();
  final _locationService = LocationService();
  late final bool _hasSession;
  late TabController _tabController;
  String _applicantType = 'nonCitizen';
  String? _ageRange;
  String? _gender;
  String? _occupation;
  String? _education;
  String? _preferredLanguage;
  final List<String> _languagesSpoken = [];
  Uint8List? _proofFileBytes;
  String? _proofFileName;
  String? _proofFileMimeType;
  bool _didPrefillProfile = false;
  bool _isDetectingLocation = false;
  bool _regionResolved = false;
  PlannerRequest? _currentRequest;
  bool _loadingStatus = false;

  @override
  void initState() {
    super.initState();
    _hasSession = serviceLocator<AuthRepository>().restoreSession() != null;
    if (_hasSession) {
      _applicantType = 'citizen';
      _loadRequestStatus();
    }
    _tabController = TabController(length: _hasSession ? 2 : 1, vsync: this);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_didPrefillProfile) return;
    _didPrefillProfile = true;
    _prefillFromProfile();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _fullNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _regionController.dispose();
    _organizationController.dispose();
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _loadRequestStatus() async {
    setState(() => _loadingStatus = true);
    try {
      final request =
          await serviceLocator<CitizenRepository>().getMyPlannerRequest();
      if (mounted) {
        setState(() {
          _currentRequest = request;
          _loadingStatus = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loadingStatus = false);
      }
    }
  }

  Future<void> _cancelRequest() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel Request'),
        content: const Text(
          'Are you sure you want to cancel your pending planner request?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('No'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Yes, Cancel'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await serviceLocator<CitizenRepository>().cancelMyPlannerRequest();
      if (mounted) {
        _showSnack('Request cancelled successfully');
        await _loadRequestStatus();
      }
    } catch (e) {
      if (mounted) {
        _showSnack('Failed to cancel request', isError: true);
      }
    }
  }

  void _submitRequest() {
    if (!_regionResolved || _regionController.text.trim().isEmpty) {
      _showSnack(
        'Please verify your region with location before submitting.',
        isError: true,
      );
      return;
    }

    if (_languagesSpoken.isEmpty) {
      _showSnack(
        'Please select at least one language spoken.',
        isError: true,
      );
      return;
    }

    if (_proofFileBytes == null) {
      _showSnack(
        'Please upload a supporting proof document.',
        isError: true,
      );
      return;
    }

    if (_formKey.currentState?.validate() ?? false) {
      context.read<PlannerRequestCubit>().submitRequest(
            organization: _organizationController.text.trim().isEmpty
                ? null
                : _organizationController.text.trim(),
            reason: _reasonController.text.trim(),
            applicantType: _applicantType,
            fullName: _fullNameController.text.trim(),
            email: _emailController.text.trim(),
            phone: _phoneController.text.trim(),
            region: _regionController.text.trim(),
            ageRange: _ageRange,
            gender: _gender,
            occupation: _occupation,
            education: _education,
            preferredLanguage: _preferredLanguage,
            languagesSpoken: _languagesSpoken.isEmpty ? null : _languagesSpoken,
            proofFileBytes: _proofFileBytes,
            proofFileName: _proofFileName,
            proofFileMimeType: _proofFileMimeType,
          );
    }
  }

  Future<void> _prefillFromProfile() async {
    if (!_hasSession) return;

    try {
      final profile = context.read<ProfileCubit>().state.profile;
      if (profile != null) {
        _fullNameController.text = profile.fullName ?? _fullNameController.text;
        _emailController.text = profile.email;
        _phoneController.text = profile.phone ?? _phoneController.text;
        _regionController.text = profile.region;
        _regionResolved = profile.region.trim().isNotEmpty;
        if (mounted) setState(() {});
        return;
      }
    } catch (_) {}

    try {
      final profile = await serviceLocator<CitizenRepository>().getProfile();
      if (!mounted) return;
      setState(() {
        _fullNameController.text = profile.fullName ?? _fullNameController.text;
        _emailController.text = profile.email;
        _phoneController.text = profile.phone ?? _phoneController.text;
        _regionController.text = profile.region;
        _regionResolved = profile.region.trim().isNotEmpty;
      });
    } catch (_) {}
  }

  Future<void> _detectLocation() async {
    setState(() => _isDetectingLocation = true);
    final region = await _locationService.getCurrentRegion();
    if (!mounted) return;

    if (region != null && region.trim().isNotEmpty) {
      setState(() {
        _regionController.text = region.trim();
        _regionResolved = true;
      });
      _showSnack('Location verified: ${region.trim()}');
    } else {
      setState(() => _regionResolved = false);
      _showSnack(
        'Please enable location access, then tap verify region again.',
        isError: true,
      );
    }

    if (mounted) {
      setState(() => _isDetectingLocation = false);
    }
  }

  Future<void> _pickProofFile() async {
    final result = await FilePicker.platform.pickFiles(
      allowMultiple: false,
      withData: true,
      type: FileType.custom,
      allowedExtensions: const [
        'pdf',
        'png',
        'jpg',
        'jpeg',
        'webp',
        'gif',
        'doc',
        'docx',
      ],
    );

    final file = result?.files.single;
    if (file == null) return;
    if (file.bytes == null) {
      _showSnack('Could not read the selected file.', isError: true);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      _showSnack('Proof file must be 5 MB or smaller.', isError: true);
      return;
    }

    setState(() {
      _proofFileBytes = file.bytes;
      _proofFileName = file.name;
      _proofFileMimeType = _mimeTypeFor(file.extension);
    });
  }

  void _removeProofFile() {
    setState(() {
      _proofFileBytes = null;
      _proofFileName = null;
      _proofFileMimeType = null;
    });
  }

  void _showSnack(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.redAccent : null,
      ),
    );
  }

  String _mimeTypeFor(String? extension) {
    switch (extension?.toLowerCase()) {
      case 'pdf':
        return 'application/pdf';
      case 'png':
        return 'image/png';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      default:
        return 'application/octet-stream';
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Request Planner Status'),
        bottom: _hasSession
            ? TabBar(
                controller: _tabController,
                tabs: const [
                  Tab(text: 'New Request'),
                  Tab(text: 'My Status'),
                ],
              )
            : null,
      ),
      body: BlocConsumer<PlannerRequestCubit, PlannerRequestState>(
        listener: (context, state) {
          if (state is PlannerRequestSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Colors.green.shade600,
                duration: const Duration(seconds: 4),
                behavior: SnackBarBehavior.floating,
              ),
            );
            // Clear form after successful submission
            _formKey.currentState?.reset();
            _organizationController.clear();
            _reasonController.clear();
            setState(() {
              _proofFileBytes = null;
              _proofFileName = null;
              _proofFileMimeType = null;
            });

            if (_hasSession) {
              _loadRequestStatus();
              _tabController.animateTo(1);
            } else {
              // Show success dialog for non-logged in users before closing
              showDialog(
                context: context,
                barrierDismissible: false,
                builder: (ctx) => AlertDialog(
                  title: const Text('Request Submitted'),
                  content: Text(state.message),
                  actions: [
                    TextButton(
                      onPressed: () {
                        Navigator.of(ctx).pop();
                        Navigator.of(context).pop();
                      },
                      child: const Text('OK'),
                    ),
                  ],
                ),
              );
            }
          } else if (state is PlannerRequestError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Colors.redAccent,
                duration: const Duration(seconds: 4),
                behavior: SnackBarBehavior.floating,
              ),
            );
          }
        },
        builder: (context, state) {
          final isLoading = state is PlannerRequestLoading;

          if (_hasSession) {
            return TabBarView(
              controller: _tabController,
              children: [
                _buildRequestForm(theme, isLoading, state),
                _buildStatusView(theme),
              ],
            );
          }

          return _buildRequestForm(theme, isLoading, state);
        },
      ),
    );
  }

  Widget _buildRequestForm(
    ThemeData theme,
    bool isLoading,
    PlannerRequestState state,
  ) {
    if (_hasSession && _currentRequest?.status == 'pending') {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.pending_actions_rounded,
                size: 80,
                color: Colors.orange.shade400,
              ),
              const SizedBox(height: 24),
              Text(
                'You already have a pending request',
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Text(
                'Please wait for admin review. Check the "My Status" tab for updates.',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: AppTheme.mutedTextFor(context),
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              OutlinedButton.icon(
                onPressed: () => _tabController.animateTo(1),
                icon: const Icon(Icons.visibility_rounded),
                label: const Text('View Status'),
              ),
            ],
          ),
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _HeaderCard(theme: theme),
            if (!_hasSession) ...[
              const SizedBox(height: 16),
              AppCard(
                child: DropdownButtonFormField<String>(
                  value: _applicantType,
                  decoration: const InputDecoration(
                    labelText: 'I am applying as',
                    prefixIcon: Icon(Icons.assignment_ind_outlined),
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
              ),
            ],
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const _SectionTitle(
                    icon: Icons.badge_outlined,
                    title: 'Applicant details',
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _fullNameController,
                    decoration: const InputDecoration(
                      labelText: 'Full name *',
                      prefixIcon: Icon(Icons.person_outline_rounded),
                    ),
                    enabled: !isLoading,
                    maxLength: 100,
                    validator: (value) {
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
                      final trimmed = (value ?? '').trim();
                      if (trimmed.isEmpty) return 'Email is required';
                      if (!trimmed.contains('@')) {
                        return 'Enter a valid email';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _phoneController,
                    decoration: const InputDecoration(
                      labelText: 'Phone *',
                      hintText: '+251912345678',
                      prefixIcon: Icon(Icons.phone_outlined),
                    ),
                    keyboardType: TextInputType.phone,
                    enabled: !isLoading,
                    validator: (value) {
                      if ((value ?? '').trim().isEmpty) {
                        return 'Phone is required';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  _RegionVerifier(
                    controller: _regionController,
                    isLoading: isLoading,
                    isDetectingLocation: _isDetectingLocation,
                    regionResolved: _regionResolved,
                    onDetectLocation: _detectLocation,
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    value: _ageRange,
                    decoration: const InputDecoration(
                      labelText: 'Age range *',
                      prefixIcon: Icon(Icons.calendar_today_outlined),
                    ),
                    items: const [
                      DropdownMenuItem(value: '18-24', child: Text('18-24')),
                      DropdownMenuItem(value: '25-34', child: Text('25-34')),
                      DropdownMenuItem(value: '35-44', child: Text('35-44')),
                      DropdownMenuItem(value: '45-54', child: Text('45-54')),
                      DropdownMenuItem(value: '55-64', child: Text('55-64')),
                      DropdownMenuItem(value: '65+', child: Text('65+')),
                    ],
                    onChanged: isLoading
                        ? null
                        : (value) => setState(() => _ageRange = value),
                    validator: (value) =>
                        value == null ? 'Age range is required' : null,
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    value: _gender,
                    decoration: const InputDecoration(
                      labelText: 'Gender *',
                      prefixIcon: Icon(Icons.person_outline),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'male', child: Text('Male')),
                      DropdownMenuItem(value: 'female', child: Text('Female')),
                      DropdownMenuItem(value: 'other', child: Text('Other')),
                      DropdownMenuItem(
                        value: 'prefer_not_to_say',
                        child: Text('Prefer not to say'),
                      ),
                    ],
                    onChanged: isLoading
                        ? null
                        : (value) => setState(() => _gender = value),
                    validator: (value) =>
                        value == null ? 'Gender is required' : null,
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    value: _occupation,
                    decoration: const InputDecoration(
                      labelText: 'Occupation *',
                      prefixIcon: Icon(Icons.work_outline),
                    ),
                    items: const [
                      DropdownMenuItem(
                          value: 'student', child: Text('Student')),
                      DropdownMenuItem(
                          value: 'teacher', child: Text('Teacher')),
                      DropdownMenuItem(
                        value: 'government_employee',
                        child: Text('Government Employee'),
                      ),
                      DropdownMenuItem(
                        value: 'private_sector',
                        child: Text('Private Sector'),
                      ),
                      DropdownMenuItem(
                        value: 'self_employed',
                        child: Text('Self Employed'),
                      ),
                      DropdownMenuItem(
                          value: 'unemployed', child: Text('Unemployed')),
                      DropdownMenuItem(
                          value: 'retired', child: Text('Retired')),
                      DropdownMenuItem(value: 'other', child: Text('Other')),
                    ],
                    onChanged: isLoading
                        ? null
                        : (value) => setState(() => _occupation = value),
                    validator: (value) =>
                        value == null ? 'Occupation is required' : null,
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    value: _education,
                    decoration: const InputDecoration(
                      labelText: 'Education level *',
                      prefixIcon: Icon(Icons.school_outlined),
                    ),
                    items: const [
                      DropdownMenuItem(
                          value: 'elementary', child: Text('Elementary')),
                      DropdownMenuItem(
                          value: 'high_school', child: Text('High School')),
                      DropdownMenuItem(
                          value: 'diploma', child: Text('Diploma')),
                      DropdownMenuItem(
                        value: 'bachelors',
                        child: Text("Bachelor's Degree"),
                      ),
                      DropdownMenuItem(
                        value: 'masters',
                        child: Text("Master's Degree"),
                      ),
                      DropdownMenuItem(value: 'phd', child: Text('PhD')),
                      DropdownMenuItem(value: 'other', child: Text('Other')),
                    ],
                    onChanged: isLoading
                        ? null
                        : (value) => setState(() => _education = value),
                    validator: (value) =>
                        value == null ? 'Education level is required' : null,
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    value: _preferredLanguage,
                    decoration: const InputDecoration(
                      labelText: 'Preferred language *',
                      prefixIcon: Icon(Icons.language_outlined),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'am', child: Text('Amharic')),
                      DropdownMenuItem(
                          value: 'om', child: Text('Afaan Oromoo')),
                      DropdownMenuItem(value: 'ti', child: Text('Tigrinya')),
                      DropdownMenuItem(value: 'en', child: Text('English')),
                    ],
                    onChanged: isLoading
                        ? null
                        : (value) => setState(() => _preferredLanguage = value),
                    validator: (value) =>
                        value == null ? 'Preferred language is required' : null,
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withValues(alpha: 0.04),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: AppTheme.primary.withValues(alpha: 0.15),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.translate_outlined,
                                color: AppTheme.primary, size: 20),
                            const SizedBox(width: 8),
                            const Text(
                              'Languages spoken *',
                              style: TextStyle(
                                  fontWeight: FontWeight.w700, fontSize: 13),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            _LanguageChip(
                              label: 'Amharic',
                              value: 'am',
                              selected: _languagesSpoken.contains('am'),
                              onChanged: (selected) {
                                setState(() {
                                  if (selected) {
                                    _languagesSpoken.add('am');
                                  } else {
                                    _languagesSpoken.remove('am');
                                  }
                                });
                              },
                            ),
                            _LanguageChip(
                              label: 'Oromo',
                              value: 'om',
                              selected: _languagesSpoken.contains('om'),
                              onChanged: (selected) {
                                setState(() {
                                  if (selected) {
                                    _languagesSpoken.add('om');
                                  } else {
                                    _languagesSpoken.remove('om');
                                  }
                                });
                              },
                            ),
                            _LanguageChip(
                              label: 'Tigrinya',
                              value: 'ti',
                              selected: _languagesSpoken.contains('ti'),
                              onChanged: (selected) {
                                setState(() {
                                  if (selected) {
                                    _languagesSpoken.add('ti');
                                  } else {
                                    _languagesSpoken.remove('ti');
                                  }
                                });
                              },
                            ),
                            _LanguageChip(
                              label: 'English',
                              value: 'en',
                              selected: _languagesSpoken.contains('en'),
                              onChanged: (selected) {
                                setState(() {
                                  if (selected) {
                                    _languagesSpoken.add('en');
                                  } else {
                                    _languagesSpoken.remove('en');
                                  }
                                });
                              },
                            ),
                          ],
                        ),
                        if (_languagesSpoken.isEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Text(
                              'Select at least one language',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.red.shade700,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const _SectionTitle(
                    icon: Icons.work_outline_rounded,
                    title: 'Planner request',
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _organizationController,
                    decoration: const InputDecoration(
                      labelText: 'Organization *',
                      hintText: 'e.g., Ministry of Education',
                      prefixIcon: Icon(Icons.business_outlined),
                      helperText: 'Name of your affiliated organization',
                    ),
                    enabled: !isLoading,
                    maxLength: 100,
                    validator: (value) {
                      if ((value ?? '').trim().isEmpty) {
                        return 'Organization is required';
                      }
                      return null;
                    },
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
                ],
              ),
            ),
            AppCard(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                children: [
                  Icon(
                    _proofFileBytes == null
                        ? Icons.attach_file_rounded
                        : Icons.description_outlined,
                    color: theme.colorScheme.primary,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      _proofFileName ?? 'Attach proof document *',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  if (_proofFileBytes != null)
                    IconButton(
                      tooltip: 'Remove file',
                      onPressed: isLoading ? null : _removeProofFile,
                      icon: const Icon(Icons.close_rounded),
                    ),
                  TextButton.icon(
                    onPressed: isLoading ? null : _pickProofFile,
                    icon: const Icon(Icons.upload_file_rounded),
                    label: Text(
                      _proofFileBytes == null ? 'Upload' : 'Replace',
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            AppButton(
              label: 'Submit Request',
              icon: Icons.send_rounded,
              loading: isLoading,
              onPressed: _submitRequest,
            ),
            const SizedBox(height: 24),
            if (state is PlannerRequestError && state.code == 'DUPLICATE_ENTRY')
              AppCard(
                color: Colors.orange.withValues(
                  alpha: AppTheme.isDark(context) ? 0.14 : 0.08,
                ),
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
                color: Colors.red.withValues(
                  alpha: AppTheme.isDark(context) ? 0.14 : 0.08,
                ),
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
  }

  Widget _buildStatusView(ThemeData theme) {
    if (_loadingStatus) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_currentRequest == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.assignment_outlined,
                size: 80,
                color: AppTheme.mutedTextFor(context).withValues(alpha: 0.5),
              ),
              const SizedBox(height: 24),
              Text(
                'No Request Found',
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                "You haven't submitted a planner request yet.",
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: AppTheme.mutedTextFor(context),
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: () => _tabController.animateTo(0),
                icon: const Icon(Icons.add_rounded),
                label: const Text('Submit Request'),
              ),
            ],
          ),
        ),
      );
    }

    final request = _currentRequest!;
    final status = request.status ?? 'pending';
    final isPending = status == 'pending';
    final isApproved = status == 'approved';
    final isRejected = status == 'rejected';
    final isCancelled = status == 'cancelled';

    Color statusColor = Colors.orange;
    IconData statusIcon = Icons.pending_actions_rounded;
    String statusText = 'Pending Review';

    if (isApproved) {
      statusColor = Colors.green;
      statusIcon = Icons.check_circle_rounded;
      statusText = 'Approved';
    } else if (isRejected) {
      statusColor = Colors.red;
      statusIcon = Icons.cancel_rounded;
      statusText = 'Rejected';
    } else if (isCancelled) {
      statusColor = AppTheme.mutedTextFor(context);
      statusIcon = Icons.block_rounded;
      statusText = 'Cancelled';
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: statusColor.withValues(alpha: 0.3)),
            ),
            child: Column(
              children: [
                Icon(statusIcon, size: 60, color: statusColor),
                const SizedBox(height: 16),
                Text(
                  statusText,
                  style: theme.textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: statusColor,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _getStatusDescription(status),
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: AppTheme.mutedTextFor(context),
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Request Details',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),
                _buildDetailRow('Organization', request.organization ?? 'N/A'),
                _buildDetailRow('Region', request.region ?? 'N/A'),
                _buildDetailRow('Age Range', request.ageRange ?? 'N/A'),
                _buildDetailRow('Gender', request.gender ?? 'N/A'),
                _buildDetailRow('Occupation', request.occupation ?? 'N/A'),
                _buildDetailRow('Education', request.education ?? 'N/A'),
                _buildDetailRow(
                  'Submitted',
                  request.createdAt != null
                      ? _formatDate(request.createdAt!)
                      : 'N/A',
                ),
                if (request.reviewedAt != null)
                  _buildDetailRow(
                    'Reviewed',
                    _formatDate(request.reviewedAt!),
                  ),
              ],
            ),
          ),
          if (request.rejectionReason != null) ...[
            const SizedBox(height: 16),
            AppCard(
              color: Colors.red.withValues(
                alpha: AppTheme.isDark(context) ? 0.14 : 0.08,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.info_outline, color: Colors.red.shade700),
                      const SizedBox(width: 8),
                      Text(
                        'Rejection Reason',
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: Colors.red.shade700,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    request.rejectionReason!,
                    style: TextStyle(
                      color: Colors.red.shade900,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
          ],
          if (isPending) ...[
            const SizedBox(height: 24),
            OutlinedButton.icon(
              onPressed: _cancelRequest,
              icon: const Icon(Icons.cancel_outlined),
              label: const Text('Cancel Request'),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.red,
                side: const BorderSide(color: Colors.red),
              ),
            ),
          ],
          if (isRejected || isCancelled) ...[
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: () {
                _tabController.animateTo(0);
                _clearForm();
              },
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Submit New Request'),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: AppTheme.mutedTextFor(context),
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }

  String _getStatusDescription(String status) {
    switch (status) {
      case 'pending':
        return 'Your request is being reviewed by administrators. You will be notified once a decision is made.';
      case 'approved':
        return 'Congratulations! Your request has been approved. Please log out and log back in to access planner features.';
      case 'rejected':
        return 'Your request was not approved. Please review the rejection reason below.';
      case 'cancelled':
        return 'You cancelled this request. You can submit a new request anytime.';
      default:
        return '';
    }
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year} at ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
  }

  void _clearForm() {
    _fullNameController.clear();
    _emailController.clear();
    _phoneController.clear();
    _regionController.clear();
    _organizationController.clear();
    _reasonController.clear();
    setState(() {
      _ageRange = null;
      _gender = null;
      _occupation = null;
      _education = null;
      _preferredLanguage = null;
      _languagesSpoken.clear();
      _proofFileBytes = null;
      _proofFileName = null;
      _proofFileMimeType = null;
      _regionResolved = false;
    });
    _prefillFromProfile();
  }
}

class _LanguageChip extends StatelessWidget {
  const _LanguageChip({
    required this.label,
    required this.value,
    required this.selected,
    required this.onChanged,
  });

  final String label;
  final String value;
  final bool selected;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return FilterChip(
      label: Text(label),
      selected: selected,
      onSelected: onChanged,
      selectedColor: AppTheme.primary.withValues(alpha: 0.15),
      checkmarkColor: AppTheme.primary,
      side: BorderSide(
        color: selected
            ? AppTheme.primary
            : AppTheme.primary.withValues(alpha: 0.2),
      ),
    );
  }
}
