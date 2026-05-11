import 'package:flutter_bloc/flutter_bloc.dart';

import '../../domain/entities/comment.dart';
import '../../domain/repositories/citizen_repository.dart';
import 'comment_state.dart';

class CommentCubit extends Cubit<CommentState> {
  CommentCubit(this._repository) : super(const CommentInitial());

  final CitizenRepository _repository;
  List<Comment> _allComments = [];
  int _currentPage = 1;
  int _total = 0;

  Future<void> loadComments({
    required String policyId,
    String? sentiment,
    String? status,
    bool refresh = false,
  }) async {
    if (refresh) {
      _currentPage = 1;
      _allComments = [];
      _total = 0;
    }

    emit(const CommentLoading());

    try {
      final page = await _repository.getPolicyComments(
        policyId: policyId,
        page: _currentPage,
        sentiment: sentiment,
        status: status,
      );

      if (refresh) {
        _allComments = page.comments;
      } else {
        _allComments.addAll(page.comments);
      }

      _total = page.total;
      _currentPage = page.page;

      emit(
        CommentLoaded(
          comments: List.from(_allComments),
          total: _total,
          page: _currentPage,
          hasMore: _allComments.length < _total,
        ),
      );
    } catch (e) {
      emit(CommentError(e.toString()));
    }
  }

  Future<void> loadMore({
    required String policyId,
    String? sentiment,
    String? status,
  }) async {
    if (_allComments.length >= _total) return;

    try {
      final page = await _repository.getPolicyComments(
        policyId: policyId,
        page: _currentPage + 1,
        sentiment: sentiment,
        status: status,
      );

      _allComments.addAll(page.comments);
      _currentPage = page.page;

      emit(
        CommentLoaded(
          comments: List.from(_allComments),
          total: _total,
          page: _currentPage,
          hasMore: _allComments.length < _total,
        ),
      );
    } catch (e) {
      emit(CommentError(e.toString()));
    }
  }

  Future<void> postComment({
    required String policyId,
    required String text,
    String? parentCommentId,
  }) async {
    emit(const CommentPosting());

    try {
      final message = await _repository.postComment(
        policyId: policyId,
        text: text,
        parentCommentId: parentCommentId,
      );
      emit(CommentPosted(message));
      // Reset to initial state after a brief delay to allow UI to react
      await Future.delayed(const Duration(milliseconds: 100));
      emit(const CommentInitial());
    } catch (e) {
      emit(CommentError(e.toString()));
      // Reset to initial state after error
      await Future.delayed(const Duration(milliseconds: 100));
      emit(const CommentInitial());
    }
  }

  Future<void> reportComment({
    required String commentId,
    required String reason,
  }) async {
    emit(const CommentReporting());

    try {
      final message = await _repository.reportComment(
        commentId: commentId,
        reason: reason,
      );
      emit(CommentReported(message));
      await Future.delayed(const Duration(milliseconds: 100));
      emit(const CommentInitial());
    } catch (e) {
      emit(CommentError(e.toString()));
      await Future.delayed(const Duration(milliseconds: 100));
      emit(const CommentInitial());
    }
  }

  Future<void> editComment({
    required String commentId,
    required String text,
  }) async {
    emit(const CommentEditing());

    try {
      final message = await _repository.editComment(
        commentId: commentId,
        text: text,
      );
      emit(CommentEdited(message));
      await Future.delayed(const Duration(milliseconds: 100));
      emit(const CommentInitial());
    } catch (e) {
      emit(CommentError(e.toString()));
      await Future.delayed(const Duration(milliseconds: 100));
      emit(const CommentInitial());
    }
  }

  Future<void> appealComment({
    required String commentId,
    required String reason,
  }) async {
    emit(const CommentAppealing());

    try {
      final message = await _repository.appealComment(
        commentId: commentId,
        reason: reason,
      );
      emit(CommentAppealed(message));
      await Future.delayed(const Duration(milliseconds: 100));
      emit(const CommentInitial());
    } catch (e) {
      emit(CommentError(e.toString()));
      await Future.delayed(const Duration(milliseconds: 100));
      emit(const CommentInitial());
    }
  }
}
