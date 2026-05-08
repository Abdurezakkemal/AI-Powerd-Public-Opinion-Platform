import 'package:equatable/equatable.dart';

class CitizenNotification extends Equatable {
  const CitizenNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    required this.read,
    required this.data,
    this.createdAt,
  });

  final String id;
  final String type;
  final String title;
  final String message;
  final bool read;
  final Map<String, dynamic> data;
  final DateTime? createdAt;

  String? get policyId => data['policyId']?.toString();

  @override
  List<Object?> get props => [id, type, title, message, read, data, createdAt];
}
