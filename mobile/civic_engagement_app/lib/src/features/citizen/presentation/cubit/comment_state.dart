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

class CommentPosting extends CommentLoaded {
  const CommentPosting({
    required super.comments,
    required super.total,
    required super.page,
    required super.hasMore,
  });
}

class CommentPosted extends CommentState {
  const CommentPosted(this.message);

  final String message;
}

class CommentReporting extends CommentLoaded {
  const CommentReporting({
    required super.comments,
    required super.total,
    required super.page,
    required super.hasMore,
  });
}

class CommentReported extends CommentState {
  const CommentReported(this.message);

  final String message;
}

class CommentEditing extends CommentLoaded {
  const CommentEditing({
    required super.comments,
    required super.total,
    required super.page,
    required super.hasMore,
  });
}

class CommentEdited extends CommentState {
  const CommentEdited(this.message);

  final String message;
}

class CommentAppealing extends CommentLoaded {
  const CommentAppealing({
    required super.comments,
    required super.total,
    required super.page,
    required super.hasMore,
  });
}

class CommentAppealed extends CommentState {
  const CommentAppealed(this.message);

  final String message;
}
