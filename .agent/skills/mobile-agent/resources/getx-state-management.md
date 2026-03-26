GetX State Management Guide - Senior Guide
1. Reactive vs Simple State Patterns
1.1 Choosing the Right State Management Approach

abstract class StateManagementStrategy {
  // Use Rx/Observable for:
  // - Frequently changing values
  // - Values that need to be observed by multiple widgets
  // - Values that trigger complex side effects
  
  // Use GetBuilder/update() for:
  // - Infrequently changing values
  // - Simple state updates without side effects
  // - Performance-critical UI updates
  // - When you need to update specific widgets only
}

// Example: Reactive approach for real-time data
class ReactiveStockController extends GetxController {
  final RxDouble _price = 0.0.obs;
  final RxInt _volume = 0.obs;
  final RxList<Trade> _trades = <Trade>[].obs;
  final Rx<StockStatus> _status = StockStatus.closed.obs;
  
  double get price => _price.value;
  int get volume => _volume.value;
  List<Trade> get trades => _trades;
  StockStatus get status => _status.value;
  
  // Real-time updates stream
  StreamSubscription? _marketDataSubscription;
  
  @override
  void onInit() {
    super.onInit();
    _connectToMarketData();
  }
  
  void _connectToMarketData() {
    _marketDataSubscription = marketDataStream.listen((data) {
      // Reactive updates
      _price(data.price);
      _volume(data.volume);
      
      if (data.trades.isNotEmpty) {
        _trades.addAll(data.trades);
        // Keep only last 100 trades
        if (_trades.length > 100) {
          _trades.removeRange(0, _trades.length - 100);
        }
      }
      
      _status(data.status);
    });
  }
}

// Example: Simple approach for form state
class SimpleFormController extends GetxController {
  String _firstName = '';
  String _lastName = '';
  DateTime? _birthDate;
  
  // No reactive needed - form only updates on submit
  void updateFirstName(String value) {
    _firstName = value.trim();
    update(); // Manual update triggers GetBuilder rebuilds
  }
  
  void updateLastName(String value) {
    _lastName = value.trim();
    update(['name_fields']); // Update only specific widgets
  }
  
  void updateBirthDate(DateTime date) {
    _birthDate = date;
    update(['date_fields']);
  }
  
  Future<void> submit() async {
    // Validate and submit
    update(); // Update loading state
    await _submitToApi();
    update(); // Update completion state
  }
}
1.2 Hybrid State Management

class HybridUserController extends GetxController {
  // Reactive properties for real-time data
  final Rx<User?> _currentUser = Rx<User?>(null);
  final RxInt _unreadNotifications = 0.obs;
  final RxDouble _balance = 0.0.obs;
  
  // Simple properties for infrequent updates
  List<Transaction> _transactions = [];
  UserSettings _settings = UserSettings.defaults();
  
  // Computed reactive properties
  RxString get displayName => RxString(
    _currentUser.value?.displayName ?? 'Guest',
  );
  
  RxBool get isPremium => RxBool(
    _currentUser.value?.subscriptionType == SubscriptionType.premium,
  );
  
  // Async reactive state
  final Rx<AsyncState<List<Message>>> _messagesState = 
      Rx<AsyncState<List<Message>>>(AsyncState.loading());
  
  // State machine
  final Rx<ProfileState> _profileState = ProfileState.idle.obs;
  
  // Complex state updates with transactions
  Future<void> updateProfile(UserProfile profile) async {
    // Use transaction for atomic updates
    _currentUser.value = _currentUser.value?.copyWith(
      profile: profile,
      updatedAt: DateTime.now(),
    );
    
    // Batch multiple updates
    _batchUpdates(() {
      _unreadNotifications.value++;
      _balance.value -= 10.0; // Profile update fee
    });
    
    // Update async state
    _messagesState(AsyncState.loading());
    try {
      final messages = await _loadMessages();
      _messagesState(AsyncState.success(messages));
    } catch (e) {
      _messagesState(AsyncState.error(e));
    }
  }
  
  void _batchUpdates(void Function() updates) {
    // Disable reactive updates temporarily
    final wasListening = _currentUser.isListening;
    _currentUser.isListening = false;
    
    try {
      updates();
    } finally {
      _currentUser.isListening = wasListening;
      // Trigger single update
      _currentUser.refresh();
    }
  }
}
2. State Persistence Strategies
2.1 Multi-Layer Persistence

class PersistentStateController extends GetxController {
  final Rx<UserPreferences> _preferences = 
      UserPreferences.defaults().obs;
  final Rx<AppSettings> _settings = AppSettings.defaults().obs;
  final Rx<AppTheme> _theme = AppTheme.light.obs;
  
  // Storage layers
  final GetStorage _localStorage = GetStorage();
  final FlutterSecureStorage _secureStorage = FlutterSecureStorage();
  final HiveInterface _hive = Hive;
  
  @override
  Future<void> onInit() async {
    super.onInit();
    await _initializeStorage();
    await _loadPersistedState();
    _setupAutoSave();
  }
  
  Future<void> _initializeStorage() async {
    // Initialize different storage backends
    await _localStorage.initStorage;
    await _hive.initFlutter();
    
    // Open boxes
    await _hive.openBox<UserPreferences>('preferences');
    await _hive.openBox<AppSettings>('settings');
  }
  
  Future<void> _loadPersistedState() async {
    // Load from fastest to slowest storage
    
    // 1. Memory (already initialized)
    
    // 2. Hive (fast local database)
    final hivePrefs = _hive.box<UserPreferences>('preferences').get('current');
    if (hivePrefs != null) {
      _preferences(hivePrefs);
    }
    
    // 3. Secure storage (for sensitive data)
    final themeName = await _secureStorage.read(key: 'theme');
    if (themeName != null) {
      _theme(AppTheme.values.firstWhere(
        (t) => t.name == themeName,
        orElse: () => AppTheme.light,
      ));
    }
    
    // 4. GetStorage (for simple key-value)
    final settingsJson = _localStorage.read<Map>('settings');
    if (settingsJson != null) {
      _settings(AppSettings.fromJson(settingsJson));
    }
  }
  
  void _setupAutoSave() {
    // Auto-save preferences on change
    ever(_preferences, (prefs) async {
      await _hive.box<UserPreferences>('preferences').put('current', prefs);
    });
    
    // Debounced auto-save for settings
    debounce(_settings, (settings) async {
      await _localStorage.write('settings', settings.toJson());
    }, time: Duration(seconds: 1));
    
    // Immediate save for theme (sensitive)
    _theme.listen((theme) async {
      await _secureStorage.write(key: 'theme', value: theme.name);
    });
  }
  
  // State migration
  Future<void> migrateState(int fromVersion, int toVersion) async {
    // Handle state schema migrations
    if (fromVersion < 2 && toVersion >= 2) {
      await _migrateToV2();
    }
    
    if (fromVersion < 3 && toVersion >= 3) {
      await _migrateToV3();
    }
  }
  
  // State compression for large data
  Future<void> compressState() async {
    final state = _collectAllState();
    final compressed = await _compress(state);
    await _localStorage.write('compressed_state', compressed);
  }
}
2.2 Offline-First State Management

class OfflineFirstController extends GetxController {
  final Rx<ConnectivityStatus> _connectivity = 
      ConnectivityStatus.connected.obs;
  final Rx<SyncStatus> _syncStatus = SyncStatus.idle.obs;
  final RxList<SyncOperation> _syncQueue = <SyncOperation>[].obs;
  
  // Local state
  final RxList<Note> _localNotes = <Note>[].obs;
  final RxList<SyncConflict> _conflicts = <SyncConflict>[].obs;
  
  // Remote state mirror
  final RxList<Note> _remoteNotes = <Note>[].obs;
  
  StreamSubscription? _connectivitySubscription;
  
  @override
  void onInit() {
    super.onInit();
    _setupConnectivityMonitoring();
    _loadLocalData();
    _startSync();
  }
  
  void _setupConnectivityMonitoring() {
    _connectivitySubscription = Connectivity()
        .onConnectivityChanged
        .listen((result) {
      final status = result == ConnectivityResult.none
          ? ConnectivityStatus.disconnected
          : ConnectivityStatus.connected;
          
      _connectivity(status);
      
      if (status == ConnectivityStatus.connected) {
        _triggerSync();
      }
    });
  }
  
  Future<void> addNote(Note note) async {
    // Always save locally first
    _localNotes.add(note);
    
    // Queue for sync
    _syncQueue.add(SyncOperation.create(note));
    
    // Try immediate sync if connected
    if (_connectivity.value == ConnectivityStatus.connected) {
      await _syncQueue.firstWhere((op) => op.entityId == note.id);
    }
  }
  
  Future<void> updateNote(Note note) async {
    // Check for conflicts
    final remoteNote = _remoteNotes.firstWhereOrNull((n) => n.id == note.id);
    
    if (remoteNote != null && remoteNote.updatedAt.isAfter(note.updatedAt)) {
      // Conflict detected
      _conflicts.add(SyncConflict(
        local: note,
        remote: remoteNote,
        resolved: false,
      ));
      return;
    }
    
    // Update local
    final index = _localNotes.indexWhere((n) => n.id == note.id);
    if (index != -1) {
      _localNotes[index] = note;
    }
    
    // Queue update
    _syncQueue.add(SyncOperation.update(note));
  }
  
  Future<void> _startSync() async {
    while (true) {
      await Future.delayed(Duration(seconds: 30));
      
      if (_connectivity.value == ConnectivityStatus.connected &&
          _syncQueue.isNotEmpty) {
        await _performSync();
      }
    }
  }
  
  Future<void> _performSync() async {
    _syncStatus(SyncStatus.syncing);
    
    try {
      for (final operation in _syncQueue.toList()) {
        await _executeSyncOperation(operation);
        _syncQueue.remove(operation);
      }
      
      _syncStatus(SyncStatus.synced);
    } catch (e) {
      _syncStatus(SyncStatus.error);
      await Future.delayed(Duration(seconds: 60)); // Backoff
    }
  }
  
  // State reconciliation
  Future<void> reconcileState() async {
    // Merge local and remote states
    final mergedNotes = <Note>[];
    
    for (final localNote in _localNotes) {
      final remoteNote = _remoteNotes.firstWhereOrNull(
        (n) => n.id == localNote.id,
      );
      
      if (remoteNote == null) {
        // Local-only note
        mergedNotes.add(localNote);
      } else if (localNote.updatedAt.isAfter(remoteNote.updatedAt)) {
        // Local is newer
        mergedNotes.add(localNote);
      } else {
        // Remote is newer
        mergedNotes.add(remoteNote);
      }
    }
    
    // Add remote-only notes
    for (final remoteNote in _remoteNotes) {
      if (!_localNotes.any((n) => n.id == remoteNote.id)) {
        mergedNotes.add(remoteNote);
      }
    }
    
    _localNotes(mergedNotes);
  }
}
3. Complex State Scenarios
3.1 State Machine Implementation

class OrderStateMachineController extends GetxController {
  final Rx<OrderState> _currentState = OrderState.created.obs;
  final RxList<OrderTransition> _transitionHistory = 
      <OrderTransition>[].obs;
  
  // State definitions
  static final Map<OrderState, Set<OrderState>> _validTransitions = {
    OrderState.created: {OrderState.processing, OrderState.cancelled},
    OrderState.processing: {OrderState.shipped, OrderState.cancelled},
    OrderState.shipped: {OrderState.delivered, OrderState.returned},
    OrderState.delivered: {OrderState.completed, OrderState.returned},
    OrderState.cancelled: {},
    OrderState.returned: {OrderState.refunded},
    OrderState.refunded: {},
    OrderState.completed: {},
  };
  
  // State enter/exit callbacks
  final Map<OrderState, VoidCallback> _onEnterCallbacks = {};
  final Map<OrderState, VoidCallback> _onExitCallbacks = {};
  
  Future<bool> transitionTo(OrderState newState, 
      {Map<String, dynamic>? data}) async {
    
    // Check if transition is valid
    if (!_isValidTransition(newState)) {
      Get.log('Invalid transition: $_currentState -> $newState');
      return false;
    }
    
    // Execute exit callback
    await _executeExitCallback(_currentState.value);
    
    // Record transition
    final transition = OrderTransition(
      from: _currentState.value,
      to: newState,
      timestamp: DateTime.now(),
      data: data,
    );
    
    _transitionHistory.add(transition);
    
    // Update state
    final previousState = _currentState.value;
    _currentState.value = newState;
    
    // Execute enter callback
    await _executeEnterCallback(newState);
    
    // Notify listeners
    update();
    
    // Log state change
    Get.find<AnalyticsService>().logStateChange(
      'order_state',
      previousState.name,
      newState.name,
    );
    
    return true;
  }
  
  bool _isValidTransition(OrderState newState) {
    final validNextStates = _validTransitions[_currentState.value];
    return validNextStates?.contains(newState) ?? false;
  }
  
  Future<void> _executeExitCallback(OrderState state) async {
    final callback = _onExitCallbacks[state];
    if (callback != null) {
      try {
        await callback();
      } catch (e) {
        Get.log('Error in exit callback for $state: $e');
      }
    }
  }
  
  Future<void> _executeEnterCallback(OrderState state) async {
    final callback = _onEnterCallbacks[state];
    if (callback != null) {
      try {
        await callback();
      } catch (e) {
        Get.log('Error in enter callback for $state: $e');
      }
    }
  }
  
  // State-specific behaviors
  void registerStateBehavior(OrderState state, {
    VoidCallback? onEnter,
    VoidCallback? onExit,
  }) {
    if (onEnter != null) {
      _onEnterCallbacks[state] = onEnter;
    }
    if (onExit != null) {
      _onExitCallbacks[state] = onExit;
    }
  }
  
  // Query state history
  List<OrderTransition> getTransitionsBetween(
    DateTime start,
    DateTime end,
  ) {
    return _transitionHistory.where((transition) {
      return transition.timestamp.isAfter(start) &&
             transition.timestamp.isBefore(end);
    }).toList();
  }
  
  // State time tracking
  Duration getTimeInState(OrderState state) {
    final transitions = _transitionHistory.where(
      (t) => t.from == state || t.to == state,
    ).toList()
      ..sort((a, b) => a.timestamp.compareTo(b.timestamp));
    
    Duration total = Duration.zero;
    DateTime? entryTime;
    
    for (final transition in transitions) {
      if (transition.to == state) {
        entryTime = transition.timestamp;
      } else if (transition.from == state && entryTime != null) {
        total += transition.timestamp.difference(entryTime);
        entryTime = null;
      }
    }
    
    // If still in state
    if (entryTime != null && _currentState.value == state) {
      total += DateTime.now().difference(entryTime);
    }
    
    return total;
  }
}
3.2 Undo/Redo State Management

class UndoRedoController<T> extends GetxController {
  final RxList<T> _stateHistory = RxList<T>();
  final RxInt _currentIndex = (-1).obs;
  final int _maxHistoryLength = 100;
  
  // Current state
  T get currentState => _stateHistory[_currentIndex.value];
  
  // Can undo/redo
  bool get canUndo => _currentIndex.value > 0;
  bool get canRedo => _currentIndex.value < _stateHistory.length - 1;
  
  // Update state with history tracking
  void updateState(T newState, {String? action}) {
    // Remove future states if we're not at the end
    if (canRedo) {
      _stateHistory.removeRange(
        _currentIndex.value + 1,
        _stateHistory.length,
      );
    }
    
    // Add new state
    _stateHistory.add(newState);
    _currentIndex.value = _stateHistory.length - 1;
    
    // Limit history size
    if (_stateHistory.length > _maxHistoryLength) {
      _stateHistory.removeAt(0);
      _currentIndex.value--;
    }
    
    // Log action
    if (action != null) {
      Get.find<HistoryLogger>().logAction(action, newState);
    }
    
    update();
  }
  
  // Undo to previous state
  bool undo() {
    if (!canUndo) return false;
    
    _currentIndex.value--;
    _notifyStateChange();
    return true;
  }
  
  // Redo to next state
  bool redo() {
    if (!canRedo) return false;
    
    _currentIndex.value++;
    _notifyStateChange();
    return true;
  }
  
  void _notifyStateChange() {
    // Trigger reactive updates
    update();
    
    // Notify specific listeners
    update(['state']);
  }
  
  // Jump to specific state
  bool jumpToState(int index) {
    if (index < 0 || index >= _stateHistory.length) {
      return false;
    }
    
    _currentIndex.value = index;
    _notifyStateChange();
    return true;
  }
  
  // Clear history
  void clearHistory() {
    if (_stateHistory.isEmpty) return;
    
    final current = currentState;
    _stateHistory.clear();
    _stateHistory.add(current);
    _currentIndex.value = 0;
    
    update();
  }
  
  // State serialization for persistence
  Map<String, dynamic> serializeHistory() {
    return {
      'history': _stateHistory.map((state) => _serializeState(state)).toList(),
      'currentIndex': _currentIndex.value,
      'timestamp': DateTime.now().toIso8601String(),
    };
  }
  
  Future<void> restoreHistory(Map<String, dynamic> serialized) async {
    final history = (serialized['history'] as List)
        .map((item) => _deserializeState(item))
        .toList();
        
    _stateHistory(history);
    _currentIndex.value = serialized['currentIndex'] as int;
    
    update();
  }
}

// Usage with document editing
class DocumentEditorController extends UndoRedoController<Document> {
  DocumentEditorController() : super() {
    // Initialize with empty document
    updateState(Document.empty(), action: 'init');
  }
  
  void insertText(String text, int position) {
    final newDoc = currentState.insertText(text, position);
    updateState(newDoc, action: 'insert_text');
  }
  
  void deleteText(int start, int end) {
    final newDoc = currentState.deleteText(start, end);
    updateState(newDoc, action: 'delete_text');
  }
  
  void formatText(TextFormat format, int start, int end) {
    final newDoc = currentState.applyFormat(format, start, end);
    updateState(newDoc, action: 'format_text');
  }
}
4. Performance-Optimized State
4.1 Selective Widget Rebuilds

class SelectiveRebuildController extends GetxController {
  // Separate observables for independent updates
  final RxString _title = ''.obs;
  final RxString _description = ''.obs;
  final RxDouble _price = 0.0.obs;
  final RxInt _quantity = 0.obs;
  final RxList<String> _tags = <String>[].obs;
  final Rx<DateTime?> _expiryDate = Rx<DateTime?>(null);
  
  // Getter for computed values
  RxDouble get totalPrice => RxDouble(_price.value * _quantity.value);
  
  // Update methods with specific IDs
  void updateTitle(String title) {
    _title.value = title;
    update(['title']); // Only rebuilds widgets watching 'title'
  }
  
  void updateDescription(String description) {
    _description.value = description;
    update(['description']);
  }
  
  void updatePrice(double price) {
    _price.value = price;
    update(['price', 'total']); // Multiple IDs
  }
  
  void updateQuantity(int quantity) {
    _quantity.value = quantity;
    update(['quantity', 'total']);
  }
  
  // Batch updates
  void updateProduct(Product product) {
    // Disable reactive updates temporarily
    final wasListening = _title.isListening;
    _title.isListening = false;
    _price.isListening = false;
    _quantity.isListening = false;
    
    try {
      _title.value = product.title;
      _description.value = product.description;
      _price.value = product.price;
      _quantity.value = product.quantity;
      _tags.value = product.tags;
      _expiryDate.value = product.expiryDate;
    } finally {
      _title.isListening = wasListening;
      _price.isListening = wasListening;
      _quantity.isListening = wasListening;
      
      // Single update for all changes
      update();
    }
  }
}

// Widget using selective rebuilds
class ProductEditorView extends GetView<SelectiveRebuildController> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          // Only rebuilds when title changes
          GetBuilder<SelectiveRebuildController>(
            id: 'title',
            builder: (controller) => TextField(
              value: controller._title.value,
              onChanged: controller.updateTitle,
            ),
          ),
          
          // Only rebuilds when description changes
          GetBuilder<SelectiveRebuildController>(
            id: 'description',
            builder: (controller) => TextField(
              value: controller._description.value,
              onChanged: controller.updateDescription,
            ),
          ),
          
          // Rebuilds for price OR quantity changes
          GetBuilder<SelectiveRebuildController>(
            id: 'total',
            builder: (controller) => Text(
              'Total: \$${controller.totalPrice.value.toStringAsFixed(2)}',
            ),
          ),
          
          // List that rebuilds efficiently
          Obx(() => ListView.builder(
            shrinkWrap: true,
            itemCount: controller._tags.length,
            itemBuilder: (context, index) => TagItem(
              tag: controller._tags[index],
              // Key helps Flutter identify items
              key: ValueKey(controller._tags[index]),
            ),
          )),
        ],
      ),
    );
  }
}
4.2 State Memoization

class MemoizedStateController extends GetxController {
  final RxList<Product> _products = <Product>[].obs;
  final RxString _searchQuery = ''.obs;
  final Rx<ProductCategory?> _selectedCategory = Rx<ProductCategory?>(null);
  final RxDouble _minPrice = 0.0.obs;
  final RxDouble _maxPrice = double.infinity.obs;
  
  // Memoized computed properties
  late final RxList<Product> _filteredProducts = RxList<Product>();
  late final RxDouble _averagePrice = RxDouble(0.0);
  late final RxMap<ProductCategory, int> _categoryCounts = 
      RxMap<ProductCategory, int>();
  
  // Cache for expensive computations
  final Map<String, List<Product>> _filterCache = {};
  final Map<String, double> _priceCache = {};
  
  @override
  void onInit() {
    super.onInit();
    
    // Setup reactive computations with memoization
    _setupReactiveComputations();
  }
  
  void _setupReactiveComputations() {
    // Debounce expensive computations
    debounce(_searchQuery, (_) => _updateFilteredProducts(), 
        time: Duration(milliseconds: 300));
    
    // Combine multiple observables
    ever<List<dynamic>>(
      [_products, _selectedCategory, _minPrice, _maxPrice],
      (_) => _updateFilteredProducts(),
    );
    
    // Memoized average price
    ever(_products, (products) {
      final cacheKey = products.hashCode.toString();
      _averagePrice.value = _priceCache.putIfAbsent(
        cacheKey,
        () => _calculateAveragePrice(products),
      );
    });
    
    // Memoized category counts
    ever(_products, (products) {
      _categoryCounts.value = _computeCategoryCounts(products);
    });
  }
  
  void _updateFilteredProducts() {
    final cacheKey = '${_searchQuery.value}|'
                     '${_selectedCategory.value}|'
                     '${_minPrice.value}|'
                     '${_maxPrice.value}';
    
    // Return cached result if available
    if (_filterCache.containsKey(cacheKey)) {
      _filteredProducts.value = _filterCache[cacheKey]!;
      return;
    }
    
    // Compute filtered products
    var filtered = _products.where((product) {
      // Apply search filter
      if (_searchQuery.value.isNotEmpty) {
        if (!product.title.toLowerCase()
            .contains(_searchQuery.value.toLowerCase()) &&
            !product.description.toLowerCase()
            .contains(_searchQuery.value.toLowerCase())) {
          return false;
        }
      }
      
      // Apply category filter
      if (_selectedCategory.value != null &&
          product.category != _selectedCategory.value) {
        return false;
      }
      
      // Apply price filter
      if (product.price < _minPrice.value ||
          product.price > _maxPrice.value) {
        return false;
      }
      
      return true;
    }).toList();
    
    // Cache the result
    _filterCache[cacheKey] = filtered;
    
    // Limit cache size
    if (_filterCache.length > 100) {
      _filterCache.remove(_filterCache.keys.first);
    }
    
    _filteredProducts.value = filtered;
  }
  
  double _calculateAveragePrice(List<Product> products) {
    if (products.isEmpty) return 0.0;
    
    final total = products.fold(0.0, (sum, product) => sum + product.price);
    return total / products.length;
  }
  
  Map<ProductCategory, int> _computeCategoryCounts(List<Product> products) {
    final counts = <ProductCategory, int>{};
    
    for (final product in products) {
      counts[product.category] = (counts[product.category] ?? 0) + 1;
    }
    
    return counts;
  }
  
  // Clear memoization cache
  void clearCache() {
    _filterCache.clear();
    _priceCache.clear();
    _updateFilteredProducts();
  }
}
5. State Synchronization Patterns
5.1 Multi-Device State Sync

class MultiDeviceSyncController extends GetxController {
  final Rx<LocalState> _localState = LocalState.empty().obs;
  final Rx<RemoteState?> _remoteState = Rx<RemoteState?>(null);
  final Rx<SyncStatus> _syncStatus = SyncStatus.idle.obs;
  
  // WebSocket connection for real-time sync
  IOWebSocketChannel? _webSocketChannel;
  StreamSubscription? _webSocketSubscription;
  
  // Conflict resolution
  final RxList<StateConflict> _conflicts = <StateConflict>[].obs;
  
  @override
  Future<void> onInit() async {
    super.onInit();
    await _connectToSyncServer();
    _setupStateListeners();
  }
  
  Future<void> _connectToSyncServer() async {
    try {
      _webSocketChannel = IOWebSocketChannel.connect(
        'wss://sync.example.com',
        headers: await _getAuthHeaders(),
      );
      
      _webSocketSubscription = _webSocketChannel!.stream.listen(
        _handleSyncMessage,
        onError: _handleSyncError,
      );
      
      _syncStatus(SyncStatus.connected);
    } catch (e) {
      _syncStatus(SyncStatus.disconnected);
      await _scheduleReconnect();
    }
  }
  
  void _setupStateListeners() {
    // Send local changes to server
    ever(_localState, (state) async {
      if (_syncStatus.value == SyncStatus.connected) {
        await _sendStateUpdate(state);
      }
    });
    
    // Periodically check for conflicts
    Timer.periodic(Duration(seconds: 30), (_) => _checkForConflicts());
  }
  
  Future<void> _sendStateUpdate(LocalState state) async {
    final update = StateUpdate(
      deviceId: await _getDeviceId(),
      state: state,
      timestamp: DateTime.now(),
      version: _localState.value.version,
    );
    
    _webSocketChannel?.sink.add(jsonEncode(update.toJson()));
  }
  
  void _handleSyncMessage(dynamic message) {
    try {
      final update = StateUpdate.fromJson(jsonDecode(message));
      
      // Check if update is from different device
      if (update.deviceId != await _getDeviceId()) {
        _applyRemoteUpdate(update);
      }
    } catch (e) {
      Get.log('Error handling sync message: $e');
    }
  }
  
  void _applyRemoteUpdate(StateUpdate update) {
    // Check for conflicts
    if (_localState.value.version != update.version - 1) {
      _conflicts.add(StateConflict(
        local: _localState.value,
        remote: update.state,
        timestamp: DateTime.now(),
      ));
      return;
    }
    
    // Apply update
    _localState.value = update.state;
    _remoteState.value = update.state;
    
    _syncStatus(SyncStatus.synced);
  }
  
  void _checkForConflicts() {
    if (_remoteState.value != null &&
        _localState.value.version > _remoteState.value!.version + 1) {
      // Local state has diverged
      _conflicts.add(StateConflict(
        local: _localState.value,
        remote: _remoteState.value!,
        timestamp: DateTime.now(),
      ));
    }
  }
  
  // Conflict resolution
  Future<void> resolveConflict(
    StateConflict conflict,
    ConflictResolution resolution,
  ) async {
    switch (resolution) {
      case ConflictResolution.useLocal:
        await _pushLocalState();
        break;
      case ConflictResolution.useRemote:
        _localState.value = conflict.remote;
        break;
      case ConflictResolution.merge:
        final merged = await _mergeStates(conflict.local, conflict.remote);
        _localState.value = merged;
        await _pushLocalState();
        break;
    }
    
    _conflicts.remove(conflict);
  }
  
  // State versioning
  void updateState(StateMutation mutation) {
    final newState = _localState.value.applyMutation(mutation);
    _localState.value = newState.copyWith(
      version: _localState.value.version + 1,
      updatedAt: DateTime.now(),
    );
  }
}
This comprehensive state management guide provides advanced patterns for building complex, performant applications with GetX. Choose the right pattern based on your specific requirements around reactivity, persistence, synchronization, and performance.