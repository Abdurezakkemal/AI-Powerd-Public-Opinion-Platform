import 'package:flutter/material.dart';

import 'src/app/civic_app.dart';
import 'src/core/di/service_locator.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await configureDependencies();
  runApp(const CivicApp());
}
