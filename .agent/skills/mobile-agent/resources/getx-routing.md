GetX Route Management - Senior Guide
1. Advanced Navigation Patterns
1.1 Nested Navigation with GetX

class NestedNavigationConfig {
  static final List<GetPage> mainPages = [
    GetPage(
      name: MainRoutes.home,
      page: () => HomeScreen(),
      binding: HomeBinding(),
      children: [
        GetPage(
          name: HomeRoutes.dashboard,
          page: () => DashboardScreen(),
          binding: DashboardBinding(),
        ),
        GetPage(
          name: HomeRoutes.profile,
          page: () => ProfileScreen(),
          binding: ProfileBinding(),
          children: [
            GetPage(
              name: ProfileRoutes.edit,
              page: () => EditProfileScreen(),
              binding: EditProfileBinding(),
            ),
            GetPage(
              name: ProfileRoutes.settings,
              page: () => ProfileSettingsScreen(),
              binding: ProfileSettingsBinding(),
            ),
          ],
        ),
      ],
    ),
    GetPage(
      name: MainRoutes.explore,
      page: () => ExploreScreen(),
      binding: ExploreBinding(),
      children: [
        GetPage(
          name: ExploreRoutes.search,
          page: () => SearchScreen(),
          binding: SearchBinding(),
        ),
        GetPage(
          name: ExploreRoutes.categories,
          page: () => CategoriesScreen(),
          binding: CategoriesBinding(),
        ),
      ],
    ),
  ];
  
  static GoRouter createRouter() {
    return GoRouter(
      navigatorKey: Get.key,
      initialRoute: MainRoutes.home,
      routes: _buildRoutes(mainPages),
      redirect: _redirectLogic,
      observers: [
        Get.routeObserver,
        AnalyticsRouteObserver(),
        PerformanceRouteObserver(),
      ],
    );
  }
  
  static List<RouteBase> _buildRoutes(List<GetPage> pages) {
    return pages.map((page) {
      if (page.children.isEmpty) {
        return GoRoute(
          path: page.name,
          pageBuilder: (context, state) => MaterialPage(
            key: state.pageKey,
            child: page.page(),
          ),
        );
      } else {
        return StatefulShellRoute.indexedStack(
          builder: (context, state, navigationShell) {
            return ScaffoldWithNestedNavigation(
              navigationShell: navigationShell,
            );
          },
          branches: page.children.map((child) {
            return StatefulShellBranch(
              routes: _buildRoutes([child]),
            );
          }).toList(),
        );
      }
    }).toList();
  }
  
  static String? _redirectLogic(BuildContext context, GoRouterState state) {
    // Complex redirect logic
    final auth = Get.find<AuthController>();
    final isAuthRoute = state.matchedLocation.contains('/auth');
    final isProtectedRoute = _isProtectedRoute(state.matchedLocation);
    
    if (!auth.isAuthenticated && isProtectedRoute) {
      return AuthRoutes.login;
    }
    
    if (auth.isAuthenticated && isAuthRoute) {
      return MainRoutes.home;
    }
    
    // Maintenance mode check
    if (Get.find<AppConfig>().isMaintenanceMode) {
      return MainRoutes.maintenance;
    }
    
    return null;
  }
  
  static bool _isProtectedRoute(String route) {
    final protectedRoutes = [
      MainRoutes.home,
      MainRoutes.profile,
      MainRoutes.settings,
    ];
    
    return protectedRoutes.any((protected) => route.startsWith(protected));
  }
}

// Nested navigation widget
class ScaffoldWithNestedNavigation extends StatelessWidget {
  final StatefulNavigationShell navigationShell;
  
  const ScaffoldWithNestedNavigation({
    required this.navigationShell,
  });
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: navigationShell.currentIndex,
        onTap: (index) => navigationShell.goBranch(
          index,
          initialLocation: index == navigationShell.currentIndex,
        ),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.explore),
            label: 'Explore',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
1.2 Tab-Based Navigation with State Preservation

class TabNavigationController extends GetxController 
    with GetSingleTickerProviderStateMixin {
  
  late TabController tabController;
  final RxInt currentTabIndex = 0.obs;
  final List<TabPage> tabs = [];
  
  // Preserve state for each tab
  final Map<int, GetPageRoute> tabRoutes = {};
  final Map<int, dynamic> tabStates = {};
  
  @override
  void onInit() {
    super.onInit();
    
    // Initialize tabs
    tabs.addAll([
      TabPage(
        name: '/home',
        icon: Icons.home,
        builder: () => HomeScreen(),
        preserveState: true,
      ),
      TabPage(
        name: '/messages',
        icon: Icons.message,
        builder: () => MessagesScreen(),
        preserveState: true,
      ),
      TabPage(
        name: '/notifications',
        icon: Icons.notifications,
        builder: () => NotificationsScreen(),
        preserveState: false,
      ),
      TabPage(
        name: '/profile',
        icon: Icons.person,
        builder: () => ProfileScreen(),
        preserveState: true,
      ),
    ]);
    
    tabController = TabController(
      length: tabs.length,
      vsync: this,
      initialIndex: currentTabIndex.value,
    );
    
    // Listen for tab changes
    tabController.addListener(_handleTabChange);
    
    // Preload first tab
    _preloadTab(0);
  }
  
  void _handleTabChange() {
    if (tabController.indexIsChanging) return;
    
    final newIndex = tabController.index;
    final oldIndex = currentTabIndex.value;
    
    // Save current tab state
    _saveTabState(oldIndex);
    
    // Update current index
    currentTabIndex.value = newIndex;
    
    // Load new tab
    _loadTab(newIndex);
    
    // Analytics
    Get.find<AnalyticsService>().logTabChange(
      from: tabs[oldIndex].name,
      to: tabs[newIndex].name,
    );
  }
  
  void _saveTabState(int index) {
    if (!tabs[index].preserveState) return;
    
    final currentRoute = Get.routing.route;
    if (currentRoute != null) {
      tabRoutes[index] = currentRoute;
    }
    
    // Save controller states
    tabStates[index] = _captureTabState();
  }
  
  Map<String, dynamic> _captureTabState() {
    final state = <String, dynamic>{};
    
    // Capture relevant controller states
    if (Get.isRegistered<HomeController>()) {
      state['home'] = Get.find<HomeController>().toJson();
    }
    
    if (Get.isRegistered<MessagesController>()) {
      state['messages'] = Get.find<MessagesController>().toJson();
    }
    
    return state;
  }
  
  void _loadTab(int index) {
    if (tabRoutes.containsKey(index)) {
      // Restore saved route
      Get.offAndToNamed(tabRoutes[index]!.settings.name!);
    } else {
      // Navigate to tab
      Get.offAndToNamed(tabs[index].name);
    }
    
    // Restore controller states
    _restoreTabState(index);
    
    // Preload adjacent tabs
    _preloadAdjacentTabs(index);
  }
  
  void _restoreTabState(int index) {
    final state = tabStates[index];
    if (state == null) return;
    
    // Restore controller states
    if (state['home'] != null && Get.isRegistered<HomeController>()) {
      Get.find<HomeController>().fromJson(state['home']);
    }
  }
  
  void _preloadAdjacentTabs(int currentIndex) {
    // Preload next tab
    if (currentIndex + 1 < tabs.length) {
      _preloadTab(currentIndex + 1);
    }
    
    // Preload previous tab
    if (currentIndex - 1 >= 0) {
      _preloadTab(currentIndex - 1);
    }
  }
  
  void _preloadTab(int index) {
    if (tabRoutes.containsKey(index)) return;
    
    // Create route but don't navigate
    final route = GetPageRoute(
      page: tabs[index].builder,
      settings: RouteSettings(name: tabs[index].name),
    );
    
    tabRoutes[index] = route;
  }
  
  @override
  void onClose() {
    tabController.dispose();
    super.onClose();
  }
}

class TabPage {
  final String name;
  final IconData icon;
  final Widget Function() builder;
  final bool preserveState;
  
  TabPage({
    required this.name,
    required this.icon,
    required this.builder,
    this.preserveState = false,
  });
}
2. Route Guards and Middleware
2.1 Comprehensive Route Guard System

abstract class RouteGuard {
  Future<GuardResult> canActivate(
    String route,
    Map<String, String> parameters,
  );
  
  Future<void> onGuardPass(String route);
  Future<void> onGuardFail(String route, GuardFailure failure);
}

class AuthGuard extends RouteGuard {
  final AuthController auth;
  final AnalyticsService analytics;
  
  AuthGuard(this.auth, this.analytics);
  
  @override
  Future<GuardResult> canActivate(
    String route,
    Map<String, String> parameters,
  ) async {
    // Check authentication
    if (!auth.isAuthenticated) {
      await analytics.logAuthRequired(route);
      return GuardResult.deny(AuthRequiredFailure());
    }
    
    // Check token expiration
    if (auth.isTokenExpired) {
      return GuardResult.deny(TokenExpiredFailure());
    }
    
    // Check email verification
    if (!auth.isEmailVerified) {
      return GuardResult.deny(EmailVerificationRequiredFailure());
    }
    
    return GuardResult.allow();
  }
  
  @override
  Future<void> onGuardPass(String route) async {
    await analytics.logRouteAccess(route, success: true);
  }
  
  @override
  Future<void> onGuardFail(String route, GuardFailure failure) async {
    await analytics.logRouteAccess(route, success: false, reason: failure);
    
    // Handle specific failures
    if (failure is AuthRequiredFailure) {
      Get.offAllNamed(AuthRoutes.login);
    } else if (failure is TokenExpiredFailure) {
      Get.dialog(TokenExpiredDialog());
    }
  }
}

class PermissionGuard extends RouteGuard {
  final RBACService rbac;
  final String requiredPermission;
  
  PermissionGuard(this.rbac, this.requiredPermission);
  
  @override
  Future<GuardResult> canActivate(
    String route,
    Map<String, String> parameters,
  ) async {
    final hasPermission = await rbac.hasPermission(requiredPermission);
    
    if (!hasPermission) {
      return GuardResult.deny(PermissionDeniedFailure(requiredPermission));
    }
    
    return GuardResult.allow();
  }
  
  @override
  Future<void> onGuardFail(String route, GuardFailure failure) async {
    if (failure is PermissionDeniedFailure) {
      Get.snackbar(
        'Access Denied',
        'You need ${failure.permission} permission',
      );
      Get.back();
    }
  }
}

class MaintenanceGuard extends RouteGuard {
  final AppConfig config;
  
  MaintenanceGuard(this.config);
  
  @override
  Future<GuardResult> canActivate(
    String route,
    Map<String, String> parameters,
  ) async {
    if (config.isMaintenanceMode && !_isExemptRoute(route)) {
      return GuardResult.deny(MaintenanceModeFailure());
    }
    
    return GuardResult.allow();
  }
  
  bool _isExemptRoute(String route) {
    final exemptRoutes = [
      '/maintenance',
      '/auth/login',
      '/auth/logout',
    ];
    
    return exemptRoutes.any((exempt) => route.startsWith(exempt));
  }
}

// Guard registry and executor
class RouteGuardExecutor {
  final List<RouteGuard> _guards = [];
  
  void registerGuard(RouteGuard guard) {
    _guards.add(guard);
  }
  
  Future<GuardResult> executeGuards(
    String route,
    Map<String, String> parameters,
  ) async {
    for (final guard in _guards) {
      final result = await guard.canActivate(route, parameters);
      
      if (!result.allowed) {
        await guard.onGuardFail(route, result.failure!);
        return result;
      }
      
      await guard.onGuardPass(route);
    }
    
    return GuardResult.allow();
  }
  
  Future<void> clearGuards() async {
    _guards.clear();
  }
}

// Integration with GetX
class GuardedGetPage extends GetPage {
  final List<RouteGuard> guards;
  
  GuardedGetPage({
    required super.name,
    required super.page,
    super.binding,
    super.transition,
    super.transitionDuration,
    super.middlewares,
    this.guards = const [],
  });
  
  @override
  GetPage copyWith({
    String? name,
    GetPageBuilder? page,
    Bindings? binding,
    Transition? transition,
    Duration? transitionDuration,
    List<GetMiddleware>? middlewares,
    List<RouteGuard>? guards,
  }) {
    return GuardedGetPage(
      name: name ?? this.name,
      page: page ?? this.page,
      binding: binding ?? this.binding,
      transition: transition ?? this.transition,
      transitionDuration: transitionDuration ?? this.transitionDuration,
      middlewares: middlewares ?? this.middlewares,
      guards: guards ?? this.guards,
    );
  }
}

// Custom GetMiddleware for guards
class GuardMiddleware extends GetMiddleware {
  final RouteGuardExecutor guardExecutor;
  
  GuardMiddleware(this.guardExecutor);
  
  @override
  Future<GetNavConfig?> redirectDelegate(GetNavConfig route) async {
    final result = await guardExecutor.executeGuards(
      route.currentPage?.name ?? '',
      route.currentParameters ?? {},
    );
    
    if (!result.allowed) {
      // Redirect to appropriate route based on failure
      return GetNavConfig.fromRoute(
        _getRedirectRoute(result.failure!),
      );
    }
    
    return await super.redirectDelegate(route);
  }
  
  String _getRedirectRoute(GuardFailure failure) {
    if (failure is AuthRequiredFailure) {
      return AuthRoutes.login;
    } else if (failure is MaintenanceModeFailure) {
      return MainRoutes.maintenance;
    }
    
    return '/';
  }
}
2.2 Route Analytics Middleware

class AnalyticsRouteObserver extends GetObserver {
  final AnalyticsService analytics;
  final PerformanceMonitor performance;
  
  AnalyticsRouteObserver(this.analytics, this.performance);
  
  @override
  void didPush(Route route, Route? previousRoute) {
    super.didPush(route, previousRoute);
    
    _logRouteChange(
      previousRoute?.settings.name,
      route.settings.name,
      'push',
    );
  }
  
  @override
  void didPop(Route route, Route? previousRoute) {
    super.didPop(route, previousRoute);
    
    _logRouteChange(
      route.settings.name,
      previousRoute?.settings.name,
      'pop',
    );
  }
  
  @override
  void didReplace({Route? newRoute, Route? oldRoute}) {
    super.didReplace(newRoute: newRoute, oldRoute: oldRoute);
    
    _logRouteChange(
      oldRoute?.settings.name,
      newRoute?.settings.name,
      'replace',
    );
  }
  
  void _logRouteChange(String? from, String? to, String action) async {
    final metrics = await performance.measureRouteChange(
      from ?? '',
      to ?? '',
    );
    
    await analytics.logRouteChange(
      fromRoute: from,
      toRoute: to,
      action: action,
      duration: metrics.duration,
      memoryUsage: metrics.memoryUsage,
      timestamp: DateTime.now(),
    );
  }
}

class RoutePerformanceMetrics {
  final Duration duration;
  final int memoryUsage;
  final DateTime timestamp;
  final String fromRoute;
  final String toRoute;
  
  RoutePerformanceMetrics({
    required this.duration,
    required this.memoryUsage,
    required this.timestamp,
    required this.fromRoute,
    required this.toRoute,
  });
}

class RouteAnalyticsMiddleware extends GetMiddleware {
  final AnalyticsService analytics;
  final Map<String, DateTime> _routeEntryTimes = {};
  
  RouteAnalyticsMiddleware(this.analytics);
  
  @override
  Future<GetNavConfig?> redirectDelegate(GetNavConfig route) async {
    // Record route entry time
    final routeName = route.currentPage?.name ?? '';
    _routeEntryTimes[routeName] = DateTime.now();
    
    return await super.redirectDelegate(route);
  }
  
  @override
  GetPageBuilder? onPageBuildStart(GetPageBuilder? page) {
    // Log page build start
    final routeName = Get.routing.current;
    analytics.logPageBuildStart(routeName);
    
    return super.onPageBuildStart(page);
  }
  
  @override
  Widget onPageBuilt(Widget page) {
    // Log page build completion
    final routeName = Get.routing.current;
    final buildTime = DateTime.now();
    
    analytics.logPageBuildComplete(
      routeName,
      buildTime.difference(_routeEntryTimes[routeName] ?? buildTime),
    );
    
    return super.onPageBuilt(page);
  }
  
  @override
  void onPageDispose() {
    // Calculate time spent on route
    final routeName = Get.routing.current;
    final entryTime = _routeEntryTimes[routeName];
    
    if (entryTime != null) {
      final timeSpent = DateTime.now().difference(entryTime);
      analytics.logTimeOnRoute(routeName, timeSpent);
      _routeEntryTimes.remove(routeName);
    }
    
    super.onPageDispose();
  }
}
3. Deep Linking Implementations
3.1 Advanced Deep Link Handling

class DeepLinkManager extends GetxService {
  final AppLinks _appLinks = AppLinks();
  final AnalyticsService _analytics;
  final Map<String, DeepLinkHandler> _handlers = {};
  
  StreamSubscription? _linkSubscription;
  
  DeepLinkManager(this._analytics);
  
  @override
  Future<void> onInit() async {
    super.onInit();
    
    // Register handlers
    _registerHandlers();
    
    // Listen for deep links
    await _setupDeepLinkListener();
    
    // Handle initial link
    await _handleInitialLink();
  }
  
  void _registerHandlers() {
    _handlers['/products'] = ProductDeepLinkHandler();
    _handlers['/profile'] = ProfileDeepLinkHandler();
    _handlers['/auth'] = AuthDeepLinkHandler();
    _handlers['/notifications'] = NotificationDeepLinkHandler();
  }
  
  Future<void> _setupDeepLinkListener() async {
    _linkSubscription = _appLinks.uriLinkStream.listen(
      _handleDeepLink,
      onError: _handleDeepLinkError,
    );
  }
  
  Future<void> _handleInitialLink() async {
    final initialLink = await _appLinks.getInitialLink();
    if (initialLink != null) {
      await _processDeepLink(initialLink);
    }
  }
  
  Future<void> _handleDeepLink(Uri uri) async {
    await _analytics.logDeepLinkReceived(uri.toString());
    
    try {
      await _processDeepLink(uri);
    } catch (e) {
      await _handleDeepLinkError(e);
    }
  }
  
  Future<void> _processDeepLink(Uri uri) async {
    // Parse deep link
    final deepLink = DeepLink.fromUri(uri);
    
    // Find appropriate handler
    final handler = _findHandler(deepLink.path);
    if (handler == null) {
      throw DeepLinkHandlerNotFoundException(deepLink.path);
    }
    
    // Validate deep link
    if (!await handler.validate(deepLink)) {
      throw InvalidDeepLinkException(deepLink);
    }
    
    // Execute handler
    await handler.handle(deepLink);
    
    // Analytics
    await _analytics.logDeepLinkProcessed(
      deepLink.path,
      success: true,
    );
  }
  
  DeepLinkHandler? _findHandler(String path) {
    for (final prefix in _handlers.keys) {
      if (path.startsWith(prefix)) {
        return _handlers[prefix];
      }
    }
    return null;
  }
  
  Future<void> _handleDeepLinkError(dynamic error) async {
    await _analytics.logDeepLinkError(error.toString());
    
    // Show user-friendly error
    Get.snackbar(
      'Link Error',
      'Could not open the link',
      duration: Duration(seconds: 3),
    );
  }
  
  // Generate deep links
  Uri generateDeepLink(DeepLinkTemplate template, Map<String, dynamic> data) {
    final path = template.generatePath(data);
    final queryParams = template.generateQueryParams(data);
    
    return Uri(
      scheme: 'myapp',
      host: 'deep',
      path: path,
      queryParameters: queryParams,
    );
  }
  
  // Universal links for web fallback
  Uri generateUniversalLink(DeepLinkTemplate template, Map<String, dynamic> data) {
    final path = template.generatePath(data);
    
    return Uri.parse('https://myapp.example.com$path');
  }
  
  @override
  Future<void> onClose() async {
    _linkSubscription?.cancel();
    await super.onClose();
  }
}

abstract class DeepLinkHandler {
  Future<bool> validate(DeepLink deepLink);
  Future<void> handle(DeepLink deepLink);
}

class ProductDeepLinkHandler implements DeepLinkHandler {
  final ProductService _productService;
  
  ProductDeepLinkHandler() : _productService = Get.find();
  
  @override
  Future<bool> validate(DeepLink deepLink) async {
    // Validate product ID exists
    final productId = deepLink.parameters['id'];
    if (productId == null) return false;
    
    // Check if product exists
    return await _productService.productExists(productId);
  }
  
  @override
  Future<void> handle(DeepLink deepLink) async {
    final productId = deepLink.parameters['id']!;
    final action = deepLink.parameters['action'] ?? 'view';
    
    switch (action) {
      case 'view':
        await _handleProductView(productId, deepLink.parameters);
        break;
      case 'purchase':
        await _handleProductPurchase(productId, deepLink.parameters);
        break;
      case 'share':
        await _handleProductShare(productId, deepLink.parameters);
        break;
    }
  }
  
  Future<void> _handleProductView(
    String productId,
    Map<String, String> parameters,
  ) async {
    // Navigate to product screen
    Get.toNamed(
      ProductRoutes.detail,
      parameters: {'id': productId},
      arguments: parameters,
    );
    
    // Preload related products
    unawaited(_productService.preloadRelatedProducts(productId));
  }
}
3.2 Dynamic Link Handling (Firebase)

class FirebaseDynamicLinkHandler extends GetxService {
  final FirebaseDynamicLinks _dynamicLinks = FirebaseDynamicLinks.instance;
  final DeepLinkManager _deepLinkManager;
  final AnalyticsService _analytics;
  
  FirebaseDynamicLinkHandler(this._deepLinkManager, this._analytics);
  
  @override
  Future<void> onInit() async {
    super.onInit();
    
    // Listen for dynamic links
    _dynamicLinks.onLink.listen(
      _handleDynamicLink,
      onError: _handleDynamicLinkError,
    );
    
    // Handle initial link
    await _handleInitialDynamicLink();
  }
  
  Future<void> _handleDynamicLink(PendingDynamicLinkData? linkData) async {
    if (linkData == null) return;
    
    await _analytics.logDynamicLinkReceived(linkData.link.toString());
    
    try {
      // Convert to deep link
      final deepLink = await _convertToDeepLink(linkData);
      
      // Process through deep link manager
      await _deepLinkManager._processDeepLink(deepLink);
      
      // Track conversion
      await _trackConversion(linkData);
    } catch (e) {
      await _handleDynamicLinkError(e);
    }
  }
  
  Future<Uri> _convertToDeepLink(PendingDynamicLinkData linkData) async {
    // Extract parameters
    final params = <String, String>{};
    
    // Add link parameters
    params.addAll(linkData.link.queryParameters);
    
    // Add utm parameters
    if (linkData.utmParameters != null) {
      params.addAll(linkData.utmParameters!.parameters);
    }
    
    // Build deep link URI
    return Uri(
      scheme: 'myapp',
      host: 'dynamic',
      path: linkData.link.path,
      queryParameters: params,
    );
  }
  
  Future<void> _trackConversion(PendingDynamicLinkData linkData) async {
    // Track in analytics
    await _analytics.logDynamicLinkConversion(
      linkData.link.toString(),
      linkData.utmParameters?.source,
      linkData.utmParameters?.medium,
      linkData.utmParameters?.campaign,
    );
    
    // Track in Firebase
    FirebaseAnalytics.instance.logEvent(
      name: 'dynamic_link_conversion',
      parameters: {
        'link': linkData.link.toString(),
        'timestamp': DateTime.now().millisecondsSinceEpoch,
      },
    );
  }
  
  Future<void> _handleInitialDynamicLink() async {
    final initialLink = await _dynamicLinks.getInitialLink();
    if (initialLink != null) {
      await _handleDynamicLink(initialLink);
    }
  }
  
  Future<void> _handleDynamicLinkError(dynamic error) async {
    await _analytics.logDynamicLinkError(error.toString());
  }
  
  // Generate dynamic links
  Future<Uri> generateDynamicLink(DynamicLinkTemplate template) async {
    final parameters = DynamicLinkParameters(
      link: template.uri,
      uriPrefix: 'https://myapp.page.link',
      androidParameters: AndroidParameters(
        packageName: 'com.example.myapp',
        minimumVersion: 1,
      ),
      iosParameters: IOSParameters(
        bundleId: 'com.example.myapp',
        minimumVersion: '1.0.0',
        appStoreId: '123456789',
      ),
      socialMetaTagParameters: SocialMetaTagParameters(
        title: template.title,
        description: template.description,
        imageUrl: template.imageUrl,
      ),
    );
    
    final shortLink = await _dynamicLinks.buildShortLink(parameters);
    return shortLink.shortUrl;
  }
}
4. Route Transition Animations
4.1 Custom Transition Builders

class CustomTransitions {
  // Slide transition with fade
  static Widget slideWithFade(
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    const begin = Offset(1.0, 0.0);
    const end = Offset.zero;
    const curve = Curves.easeInOutCubic;
    
    var slideTween = Tween(begin: begin, end: end).chain(CurveTween(curve: curve));
    var fadeTween = Tween(begin: 0.0, end: 1.0).chain(CurveTween(curve: curve));
    
    return SlideTransition(
      position: animation.drive(slideTween),
      child: FadeTransition(
        opacity: animation.drive(fadeTween),
        child: child,
      ),
    );
  }
  
  // Scale transition
  static Widget scaleTransition(
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child, {
    double beginScale = 0.5,
    double endScale = 1.0,
  }) {
    final scaleTween = Tween(begin: beginScale, end: endScale)
        .chain(CurveTween(curve: Curves.elasticOut));
    
    return ScaleTransition(
      scale: animation.drive(scaleTween),
      child: child,
    );
  }
  
  // 3D rotation transition
  static Widget rotation3DTransition(
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child, {
    double beginAngle = -90.0,
    double endAngle = 0.0,
  }) {
    final rotationTween = Tween(begin: beginAngle, end: endAngle)
        .chain(CurveTween(curve: Curves.easeInOutBack));
    
    return AnimatedBuilder(
      animation: animation,
      builder: (context, child) {
        return Transform(
          transform: Matrix4.identity()
            ..setEntry(3, 2, 0.001)
            ..rotateY(rotationTween.evaluate(animation) * (pi / 180)),
          alignment: Alignment.center,
          child: child,
        );
      },
      child: child,
    );
  }
  
  // Shared element transition
  static Widget sharedElementTransition(
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child, {
    required String heroTag,
    required SharedElementTransitionSettings settings,
  }) {
    return Hero(
      tag: heroTag,
      flightShuttleBuilder: (
        BuildContext flightContext,
        Animation<double> animation,
        HeroFlightDirection flightDirection,
        BuildContext fromHeroContext,
        BuildContext toHeroContext,
      ) {
        final hero = flightDirection == HeroFlightDirection.push
            ? fromHeroContext.widget
            : toHeroContext.widget;
        
        return AnimatedBuilder(
          animation: animation,
          builder: (context, child) {
            final scale = 1.0 + (settings.scale - 1.0) * animation.value;
            
            return Transform.scale(
              scale: scale,
              child: Opacity(
                opacity: settings.opacityTween.evaluate(animation),
                child: hero,
              ),
            );
          },
        );
      },
      child: child,
    );
  }
}

// Transition manager
class TransitionManager extends GetxService {
  final Rx<TransitionConfig> _currentConfig = TransitionConfig.defaults().obs;
  final Map<String, TransitionConfig> _routeTransitions = {};
  
  void registerRouteTransition(String route, TransitionConfig config) {
    _routeTransitions[route] = config;
  }
  
  TransitionConfig getTransitionForRoute(String route) {
    return _routeTransitions[route] ?? _currentConfig.value;
  }
  
  void updateGlobalTransition(TransitionConfig config) {
    _currentConfig.value = config;
  }
  
  // Adaptive transitions based on platform
  TransitionConfig getAdaptiveTransition(String route) {
    if (GetPlatform.isIOS) {
      return TransitionConfig.cupertino();
    } else if (GetPlatform.isAndroid) {
      return TransitionConfig.material();
    } else {
      return TransitionConfig.defaults();
    }
  }
  
  // Performance-optimized transitions
  TransitionConfig getPerformanceOptimizedTransition() {
    return TransitionConfig(
      duration: Duration(milliseconds: 200),
      transition: Transition.fade,
      opaque: true,
      fullscreenDialog: false,
    );
  }
}

class TransitionConfig {
  final Duration duration;
  final Transition transition;
  final Curve curve;
  final bool opaque;
  final bool fullscreenDialog;
  final CustomTransitionBuilder? customTransition;
  
  TransitionConfig({
    required this.duration,
    required this.transition,
    this.curve = Curves.easeInOut,
    this.opaque = true,
    this.fullscreenDialog = false,
    this.customTransition,
  });
  
  factory TransitionConfig.defaults() {
    return TransitionConfig(
      duration: Duration(milliseconds: 300),
      transition: Transition.rightToLeft,
      curve: Curves.easeInOut,
    );
  }
  
  factory TransitionConfig.cupertino() {
    return TransitionConfig(
      duration: Duration(milliseconds: 400),
      transition: Transition.cupertino,
      curve: Curves.easeInOutCubic,
    );
  }
  
  factory TransitionConfig.material() {
    return TransitionConfig(
      duration: Duration(milliseconds: 300),
      transition: Transition.fade,
      curve: Curves.fastOutSlowIn,
    );
  }
}
4.2 Page Route Factory

class CustomPageRouteFactory {
  final TransitionManager _transitionManager;
  
  CustomPageRouteFactory(this._transitionManager);
  
  GetPageRoute createRoute(
    String routeName,
    Widget Function() pageBuilder,
    Map<String, String> parameters,
  ) {
    final config = _transitionManager.getTransitionForRoute(routeName);
    
    if (config.customTransition != null) {
      return GetPageRoute(
        settings: RouteSettings(name: routeName, arguments: parameters),
        page: pageBuilder,
        transition: Transition.custom,
        customTransition: config.customTransition!,
        transitionDuration: config.duration,
        curve: config.curve,
        opaque: config.opaque,
        fullscreenDialog: config.fullscreenDialog,
      );
    }
    
    return GetPageRoute(
      settings: RouteSettings(name: routeName, arguments: parameters),
      page: pageBuilder,
      transition: config.transition,
      transitionDuration: config.duration,
      curve: config.curve,
      opaque: config.opaque,
      fullscreenDialog: config.fullscreenDialog,
    );
  }
  
  // Modal route with customizations
  GetPageRoute createModalRoute(
    String routeName,
    Widget Function() pageBuilder,
    Map<String, String> parameters, {
    bool barrierDismissible = true,
    Color? barrierColor,
    String? barrierLabel,
  }) {
    return GetPageRoute(
      settings: RouteSettings(name: routeName, arguments: parameters),
      page: pageBuilder,
      transition: Transition.downToUp,
      transitionDuration: Duration(milliseconds: 300),
      fullscreenDialog: true,
      opaque: false,
      barrierDismissible: barrierDismissible,
      barrierColor: barrierColor ?? Colors.black54,
      barrierLabel: barrierLabel,
    );
  }
  
  // Bottom sheet style route
  GetPageRoute createBottomSheetRoute(
    String routeName,
    Widget Function() pageBuilder,
    Map<String, String> parameters,
  ) {
    return GetPageRoute(
      settings: RouteSettings(name: routeName, arguments: parameters),
      page: pageBuilder,
      transition: Transition.upToDown,
      transitionDuration: Duration(milliseconds: 250),
      curve: Curves.easeOut,
      fullscreenDialog: false,
      opaque: false,
    );
  }
}
5. Route Testing Utilities
5.1 Route Testing Helpers

class RouteTestHelpers {
  static Future<void> pumpRoute(
    WidgetTester tester,
    String route, {
    Map<String, String> parameters = const {},
    Object? arguments,
    bool withAnimation = true,
  }) async {
    // Navigate to route
    Get.toNamed(route, parameters: parameters, arguments: arguments);
    
    // Wait for navigation
    if (withAnimation) {
      await tester.pumpAndSettle();
    } else {
      await tester.pump();
    }
    
    // Verify route
    expect(Get.currentRoute, route);
  }
  
  static Future<void> testRouteFlow(
    WidgetTester tester,
    List<RouteTestStep> steps,
  ) async {
    for (final step in steps) {
      await step.execute(tester);
    }
  }
  
  static Future<void> testDeepLink(
    WidgetTester tester,
    Uri deepLink,
  ) async {
    // Simulate deep link
    final manager = Get.find<DeepLinkManager>();
    await manager._processDeepLink(deepLink);
    
    await tester.pumpAndSettle();
  }
  
  static Future<void> testRouteGuard(
    WidgetTester tester,
    RouteGuard guard,
    String route,
    Map<String, String> parameters,
  ) async {
    final result = await guard.canActivate(route, parameters);
    
    if (!result.allowed) {
      await guard.onGuardFail(route, result.failure!);
    } else {
      await guard.onGuardPass(route);
    }
    
    await tester.pumpAndSettle();
  }
  
  // Mock route observer for testing
  static MockRouteObserver createMockObserver() {
    return MockRouteObserver();
  }
  
  // Generate test routes
  static List<GetPage> generateTestRoutes() {
    return [
      GetPage(
        name: '/test/home',
        page: () => Container(),
      ),
      GetPage(
        name: '/test/detail/:id',
        page: () => Container(),
      ),
      GetPage(
        name: '/test/modal',
        page: () => Container(),
        fullscreenDialog: true,
      ),
    ];
  }
}

class RouteTestStep {
  final String description;
  final Future<void> Function(WidgetTester) execute;
  
  RouteTestStep({
    required this.description,
    required this.execute,
  });
}

class MockRouteObserver extends NavigatorObserver {
  final List<RouteEvent> events = [];
  
  @override
  void didPush(Route route, Route? previousRoute) {
    events.add(RouteEvent.push(route));
  }
  
  @override
  void didPop(Route route, Route? previousRoute) {
    events.add(RouteEvent.pop(route));
  }
  
  void clear() {
    events.clear();
  }
}

class RouteEvent {
  final String type;
  final Route route;
  final DateTime timestamp;
  
  RouteEvent._(this.type, this.route) : timestamp = DateTime.now();
  
  factory RouteEvent.push(Route route) = _PushRouteEvent;
  factory RouteEvent.pop(Route route) = _PopRouteEvent;
}

class _PushRouteEvent extends RouteEvent {
  _PushRouteEvent(Route route) : super._('push', route);
}

class _PopRouteEvent extends RouteEvent {
  _PopRouteEvent(Route route) : super._('pop', route);
}
This comprehensive routing guide provides advanced patterns for navigation, deep linking, route guards, transitions, and testing in GetX applications. These patterns enable building complex navigation flows with proper state management, security, and analytics.