GetX Dependency Injection - Senior Guide
1. Advanced Binding Patterns
1.1 Layered Dependency Injection

abstract class DependencyLayer {
  Future<void> registerDependencies();
  Future<void> disposeDependencies();
}

// Infrastructure Layer
class InfrastructureLayer implements DependencyLayer {
  @override
  Future<void> registerDependencies() async {
    // Core infrastructure services
    Get.lazyPut<NetworkService>(
      () => NetworkServiceImpl(),
      tag: 'network',
      fenix: true,
    );
    
    Get.lazyPut<DatabaseService>(
      () => DatabaseServiceImpl(),
      tag: 'database',
      fenix: true,
    );
    
    Get.lazyPut<StorageService>(
      () => StorageServiceImpl(),
      tag: 'storage',
      fenix: true,
    );
    
    // Configuration
    Get.lazyPut<AppConfig>(
      () => AppConfig.fromEnvironment(),
      tag: 'config',
    );
  }
  
  @override
  Future<void> disposeDependencies() async {
    // Clean up infrastructure resources
    await Get.find<DatabaseService>(tag: 'database').close();
    await Get.find<StorageService>(tag: 'storage').cleanup();
  }
}

// Domain Layer
class DomainLayer implements DependencyLayer {
  @override
  Future<void> registerDependencies() async {
    // Repository interfaces with implementations
    Get.lazyPut<UserRepository>(
      () => UserRepositoryImpl(
        Get.find<NetworkService>(tag: 'network'),
        Get.find<DatabaseService>(tag: 'database'),
      ),
      fenix: true,
    );
    
    Get.lazyPut<ProductRepository>(
      () => ProductRepositoryImpl(
        Get.find<NetworkService>(tag: 'network'),
        Get.find<DatabaseService>(tag: 'database'),
      ),
      fenix: true,
    );
    
    // Use cases
    Get.lazyPut<GetUserUseCase>(
      () => GetUserUseCase(Get.find<UserRepository>()),
    );
    
    Get.lazyPut<CreateProductUseCase>(
      () => CreateProductUseCase(Get.find<ProductRepository>()),
    );
  }
  
  @override
  Future<void> disposeDependencies() async {
    // Domain layer usually doesn't need disposal
  }
}

// Presentation Layer
class PresentationLayer implements DependencyLayer {
  @override
  Future<void> registerDependencies() async {
    // Controllers
    Get.lazyPut<HomeController>(
      () => HomeController(
        Get.find<GetUserUseCase>(),
        Get.find<CreateProductUseCase>(),
      ),
      fenix: true,
    );
    
    Get.lazyPut<ProfileController>(
      () => ProfileController(Get.find<GetUserUseCase>()),
      fenix: true,
    );
    
    // Services
    Get.lazyPut<NavigationService>(
      () => NavigationServiceImpl(),
      fenix: true,
    );
    
    Get.lazyPut<AnalyticsService>(
      () => AnalyticsServiceImpl(Get.find<AppConfig>(tag: 'config')),
      fenix: true,
    );
  }
  
  @override
  Future<void> disposeDependencies() async {
    // Dispose controllers
    Get.find<HomeController>().onClose();
    Get.find<ProfileController>().onClose();
  }
}

// Dependency Manager
class DependencyManager extends GetxService {
  final List<DependencyLayer> _layers = [];
  
  @override
  Future<void> onInit() async {
    super.onInit();
    
    // Register layers in order
    _layers.addAll([
      InfrastructureLayer(),
      DomainLayer(),
      PresentationLayer(),
    ]);
    
    // Initialize layers
    for (final layer in _layers) {
      await layer.registerDependencies();
    }
    
    // Verify dependencies
    await _verifyDependencies();
  }
  
  @override
  Future<void> onClose() async {
    // Dispose layers in reverse order
    for (final layer in _layers.reversed) {
      await layer.disposeDependencies();
    }
    
    await super.onClose();
  }
  
  Future<void> _verifyDependencies() async {
    // Check critical dependencies
    final missingDeps = <Type>[];
    
    if (!Get.isRegistered<NetworkService>()) {
      missingDeps.add(NetworkService);
    }
    
    if (!Get.isRegistered<DatabaseService>()) {
      missingDeps.add(DatabaseService);
    }
    
    if (missingDeps.isNotEmpty) {
      throw DependencyException('Missing dependencies: $missingDeps');
    }
  }
}
1.2 Scoped Dependency Injection

class ScopedDependencyManager {
  final Map<String, DependencyScope> _scopes = {};
  
  DependencyScope createScope(String name) {
    final scope = DependencyScope(name);
    _scopes[name] = scope;
    return scope;
  }
  
  DependencyScope? getScope(String name) => _scopes[name];
  
  Future<void> disposeScope(String name) async {
    final scope = _scopes[name];
    if (scope != null) {
      await scope.dispose();
      _scopes.remove(name);
    }
  }
  
  Future<void> disposeAll() async {
    for (final scope in _scopes.values) {
      await scope.dispose();
    }
    _scopes.clear();
  }
}

class DependencyScope {
  final String name;
  final Map<Type, dynamic> _instances = {};
  final Map<Type, FactoryFunction> _factories = {};
  
  DependencyScope(this.name);
  
  T get<T>([String? tag]) {
    final key = _createKey<T>(tag);
    
    if (_instances.containsKey(key)) {
      return _instances[key] as T;
    }
    
    if (_factories.containsKey(T)) {
      final instance = _factories[T]!() as T;
      _instances[key] = instance;
      return instance;
    }
    
    throw DependencyNotFoundException(T, scope: name);
  }
  
  void registerFactory<T>(FactoryFunction<T> factory) {
    _factories[T] = factory;
  }
  
  void registerSingleton<T>(T instance, {String? tag}) {
    final key = _createKey<T>(tag);
    _instances[key] = instance;
  }
  
  Future<void> dispose() async {
    // Dispose disposable instances
    for (final instance in _instances.values) {
      if (instance is Disposable) {
        await instance.dispose();
      }
    }
    
    _instances.clear();
    _factories.clear();
  }
  
  Type _createKey<T>([String? tag]) {
    return tag != null ? _TaggedType<T>(tag) : T;
  }
}

// Usage with feature modules
class CheckoutScope extends DependencyScope {
  CheckoutScope() : super('checkout') {
    registerFactory<CartService>(() => CartService());
    registerFactory<PaymentService>(() => PaymentService());
    registerFactory<ShippingService>(() => ShippingService());
    
    registerSingleton<CheckoutController>(
      CheckoutController(
        get<CartService>(),
        get<PaymentService>(),
        get<ShippingService>(),
      ),
    );
  }
}

// Integration with GetX
class ScopedBinding extends Bindings {
  final DependencyScope scope;
  
  ScopedBinding(this.scope);
  
  @override
  void dependencies() {
    // Register scope in GetX
    Get.lazyPut(() => scope, tag: scope.name);
    
    // Register scope instances as needed
    Get.lazyPut<CartService>(
      () => scope.get<CartService>(),
      tag: '${scope.name}_cart',
    );
  }
}
2. Service Lifetime Management
2.1 Lifetime Strategies

enum ServiceLifetime {
  transient,    // New instance every time
  scoped,       // One instance per scope
  singleton,    // Single instance for app lifetime
  request,      // Instance per request/feature
}

class LifetimeManager extends GetxService {
  final Map<Type, ServiceRegistration> _registrations = {};
  final Map<Type, dynamic> _singletons = {};
  final Map<String, Map<Type, dynamic>> _scopedInstances = {};
  
  void register<T>({
    required FactoryFunction<T> factory,
    ServiceLifetime lifetime = ServiceLifetime.transient,
    List<Type> dependencies = const [],
    String? tag,
  }) {
    _registrations[T] = ServiceRegistration(
      factory: factory,
      lifetime: lifetime,
      dependencies: dependencies,
      tag: tag,
    );
  }
  
  T resolve<T>([String? scopeId]) {
    final registration = _registrations[T];
    if (registration == null) {
      throw DependencyNotFoundException(T);
    }
    
    switch (registration.lifetime) {
      case ServiceLifetime.transient:
        return _createTransient<T>(registration);
        
      case ServiceLifetime.scoped:
        return _getScoped<T>(registration, scopeId);
        
      case ServiceLifetime.singleton:
        return _getSingleton<T>(registration);
        
      case ServiceLifetime.request:
        return _createRequestScoped<T>(registration);
    }
  }
  
  T _createTransient<T>(ServiceRegistration registration) {
    // Resolve dependencies
    final deps = _resolveDependencies(registration.dependencies);
    
    // Create new instance
    return registration.factory(deps) as T;
  }
  
  T _getSingleton<T>(ServiceRegistration registration) {
    final key = _createKey<T>(registration.tag);
    
    if (!_singletons.containsKey(key)) {
      final deps = _resolveDependencies(registration.dependencies);
      _singletons[key] = registration.factory(deps);
    }
    
    return _singletons[key] as T;
  }
  
  T _getScoped<T>(ServiceRegistration registration, String? scopeId) {
    if (scopeId == null) {
      throw ScopeRequiredException(T);
    }
    
    final scope = _scopedInstances.putIfAbsent(scopeId, () => {});
    final key = _createKey<T>(registration.tag);
    
    if (!scope.containsKey(key)) {
      final deps = _resolveDependencies(registration.dependencies);
      scope[key] = registration.factory(deps);
    }
    
    return scope[key] as T;
  }
  
  T _createRequestScoped<T>(ServiceRegistration registration) {
    // Request-scoped instances are created per feature/request
    // and disposed when the feature/request completes
    
    final deps = _resolveDependencies(registration.dependencies);
    return registration.factory(deps) as T;
  }
  
  List<dynamic> _resolveDependencies(List<Type> dependencies) {
    return dependencies.map((type) => resolve(type)).toList();
  }
  
  Future<void> disposeScope(String scopeId) async {
    final scope = _scopedInstances[scopeId];
    if (scope != null) {
      for (final instance in scope.values) {
        if (instance is Disposable) {
          await instance.dispose();
        }
      }
      _scopedInstances.remove(scopeId);
    }
  }
  
  Future<void> disposeAll() async {
    // Dispose singletons
    for (final instance in _singletons.values) {
      if (instance is Disposable) {
        await instance.dispose();
      }
    }
    _singletons.clear();
    
    // Dispose all scoped instances
    for (final scopeId in _scopedInstances.keys.toList()) {
      await disposeScope(scopeId);
    }
  }
}

class ServiceRegistration {
  final FactoryFunction factory;
  final ServiceLifetime lifetime;
  final List<Type> dependencies;
  final String? tag;
  
  ServiceRegistration({
    required this.factory,
    required this.lifetime,
    required this.dependencies,
    this.tag,
  });
}
2.2 Dependency Disposal Strategies

abstract class Disposable {
  Future<void> dispose();
}

class DisposableRegistry extends GetxService {
  final List<Disposable> _disposables = [];
  final Map<String, List<Disposable>> _scopedDisposables = {};
  
  void register(Disposable disposable, {String? scope}) {
    if (scope != null) {
      final list = _scopedDisposables.putIfAbsent(scope, () => []);
      list.add(disposable);
    } else {
      _disposables.add(disposable);
    }
  }
  
  Future<void> disposeScope(String scope) async {
    final disposables = _scopedDisposables[scope];
    if (disposables != null) {
      for (final disposable in disposables.reversed) {
        await disposable.dispose();
      }
      _scopedDisposables.remove(scope);
    }
  }
  
  @override
  Future<void> onClose() async {
    // Dispose global disposables
    for (final disposable in _disposables.reversed) {
      await disposable.dispose();
    }
    _disposables.clear();
    
    // Dispose all scoped disposables
    for (final scope in _scopedDisposables.keys.toList()) {
      await disposeScope(scope);
    }
    
    await super.onClose();
  }
}

// Smart disposable wrapper
class SmartDisposable<T> implements Disposable {
  final T _instance;
  final Future<void> Function(T) _disposer;
  final bool _autoDispose;
  
  SmartDisposable(
    this._instance, {
    required Future<void> Function(T) disposer,
    bool autoDispose = true,
  }) : _disposer = disposer, _autoDispose = autoDispose;
  
  T get instance => _instance;
  
  @override
  Future<void> dispose() async {
    if (_autoDispose) {
      await _disposer(_instance);
    }
  }
  
  // Factory method for common types
  factory SmartDisposable.dio(Dio dio) {
    return SmartDisposable(
      dio,
      disposer: (dio) async {
        dio.close();
      },
    );
  }
  
  factory SmartDisposable.database(Database database) {
    return SmartDisposable(
      database,
      disposer: (db) => db.close(),
    );
  }
}

// Automatic disposal with GetX
class AutoDisposingController extends GetxController 
    implements Disposable {
  
  final List<StreamSubscription> _subscriptions = [];
  final List<Timer> _timers = [];
  final List<Worker> _workers = [];
  
  void registerSubscription(StreamSubscription subscription) {
    _subscriptions.add(subscription);
  }
  
  void registerTimer(Timer timer) {
    _timers.add(timer);
  }
  
  void registerWorker(Worker worker) {
    _workers.add(worker);
  }
  
  @override
  Future<void> dispose() async {
    // Cancel all subscriptions
    for (final subscription in _subscriptions) {
      await subscription.cancel();
    }
    _subscriptions.clear();
    
    // Cancel all timers
    for (final timer in _timers) {
      timer.cancel();
    }
    _timers.clear();
    
    // Dispose all workers
    for (final worker in _workers) {
      worker.dispose();
    }
    _workers.clear();
    
    super.dispose();
  }
  
  @override
  void onClose() {
    // Auto-register with disposal registry
    Get.find<DisposableRegistry>().register(this);
    super.onClose();
  }
}
3. Testing with Dependency Injection
3.1 Test-Specific Dependency Configuration

class TestDependencyConfig {
  static void setupUnitTests() {
    // Clear any existing instances
    Get.reset();
    
    // Register test doubles
    Get.put<ApiService>(MockApiService());
    Get.put<DatabaseService>(MockDatabaseService());
    Get.put<AnalyticsService>(MockAnalyticsService());
    
    // Enable test mode
    Get.testMode = true;
  }
  
  static void setupIntegrationTests() {
    Get.reset();
    
    // Use real services with test configuration
    Get.put<ApiService>(
      ApiServiceImpl(baseUrl: 'http://localhost:8080'),
    );
    
    Get.put<DatabaseService>(
      DatabaseServiceImpl(inMemory: true),
    );
    
    // Mock external services
    Get.put<AnalyticsService>(MockAnalyticsService());
    
    Get.testMode = true;
  }
  
  static void teardown() {
    Get.reset();
    Get.testMode = false;
  }
}

// Test-specific bindings
class TestBindings extends Bindings {
  final Map<Type, dynamic> _overrides;
  
  TestBindings({Map<Type, dynamic> overrides = const {}})
      : _overrides = overrides;
  
  @override
  void dependencies() {
    // Register test services
    _registerCoreServices();
    _registerRepositories();
    _registerControllers();
  }
  
  void _registerCoreServices() {
    Get.lazyPut<NetworkService>(
      () => _overrides[NetworkService] ?? MockNetworkService(),
      fenix: true,
    );
    
    Get.lazyPut<DatabaseService>(
      () => _overrides[DatabaseService] ?? MockDatabaseService(),
      fenix: true,
    );
  }
  
  void _registerRepositories() {
    Get.lazyPut<UserRepository>(
      () => _overrides[UserRepository] ?? MockUserRepository(),
      fenix: true,
    );
  }
  
  void _registerControllers() {
    Get.lazyPut<AuthController>(
      () => AuthController(
        Get.find<UserRepository>(),
        _overrides[AnalyticsService] ?? MockAnalyticsService(),
      ),
    );
  }
}

// Dependency injection in tests
void main() {
  group('AuthController Tests', () {
    late AuthController controller;
    late MockUserRepository mockRepository;
    
    setUp(() {
      // Setup test bindings
      TestBindings(
        overrides: {
          UserRepository: MockUserRepository(),
          AnalyticsService: MockAnalyticsService(),
        },
      ).dependencies();
      
      // Get controller instance
      controller = Get.find<AuthController>();
      mockRepository = Get.find<UserRepository>() as MockUserRepository;
    });
    
    tearDown(() {
      Get.reset();
    });
    
    test('Login calls repository', () async {
      // Arrange
      when(mockRepository.login(any, any))
          .thenAnswer((_) async => User(id: '1', name: 'Test'));
      
      // Act
      await controller.login('test@test.com', 'password');
      
      // Assert
      verify(mockRepository.login('test@test.com', 'password')).called(1);
    });
  });
}
3.2 Mock Dependency Injection

class MockDependencyInjector {
  final Map<Type, dynamic> _mocks = {};
  final Map<Type, List<dynamic>> _callHistory = {};
  
  void registerMock<T>(T mock) {
    _mocks[T] = mock;
  }
  
  T getMock<T>() {
    final mock = _mocks[T];
    if (mock == null) {
      throw MockNotFoundException(T);
    }
    return mock as T;
  }
  
  void recordCall<T>(String method, List<dynamic> args) {
    _callHistory.putIfAbsent(T, () => []).add({
      'method': method,
      'args': args,
      'timestamp': DateTime.now(),
    });
  }
  
  List<Map<String, dynamic>> getCallHistory<T>() {
    return _callHistory[T] ?? [];
  }
  
  void clearCallHistory() {
    _callHistory.clear();
  }
  
  void resetAll() {
    _mocks.clear();
    _callHistory.clear();
  }
}

// Mock factory
class MockFactory {
  static MockUserRepository createUserRepository({
    User? mockUser,
    Exception? loginError,
    bool slowResponse = false,
  }) {
    final mock = MockUserRepository();
    
    if (mockUser != null) {
      when(mock.login(any, any)).thenAnswer((_) async {
        if (slowResponse) {
          await Future.delayed(Duration(milliseconds: 500));
        }
        return mockUser;
      });
    }
    
    if (loginError != null) {
      when(mock.login(any, any)).thenThrow(loginError);
    }
    
    return mock;
  }
  
  static MockApiService createApiService({
    Map<String, dynamic>? mockResponses,
    Duration? delay,
  }) {
    final mock = MockApiService();
    
    if (mockResponses != null) {
      for (final entry in mockResponses.entries) {
        when(mock.get(entry.key)).thenAnswer((_) async {
          if (delay != null) {
            await Future.delayed(delay);
          }
          return Response(
            requestOptions: RequestOptions(path: entry.key),
            data: entry.value,
          );
        });
      }
    }
    
    return mock;
  }
}

// Verifiable dependency
class Verifiable<T> {
  final T instance;
  final List<Verification> _verifications = [];
  
  Verifiable(this.instance);
  
  void verifyCall(String method, {List<dynamic>? args, int times = 1}) {
    _verifications.add(Verification(
      method: method,
      expectedArgs: args,
      expectedTimes: times,
    ));
  }
  
  void assertVerifications() {
    for (final verification in _verifications) {
      final actualCalls = _getActualCalls(verification.method);
      
      if (verification.expectedArgs != null) {
        final matchingCalls = actualCalls.where((call) {
          return _argsMatch(call['args'], verification.expectedArgs!);
        });
        
        expect(
          matchingCalls.length,
          verification.expectedTimes,
          reason: 'Expected ${verification.method} to be called '
                  '${verification.expectedTimes} times with '
                  '${verification.expectedArgs}',
        );
      } else {
        expect(
          actualCalls.length,
          verification.expectedTimes,
          reason: 'Expected ${verification.method} to be called '
                  '${verification.expectedTimes} times',
        );
      }
    }
  }
  
  List<Map<String, dynamic>> _getActualCalls(String method) {
    // Implementation depends on mocking framework
    return [];
  }
  
  bool _argsMatch(List<dynamic> actual, List<dynamic> expected) {
    if (actual.length != expected.length) return false;
    
    for (var i = 0; i < actual.length; i++) {
      if (actual[i] != expected[i] && expected[i] != any) {
        return false;
      }
    }
    
    return true;
  }
}
4. Advanced Injection Patterns
4.1 Decorator Pattern with DI

abstract class DataService {
  Future<Data> fetchData(String id);
}

class RealDataService implements DataService {
  final ApiService _api;
  
  RealDataService(this._api);
  
  @override
  Future<Data> fetchData(String id) async {
    return await _api.get('/data/$id');
  }
}

// Decorator base class
abstract class DataServiceDecorator implements DataService {
  final DataService _decorated;
  
  DataServiceDecorator(this._decorated);
  
  @override
  Future<Data> fetchData(String id) => _decorated.fetchData(id);
}

// Caching decorator
class CachingDataService extends DataServiceDecorator {
  final CacheService _cache;
  final Duration _cacheDuration;
  
  CachingDataService(
    DataService decorated,
    this._cache,
    this._cacheDuration,
  ) : super(decorated);
  
  @override
  Future<Data> fetchData(String id) async {
    // Try cache first
    final cached = await _cache.get<Data>('data_$id');
    if (cached != null) {
      return cached;
    }
    
    // Fetch from decorated service
    final data = await super.fetchData(id);
    
    // Cache the result
    await _cache.set('data_$id', data, _cacheDuration);
    
    return data;
  }
}

// Logging decorator
class LoggingDataService extends DataServiceDecorator {
  final AnalyticsService _analytics;
  
  LoggingDataService(DataService decorated, this._analytics)
      : super(decorated);
  
  @override
  Future<Data> fetchData(String id) async {
    final stopwatch = Stopwatch()..start();
    
    try {
      final data = await super.fetchData(id);
      
      _analytics.logDataFetch(
        id: id,
        duration: stopwatch.elapsed,
        success: true,
      );
      
      return data;
    } catch (e) {
      _analytics.logDataFetch(
        id: id,
        duration: stopwatch.elapsed,
        success: false,
        error: e.toString(),
      );
      
      rethrow;
    }
  }
}

// Decorator factory with DI
class DataServiceFactory {
  final ApiService _api;
  final CacheService _cache;
  final AnalyticsService _analytics;
  
  DataServiceFactory(
    this._api,
    this._cache,
    this._analytics,
  );
  
  DataService createService({
    bool caching = true,
    bool logging = true,
    Duration cacheDuration = const Duration(minutes: 5),
  }) {
    DataService service = RealDataService(_api);
    
    if (caching) {
      service = CachingDataService(service, _cache, cacheDuration);
    }
    
    if (logging) {
      service = LoggingDataService(service, _analytics);
    }
    
    return service;
  }
}

// Registration in GetX
class DecoratorBindings extends Bindings {
  @override
  void dependencies() {
    // Register dependencies
    Get.lazyPut<ApiService>(() => ApiServiceImpl());
    Get.lazyPut<CacheService>(() => CacheServiceImpl());
    Get.lazyPut<AnalyticsService>(() => AnalyticsServiceImpl());
    
    // Register factory
    Get.lazyPut<DataServiceFactory>(
      () => DataServiceFactory(
        Get.find<ApiService>(),
        Get.find<CacheService>(),
        Get.find<AnalyticsService>(),
      ),
    );
    
    // Register decorated service
    Get.lazyPut<DataService>(
      () => Get.find<DataServiceFactory>().createService(
        caching: true,
        logging: true,
      ),
      fenix: true,
    );
  }
}
4.2 Strategy Pattern with DI

abstract class PaymentStrategy {
  Future<PaymentResult> process(PaymentRequest request);
  bool supports(PaymentMethod method);
}

class CreditCardStrategy implements PaymentStrategy {
  final PaymentGateway _gateway;
  
  CreditCardStrategy(this._gateway);
  
  @override
  Future<PaymentResult> process(PaymentRequest request) async {
    return await _gateway.processCreditCard(request);
  }
  
  @override
  bool supports(PaymentMethod method) => method == PaymentMethod.creditCard;
}

class PayPalStrategy implements PaymentStrategy {
  final PayPalService _paypal;
  
  PayPalStrategy(this._paypal);
  
  @override
  Future<PaymentResult> process(PaymentRequest request) async {
    return await _paypal.processPayment(request);
  }
  
  @override
  bool supports(PaymentMethod method) => method == PaymentMethod.paypal;
}

class CryptoStrategy implements PaymentStrategy {
  final CryptoPaymentService _crypto;
  
  CryptoStrategy(this._crypto);
  
  @override
  Future<PaymentResult> process(PaymentRequest request) async {
    return await _crypto.processCryptoPayment(request);
  }
  
  @override
  bool supports(PaymentMethod method) => method == PaymentMethod.crypto;
}

// Strategy registry
class PaymentStrategyRegistry {
  final List<PaymentStrategy> _strategies = [];
  
  void registerStrategy(PaymentStrategy strategy) {
    _strategies.add(strategy);
  }
  
  PaymentStrategy getStrategy(PaymentMethod method) {
    final strategy = _strategies.firstWhere(
      (s) => s.supports(method),
      orElse: () => throw UnsupportedPaymentMethod(method),
    );
    
    return strategy;
  }
  
  List<PaymentMethod> get supportedMethods {
    return _strategies
        .map((s) => PaymentMethod.values.firstWhere((m) => s.supports(m)))
        .toList();
  }
}

// Payment processor using strategies
class PaymentProcessor extends GetxController {
  final PaymentStrategyRegistry _registry;
  final Rx<PaymentStatus> _status = PaymentStatus.idle.obs;
  final Rx<PaymentMethod?> _selectedMethod = Rx<PaymentMethod?>(null);
  
  PaymentProcessor(this._registry);
  
  Future<PaymentResult> processPayment(PaymentRequest request) async {
    if (_selectedMethod.value == null) {
      throw PaymentMethodNotSelected();
    }
    
    _status(PaymentStatus.processing);
    
    try {
      final strategy = _registry.getStrategy(_selectedMethod.value!);
      final result = await strategy.process(request);
      
      _status(PaymentStatus.completed);
      return result;
    } catch (e) {
      _status(PaymentStatus.failed);
      rethrow;
    }
  }
  
  void selectMethod(PaymentMethod method) {
    if (!_registry.supportedMethods.contains(method)) {
      throw UnsupportedPaymentMethod(method);
    }
    
    _selectedMethod(method);
  }
}

// Registration
class PaymentBindings extends Bindings {
  @override
  void dependencies() {
    // Register services
    Get.lazyPut<PaymentGateway>(() => PaymentGatewayImpl());
    Get.lazyPut<PayPalService>(() => PayPalServiceImpl());
    Get.lazyPut<CryptoPaymentService>(() => CryptoPaymentServiceImpl());
    
    // Register strategies
    Get.lazyPut<CreditCardStrategy>(
      () => CreditCardStrategy(Get.find<PaymentGateway>()),
    );
    
    Get.lazyPut<PayPalStrategy>(
      () => PayPalStrategy(Get.find<PayPalService>()),
    );
    
    Get.lazyPut<CryptoStrategy>(
      () => CryptoStrategy(Get.find<CryptoPaymentService>()),
    );
    
    // Register strategy registry
    Get.lazyPut<PaymentStrategyRegistry>(() {
      final registry = PaymentStrategyRegistry();
      registry.registerStrategy(Get.find<CreditCardStrategy>());
      registry.registerStrategy(Get.find<PayPalStrategy>());
      registry.registerStrategy(Get.find<CryptoStrategy>());
      return registry;
    });
    
    // Register processor
    Get.lazyPut<PaymentProcessor>(
      () => PaymentProcessor(Get.find<PaymentStrategyRegistry>()),
    );
  }
}
5. Circular Dependency Resolution
5.1 Lazy Resolution Pattern

class ServiceA {
  final Lazy<ServiceB> _serviceB;
  
  ServiceA(this._serviceB);
  
  Future<void> doSomething() async {
    // Resolve ServiceB only when needed
    final serviceB = await _serviceB.get();
    await serviceB.doSomethingElse();
  }
}

class ServiceB {
  final Lazy<ServiceA> _serviceA;
  
  ServiceB(this._serviceA);
  
  Future<void> doSomethingElse() async {
    final serviceA = await _serviceA.get();
    // Use serviceA
  }
}

// Lazy dependency wrapper
class Lazy<T> {
  final Future<T> Function() _factory;
  T? _instance;
  bool _isResolving = false;
  
  Lazy(this._factory);
  
  Future<T> get() async {
    if (_instance != null) return _instance!;
    
    if (_isResolving) {
      // Circular dependency detected
      throw CircularDependencyException(T);
    }
    
    _isResolving = true;
    try {
      _instance = await _factory();
      return _instance!;
    } finally {
      _isResolving = false;
    }
  }
  
  void clear() {
    _instance = null;
  }
}

// Registration with lazy resolution
class CircularDependencyBindings extends Bindings {
  @override
  void dependencies() {
    // Register lazy factories
    Get.lazyPut<Lazy<ServiceA>>(
      () => Lazy(() => Get.find<ServiceA>()),
    );
    
    Get.lazyPut<Lazy<ServiceB>>(
      () => Lazy(() => Get.find<ServiceB>()),
    );
    
    // Register services with lazy dependencies
    Get.lazyPut<ServiceA>(
      () => ServiceA(Get.find<Lazy<ServiceB>>()),
    );
    
    Get.lazyPut<ServiceB>(
      () => ServiceB(Get.find<Lazy<ServiceA>>()),
    );
  }
}
5.2 Property Injection Pattern

abstract class Injectable {
  void injectDependencies();
}

class ServiceC implements Injectable {
  ServiceD? _serviceD;
  
  @override
  void injectDependencies() {
    _serviceD = Get.find<ServiceD>();
  }
  
  Future<void> doWork() async {
    if (_serviceD == null) {
      throw DependencyNotInjectedException(ServiceD);
    }
    
    await _serviceD!.help();
  }
}

class ServiceD implements Injectable {
  ServiceC? _serviceC;
  
  @override
  void injectDependencies() {
    _serviceC = Get.find<ServiceC>();
  }
  
  Future<void> help() async {
    if (_serviceC == null) {
      throw DependencyNotInjectedException(ServiceC);
    }
    
    // Use serviceC
  }
}

// Dependency injector
class DependencyInjector extends GetxService {
  final List<Injectable> _injectables = [];
  
  void registerInjectable(Injectable injectable) {
    _injectables.add(injectable);
  }
  
  Future<void> injectAll() async {
    // Create graph of dependencies
    final graph = _buildDependencyGraph();
    
    // Resolve dependencies in topological order
    final order = _topologicalSort(graph);
    
    for (final type in order) {
      final injectable = _injectables.firstWhere(
        (i) => i.runtimeType == type,
      );
      
      injectable.injectDependencies();
    }
  }
  
  Map<Type, List<Type>> _buildDependencyGraph() {
    // Analyze dependencies between injectables
    // Implementation depends on reflection or annotations
    return {};
  }
  
  List<Type> _topologicalSort(Map<Type, List<Type>> graph) {
    // Implement topological sort algorithm
    return [];
  }
}

// Registration
class PropertyInjectionBindings extends Bindings {
  @override
  void dependencies() {
    // Register injectables
    Get.lazyPut<ServiceC>(() => ServiceC());
    Get.lazyPut<ServiceD>(() => ServiceD());
    
    // Register with injector
    final injector = DependencyInjector();
    injector.registerInjectable(Get.find<ServiceC>());
    injector.registerInjectable(Get.find<ServiceD>());
    
    Get.lazyPut<DependencyInjector>(() => injector);
  }
  
  @override
  void afterBuild() {
    // Inject dependencies after all services are created
    Get.find<DependencyInjector>().injectAll();
  }
}
This comprehensive dependency injection guide provides advanced patterns for managing complex dependency graphs, lifetime management, testing, and resolving circular dependencies in GetX applications.