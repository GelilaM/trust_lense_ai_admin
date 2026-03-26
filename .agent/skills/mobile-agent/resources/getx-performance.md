GetX Performance Optimization - Senior Guide
1. Reactive State Optimization
1.1 Smart Observable Usage
class OptimizedController extends GetxController {
  // ✅ GOOD: Fine-grained observables
  final Rx<String> _username = ''.obs;
  final Rx<String> _email = ''.obs;
  final Rx<int> _score = 0.obs;
  final RxList<User> _users = <User>[].obs;
  
  // ❌ BAD: Large observable objects
  // final Rx<UserProfile> _profile = UserProfile().obs;
  
  String get username => _username.value;
  String get email => _email.value;
  
  void updateUser(String name, String email) {
    // Update only what changed
    if (_username.value != name) _username(name);
    if (_email.value != email) _email(email);
    
    // ❌ AVOID: Recreating entire object
    // _profile(UserProfile(name: name, email: email));
  }
  
  // Batch updates for multiple changes
  void batchUpdateUser(User user) {
    _username(user.name);
    _email(user.email);
    _score(user.score);
    
    // Use update() for multiple changes to trigger single rebuild
    update();
  }
}

1.2 Computed Properties

class UserController extends GetxController {
  final RxList<User> _users = <User>[].obs;
  final RxString _filter = ''.obs;
  
  // ✅ Computed property - updates only when dependencies change
  List<User> get filteredUsers {
    if (_filter.isEmpty) return _users;
    return _users.where((user) => 
      user.name.toLowerCase().contains(_filter.toLowerCase())
    ).toList();
  }
  
  // ✅ Computed with multiple dependencies
  RxInt get totalScore => RxInt(
    _users.fold(0, (sum, user) => sum + user.score)
  );
  
  // ❌ AVOID: Computing in build method
  // Widget build() {
  //   final filtered = _users.where(...).toList(); // Recomputes every build
  // }
}
2. Memory Management
2.1 Controller Lifecycle Management

class MemorySafeController extends GetxController {
  final List<StreamSubscription> _subscriptions = [];
  final List<Timer> _timers = [];
  final List<Worker> _workers = [];
  
  @override
  void onInit() {
    super.onInit();
    
    // ✅ Store subscriptions for cleanup
    _subscriptions.add(
      someStream.listen(_handleEvent)
    );
    
    // ✅ Store timers
    _timers.add(
      Timer.periodic(Duration(seconds: 30), (_) => _syncData())
    );
    
    // ✅ Store GetX workers
    _workers.add(
      ever(_users, (_) => _logUserChange())
    );
  }
  
  @override
  void onClose() {
    // ✅ Clean up all resources
    for (final sub in _subscriptions) {
      sub.cancel();
    }
    _subscriptions.clear();
    
    for (final timer in _timers) {
      timer.cancel();
    }
    _timers.clear();
    
    for (final worker in _workers) {
      worker.dispose();
    }
    _workers.clear();
    
    super.onClose();
  }
}
2.2 Resource Pool Pattern

class ResourcePool<T extends Disposable> {
  final Queue<T> _pool = Queue();
  final int _maxSize;
  final T Function() _creator;
  
  ResourcePool(this._maxSize, this._creator);
  
  T acquire() {
    if (_pool.isNotEmpty) {
      return _pool.removeFirst();
    }
    return _creator();
  }
  
  void release(T resource) {
    if (_pool.length < _maxSize) {
      resource.reset(); // Reset resource state
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

// Usage with network clients
final clientPool = ResourcePool<Dio>(5, () => Dio());
final client = clientPool.acquire();
// Use client...
clientPool.release(client);
3. Render Performance Tuning
3.1 Optimized Widget Rebuilds

class OptimizedView extends GetView<UserController> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          // ✅ Only rebuilds when username changes
          Obx(() => Text(controller.username)),
          
          // ✅ GetBuilder for complex widgets
          GetBuilder<UserController>(
            id: 'user_score', // Specific ID for targeted rebuilds
            builder: (controller) => ScoreWidget(score: controller.score),
          ),
          
          // ✅ Conditional rendering with ObxValue
          ObxValue(
            (RxBool isLoading) => isLoading.value 
                ? CircularProgressIndicator()
                : UserList(),
            controller.isLoading,
          ),
          
          // ✅ Separated lists with keys
          UserListView(
            key: ValueKey(controller.filteredUsers.hashCode),
            users: controller.filteredUsers,
          ),
        ],
      ),
    );
  }
}
3.2 List Optimization

class OptimizedListView extends StatelessWidget {
  final RxList<User> users;
  
  @override
  Widget build(BuildContext context) {
    return Obx(() => ListView.builder(
      // ✅ Key for list identity
      key: ValueKey('user_list_${users.length}'),
      
      // ✅ Estimate item extent for better performance
      itemExtent: 80.0,
      
      // ✅ Cache extent for offscreen rendering
      cacheExtent: 500.0,
      
      // ✅ Add separators efficiently
      separatorBuilder: (context, index) => Divider(height: 1),
      
      itemCount: users.length,
      itemBuilder: (context, index) {
        final user = users[index];
        
        // ✅ Use const constructor where possible
        return UserListItem(
          key: ValueKey(user.id), // Key for list diffing
          user: user,
          // ✅ Memoize expensive calculations
          scoreColor: _getScoreColor(user.score),
        );
      },
    ));
  }
  
  // ✅ Memoize expensive calculations
  final _scoreColorCache = <int, Color>{};
  Color _getScoreColor(int score) {
    return _scoreColorCache.putIfAbsent(score, () {
      // Expensive color calculation
      return Color.lerp(Colors.red, Colors.green, score / 100)!;
    });
  }
}
4. Image and Asset Optimization
4.1 Smart Image Loading

class OptimizedImage extends StatelessWidget {
  final String url;
  final double? width, height;
  
  @override
  Widget build(BuildContext context) {
    return Image.network(
      url,
      width: width,
      height: height,
      
      // ✅ Cache images
      cacheWidth: (width != null) ? (width! * 2).toInt() : null,
      cacheHeight: (height != null) ? (height! * 2).toInt() : null,
      
      // ✅ Fade in animation
      filterQuality: FilterQuality.medium,
      fit: BoxFit.cover,
      
      // ✅ Error handling
      errorBuilder: (context, error, stackTrace) => 
        _buildPlaceholder(),
      
      // ✅ Loading builder
      loadingBuilder: (context, child, loadingProgress) {
        if (loadingProgress == null) return child;
        return ShimmerPlaceholder();
      },
      
      // ✅ Frame builder for progressive loading
      frameBuilder: (context, child, frame, wasSynchronouslyLoaded) {
        if (wasSynchronouslyLoaded) return child;
        return AnimatedOpacity(
          child: child,
          opacity: frame == null ? 0 : 1,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      },
    );
  }
}
4.2 Asset Management

class AssetManager extends GetxController {
  final _assetCache = <String, Uint8List>{};
  final _loadingAssets = <String, Future<Uint8List>>{};
  
  Future<Uint8List> loadAsset(String path, {bool precache = false}) async {
    // ✅ Check cache first
    if (_assetCache.containsKey(path)) {
      return _assetCache[path]!;
    }
    
    // ✅ Prevent duplicate loading
    if (_loadingAssets.containsKey(path)) {
      return _loadingAssets[path]!;
    }
    
    // ✅ Load asset
    final completer = Completer<Uint8List>();
    _loadingAssets[path] = completer.future;
    
    try {
      final byteData = await rootBundle.load(path);
      final bytes = byteData.buffer.asUint8List();
      
      // ✅ Cache the result
      _assetCache[path] = bytes;
      completer.complete(bytes);
      
      return bytes;
    } catch (e) {
      completer.completeError(e);
      rethrow;
    } finally {
      _loadingAssets.remove(path);
    }
  }
  
  // ✅ Precache assets on app start
  Future<void> precacheAssets(List<String> assetPaths) async {
    await Future.wait(
      assetPaths.map((path) => loadAsset(path, precache: true)),
    );
  }
}
5. Network Performance
5.1 Optimized API Calls

class OptimizedApiService {
  final Dio _dio;
  final Map<String, ApiCacheEntry> _cache = {};
  final Map<String, Future> _pendingRequests = {};
  
  Future<Response<T>> request<T>(
    String path, {
    bool cache = false,
    Duration cacheDuration = const Duration(minutes: 5),
    bool debounce = false,
    Duration debounceDuration = const Duration(milliseconds: 300),
  }) async {
    // ✅ Check cache
    if (cache) {
      final cached = _getFromCache<T>(path);
      if (cached != null) return cached;
    }
    
    // ✅ Debounce duplicate requests
    if (debounce && _pendingRequests.containsKey(path)) {
      return _pendingRequests[path]! as Future<Response<T>>;
    }
    
    // ✅ Make request
    final future = _dio.get<T>(path);
    _pendingRequests[path] = future;
    
    try {
      final response = await future;
      
      // ✅ Cache response
      if (cache) {
        _addToCache(
          path,
          response,
          cacheDuration: cacheDuration,
        );
      }
      
      return response;
    } finally {
      _pendingRequests.remove(path);
    }
  }
  
  // ✅ Batch requests
  Future<List<Response>> batchRequests(List<String> paths) async {
    final futures = paths.map((path) => _dio.get(path));
    return await Future.wait(futures);
  }
}
5.2 Connection Management

class ConnectionManager extends GetxController {
  final Rx<ConnectionType> _connectionType = ConnectionType.wifi.obs;
  final RxInt _connectionStrength = 100.obs;
  final RxBool _isConnected = true.obs;
  
  StreamSubscription? _connectivitySubscription;
  Timer? _qualityChecker;
  
  @override
  void onInit() {
    super.onInit();
    _startMonitoring();
  }
  
  Future<void> _startMonitoring() async {
    // ✅ Monitor connectivity changes
    _connectivitySubscription = Connectivity()
        .onConnectivityChanged
        .listen(_handleConnectivityChange);
    
    // ✅ Periodically check connection quality
    _qualityChecker = Timer.periodic(
      Duration(seconds: 30),
      (_) => _checkConnectionQuality(),
    );
  }
  
  void _handleConnectivityChange(ConnectivityResult result) {
    _isConnected(result != ConnectivityResult.none);
    
    // ✅ Adjust API timeouts based on connection
    final dio = Get.find<Dio>();
    switch (result) {
      case ConnectivityResult.wifi:
        dio.options.connectTimeout = Duration(seconds: 10);
        _connectionType(ConnectionType.wifi);
        break;
      case ConnectivityResult.mobile:
        dio.options.connectTimeout = Duration(seconds: 30);
        _connectionType(ConnectionType.mobile);
        break;
      default:
        dio.options.connectTimeout = Duration(seconds: 60);
        _connectionType(ConnectionType.none);
    }
  }
  
  // ✅ Adaptive loading based on connection
  Future<T> loadWithAdaptiveStrategy<T>(
    Future<T> Function() loader,
    Future<T> Function() fallbackLoader,
  ) async {
    if (!_isConnected.value) {
      return fallbackLoader();
    }
    
    if (_connectionStrength.value < 30) {
      // Poor connection - use compressed data
      return _loadWithCompression(loader);
    }
    
    return loader();
  }
}
6. Performance Monitoring Tools
6.1 Custom Performance Profiler

class PerformanceProfiler extends GetxController {
  final _frameTimes = <Duration>[];
  final _memoryUsage = <int>[];
  final _performanceMetrics = Rx<PerformanceMetrics>(
    PerformanceMetrics(),
  );
  
  void startProfiling() {
    // ✅ Monitor frame times
    WidgetsBinding.instance.addTimingsCallback(_handleTimings);
    
    // ✅ Monitor memory
    _startMemoryMonitoring();
  }
  
  void _handleTimings(List<FrameTiming> timings) {
    for (final timing in timings) {
      final frameDuration = Duration(
        microseconds: timing.totalSpan.inMicroseconds,
      );
      
      _frameTimes.add(frameDuration);
      
      // Keep only last 100 frames
      if (_frameTimes.length > 100) {
        _frameTimes.removeAt(0);
      }
      
      // ✅ Calculate FPS
      final fps = _calculateFPS();
      _performanceMetrics.update((metrics) {
        metrics.currentFps = fps;
        metrics.frameTime = frameDuration;
      });
      
      // ✅ Warn about jank (frames > 16ms)
      if (frameDuration > Duration(milliseconds: 16)) {
        _logJank(frameDuration);
      }
    }
  }
  
  double _calculateFPS() {
    if (_frameTimes.isEmpty) return 60.0;
    
    final totalMicroseconds = _frameTimes.fold<int>(
      0,
      (sum, duration) => sum + duration.inMicroseconds,
    );
    
    final averageFrameTime = totalMicroseconds / _frameTimes.length;
    return 1000000 / averageFrameTime; // FPS = 1,000,000 μs / avg frame time
  }
  
  void _logJank(Duration frameTime) {
    debugPrint('⚠️ Jank detected: ${frameTime.inMilliseconds}ms');
    
    // ✅ Capture widget tree for debugging
    if (frameTime > Duration(milliseconds: 32)) {
      _captureWidgetTree();
    }
  }
  
  Future<void> _captureWidgetTree() async {
    final pipelineOwner = WidgetsBinding.instance.renderViewElement?.owner;
    if (pipelineOwner != null) {
      final tree = pipelineOwner.toStringDeep();
      await _saveDebugInfo('widget_tree_${DateTime.now()}.txt', tree);
    }
  }
}
6.2 Memory Profiling

class MemoryProfiler extends GetxController {
  final _memorySnapshots = <MemorySnapshot>[];
  Timer? _profilingTimer;
  
  void startMemoryProfiling({Duration interval = const Duration(seconds: 5)}) {
    _profilingTimer = Timer.periodic(interval, (_) => _takeMemorySnapshot());
  }
  
  Future<void> _takeMemorySnapshot() async {
    final snapshot = MemorySnapshot(
      timestamp: DateTime.now(),
      heapUsage: await _getHeapUsage(),
      externalUsage: await _getExternalMemory(),
      rasterUsage: await _getRasterMemory(),
    );
    
    _memorySnapshots.add(snapshot);
    
    // Keep only last hour of snapshots
    final oneHourAgo = DateTime.now().subtract(Duration(hours: 1));
    _memorySnapshots.removeWhere((s) => s.timestamp.isBefore(oneHourAgo));
    
    // ✅ Check for memory leaks
    _checkForMemoryLeaks();
  }
  
  void _checkForMemoryLeaks() {
    if (_memorySnapshots.length < 10) return;
    
    final recent = _memorySnapshots.sublist(_memorySnapshots.length - 10);
    final trend = _calculateMemoryTrend(recent);
    
    if (trend > 100 * 1024) { // 100KB growth trend
      _reportPotentialLeak(trend);
    }
  }
  
  Future<int> _getHeapUsage() async {
    // Use Dart VM service protocol or platform channels
    // This is simplified - use actual memory profiling in production
    return -1;
  }
  
  void _reportPotentialLeak(int growthBytes) {
    debugPrint('🚨 Potential memory leak detected: ${growthBytes / 1024}KB growth');
    
    // ✅ Capture controller states for debugging
    final controllerInfo = Get.instances.entries.map((e) {
      return '${e.key}: ${e.value.runtimeType}';
    }).join('\n');
    
    _saveDebugInfo('leak_report_${DateTime.now()}.txt', '''
Memory Leak Detected:
Growth: ${growthBytes} bytes
Time: ${DateTime.now()}
Active Controllers: ${Get.instances.length}
Controller List:
$controllerInfo
''');
  }
}
7. Build Optimization
7.1 Code Splitting

// ✅ Split large features into separate packages
// pubspec.yaml
dependencies:
  auth_module: 
    path: packages/auth_module
  payment_module:
    path: packages/payment_module
  analytics_module:
    path: packages/analytics_module

// ✅ Lazy load modules
class ModuleLoader {
  static Future<void> loadModule(String moduleName) async {
    switch (moduleName) {
      case 'analytics':
        await Get.putAsync(() => AnalyticsModule().initialize());
        break;
      case 'payment':
        await Get.putAsync(() => PaymentModule().initialize());
        break;
    }
  }
}

// ✅ Conditional compilation for platform-specific code
class PlatformOptimizedService {
  Future<void> performOperation() async {
    // Platform-specific implementations
    if (GetPlatform.isAndroid) {
      await _androidSpecificOperation();
    } else if (GetPlatform.isIOS) {
      await _iosSpecificOperation();
    } else {
      await _defaultOperation();
    }
  }
}
7.2 Asset Bundle Optimization

class AssetBundleOptimizer {
  Future<void> optimizeAssetBundle() async {
    // ✅ Remove unused assets
    await _removeUnusedAssets();
    
    // ✅ Compress images
    await _compressImages();
    
    // ✅ Generate asset manifest
    await _generateAssetManifest();
  }
  
  Future<void> _compressImages() async {
    final imageAssets = await _findImageAssets();
    
    await Future.wait(imageAssets.map((asset) async {
      // Skip if already compressed
      if (await _isCompressed(asset)) return;
      
      // Compress based on platform and quality needs
      final compressed = await _compressImage(asset, quality: 0.8);
      await _replaceAsset(asset, compressed);
    }));
  }
}