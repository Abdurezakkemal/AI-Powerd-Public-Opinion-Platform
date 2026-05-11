import '../../domain/entities/comment.dart';

abstract class CommentState {
  const CommentState();
}

class CommentInitial extends CommentState {
  const CommentInitial();
}

class CommentLoading extends CommentState {
  const CommentLoading();
}

class CommentLoaded extends CommentState {
  const CommentLoaded({
    required this.comments,
    required this.total,
    required this.page,
    required this.hasMore,
  });

  final List<Comment> comments;
  final int total;
  final int page;
  final bool hasMore;
}

class CommentError extends CommentState {
  const CommentError(this.message);

  final String message;
}

class CommentPosting extends CommentState {
  const CommentPosting();
}

class CommentPosted extends CommentState {
  const CommentPosted(this.message);

  final String message;
}

class CommentReporting extends CommentState {
  const CommentReporting();
}

class CommentReported extends CommentState {
  const CommentReported(this.message);

  final String message;
}

class CommentEditing extends CommentState {
  const CommentEditing();
}

class CommentEdited extends CommentState {
  const CommentEdited(this.message);

  final String message;
}

class CommentAppealing extends CommentState {
  const CommentAppealing();
}

class CommentAppealed extends CommentState {
  const CommentAppealed(this.message);

  final String message;
}
