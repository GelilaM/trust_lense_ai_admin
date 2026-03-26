GetX Best Practices - Senior Guide
1. Code Organization Standards
1.1 Project Structure Guidelines
text
lib/
├── app/                          # Application layer
│   ├── core/                     # Core application infrastructure
│   │   ├── constants/            # App constants and enums
│   │   ├── exceptions/           # Custom exceptions
│   │   ├── extensions/           # Dart extensions
│   │   ├── theme/                # App theme and styling
│   │   ├── utils/                # Utility functions
│   │   └── widgets/              # Global/reusable widgets
│   ├── data/                     # Data layer
│   │   ├── datasources/          # Data sources (local/remote)
│   │   │   ├── local/            # Local data sources (Hive, SharedPreferences)
│   │   │   └── remote/           # Remote data sources (API clients)
│   │   ├── models/               # Data transfer objects (DTOs)
│   │   └── repositories/         # Repository implementations
│   ├── domain/                   # Domain layer (business logic)
│   │   ├── entities/             # Business entities
│   │   ├── repositories/         # Repository interfaces
│   │   └── usecases/             # Business use cases
│   └── presentation/             # Presentation layer (UI)
│       ├── bindings/             # Dependency injection bindings
│       ├── controllers/          # GetX Controllers
│       ├── modules/              # Feature modules
│       │   ├── auth/             # Authentication module
│       │   │   ├── bindings/
│       │   │   ├── controllers/
│       │   │   └── views/
│       │   └── home/             # Home module
│       ├── routes/               # Route definitions
│       └── views/                # Screens and widgets
├── main.dart                     # App entry point
└── injection.dart               # Dependency injection setup
1.2 File Naming Conventions

// ✅ GOOD: Clear, descriptive names
class UserAuthenticationController {}    // Controller
class ProductRepositoryImpl {}           // Repository implementation
class HomeBinding {}                     // Binding
class ProductDetailScreen {}             // Screen
class CircularProgressWithLabel {}       // Widget

// ❌ BAD: Vague or inconsistent names
class Controller {}                      // Too vague
class Repo {}                           // Abbreviation
class Bind {}                           // Inconsistent
class Screen1 {}                        // Non-descriptive

// File naming examples:
user_authentication_controller.dart     // snake_case for files
product_repository_impl.dart
home_binding.dart
product_detail_screen.dart
circular_progress_with_label.dart
1.3 Code Organization Principles

// Each file should have single responsibility
// user_controller.dart
class UserController extends GetxController {
  // Only user-related state and logic
}

// ❌ AVOID: Mixing responsibilities
class UserAndProductController extends GetxController {
  // Mixing user and product logic
}

// Group related files in folders
// presentation/modules/auth/
// ├── auth_binding.dart
// ├── auth_controller.dart
// ├── login_screen.dart
// ├── register_screen.dart
// └── widgets/
//     ├── auth_form.dart
//     └── social_login_buttons.dart

// Use barrel files for clean imports
// presentation/modules/auth/auth.dart
export 'auth_binding.dart';
export 'auth_controller.dart';
export 'login_screen.dart';
export 'register_screen.dart';
export 'widgets/auth_form.dart';
export 'widgets/social_login_buttons.dart';

// Then import like this:
import 'package:app/presentation/modules/auth/auth.dart';
2. Controller Best Practices
2.1 Controller Design Principles

// Single Responsibility Principle
class UserProfileController extends GetxController {
  // ✅ Focuses only on user profile
  final Rx<UserProfile> _profile = UserProfile.empty().obs;
  final RxBool _isLoading = false.obs;
  
  UserProfile get profile => _profile.value;
  bool get isLoading => _isLoading.value;
  
  Future<void> loadProfile() async {
    _isLoading(true);
    try {
      final userRepo = Get.find<UserRepository>();
      _profile(await userRepo.getProfile());
    } finally {
      _isLoading(false);
    }
  }
  
  Future<void> updateProfile(UserProfile newProfile) async {
    _isLoading(true);
    try {
      final userRepo = Get.find<UserRepository>();
      await userRepo.updateProfile(newProfile);
      _profile(newProfile);
    } finally {
      _isLoading(false);
    }
  }
}

// ❌ AVOID: Multiple responsibilities
class UserAndSettingsController extends GetxController {
  // Mixing user profile and app settings
}

// Separation of Concerns
class AuthController extends GetxController {
  // Authentication logic only
  final Rx<AuthState> _state = AuthState.loggedOut.obs;
  final _authService = Get.find<AuthService>();
  
  Future<void> login(String email, String password) async {
    _state(AuthState.loading);
    try {
      await _authService.login(email, password);
      _state(AuthState.loggedIn);
    } catch (e) {
      _state(AuthState.error);
      rethrow;
    }
  }
}

class UserController extends GetxController {
  // User data management only
  final Rx<User> _user = User.empty().obs;
  
  Future<void> loadUserData() async {
    final userRepo = Get.find<UserRepository>();
    _user(await userRepo.getUser());
  }
}
2.2 State Management Patterns

// Use Rx for reactive state
class ReactiveController extends GetxController {
  // ✅ Observable state
  final RxString _username = ''.obs;
  final RxInt _score = 0.obs;
  final RxList<String> _items = <String>[].obs;
  final Rx<DateTime?> _lastUpdated = Rx<DateTime?>(null);
  
  // Computed properties
  RxBool get hasItems => _items.isNotEmpty.obs;
  RxString get displayName => _username.isNotEmpty 
      ? _username 
      : 'Guest'.obs;
  
  // State changes
  void updateUsername(String name) {
    _username(name);
    _lastUpdated(DateTime.now());
  }
}

// Use GetBuilder for simple state
class SimpleController extends GetxController {
  String _message = '';
  int _counter = 0;
  
  void updateMessage(String newMessage) {
    _message = newMessage;
    update(); // Manual update
  }
  
  void increment() {
    _counter++;
    update(['counter']); // Update specific ID
  }
}

// State validation
class ValidatedController extends GetxController {
  final RxString _email = ''.obs;
  final RxString _password = ''.obs;
  final Rx<ValidationState> _validation = ValidationState.initial.obs;
  
  // Validation logic
  RxBool get isEmailValid => 
      _email.value.contains('@').obs;
  
  RxBool get isPasswordValid => 
      (_password.value.length >= 8).obs;
  
  RxBool get canSubmit => 
      (isEmailValid.value && isPasswordValid.value).obs;
  
  void validate() {
    if (!isEmailValid.value) {
      _validation(ValidationState.emailInvalid);
    } else if (!isPasswordValid.value) {
      _validation(ValidationState.passwordInvalid);
    } else {
      _validation(ValidationState.valid);
    }
  }
}
2.3 Lifecycle Management

class LifecycleController extends GetxController 
    with WidgetsBindingObserver {
  
  final List<StreamSubscription> _subscriptions = [];
  final List<Timer> _timers = [];
  final List<Worker> _workers = [];
  
  @override
  void onInit() {
    super.onInit();
    
    // Initialize state
    _initialize();
    
    // Setup observers
    WidgetsBinding.instance.addObserver(this);
    
    // Setup periodic tasks
    _setupTimers();
    
    // Setup reactive workers
    _setupWorkers();
  }
  
  @override
  void onReady() {
    super.onReady();
    
    // Load initial data after view is ready
    _loadInitialData();
  }
  
  @override
  void onClose() {
    // Clean up resources
    _cleanup();
    
    // Remove observers
    WidgetsBinding.instance.removeObserver(this);
    
    super.onClose();
  }
  
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Handle app lifecycle changes
    switch (state) {
      case AppLifecycleState.resumed:
        _onAppResumed();
        break;
      case AppLifecycleState.paused:
        _onAppPaused();
        break;
      case AppLifecycleState.inactive:
        _onAppInactive();
        break;
      case AppLifecycleState.detached:
        _onAppDetached();
        break;
    }
  }
  
  void _initialize() {
    // Initialization logic
  }
  
  void _setupTimers() {
    _timers.add(Timer.periodic(
      Duration(minutes: 5),
      (_) => _syncData(),
    ));
  }
  
  void _setupWorkers() {
    _workers.add(ever(_someObservable, (_) {
      // React to observable changes
    }));
    
    _workers.add(once(_anotherObservable, (_) {
      // React once
    }));
    
    _workers.add(debounce(_searchQuery, (_) {
      // Debounced reaction
    }, time: Duration(milliseconds: 300)));
  }
  
  void _cleanup() {
    // Cancel subscriptions
    for (final subscription in _subscriptions) {
      subscription.cancel();
    }
    _subscriptions.clear();
    
    // Cancel timers
    for (final timer in _timers) {
      timer.cancel();
    }
    _timers.clear();
    
    // Dispose workers
    for (final worker in _workers) {
      worker.dispose();
    }
    _workers.clear();
  }
}
3. Performance Optimization
3.1 Reactive Performance

class PerformanceOptimizedController extends GetxController {
  // ✅ Fine-grained observables
  final Rx<String> _firstName = ''.obs;
  final Rx<String> _lastName = ''.obs;
  final Rx<String> _email = ''.obs;
  final Rx<String> _phone = ''.obs;
  
  // ❌ AVOID: Large observable objects
  // final Rx<UserProfile> _profile = UserProfile().obs;
  
  // Lazy loading of expensive data
  final Rx<Future<List<Item>>> _itemsFuture = 
      Future.value(<Item>[]).obs;
  
  void loadItems() {
    _itemsFuture(Future(() => _fetchItems()));
  }
  
  // Batch updates
  void updateUser(User user) {
    _firstName(user.firstName);
    _lastName(user.lastName);
    _email(user.email);
    _phone(user.phone);
    
    // Single update call
    update();
  }
  
  // Memoization for expensive computations
  final Map<String, ComputedResult> _computationCache = {};
  
  ComputedResult computeExpensive(String input) {
    return _computationCache.putIfAbsent(input, () {
      return _performExpensiveComputation(input);
    });
  }
}

// Optimized widgets
class OptimizedView extends GetView<PerformanceOptimizedController> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          // Only rebuilds when firstName changes
          Obx(() => Text(controller._firstName.value)),
          
          // GetBuilder for targeted rebuilds
          GetBuilder<PerformanceOptimizedController>(
            id: 'email',
            builder: (c) => Text(c._email.value),
          ),
          
          // Async handling with Obx
          Obx(() {
            return controller._itemsFuture.value.when(
              loading: () => CircularProgressIndicator(),
              error: (error, stack) => Text('Error: $error'),
              data: (items) => ListView.builder(
                itemCount: items.length,
                itemBuilder: (context, index) => ItemWidget(
                  key: ValueKey(items[index].id), // Key for efficient diffing
                  item: items[index],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}
3.2 Memory Management

class MemorySafeController extends GetxController {
  // Track resources for cleanup
  final List<Disposable> _resources = [];
  final Map<String, Disposable> _namedResources = {};
  
  @override
  void onInit() {
    super.onInit();
    
    // Register resources
    _registerResources();
  }
  
  void _registerResources() {
    // Network clients
    final dio = Dio();
    _registerResource(dio, name: 'dio');
    
    // Database connections
    final db = Database();
    _registerResource(db, name: 'database');
    
    // File handlers
    final file = FileHandler();
    _registerResource(file, name: 'file_handler');
  }
  
  void _registerResource(Disposable resource, {String? name}) {
    _resources.add(resource);
    
    if (name != null) {
      _namedResources[name] = resource;
    }
  }
  
  T getResource<T extends Disposable>(String name) {
    final resource = _namedResources[name];
    if (resource == null || resource is! T) {
      throw ResourceNotFoundException(name);
    }
    return resource as T;
  }
  
  @override
  void onClose() {
    // Dispose all resources
    _disposeResources();
    
    super.onClose();
  }
  
  void _disposeResources() {
    // Dispose in reverse order
    for (final resource in _resources.reversed) {
      resource.dispose();
    }
    
    _resources.clear();
    _namedResources.clear();
  }
  
  // Resource pooling for expensive objects
  final ResourcePool<Dio> _dioPool = ResourcePool(
    maxSize: 5,
    create: () => Dio(),
  );
  
  Future<T> withDio<T>(Future<T> Function(Dio) operation) async {
    final dio = _dioPool.acquire();
    
    try {
      return await operation(dio);
    } finally {
      _dioPool.release(dio);
    }
  }
}

abstract class Disposable {
  Future<void> dispose();
}

class ResourcePool<T extends Disposable> {
  final Queue<T> _pool = Queue();
  final int _maxSize;
  final T Function() _create;
  
  ResourcePool({
    required this._maxSize,
    required this._create,
  });
  
  T acquire() {
    if (_pool.isNotEmpty) {
      return _pool.removeFirst();
    }
    return _create();
  }
  
  void release(T resource) {
    if (_pool.length < _maxSize) {
      resource.dispose();
      _pool.add(resource);
    } else {
      resource.dispose();
    }
  }
  
  void disposeAll() {
    for (final resource in _pool) {
      resource.dispose();
    }
    _pool.clear();
  }
}
4. Error Handling and Logging
4.1 Comprehensive Error Handling

abstract class AppException implements Exception {
  final String message;
  final StackTrace stackTrace;
  final DateTime timestamp;
  
  AppException(this.message, this.stackTrace)
      : timestamp = DateTime.now();
  
  String get userFriendlyMessage;
  
  Map<String, dynamic> toJson() {
    return {
      'type': runtimeType.toString(),
      'message': message,
      'timestamp': timestamp.toIso8601String(),
      'stackTrace': stackTrace.toString(),
    };
  }
}

class NetworkException extends AppException {
  NetworkException(String message, StackTrace stackTrace)
      : super(message, stackTrace);
  
  @override
  String get userFriendlyMessage => 
      'Network error. Please check your connection.';
}

class ValidationException extends AppException {
  final String field;
  final String validationError;
  
  ValidationException(
    this.field,
    this.validationError,
    StackTrace stackTrace,
  ) : super('Validation failed for $field: $validationError', stackTrace);
  
  @override
  String get userFriendlyMessage => 
      'Please check the $field field: $validationError';
}

// Error handling in controllers
class ErrorHandlingController extends GetxController {
  final Rx<AppException?> _error = Rx<AppException?>(null);
  final RxBool _hasError = false.obs;
  
  AppException? get error => _error.value;
  bool get hasError => _hasError.value;
  
  Future<T> executeWithErrorHandling<T>(
    Future<T> Function() operation, {
    bool showUserMessage = true,
  }) async {
    try {
      _clearError();
      return await operation();
    } on NetworkException catch (e, stack) {
      await _handleNetworkError(e, stack, showUserMessage);
      rethrow;
    } on ValidationException catch (e, stack) {
      await _handleValidationError(e, stack, showUserMessage);
      rethrow;
    } catch (e, stack) {
      await _handleUnknownError(e, stack, showUserMessage);
      rethrow;
    }
  }
  
  void _clearError() {
    _error.value = null;
    _hasError.value = false;
  }
  
  Future<void> _handleNetworkError(
    NetworkException e,
    StackTrace stack,
    bool showUserMessage,
  ) async {
    _error.value = e;
    _hasError.value = true;
    
    await _logError(e);
    
    if (showUserMessage) {
      Get.snackbar(
        'Network Error',
        e.userFriendlyMessage,
        snackPosition: SnackPosition.BOTTOM,
      );
    }
  }
  
  Future<void> _handleValidationError(
    ValidationException e,
    StackTrace stack,
    bool showUserMessage,
  ) async {
    _error.value = e;
    _hasError.value = true;
    
    await _logError(e);
    
    if (showUserMessage) {
      Get.snackbar(
        'Validation Error',
        e.userFriendlyMessage,
        snackPosition: SnackPosition.BOTTOM,
      );
    }
  }
  
  Future<void> _handleUnknownError(
    dynamic e,
    StackTrace stack,
    bool showUserMessage,
  ) async {
    final error = AppException(
      e.toString(),
      stack,
    );
    
    _error.value = error;
    _hasError.value = true;
    
    await _logError(error);
    
    if (showUserMessage) {
      Get.snackbar(
        'Error',
        'Something went wrong. Please try again.',
        snackPosition: SnackPosition.BOTTOM,
      );
    }
  }
  
  Future<void> _logError(AppException error) async {
    final logger = Get.find<ErrorLogger>();
    await logger.logError(error);
    
    // Send to analytics if it's a critical error
    if (error is NetworkException || error is ValidationException) {
      final analytics = Get.find<AnalyticsService>();
      await analytics.logError(error);
    }
  }
}
4.2 Structured Logging

class AppLogger extends GetxService {
  final List<LogSink> _sinks = [];
  final Rx<LogLevel> _minimumLevel = LogLevel.info.obs;
  
  @override
  Future<void> onInit() async {
    super.onInit();
    
    // Add sinks
    _sinks.add(ConsoleSink());
    _sinks.add(FileSink());
    
    if (Get.find<AppConfig>().isProduction) {
      _sinks.add(RemoteSink());
    }
  }
  
  Future<void> log(
    LogLevel level,
    String message, {
    Object? error,
    StackTrace? stackTrace,
    Map<String, dynamic>? context,
  }) async {
    if (level.index < _minimumLevel.value.index) {
      return;
    }
    
    final logEntry = LogEntry(
      level: level,
      message: message,
      timestamp: DateTime.now(),
      error: error,
      stackTrace: stackTrace,
      context: context ?? {},
    );
    
    // Send to all sinks
    for (final sink in _sinks) {
      try {
        await sink.log(logEntry);
      } catch (e) {
        // Don't let logging errors crash the app
        debugPrint('Failed to log to sink: $e');
      }
    }
  }
  
  // Convenience methods
  Future<void> debug(String message, {Map<String, dynamic>? context}) async {
    await log(LogLevel.debug, message, context: context);
  }
  
  Future<void> info(String message, {Map<String, dynamic>? context}) async {
    await log(LogLevel.info, message, context: context);
  }
  
  Future<void> warning(String message, {Map<String, dynamic>? context}) async {
    await log(LogLevel.warning, message, context: context);
  }
  
  Future<void> error(
    String message, {
    Object? error,
    StackTrace? stackTrace,
    Map<String, dynamic>? context,
  }) async {
    await log(
      LogLevel.error,
      message,
      error: error,
      stackTrace: stackTrace,
      context: context,
    );
  }
  
  Future<void> critical(
    String message, {
    Object? error,
    StackTrace? stackTrace,
    Map<String, dynamic>? context,
  }) async {
    await log(
      LogLevel.critical,
      message,
      error: error,
      stackTrace: stackTrace,
      context: context,
    );
  }
}

enum LogLevel {
  debug,
  info,
  warning,
  error,
  critical,
}

class LogEntry {
  final LogLevel level;
  final String message;
  final DateTime timestamp;
  final Object? error;
  final StackTrace? stackTrace;
  final Map<String, dynamic> context;
  
  LogEntry({
    required this.level,
    required this.message,
    required this.timestamp,
    this.error,
    this.stackTrace,
    required this.context,
  });
  
  Map<String, dynamic> toJson() {
    return {
      'level': level.name,
      'message': message,
      'timestamp': timestamp.toIso8601String(),
      'error': error?.toString(),
      'stackTrace': stackTrace?.toString(),
      'context': context,
    };
  }
}

abstract class LogSink {
  Future<void> log(LogEntry entry);
}

class ConsoleSink implements LogSink {
  @override
  Future<void> log(LogEntry entry) async {
    final json = entry.toJson();
    debugPrint(jsonEncode(json));
  }
}

class FileSink implements LogSink {
  final Directory _logDirectory;
  
  FileSink() : _logDirectory = Directory('logs');
  
  @override
  Future<void> log(LogEntry entry) async {
    if (!await _logDirectory.exists()) {
      await _logDirectory.create(recursive: true);
    }
    
    final now = DateTime.now();
    final fileName = '${now.year}-${now.month}-${now.day}.log';
    final file = File('${_logDirectory.path}/$fileName');
    
    await file.writeAsString(
      '${entry.timestamp.toIso8601String()} [${entry.level.name}] ${entry.message}\n',
      mode: FileMode.append,
    );
  }
}
5. Testing Best Practices
5.1 Controller Testing

// Comprehensive controller tests
void main() {
  late UserController controller;
  late MockUserRepository mockRepository;
  late MockAnalyticsService mockAnalytics;
  
  setUp(() {
    // Setup mocks
    mockRepository = MockUserRepository();
    mockAnalytics = MockAnalyticsService();
    
    // Register dependencies
    Get.put<UserRepository>(mockRepository);
    Get.put<AnalyticsService>(mockAnalytics);
    
    // Create controller
    controller = UserController();
  });
  
  tearDown(() {
    Get.reset();
  });
  
  group('UserController', () {
    test('Initial state is correct', () {
      expect(controller.isLoading.value, isFalse);
      expect(controller.user.value, isNull);
      expect(controller.error.value, isEmpty);
    });
    
    test('Load user successfully', () async {
      // Arrange
      final mockUser = User(id: '1', name: 'John');
      when(mockRepository.getUser()).thenAnswer((_) async => mockUser);
      
      // Act
      await controller.loadUser();
      
      // Assert
      expect(controller.isLoading.value, isFalse);
      expect(controller.user.value, equals(mockUser));
      expect(controller.error.value, isEmpty);
      verify(mockAnalytics.logUserLoad()).called(1);
    });
    
    test('Handle load user error', () async {
      // Arrange
      final exception = Exception('Network error');
      when(mockRepository.getUser()).thenThrow(exception);
      
      // Act & Assert
      expect(() async => await controller.loadUser(), throwsException);
      expect(controller.isLoading.value, isFalse);
      expect(controller.error.value, isNotEmpty);
    });
    
    test('Update user triggers reactive updates', () async {
      // Arrange
      final user = User(id: '1', name: 'John');
      controller.user.value = user;
      
      var updateCount = 0;
      controller.user.listen((_) => updateCount++);
      
      // Act
      controller.user.value = user.copyWith(name: 'Jane');
      
      // Assert
      expect(updateCount, equals(1));
      expect(controller.user.value.name, equals('Jane'));
    });
  });
}
5.2 Widget Testing with GetX

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
  
  testWidgets('UserProfileScreen displays user data', (tester) async {
    // Build widget
    await tester.pumpWidget(
      GetMaterialApp(
        home: UserProfileScreen(),
      ),
    );
    
    // Verify UI
    expect(find.text('John Doe'), findsOneWidget);
    expect(find.byType(CircularProgressIndicator), findsNothing);
  });
  
  testWidgets('UserProfileScreen shows loading state', (tester) async {
    // Update mock
    when(mockController.isLoading).thenReturn(true.obs);
    
    await tester.pumpWidget(
      GetMaterialApp(
        home: UserProfileScreen(),
      ),
    );
    
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });
  
  testWidgets('UserProfileScreen handles refresh', (tester) async {
    await tester.pumpWidget(
      GetMaterialApp(
        home: UserProfileScreen(),
      ),
    );
    
    // Tap refresh button
    await tester.tap(find.byIcon(Icons.refresh));
    await tester.pump();
    
    verify(mockController.loadUser()).called(1);
  });
  
  testWidgets('UserProfileScreen navigates on edit', (tester) async {
    await tester.pumpWidget(
      GetMaterialApp(
        home: UserProfileScreen(),
        getPages: [
          GetPage(name: '/edit', page: () => EditProfileScreen()),
        ],
      ),
    );
    
    // Tap edit button
    await tester.tap(find.byIcon(Icons.edit));
    await tester.pumpAndSettle();
    
    expect(Get.currentRoute, '/edit');
  });
}
6. Security Best Practices
6.1 Secure Data Handling

class SecureDataHandler extends GetxService {
  final FlutterSecureStorage _secureStorage = FlutterSecureStorage();
  final GetStorage _localStorage = GetStorage();
  
  // Store sensitive data securely
  Future<void> storeSensitive(String key, String value) async {
    // Encrypt before storage
    final encrypted = await _encrypt(value);
    await _secureStorage.write(key: key, value: encrypted);
  }
  
  Future<String?> readSensitive(String key) async {
    final encrypted = await _secureStorage.read(key: key);
    if (encrypted == null) return null;
    
    return await _decrypt(encrypted);
  }
  
  Future<void> _encrypt(String plaintext) async {
    // Use platform-specific encryption
    final encryption = FlutterStringEncryption();
    return await encryption.encrypt(plaintext, 'encryption_key');
  }
  
  // Store non-sensitive data
  Future<void> store(String key, dynamic value) async {
    await _localStorage.write(key, value);
  }
  
  T? read<T>(String key) {
    return _localStorage.read<T>(key);
  }
  
  // Clear all data
  Future<void> clearAll() async {
    await _localStorage.erase();
    await _secureStorage.deleteAll();
  }
  
  // Secure deletion
  Future<void> secureDelete(String key) async {
    // Overwrite before deletion
    await _secureStorage.write(key: key, value: '0' * 100);
    await _secureStorage.delete(key: key);
  }
}
6.2 Input Validation and Sanitization

class InputValidator extends GetxService {
  final RegExp _emailRegex = RegExp(
    r'^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$',
  );
  
  final RegExp _passwordRegex = RegExp(
    r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$',
  );
  
  Future<ValidationResult> validateEmail(String email) async {
    final cleaned = email.trim().toLowerCase();
    
    if (!_emailRegex.hasMatch(cleaned)) {
      return ValidationResult.invalid('Invalid email format');
    }
    
    // Check for disposable emails
    if (await _isDisposableEmail(cleaned)) {
      return ValidationResult.invalid('Disposable email not allowed');
    }
    
    return ValidationResult.valid();
  }
  
  Future<ValidationResult> validatePassword(String password) async {
    if (password.length < 8) {
      return ValidationResult.invalid('Password must be at least 8 characters');
    }
    
    if (!_passwordRegex.hasMatch(password)) {
      return ValidationResult.invalid(
        'Password must contain uppercase, lowercase, number, and special character',
      );
    }
    
    // Common password check
    if (await _isCommonPassword(password)) {
      return ValidationResult.invalid('Password is too common');
    }
    
    return ValidationResult.valid();
  }
  
  String sanitizeInput(String input) {
    // Remove potentially dangerous characters
    return input
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#x27;')
        .replaceAll('/', '&#x2F;');
  }
}
This comprehensive best practices guide provides patterns for building maintainable, performant, and secure GetX applications. Following these practices ensures code quality, reliability, and scalability as your application grows.