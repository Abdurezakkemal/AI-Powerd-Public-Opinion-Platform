import 'package:civic_engagement_app/src/app/civic_app.dart';
import 'package:civic_engagement_app/src/core/di/service_locator.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    await configureDependencies(reset: true);
  });

  testWidgets('renders the citizen auth screen', (tester) async {
    await tester.pumpWidget(const CivicApp());
    await tester.pumpAndSettle();

    expect(find.text('Civic Voice'), findsOneWidget);
    expect(find.text('Login'), findsWidgets);
    expect(find.text('Register'), findsOneWidget);
  });
}
