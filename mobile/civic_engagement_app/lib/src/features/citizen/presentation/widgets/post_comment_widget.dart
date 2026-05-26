import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/app_button.dart';
import '../cubit/comment_cubit.dart';
import '../cubit/comment_state.dart';

class PostCommentWidget extends StatefulWidget {
  const PostCommentWidget({
    required this.policyId,
    this.parentCommentId,
    this.onCommentPosted,
    super.key,
  });

  final String policyId;
  final String? parentCommentId;
  final VoidCallback? onCommentPosted;

  @override
  State<PostCommentWidget> createState() => _PostCommentWidgetState();
}

class _PostCommentWidgetState extends State<PostCommentWidget> {
  final _textController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  void _submitComment() {
    print('[PostCommentWidget] _submitComment called');
    if (!_formKey.currentState!.validate()) {
      print('[PostCommentWidget] Form validation failed');
      return;
    }

    print('[PostCommentWidget] Form validated, posting comment...');
    print('  - policyId: ${widget.policyId}');
    print('  - text length: ${_textController.text.length}');
    print('  - parentCommentId: ${widget.parentCommentId}');
    
    context.read<CommentCubit>().postComment(
          policyId: widget.policyId,
          text: _textController.text,
          parentCommentId: widget.parentCommentId,
        );
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<CommentCubit, CommentState>(
      listener: (context, state) {
        print('[PostCommentWidget] State changed: ${state.runtimeType}');
        
        if (state is CommentPosted) {
          print('[PostCommentWidget] Comment posted successfully: ${state.message}');
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.message),
              backgroundColor: Colors.green.shade600,
            ),
          );
          _textController.clear();
          print('[PostCommentWidget] Calling onCommentPosted callback');
          widget.onCommentPosted?.call();
        } else if (state is CommentError) {
          print('[PostCommentWidget] Error posting comment: ${state.message}');
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.message),
              backgroundColor: Colors.redAccent,
            ),
          );
        }
      },
      builder: (context, state) {
        final isPosting = state is CommentPosting;

        return Container(
          margin: const EdgeInsets.fromLTRB(20, 16, 20, 16),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(32),
            boxShadow: [
              BoxShadow(
                color: AppTheme.primary.withValues(alpha: 0.05),
                blurRadius: 24,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Icon(
                      widget.parentCommentId != null
                          ? Icons.reply_rounded
                          : Icons.chat_bubble_outline_rounded,
                      color: AppTheme.primary,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      widget.parentCommentId != null
                          ? 'Reply to Comment'
                          : 'Join the Discussion',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.3,
                          ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _textController,
                  maxLines: 4,
                  maxLength: 2000,
                  decoration: InputDecoration(
                    hintText: 'Share your thoughts, concerns, or suggestions...',
                    filled: true,
                    fillColor: AppTheme.primary.withValues(alpha: 0.03),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(20),
                      borderSide: BorderSide.none,
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(20),
                      borderSide: BorderSide.none,
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(20),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.all(20),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Comment cannot be empty';
                    }
                    if (value.length > 2000) {
                      return 'Comment must be less than 2000 characters';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    if (widget.parentCommentId != null) ...[
                      TextButton(
                        onPressed: () => Navigator.pop(context),
                        style: TextButton.styleFrom(
                          foregroundColor: AppTheme.mutedText,
                          textStyle:
                              const TextStyle(fontWeight: FontWeight.w600),
                        ),
                        child: const Text('Cancel'),
                      ),
                      const SizedBox(width: 12),
                    ],
                    Expanded(
                      child: AppButton(
                        onPressed: isPosting ? null : _submitComment,
                        label: widget.parentCommentId != null
                            ? 'Post Reply'
                            : 'Post Comment',
                        icon: Icons.send_rounded,
                        loading: isPosting,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
