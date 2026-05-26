import 'package:flutter/material.dart';

import '../../../../core/theme/app_theme.dart';

class AppealCommentDialog extends StatefulWidget {
  const AppealCommentDialog({
    required this.onSubmit,
    this.initialReason,
    super.key,
  });

  final ValueChanged<String> onSubmit;
  final String? initialReason;

  @override
  State<AppealCommentDialog> createState() => _AppealCommentDialogState();
}

class _AppealCommentDialogState extends State<AppealCommentDialog> {
  late final TextEditingController _reasonController;

  @override
  void initState() {
    super.initState();
    _reasonController = TextEditingController(text: widget.initialReason);
  }

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  void _submit() {
    final reason = _reasonController.text.trim();
    if (reason.isEmpty) return;
    widget.onSubmit(reason);
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      title: const Text(
        'Appeal moderation',
        style: TextStyle(fontWeight: FontWeight.w800),
      ),
      content: TextField(
        controller: _reasonController,
        decoration: InputDecoration(
          hintText: 'Explain why this decision should be reconsidered...',
          hintStyle: const TextStyle(color: AppTheme.mutedText),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide(color: AppTheme.border),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: const BorderSide(color: AppTheme.primary, width: 2),
          ),
        ),
        maxLines: 4,
        maxLength: 500,
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text(
            'Cancel',
            style: TextStyle(fontWeight: FontWeight.w700),
          ),
        ),
        ElevatedButton(
          onPressed: _submit,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.primary,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            elevation: 0,
          ),
          child: const Text(
            'Submit appeal',
            style: TextStyle(fontWeight: FontWeight.w700),
          ),
        ),
      ],
    );
  }
}
