GetX Testing Strategies - Senior Guide
1. Controller Testing Patterns
1.1 Unit Testing GetX Controllers
dart
// test/unit/controllers/user_controller_test.dart
void main() {
  late UserController controller;
  late MockUserRepository mockRepository;
  late MockAnalyticsService mockAnalytics;
  
  setUp(() {
    // Initialize mocks
    mockRepository = MockUserRepository();
    mockAnalytics = MockAnalyticsService();
    
    // Put dependencies in GetX
    Get.put<UserRepository>(mockRepository);
    Get.put<AnalyticsService>(mockAnalytics);
    
    // Create controller
    controller = UserController();
  });
  
  tearDown(() {
    // Clean up GetX instances
    Get.reset();
  });
  
  test('Controller should fetch users on initialization', () async {
    // Arrange
    final users = [User(id: '1', name: 'John')];
    when(mockRepository.getUsers()).thenAnswer((_) async => users);
    
    // Act
    await controller.initialize();
    
    // Assert
    expect(controller.users, equals(users));
    expect(controller.isLoading.value, isFalse);
    verify(mockAnalytics.trackEvent('users_fetched')).called(1);
  });
  
  test('Controller should handle errors gracefully', () async {
    // Arrange
    final exception = Exception('Network error');
    when(mockRepository.getUsers()).thenThrow(exception);
    
    // Act & Assert
    expect(() async => await controller.initialize(), throwsException);
    expect(controller.errorMessage.value, contains('Network error'));
    expect(controller.isLoading.value, isFalse);
  });
  
  test('Controller should update user correctly', () async {
    // Arrange
    final updatedUser = User(id: '1', name: 'John Updated');
    when(mockRepository.updateUser(any)).thenAnswer((_) async => updatedUser);
    
    // Act
    await controller.updateUser('1', 'John Updated');
    
    // Assert
    expect(controller.users.first.name, equals('John Updated'));
    verify(mockRepository.updateUser(any)).called(1);
  });
  
  test('Controller should dispose resources', () async {
    // Arrange
    final mockSubscription = MockStreamSubscription();
    controller.streamSubscription = mockSubscription;
    
    // Act
    controller.dispose();
    
    // Assert
    verify(mockSubscription.cancel()).called(1);
  });
}
1.2 State Change Testing
dart
test('Controller state should change correctly', () async {
  // Test reactive state changes
  final controller = UserController();
  
  // Initial state
  expect(controller.isLoading.value, isFalse);
  expect(controller.users.isEmpty, isTrue);
  
  // Trigger async operation
  unawaited(controller.fetchUsers());
  
  // State during loading
  expect(controller.isLoading.value, isTrue);
  
  // Wait for completion
  await pumpEventQueue();
  
  // State after completion
  expect(controller.isLoading.value, isFalse);
  expect(controller.users.isNotEmpty, isTrue);
});

test('Observable values should notify listeners', () {
  final controller = UserController();
  var notificationCount = 0;
  
  // Listen to observable
  controller.userName.listen((name) {
    notificationCount++;
  });
  
  // Change value multiple times
  controller.userName.value = 'John';
  controller.userName.value = 'Jane';
  controller.userName.value = 'Bob';
  
  expect(notificationCount, equals(3));
});
2. Widget Testing with GetX
2.1 Testing GetView Widgets
dart
// test/widgets/user_profile_view_test.dart
void main() {
  late MockUserController mockController;
  
  setUp(() {
    mockController = MockUserController();
    
    // Setup GetX bindings
    Get.put<UserController>(mockController);
    
    // Mock controller state
    when(mockController.user).thenReturn(
      Rx<User?>(User(id: '1', name: 'John Doe')),
    );
    when(mockController.isLoading).thenReturn(false.obs);
  });
  
  tearDown(() {
    Get.reset();
  });
  
  testWidgets('UserProfileView should display user data', (tester) async {
    // Build widget
    await tester.pumpWidget(
      GetMaterialApp(
        home: UserProfileView(),
      ),
    );
    
    // Verify UI
    expect(find.text('John Doe'), findsOneWidget);
    expect(find.byType(CircularProgressIndicator), findsNothing);
  });
  
  testWidgets('UserProfileView should show loading state', (tester) async {
    // Update mock
    when(mockController.isLoading).thenReturn(true.obs);
    
    await tester.pumpWidget(
      GetMaterialApp(
        home: UserProfileView(),
      ),
    );
    
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });
  
  testWidgets('UserProfileView should handle refresh', (tester) async {
    await tester.pumpWidget(
      GetMaterialApp(
        home: UserProfileView(),
      ),
    );
    
    // Tap refresh button
    await tester.tap(find.byIcon(Icons.refresh));
    await tester.pump();
    
    verify(mockController.refreshUser()).called(1);
  });
  
  testWidgets('UserProfileView should navigate on edit', (tester) async {
    await tester.pumpWidget(
      GetMaterialApp(
        home: UserProfileView(),
        getPages: [
          GetPage(name: '/edit', page: () => EditUserView()),
        ],
      ),
    );
    
    // Tap edit button
    await tester.tap(find.byIcon(Icons.edit));
    await tester.pumpAndSettle();
    
    expect(Get.currentRoute, '/edit');
  });
}
2.2 Testing Reactive Widgets
dart
testWidgets('Obx widget should rebuild on observable change', (tester) async {
  final controller = CounterController();
  Get.put(controller);
  
  await tester.pumpWidget(
    GetMaterialApp(
      home: Scaffold(
        body: Obx(() => Text('Count: ${controller.count}')),
      ),
    ),
  );
  
  // Initial state
  expect(find.text('Count: 0'), findsOneWidget);
  
  // Update observable
  controller.increment();
  await tester.pump();
  
  // Should rebuild
  expect(find.text('Count: 1'), findsOneWidget);
});

testWidgets('GetBuilder should update with ID', (tester) async {
  final controller = UserController();
  Get.put(controller);
  
  await tester.pumpWidget(
    GetMaterialApp(
      home: Scaffold(
        body: Column(
          children: [
            GetBuilder<UserController>(
              id: 'name',
              builder: (c) => Text('Name: ${c.userName}'),
            ),
            GetBuilder<UserController>(
              id: 'email',
              builder: (c) => Text('Email: ${c.userEmail}'),
            ),
          ],
        ),
      ),
    ),
  );
  
  // Update specific ID
  controller.userName = 'New Name';
  controller.update(['name']);
  await tester.pump();
  
  // Only name should update
  expect(find.text('Name: New Name'), findsOneWidget);
  expect(find.text('Email: ${controller.userEmail}'), findsOneWidget);
});
3. Integration Test Setups
3.1 End-to-End Feature Testing
dart
// test/integration/user_flow_test.dart
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  
  group('User Authentication Flow', () {
    late MockAuthService mockAuthService;
    
    setUpAll(() async {
      // Setup test environment
      TestWidgetsFlutterBinding.ensureInitialized();
      
      // Mock backend services
      mockAuthService = MockAuthService();
      
      // Configure app for testing
      await configureAppForTesting();
    });
    
    testWidgets('Complete login flow', (tester) async {
      // Start at login screen
      await tester.pumpWidget(TestApp());
      
      // Verify initial state
      expect(find.text('Login'), findsOneWidget);
      expect(find.text('Email'), findsOneWidget);
      expect(find.text('Password'), findsOneWidget);
      
      // Enter credentials
      await tester.enterText(
        find.byKey(Key('email_field')),
        'test@example.com',
      );
      await tester.enterText(
        find.byKey(Key('password_field')),
        'password123',
      );
      
      // Tap login
      await tester.tap(find.text('Login'));
      await tester.pumpAndSettle();
      
      // Verify navigation to home
      expect(find.text('Welcome'), findsOneWidget);
      expect(find.text('Dashboard'), findsOneWidget);
      
      // Verify authentication
      verify(mockAuthService.login(
        'test@example.com',
        'password123',
      )).called(1);
    });
    
    testWidgets('Login with invalid credentials', (tester) async {
      // Mock failure
      when(mockAuthService.login(any, any)).thenThrow(
        AuthException('Invalid credentials'),
      );
      
      await tester.pumpWidget(TestApp());
      
      // Attempt login
      await tester.enterText(
        find.byKey(Key('email_field')),
        'wrong@example.com',
      );
      await tester.enterText(
        find.byKey(Key('password_field')),
        'wrong',
      );
      
      await tester.tap(find.text('Login'));
      await tester.pumpAndSettle();
      
      // Verify error message
      expect(find.text('Invalid credentials'), findsOneWidget);
      expect(find.text('Login'), findsOneWidget); // Still on login screen
    });
  });
}
3.2 Navigation Testing
dart
testWidgets('Deep link navigation', (tester) async {
  // Setup router with deep linking
  final router = GetMaterialApp(
    initialRoute: '/',
    getPages: [
      GetPage(name: '/', page: () => HomeView()),
      GetPage(name: '/products/:id', page: () => ProductView()),
      GetPage(name: '/profile', page: () => ProfileView()),
    ],
  );
  
  // Test deep link
  await tester.pumpWidget(router);
  Get.toNamed('/products/123');
  await tester.pumpAndSettle();
  
  expect(Get.currentRoute, '/products/123');
  expect(find.text('Product 123'), findsOneWidget);
  
  // Test back navigation
  Get.back();
  await tester.pumpAndSettle();
  
  expect(Get.currentRoute, '/');
});

testWidgets('Route guards', (tester) async {
  final authController = MockAuthController();
  when(authController.isAuthenticated).thenReturn(false.obs);
  
  Get.put(authController);
  
  final router = GetMaterialApp(
    initialRoute: '/',
    routingCallback: (routing) {
      if (routing.current == '/protected' && 
          !authController.isAuthenticated.value) {
        Get.offNamed('/login');
      }
    },
    getPages: [
      GetPage(name: '/', page: () => HomeView()),
      GetPage(name: '/login', page: () => LoginView()),
      GetPage(name: '/protected', page: () => ProtectedView()),
    ],
  );
  
  await tester.pumpWidget(router);
  
  // Try to access protected route
  Get.toNamed('/protected');
  await tester.pumpAndSettle();
  
  // Should redirect to login
  expect(Get.currentRoute, '/login');
});
4. Mocking and Test Doubles
4.1 Comprehensive Mock Classes
dart
// test/mocks/mock_user_repository.dart
class MockUserRepository extends Mock implements UserRepository {
  // Setup common responses
  MockUserRepository() {
    // Default successful responses
    when(getUsers()).thenAnswer((_) async => []);
    when(getUser(any)).thenAnswer((_) async => User(id: '1', name: 'Test'));
    when(updateUser(any)).thenAnswer((_) async => true);
    when(deleteUser(any)).thenAnswer((_) async => true);
  }
  
  // Helper methods for test setup
  void setupSuccessfulFetch(List<User> users) {
    when(getUsers()).thenAnswer((_) async => users);
  }
  
  void setupFetchError(Exception error) {
    when(getUsers()).thenThrow(error);
  }
  
  void setupEmptyResponse() {
    when(getUsers()).thenAnswer((_) async => []);
  }
  
  void verifyUserFetched([int times = 1]) {
    verify(getUsers()).called(times);
  }
  
  void verifyUserUpdated(String userId, [int times = 1]) {
    verify(updateUser(argThat(equals(userId)))).called(times);
  }
}

// Specialized mocks for edge cases
class SlowUserRepository extends Mock implements UserRepository {
  @override
  Future<List<User>> getUsers() async {
    await Future.delayed(Duration(seconds: 2));
    return [User(id: '1', name: 'Slow User')];
  }
}

class FailingUserRepository extends Mock implements UserRepository {
  @override
  Future<List<User>> getUsers() async {
    throw SocketException('No internet connection');
  }
}
4.2 Mock Bindings for Testing
dart
class TestBindings extends Bindings {
  final Map<Type, dynamic> overrides;
  
  TestBindings({this.overrides = const {}});
  
  @override
  void dependencies() {
    // Register real or mocked dependencies
    Get.lazyPut<ApiService>(
      () => overrides[ApiService] ?? ApiServiceImpl(),
      fenix: true,
    );
    
    Get.lazyPut<UserRepository>(
      () => overrides[UserRepository] ?? UserRepositoryImpl(
        Get.find<ApiService>(),
      ),
    );
    
    Get.lazyPut<UserController>(
      () => overrides[UserController] ?? UserController(
        Get.find<UserRepository>(),
      ),
    );
  }
}

// Usage in tests
void main() {
  late MockApiService mockApi;
  
  setUp(() {
    mockApi = MockApiService();
    
    // Setup test bindings with mocks
    TestBindings(
      overrides: {
        ApiService: mockApi,
      },
    ).dependencies();
  });
  
  test('Controller uses mocked API', () {
    final controller = Get.find<UserController>();
    // controller now uses mockApi
  });
}
5. Advanced Testing Patterns
5.1 State Machine Testing
dart
class StateMachineController extends GetxController {
  final Rx<AuthState> _state = AuthState.initial.obs;
  AuthState get state => _state.value;
  
  Future<void> login(String email, String password) async {
    _state(AuthState.loading);
    
    try {
      await authService.login(email, password);
      _state(AuthState.authenticated);
    } catch (e) {
      _state(AuthState.error);
    }
  }
}

// State machine tests
test('State transitions correctly', () async {
  final controller = StateMachineController();
  
  // Initial state
  expect(controller.state, AuthState.initial);
  
  // Start login
  unawaited(controller.login('test@test.com', 'pass'));
  expect(controller.state, AuthState.loading);
  
  // Wait for completion
  await pumpEventQueue();
  expect(controller.state, AuthState.authenticated);
});

test('State machine handles errors', () async {
  final controller = StateMachineController();
  
  // Mock failure
  when(authService.login(any, any)).thenThrow(Exception());
  
  await controller.login('test@test.com', 'pass');
  expect(controller.state, AuthState.error);
});
5.2 Event-Driven Testing
dart
class EventDrivenController extends GetxController {
  final _events = Rx<AppEvent?>(null);
  Stream<AppEvent?> get events => _events.stream;
  
  void emitEvent(AppEvent event) {
    _events(event);
  }
}

// Event testing
test('Events are emitted correctly', () async {
  final controller = EventDrivenController();
  final events = <AppEvent>[];
  
  // Listen to events
  final subscription = controller.events.listen(events.add);
  
  // Emit events
  controller.emitEvent(UserLoggedInEvent());
  controller.emitEvent(DataLoadedEvent());
  
  await pumpEventQueue();
  
  expect(events.length, 2);
  expect(events[0], isA<UserLoggedInEvent>());
  expect(events[1], isA<DataLoadedEvent>());
  
  subscription.cancel();
});
6. Performance Testing
6.1 Load Testing Controllers
dart
test('Controller handles high load', () async {
  final controller = UserController();
  const requestCount = 1000;
  
  // Time the operation
  final stopwatch = Stopwatch()..start();
  
  // Simulate many concurrent requests
  final futures = List.generate(requestCount, (i) {
    return controller.updateUser('$i', 'User $i');
  });
  
  await Future.wait(futures);
  stopwatch.stop();
  
  // Should complete in reasonable time
  expect(stopwatch.elapsedMilliseconds, lessThan(5000));
  
  // Memory should be stable
  expect(controller.users.length, requestCount);
});

test('Memory usage during rapid updates', () async {
  final controller = UserController();
  final initialMemory = await getMemoryUsage();
  
  // Rapid state changes
  for (var i = 0; i < 10000; i++) {
    controller.userName.value = 'User $i';
    await pumpEventQueue();
  }
  
  final finalMemory = await getMemoryUsage();
  final memoryIncrease = finalMemory - initialMemory;
  
  // Memory increase should be reasonable
  expect(memoryIncrease, lessThan(10 * 1024 * 1024)); // Less than 10MB
});
6.2 Render Performance Testing
dart
testWidgets('Widget rebuild performance', (tester) async {
  final controller = CounterController();
  Get.put(controller);
  
  var rebuildCount = 0;
  
  await tester.pumpWidget(
    GetMaterialApp(
      home: Scaffold(
        body: GetBuilder<CounterController>(
          builder: (c) {
            rebuildCount++;
            return Text('Count: ${c.count}');
          },
        ),
      ),
    ),
  );
  
  final stopwatch = Stopwatch()..start();
  
  // Trigger many rebuilds
  for (var i = 0; i < 100; i++) {
    controller.increment();
    await tester.pump();
  }
  
  stopwatch.stop();
  
  // Should rebuild quickly
  expect(stopwatch.elapsedMilliseconds, lessThan(1000));
  expect(rebuildCount, equals(101)); // Initial + 100 updates
});
7. Test Utilities and Helpers
7.1 Test Setup Utilities
dart
class TestUtils {
  static Future<void> pumpEventQueue([int times = 10]) async {
    for (var i = 0; i < times; i++) {
      await Future.delayed(Duration.zero);
    }
  }
  
  static Future<MemoryImage> createTestImage({
    int width = 100,
    int height = 100,
  }) async {
    final completer = Completer<ui.Image>();
    final pictureRecorder = ui.PictureRecorder();
    final canvas = Canvas(pictureRecorder);
    
    canvas.drawRect(
      Rect.fromLTWH(0, 0, width.toDouble(), height.toDouble()),
      Paint()..color = Colors.blue,
    );
    
    final picture = pictureRecorder.endRecording();
    final image = await picture.toImage(width, height);
    completer.complete(image);
    
    return MemoryImage(
      (await image.toByteData(format: ui.ImageByteFormat.png))!.buffer.asUint8List(),
    );
  }
  
  static void simulateSlowNetwork(Duration delay) {
    // Mock network delay for testing
    Get.replace<Dio>(
      Dio()
        ..interceptors.add(
          InterceptorsWrapper(
            onRequest: (options, handler) async {
              await Future.delayed(delay);
              handler.next(options);
            },
          ),
        ),
    );
  }
  
  static Future<void> waitForCondition(
    bool Function() condition, {
    Duration timeout = const Duration(seconds: 5),
    Duration interval = const Duration(milliseconds: 100),
  }) async {
    final endTime = DateTime.now().add(timeout);
    
    while (DateTime.now().isBefore(endTime)) {
      if (condition()) return;
      await Future.delayed(interval);
    }
    
    throw TimeoutException('Condition not met within timeout');
  }
}
7.2 Snapshot Testing
dart
testWidgets('UI snapshot matches reference', (tester) async {
  // Setup
  final controller = UserController();
  Get.put(controller);
  
  // Load reference image
  final referenceBytes = await File('test/reference/user_screen.png').readAsBytes();
  final referenceImage = MemoryImage(referenceBytes);
  
  // Build widget
  await tester.pumpWidget(
    GetMaterialApp(
      home: UserScreen(),
    ),
  );
  
  await tester.pumpAndSettle();
  
  // Capture screenshot
  final screenshot = await tester.takeSnapshot();
  
  // Compare with reference
  final matches = await compareImages(
    screenshot,
    referenceImage,
    tolerance: 0.01, // 1% tolerance for differences
  );
  
  expect(matches, isTrue);
});

testWidgets('Golden test for responsive layouts', (tester) async {
  // Test different screen sizes
  final testSizes = [
    Size(360, 640),  // Small phone
    Size(414, 896),  // iPhone X
    Size(768, 1024), // iPad
  ];
  
  for (final size in testSizes) {
    tester.binding.window.physicalSizeTestValue = size;
    tester.binding.window.devicePixelRatioTestValue = 2.0;
    
    await tester.pumpWidget(TestApp());
    await tester.pumpAndSettle();
    
    await expectLater(
      find.byType(TestApp),
      matchesGoldenFile('goldens/test_app_${size.width}x${size.height}.png'),
    );
  }
  
  // Reset
  addTearDown(tester.binding.window.clearPhysicalSizeTestValue);
  addTearDown(tester.binding.window.clearDevicePixelRatioTestValue);
});