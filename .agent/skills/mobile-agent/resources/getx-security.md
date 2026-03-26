### GetX Security Practices - Senior Guide
1. Secure Storage Patterns
1.1 Encrypted Storage with GetStorage

class SecureStorageService extends GetxService {
  late GetStorage _storage;
  late FlutterSecureStorage _secureStorage;
  
  @override
  Future<void> onInit() async {
    await super.onInit();
    
    // Initialize with encryption
    _storage = GetStorage('secure_app');
    _secureStorage = FlutterSecureStorage();
    
    // Migrate old unencrypted data
    await _migrateToSecureStorage();
  }
  
  // Store sensitive data
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
    if (GetPlatform.isIOS || GetPlatform.isAndroid) {
      return await _platformEncrypt(plaintext);
    }
    
    // Fallback for web/desktop
    return _fallbackEncrypt(plaintext);
  }
  
  // Store non-sensitive data
  Future<void> store(String key, dynamic value) async {
    await _storage.write(key, value);
    
    // Log storage operations (not values)
    Get.find<AuditService>().logStorageWrite(key);
  }
  
  T? read<T>(String key) {
    return _storage.read<T>(key);
  }
  
  // Clear all data
  Future<void> clearAll() async {
    await _storage.erase();
    await _secureStorage.deleteAll();
    
    // Clear memory cache
    Get.reset();
  }
  
  // Secure deletion
  Future<void> secureDelete(String key) async {
    // Overwrite before deletion on supported platforms
    if (GetPlatform.isAndroid) {
      await _secureStorage.write(key: key, value: '0' * 100);
    }
    
    await _secureStorage.delete(key: key);
  }
}
1.2 Biometric Storage Protection

class BiometricProtectedStorage extends GetxService {
  final LocalAuth _localAuth = LocalAuth();
  final SecureStorageService _storage = Get.find();
  
  Future<bool> authenticate() async {
    try {
      return await _localAuth.authenticate(
        localizedReason: 'Authenticate to access secure data',
        options: AuthenticationOptions(
          biometricOnly: true,
          stickyAuth: true,
          sensitiveTransaction: true,
        ),
      );
    } catch (e) {
      Get.log('Biometric auth failed: $e');
      return false;
    }
  }
  
  Future<void> storeWithBiometric(String key, String value) async {
    if (await authenticate()) {
      await _storage.storeSensitive(key, value);
    } else {
      throw AuthenticationRequiredException();
    }
  }
  
  Future<String?> readWithBiometric(String key) async {
    if (await authenticate()) {
      return await _storage.readSensitive(key);
    }
    return null;
  }
}
2. API Security with GetX
2.1 Secure HTTP Client Configuration

class SecureHttpClient extends GetxService {
  late Dio _dio;
  
  @override
  Future<void> onInit() async {
    await super.onInit();
    
    _dio = Dio(
      BaseOptions(
        baseUrl: _getBaseUrl(),
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'User-Agent': _getUserAgent(),
          'Accept': 'application/json',
          'Accept-Language': Get.locale?.languageCode ?? 'en',
        },
      ),
    );
    
    // Add security interceptors
    _dio.interceptors.addAll([
      _createSecurityInterceptor(),
      _createAuthInterceptor(),
      _createLoggingInterceptor(),
      _createErrorInterceptor(),
    ]);
  }
  
  Interceptor _createSecurityInterceptor() {
    return InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Validate URL
        if (!_isValidUrl(options.uri)) {
          throw SecurityException('Invalid URL');
        }
        
        // Add security headers
        options.headers.addAll({
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        });
        
        // Encrypt sensitive request data
        if (options.data is Map) {
          options.data = await _encryptRequestData(options.data as Map);
        }
        
        handler.next(options);
      },
      
      onResponse: (response, handler) async {
        // Validate response
        await _validateResponse(response);
        
        // Decrypt response if needed
        if (response.data is String) {
          response.data = await _decryptResponse(response.data as String);
        }
        
        handler.next(response);
      },
      
      onError: (error, handler) async {
        // Handle security-related errors
        if (error.response?.statusCode == 403) {
          await _handleForbiddenError();
        }
        
        // Don't leak internal errors to users
        error = _sanitizeError(error);
        
        handler.next(error);
      },
    );
  }
  
  Future<void> _validateResponse(Response response) async {
    // Check for security headers
    final headers = response.headers.map;
    
    if (headers['content-security-policy'] == null) {
      Get.find<SecurityMonitor>().logMissingCSP();
    }
    
    // Validate content type
    final contentType = headers['content-type']?.first;
    if (contentType?.contains('application/json') != true) {
      throw SecurityException('Invalid content type: $contentType');
    }
    
    // Validate response size (prevent DoS)
    final contentLength = int.tryParse(headers['content-length']?.first ?? '0') ?? 0;
    if (contentLength > 10 * 1024 * 1024) { // 10MB limit
      throw SecurityException('Response too large');
    }
  }
}
2.2 JWT Token Management

class JwtTokenManager extends GetxService {
  final SecureStorageService _storage = Get.find();
  final Rx<JwtToken?> _currentToken = Rx<JwtToken?>(null);
  Timer? _refreshTimer;
  
  @override
  Future<void> onInit() async {
    await super.onInit();
    
    // Load token from secure storage
    await _loadToken();
    
    // Setup automatic refresh
    _setupTokenRefresh();
  }
  
  Future<void> _loadToken() async {
    final tokenJson = await _storage.readSensitive('jwt_token');
    if (tokenJson != null) {
      final token = JwtToken.fromJson(jsonDecode(tokenJson));
      
      // Validate token
      if (await _validateToken(token)) {
        _currentToken(token);
      } else {
        await _clearToken();
      }
    }
  }
  
  Future<bool> _validateToken(JwtToken token) async {
    // Check expiration
    if (token.isExpired) {
      return false;
    }
    
    // Validate signature (for local validation)
    if (!await _verifyTokenSignature(token)) {
      return false;
    }
    
    // Check revocation list
    if (await _isTokenRevoked(token)) {
      return false;
    }
    
    return true;
  }
  
  Future<void> storeToken(JwtToken token) async {
    // Encrypt before storage
    await _storage.storeSensitive(
      'jwt_token',
      jsonEncode(token.toJson()),
    );
    
    _currentToken(token);
    
    // Schedule refresh
    _scheduleRefresh(token);
  }
  
  void _scheduleRefresh(JwtToken token) {
    // Refresh 5 minutes before expiration
    final refreshTime = token.expiresAt.subtract(Duration(minutes: 5));
    final delay = refreshTime.difference(DateTime.now());
    
    if (delay > Duration.zero) {
      _refreshTimer?.cancel();
      _refreshTimer = Timer(delay, () => _refreshToken());
    }
  }
  
  Future<void> _refreshToken() async {
    try {
      final authService = Get.find<AuthService>();
      final newToken = await authService.refreshToken(_currentToken.value!);
      
      await storeToken(newToken);
    } catch (e) {
      // Refresh failed - logout user
      Get.find<AuthController>().logout();
    }
  }
  
  Future<void> clearToken() async {
    await _storage.secureDelete('jwt_token');
    _currentToken(null);
    _refreshTimer?.cancel();
  }
  
  // Get token for API requests
  Future<String?> getAccessToken() async {
    final token = _currentToken.value;
    
    if (token == null || token.isExpired) {
      return null;
    }
    
    return token.accessToken;
  }
  
  // Parse token claims
  Map<String, dynamic>? getTokenClaims() {
    final token = _currentToken.value;
    if (token == null) return null;
    
    try {
      final parts = token.accessToken.split('.');
      if (parts.length != 3) return null;
      
      final payload = parts[1];
      final normalized = base64Url.normalize(payload);
      final decoded = utf8.decode(base64Url.decode(normalized));
      
      return jsonDecode(decoded) as Map<String, dynamic>;
    } catch (e) {
      return null;
    }
  }
}
3. Authentication & Authorization Flows
3.1 Multi-Factor Authentication

class MultiFactorAuthController extends GetxController {
  final Rx<AuthState> _state = AuthState.idle.obs;
  final Rx<MfaMethod?> _selectedMethod = Rx<MfaMethod?>(null);
  final RxString _mfaCode = ''.obs;
  final RxInt _attemptsRemaining = 3.obs;
  
  Timer? _codeExpiryTimer;
  Timer? _resendTimer;
  
  AuthState get state => _state.value;
  MfaMethod? get selectedMethod => _selectedMethod.value;
  
  Future<void> initiateMfa(MfaMethod method) async {
    _state(AuthState.mfaRequired);
    _selectedMethod(method);
    
    try {
      switch (method) {
        case MfaMethod.totp:
          await _sendTotpCode();
          break;
        case MfaMethod.sms:
          await _sendSmsCode();
          break;
        case MfaMethod.email:
          await _sendEmailCode();
          break;
        case MfaMethod.biometric:
          await _authenticateBiometric();
          break;
      }
      
      // Start code expiry timer
      _startCodeExpiryTimer();
      
      // Start resend timer
      _startResendTimer();
      
    } catch (e) {
      _state(AuthState.error);
      Get.snackbar('Error', 'Failed to initiate MFA');
    }
  }
  
  Future<void> verifyMfaCode(String code) async {
    if (_attemptsRemaining.value <= 0) {
      throw TooManyAttemptsException();
    }
    
    _state(AuthState.verifying);
    
    try {
      final isValid = await _validateMfaCode(code);
      
      if (isValid) {
        _state(AuthState.verified);
        _clearTimers();
        
        // Continue with authentication
        await Get.find<AuthController>().completeMfa();
      } else {
        _attemptsRemaining.value--;
        
        if (_attemptsRemaining.value > 0) {
          _state(AuthState.mfaRequired);
          Get.snackbar(
            'Invalid Code',
            '${_attemptsRemaining.value} attempts remaining',
          );
        } else {
          _state(AuthState.locked);
          await _lockAccount();
        }
      }
    } catch (e) {
      _state(AuthState.error);
      rethrow;
    }
  }
  
  void _startCodeExpiryTimer() {
    _codeExpiryTimer?.cancel();
    _codeExpiryTimer = Timer(Duration(minutes: 5), () {
      _state(AuthState.expired);
      _selectedMethod(null);
    });
  }
  
  void _startResendTimer() {
    _resendTimer?.cancel();
    _resendTimer = Timer(Duration(seconds: 30), () {
      _enableResend();
    });
  }
  
  void _clearTimers() {
    _codeExpiryTimer?.cancel();
    _resendTimer?.cancel();
  }
  
  @override
  void onClose() {
    _clearTimers();
    super.onClose();
  }
}
3.2 Role-Based Access Control

class RBACService extends GetxService {
  final JwtTokenManager _tokenManager = Get.find();
  final SecureStorageService _storage = Get.find();
  
  final Map<String, Set<String>> _rolePermissions = {
    'user': {'read_profile', 'update_profile'},
    'admin': {'manage_users', 'view_analytics', 'manage_settings'},
    'super_admin': {'*'}, // Wildcard for all permissions
  };
  
  Future<bool> hasPermission(String permission) async {
    final userRole = await _getUserRole();
    
    if (userRole == null) return false;
    
    final permissions = _rolePermissions[userRole];
    if (permissions == null) return false;
    
    // Check for wildcard
    if (permissions.contains('*')) return true;
    
    return permissions.contains(permission);
  }
  
  Future<List<String>> getUserPermissions() async {
    final userRole = await _getUserRole();
    
    if (userRole == null) return [];
    
    final permissions = _rolePermissions[userRole];
    return permissions?.toList() ?? [];
  }
  
  Future<String?> _getUserRole() async {
    // Try to get from token first
    final claims = _tokenManager.getTokenClaims();
    if (claims?['role'] is String) {
      return claims!['role'] as String;
    }
    
    // Fallback to storage
    return await _storage.readSensitive('user_role');
  }
  
  // Route guard for GetX navigation
  RouteGuard createPermissionGuard(String requiredPermission) {
    return RouteGuard(
      canNavigate: () async {
        final hasPerm = await hasPermission(requiredPermission);
        
        if (!hasPerm) {
          Get.snackbar(
            'Access Denied',
            'You do not have permission to access this page',
          );
          
          // Log access attempt
          Get.find<AuditService>().logAccessDenied(
            requiredPermission,
            Get.currentRoute,
          );
        }
        
        return hasPerm;
      },
    );
  }
  
  // Widget-level permission check
  Widget withPermission(
    String permission,
    Widget child, {
    Widget? fallback,
  }) {
    return FutureBuilder<bool>(
      future: hasPermission(permission),
      builder: (context, snapshot) {
        if (snapshot.hasData && snapshot.data == true) {
          return child;
        }
        
        return fallback ?? const SizedBox.shrink();
      },
    );
  }
}
4. Input Validation & Sanitization
4.1 Comprehensive Input Validation

class InputValidator extends GetxService {
  final RegExp _emailRegex = RegExp(
    r'^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$',
  );
  
  final RegExp _passwordRegex = RegExp(
    r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$',
  );
  
  final RegExp _phoneRegex = RegExp(
    r'^\+?[1-9]\d{1,14}$', // E.164 format
  );
  
  Future<ValidationResult> validateEmail(String email) async {
    // Trim and lowercase
    final cleaned = email.trim().toLowerCase();
    
    // Basic format validation
    if (!_emailRegex.hasMatch(cleaned)) {
      return ValidationResult.invalid('Invalid email format');
    }
    
    // Check for disposable emails
    if (await _isDisposableEmail(cleaned)) {
      return ValidationResult.invalid('Disposable email not allowed');
    }
    
    // Check for known malicious domains
    if (await _isMaliciousDomain(cleaned)) {
      return ValidationResult.invalid('Email domain not allowed');
    }
    
    return ValidationResult.valid();
  }
  
  Future<ValidationResult> validatePassword(String password) async {
    // Length check
    if (password.length < 8) {
      return ValidationResult.invalid('Password must be at least 8 characters');
    }
    
    // Complexity check
    if (!_passwordRegex.hasMatch(password)) {
      return ValidationResult.invalid(
        'Password must contain uppercase, lowercase, number, and special character',
      );
    }
    
    // Common password check
    if (await _isCommonPassword(password)) {
      return ValidationResult.invalid('Password is too common');
    }
    
    // Similarity to personal info
    final userData = Get.find<UserController>().user;
    if (userData != null) {
      if (_isSimilarToPersonalInfo(password, userData)) {
        return ValidationResult.invalid(
          'Password should not contain personal information',
        );
      }
    }
    
    return ValidationResult.valid();
  }
  
  ValidationResult validateInput(String input, InputType type) {
    final cleaned = input.trim();
    
    switch (type) {
      case InputType.name:
        return _validateName(cleaned);
      case InputType.phone:
        return _validatePhone(cleaned);
      case InputType.address:
        return _validateAddress(cleaned);
      case InputType.cardNumber:
        return _validateCardNumber(cleaned);
      case InputType.cvv:
        return _validateCvv(cleaned);
      default:
        return _validateGeneric(cleaned);
    }
  }
  
  ValidationResult _validateName(String name) {
    // Prevent injection attacks
    if (name.contains('<') || name.contains('>')) {
      return ValidationResult.invalid('Invalid characters in name');
    }
    
    // Length limits
    if (name.length > 100) {
      return ValidationResult.invalid('Name too long');
    }
    
    return ValidationResult.valid();
  }
  
  String sanitizeHtml(String html) {
    // Allow only safe tags and attributes
    final sanitizer = HtmlSanitizer(
      allowedElements: {'b', 'i', 'em', 'strong', 'p', 'br'},
      allowedAttributes: {'class', 'style'},
    );
    
    return sanitizer.sanitize(html);
  }
  
  String sanitizeSql(String input) {
    // Parameterized queries should be used instead,
    // but this provides additional protection
    return input
        .replaceAll("'", "''")
        .replaceAll(';', '')
        .replaceAll('--', '')
        .replaceAll('/*', '')
        .replaceAll('*/', '');
  }
}
5. Network Security
5.1 Certificate Pinning

class CertificatePinner extends GetxService {
  final Map<String, List<String>> _pinnedCertificates = {
    'api.example.com': [
      'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
      'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=',
    ],
  };
  
  Dio createPinnedClient() {
    final dio = Dio();
    
    (dio.httpClientAdapter as DefaultHttpClientAdapter).onHttpClientCreate =
        (HttpClient client) {
      final securityContext = SecurityContext();
      
      // Add pinned certificates
      for (final cert in _loadCertificates()) {
        securityContext.setTrustedCertificatesBytes(cert);
      }
      
      client.badCertificateCallback = (cert, host, port) {
        // Implement certificate pinning logic
        return _verifyCertificate(cert, host);
      };
      
      return client;
    };
    
    return dio;
  }
  
  bool _verifyCertificate(X509Certificate cert, String host) {
    final expectedHashes = _pinnedCertificates[host];
    if (expectedHashes == null) return false;
    
    final certHash = _calculateCertificateHash(cert);
    
    return expectedHashes.contains(certHash);
  }
  
  String _calculateCertificateHash(X509Certificate cert) {
    final bytes = cert.der;
    final hash = sha256.convert(bytes);
    return 'sha256/${base64.encode(hash.bytes)}';
  }
}
5.2 SSL/TLS Configuration

class SecurityConfig extends GetxService {
  final Rx<TlsVersion> _minTlsVersion = TlsVersion.tls12.obs;
  final RxList<String> _allowedCiphers = RxList([
    'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256',
    'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384',
    'TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256',
  ]);
  
  @override
  Future<void> onInit() async {
    await super.onInit();
    
    // Update security config based on platform capabilities
    await _updateSecurityConfig();
    
    // Monitor for security updates
    _setupSecurityMonitoring();
  }
  
  Future<void> _updateSecurityConfig() async {
    if (GetPlatform.isAndroid) {
      // Android-specific config
      if (await _supportsTls13()) {
        _minTlsVersion(TlsVersion.tls13);
      }
    } else if (GetPlatform.isIOS) {
      // iOS-specific config
      _allowedCiphers.add('TLS_AES_128_GCM_SHA256');
      _allowedCiphers.add('TLS_AES_256_GCM_SHA384');
    }
  }
  
  Map<String, dynamic> getSecurityHeaders() {
    return {
      'Upgrade-Insecure-Requests': '1',
      'Content-Security-Policy': _getCspHeader(),
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': _getPermissionsHeader(),
    };
  }
  
  String _getCspHeader() {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' https://api.example.com",
      "font-src 'self'",
      "object-src 'none'",
      "media-src 'self'",
      "frame-src 'none'",
      "base-uri 'self'",
    ].join('; ');
  }
}
6. Security Monitoring & Audit
6.1 Security Event Logging

class SecurityMonitor extends GetxService {
  final RxList<SecurityEvent> _events = RxList<SecurityEvent>();
  final SecureStorageService _storage = Get.find();
  
  Stream<List<SecurityEvent>> get events => _events.stream;
  
  Future<void> logEvent(SecurityEvent event) async {
    // Add to memory
    _events.add(event);
    
    // Persist to secure storage
    await _persistEvent(event);
    
    // Send to security backend if configured
    if (event.severity >= SecuritySeverity.high) {
      await _reportToBackend(event);
    }
    
    // Alert user if needed
    if (event.severity >= SecuritySeverity.critical) {
      _alertUser(event);
    }
  }
  
  Future<void> _persistEvent(SecurityEvent event) async {
    final eventsJson = await _storage.read<List>('security_events') ?? [];
    
    eventsJson.add(event.toJson());
    
    // Keep only last 1000 events
    if (eventsJson.length > 1000) {
      eventsJson.removeRange(0, eventsJson.length - 1000);
    }
    
    await _storage.store('security_events', eventsJson);
  }
  
  Future<void> _reportToBackend(SecurityEvent event) async {
    try {
      final api = Get.find<SecurityApi>();
      await api.reportSecurityEvent(event);
    } catch (e) {
      // Don't throw - security logging should not break app
      Get.log('Failed to report security event: $e');
    }
  }
  
  void _alertUser(SecurityEvent event) {
    Get.dialog(
      SecurityAlertDialog(event: event),
      barrierDismissible: false,
    );
  }
  
  // Specific event loggers
  Future<void> logAuthAttempt(String method, bool success) async {
    await logEvent(AuthAttemptEvent(
      timestamp: DateTime.now(),
      method: method,
      success: success,
      ipAddress: await _getIpAddress(),
      deviceId: await _getDeviceId(),
    ));
  }
  
  Future<void> logAccessDenied(String permission, String route) async {
    await logEvent(AccessDeniedEvent(
      timestamp: DateTime.now(),
      permission: permission,
      route: route,
      userId: Get.find<AuthController>().userId,
    ));
  }
  
  Future<void> logDataAccess(String dataType, AccessType type) async {
    await logEvent(DataAccessEvent(
      timestamp: DateTime.now(),
      dataType: dataType,
      accessType: type,
      userId: Get.find<AuthController>().userId,
    ));
  }
}
6.2 Anomaly Detection

class AnomalyDetector extends GetxService {
  final SecurityMonitor _monitor = Get.find();
  final Map<String, List<DateTime>> _eventTimestamps = {};
  
  @override
  Future<void> onInit() async {
    await super.onInit();
    
    // Listen to security events
    _monitor.events.listen(_analyzeEvent);
    
    // Schedule periodic analysis
    Timer.periodic(Duration(minutes: 5), (_) => _runPeriodicAnalysis());
  }
  
  Future<void> _analyzeEvent(List<SecurityEvent> events) async {
    if (events.isEmpty) return;
    
    final latestEvent = events.last;
    
    // Track event frequency
    final eventType = latestEvent.runtimeType.toString();
    _eventTimestamps.putIfAbsent(eventType, () => []).add(latestEvent.timestamp);
    
    // Clean old timestamps (last hour only)
    final oneHourAgo = DateTime.now().subtract(Duration(hours: 1));
    _eventTimestamps[eventType]?.removeWhere((ts) => ts.isBefore(oneHourAgo));
    
    // Check for anomalies
    await _checkForAnomalies(eventType);
  }
  
  Future<void> _checkForAnomalies(String eventType) async {
    final timestamps = _eventTimestamps[eventType] ?? [];
    
    // Check rate limits
    if (timestamps.length > _getRateLimit(eventType)) {
      await _handleRateLimitExceeded(eventType, timestamps.length);
    }
    
    // Check for suspicious patterns
    if (_isSuspiciousPattern(timestamps)) {
      await _handleSuspiciousPattern(eventType);
    }
  }
  
  bool _isSuspiciousPattern(List<DateTime> timestamps) {
    if (timestamps.length < 5) return false;
    
    // Check for evenly spaced events (could be automated)
    final intervals = <Duration>[];
    for (var i = 1; i < timestamps.length; i++) {
      intervals.add(timestamps[i].difference(timestamps[i - 1]));
    }
    
    final averageInterval = intervals.fold(
      Duration.zero,
      (sum, interval) => sum + interval,
    ) ~/ intervals.length;
    
    // If all intervals are within 10% of average, might be automated
    final tolerance = averageInterval ~/ 10;
    
    return intervals.every((interval) {
      final diff = (interval - averageInterval).abs();
      return diff <= tolerance;
    });
  }
  
  Future<void> _handleRateLimitExceeded(String eventType, int count) async {
    await _monitor.logEvent(RateLimitExceededEvent(
      timestamp: DateTime.now(),
      eventType: eventType,
      count: count,
      severity: SecuritySeverity.high,
    ));
    
    // Take action based on event type
    switch (eventType) {
      case 'AuthAttemptEvent':
        await _handleAuthRateLimit(count);
        break;
      case 'AccessDeniedEvent':
        await _handleAccessRateLimit(count);
        break;
    }
  }
  
  Future<void> _handleAuthRateLimit(int count) async {
    // Temporarily disable authentication
    Get.find<AuthController>().disableAuth(Duration(minutes: 5));
    
    // Notify user
    Get.snackbar(
      'Security Alert',
      'Too many login attempts detected. Please try again later.',
      duration: Duration(seconds: 10),
    );
  }
}
7. Secure Communication
7.1 End-to-End Encryption

class EndToEndEncryption extends GetxService {
  final SecureStorageService _storage = Get.find();
  
  Future<EncryptedMessage> encryptMessage(
    String plaintext,
    String recipientPublicKey,
  ) async {
    // Generate ephemeral key pair
    final ephemeralKeyPair = await _generateKeyPair();
    
    // Derive shared secret
    final sharedSecret = await _deriveSharedSecret(
      ephemeralKeyPair.privateKey,
      recipientPublicKey,
    );
    
    // Encrypt with AES-GCM
    final encrypted = await _aesGcmEncrypt(plaintext, sharedSecret);
    
    return EncryptedMessage(
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      tag: encrypted.tag,
      ephemeralPublicKey: ephemeralKeyPair.publicKey,
      timestamp: DateTime.now(),
    );
  }
  
  Future<String> decryptMessage(EncryptedMessage message) async {
    // Get private key from secure storage
    final privateKey = await _storage.readSensitive('e2e_private_key');
    if (privateKey == null) {
      throw EncryptionException('Private key not found');
    }
    
    // Derive shared secret
    final sharedSecret = await _deriveSharedSecret(
      privateKey,
      message.ephemeralPublicKey,
    );
    
    // Decrypt
    return await _aesGcmDecrypt(
      message.ciphertext,
      sharedSecret,
      message.iv,
      message.tag,
    );
  }
  
  Future<void> initialize() async {
    // Generate key pair if not exists
    final existingKey = await _storage.readSensitive('e2e_private_key');
    if (existingKey == null) {
      final keyPair = await _generateKeyPair();
      
      await _storage.storeSensitive(
        'e2e_private_key',
        keyPair.privateKey,
      );
      
      // Public key can be shared openly
      await _storage.store(
        'e2e_public_key',
        keyPair.publicKey,
      );
    }
  }
  
  Future<String> signData(String data) async {
    final privateKey = await _storage.readSensitive('e2e_private_key');
    if (privateKey == null) {
      throw EncryptionException('Private key not found');
    }
    
    return await _sign(data, privateKey);
  }
  
  Future<bool> verifySignature(String data, String signature, String publicKey) async {
    return await _verify(data, signature, publicKey);
  }
}
This comprehensive security guide provides patterns for building secure Flutter applications with GetX. Security should be considered at every layer of your application, from storage and networking to authentication and authorization.