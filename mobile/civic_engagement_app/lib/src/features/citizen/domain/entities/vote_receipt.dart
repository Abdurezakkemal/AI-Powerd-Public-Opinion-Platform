import 'package:equatable/equatable.dart';

class VoteReceipt extends Equatable {
  const VoteReceipt({
    required this.voteId,
    required this.rating,
    required this.message,
    this.commentId,
  });

  final String voteId;
  final String? commentId;
  final int rating;
  final String message;

  @override
  List<Object?> get props => [voteId, commentId, rating, message];
}
