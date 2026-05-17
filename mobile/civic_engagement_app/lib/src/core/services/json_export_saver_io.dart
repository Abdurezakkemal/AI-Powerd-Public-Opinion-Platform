import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:file_picker/file_picker.dart';

Future<String> saveJsonExport({
  required String fileName,
  required String jsonText,
}) async {
  final savedPath = await FilePicker.platform.saveFile(
    dialogTitle: 'Save civic data export',
    fileName: fileName,
    type: FileType.custom,
    allowedExtensions: const ['json'],
    bytes: Uint8List.fromList(utf8.encode(jsonText)),
  );

  if (savedPath != null && savedPath.isNotEmpty) {
    return savedPath;
  }

  final directory = Directory.systemTemp;
  final file = File('${directory.path}${Platform.pathSeparator}$fileName');
  await file.writeAsString(jsonText);
  return file.path;
}
