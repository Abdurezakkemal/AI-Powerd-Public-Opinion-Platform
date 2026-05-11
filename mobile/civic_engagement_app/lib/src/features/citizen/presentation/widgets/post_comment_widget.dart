import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

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
    if (!_formKey.currentState!.validate()) return;

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
        if (state is CommentPosted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.message),
              backgroundColor: Colors.green,
              duration: const Duration(seconds: 3),
            ),
          );
          _textController.clear();
          widget.onCommentPosted?.call();
        } else if (state is CommentError) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.message),
              backgroundColor: Colors.red,
              duration: const Duration(seconds: 4),
            ),
          );
        }
      },
      builder: (context, state) {
        final isPosting = state is CommentPosting;

        return Card(
          margin: const EdgeInsets.all(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    widget.parentCommentId != null
                        ? 'Reply to comment'
                        : 'Post a comment',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _textController,
                    decoration: const InputDecoration(
                      hintText: 'Share your thoughts...',
                      border: OutlineInputBorder(),
                    ),
                    maxLines: 4,
                    maxLength: 2000,
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
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: isPosting ? null : _submitComment,
                    child: isPosting
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Post Comment'),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
