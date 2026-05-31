# Civic Engagement Mobile App

Flutter mobile app for citizens to vote, comment, view notifications, and interact with policies.

## Features

- Citizen login and profile management
- Policy browsing and rating
- Comment submission and history
- Notifications via Socket.IO
- Geolocation support for regional policy feeds

## Prerequisites

- Flutter SDK
- Dart SDK (comes with Flutter)
- A running backend API

## Setup

```bash
cd mobile/civic_engagement_app
flutter pub get
```

## Configure API URL

The app uses `API_BASE_URL` at build time.

Default in code:

```dart
http://192.168.137.142:5002/api
```

For a local backend, override it using `--dart-define`:

### Android emulator

```bash
flutter run -d emulator-5554 --dart-define=API_BASE_URL=http://10.0.2.2:5000/api
```

### iOS simulator

```bash
flutter run -d ios --dart-define=API_BASE_URL=http://localhost:5000/api
```

### Physical device

Use a network-accessible backend host, for example:

```bash
flutter run --dart-define=API_BASE_URL=http://192.168.1.100:5000/api
```

## Run

```bash
flutter run
```

## Build

```bash
flutter build apk --dart-define=API_BASE_URL=http://your-backend-host:5000/api
```

## Notes

- The mobile app performs a quick network health check at startup.
- If the backend is not reachable, adjust `API_BASE_URL` or use emulator-specific host names.
- The app currently uses `flutter_bloc`, `get_it`, `http`, `shared_preferences`, `geolocator`, and `socket_io_client`.
