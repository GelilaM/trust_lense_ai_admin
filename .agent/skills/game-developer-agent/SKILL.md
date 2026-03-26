# Senior-level Flutter + Flame Game Development Expertise

Use when building 2D games, implementing game architecture, or solving complex game development challenges with production-ready patterns.

---

## Flutter + Flame Senior Game Development

### Core Architecture & Design Patterns

#### Game Structure
- Use `FlameGame` with proper separation between World and Camera - World manages game objects, Camera handles viewport
- Implement Component-based architecture with FCS (Flame Component System) for modular, testable code
- Extend `World` class for game logic container, leverage built-in camera system for viewport management
- Use Component lifecycle properly: `onLoad` for async initialization, `update` for logic, `render` for visual (rarely override directly)
- Apply mixins strategically: `TapCallbacks`, `DraggableCallbacks`, `HasGameRef`, `KeyboardHandler`

#### State Management
- Use Flame's `FlameGame` state machine with `changeState` for game states (loading, running, paused, gameOver)
- Integrate with Flutter state management (Riverpod/Bloc/Provider) for UI-game cross-cutting concerns via `GameWidget` constructor
- Implement save/load systems using Hive or SharedPreferences with proper serialization
- Cache game state with HydratedCedar for offline persistence

---

### Performance Optimization

#### Rendering
- Use `SpriteBatch` for static sprites and tilemaps (thousands of objects)
- Implement `FpsComponent` for monitoring and adaptive frame rates on low-end devices
- Set `Anchor` appropriately to optimize transform calculations
- Leverage `SpriteAnimationComponent` with pre-cached animations and `SpriteAnimationSheet`
- Configure viewport and camera with `CameraComponent` - use `FixedResolutionViewport` for pixel-perfect games
- Implement object pooling with Component recycling for bullets, particles, enemies

#### Memory Management
- Implement asset pooling for frequently spawned objects
- Use `Flame.images.load` with proper disposal in `onRemove` to prevent memory leaks
- Pre-load assets with loading screens using `Future.wait` and progress tracking
- Implement texture atlases via `SpriteSheet` for memory-efficient animations
- Use `ImageComposition` for runtime sprite composition

---

### Physics & Collision
- Use Forge2D for realistic physics (Box2D implementation) - extends `Forge2DGame`
- Implement custom collision detection with `CollisionDetectionSystem` or `HasCollisionDetection` mixin
- Use `ShapeHitbox` (rectangle, circle, polygon) for precise collision detection with proper positioning
- Handle collision callbacks with `CollisionCallbacks` mixin (`onCollisionStart`, `onCollision`, `onCollisionEnd`)
- Implement spatial partitioning via QuadTree for performance with many objects

---

### Advanced Features

#### Particle Systems
- Use `ParticleSystemComponent` for visual effects (explosions, magic, weather)
- Implement custom particles with `ComputedParticle`, `TranslatedParticle`, `AcceleratedParticle`
- Create behavior-driven particle emitters with Behavior pattern
- Optimize with particle pooling and LOD (Level of Detail) system

#### Audio Management
- Use `AudioPool` for sound effect pooling to prevent latency
- Implement dynamic audio mixing based on game state (combat, exploration, menu)
- Use bgm and sfx volume controls with user preferences persistence
- Pre-load audio assets with `FlameAudio.bgm.initialize` and `FlameAudio.audioCache.loadAll`

#### Input Handling
- Implement gesture detection (tap, double-tap, long-press, drag, pinch, rotate)
- Use gesture arena conflict resolution with `GestureDetector` wrapper when needed
- Support multiple input sources: touch, mouse, keyboard, gamepad (via `flame_gamepad`)
- Implement input buffering for fighting/action games with command pattern
- Use `PositionComponent`'s `containsLocalPoint` for custom hit testing

#### Camera & Viewport
- Configure `CameraComponent` with `Viewport` and `Viewfinder`
- Implement camera follow behaviors: `Camera.followComponent` with smooth interpolation
- Use world coordinates vs screen coordinates correctly - convert via `camera.localToGlobal`
- Implement shake effects, zoom constraints, and boundaries
- Support multiple viewports for split-screen multiplayer

---

### Production Patterns

#### Asset Management
- Organize assets by type: `assets/images/`, `assets/audio/`, `assets/tiles/`, `assets/fonts/`
- Use `assets.g.dart` with `flutter_gen` for type-safe asset references
- Implement responsive asset loading with resolution-specific assets (1x, 2x, 3x)
- Use spritesheets and texture atlases via `SpriteSheet` and json animation data
- Configure `pubspec.yaml` properly with asset variants for platforms

#### Loading & Initialization
- Implement splash/loading screens with progress indicators
- Use `FutureBuilder` or custom `LoadingScreen` widget with `GameWidget.controlled`
- Show loading progress per asset category
- Implement fallback assets for failed loads

#### Testing
- Write widget tests for UI components using `WidgetTester`
- Use `FlameTester` for game component and game loop testing
- Implement integration tests for full game flows
- Mock Flame components with `MockComponent`, `MockGame`, `MockImage`
- Test collision detection with precise hitbox positioning

#### Debugging & Tools
- Use `Flame.util.addVisibilityExtension()` for debug visualizations
- Implement `DevConsole` with runtime parameter adjustments (speed, god mode, noclip)
- Add collision box visualizers with `debugMode = true` on components
- Use performance overlay and frame time monitoring via `FpsComponent`
- Implement FPSCounter widget overlay for production monitoring opt-in

---

### Project Structure
    lib/
    ├── game/
    │ ├── components/ # Reusable game components (health bars, buttons, particles)
    │ ├── entities/ # Player, enemies, NPCs, power-ups
    │ ├── levels/ # Level definitions, tilemaps, wave managers
    │ ├── systems/ # ECS systems (collision, spawn, AI, physics)
    │ ├── worlds/ # Game world variants (overworld, dungeon, menu)
    │ └── game.dart # Main FlameGame extension
    ├── screens/ # Flutter UI screens (title, settings, level select)
    ├── models/ # Data models (player stats, inventory, achievements)
    ├── services/ # Audio, storage, ads, analytics, multiplayer
    ├── utils/ # Helpers, extensions, constants
    └── main.dart # App entry point with GameWidget


---

### When to use this skill
- Building production-ready 2D mobile/desktop/web games with Flutter + Flame
- Implementing complex game mechanics, physics systems, or custom rendering pipelines
- Optimizing game performance for 60fps on low-end devices with memory constraints
- Architecting scalable game codebases for long-term maintenance and team collaboration
- Debugging performance issues, memory leaks, or rendering artifacts in Flame games
- Implementing platform-specific features (achievements, leaderboards, IAP, cloud saves)
- Porting existing games to Flutter/Flame with parity in features and performance
- Building games that require precise input handling (fighting, platformers, shooters)

---

### How to use it
- **Foundation**: Start with `GameWidget` and extend `FlameGame`; configure World and Camera early
- **Assets**: Pre-load all assets with loading screen showing progress percentage
- **Architecture**: Break down game entities into components (FCS) - one responsibility per component
- **Camera**: Configure camera/viewport BEFORE placing world objects to avoid coordinate confusion
- **Collision**: Implement collision detection early, test with `debugMode` visualizers
- **Physics**: Add Forge2D only if needed; use custom collision for simpler games
- **Input**: Add input handling progressively; test on target devices (touch vs mouse)
- **Optimization**: Profile regularly using Flutter DevTools and Flame overlays; fix bottlenecks early
- **Testing**: Test on minimum-spec devices early; implement integration tests for critical paths
- **Polish**: Add particles, screenshake, audio feedback, and transitions last

---

### Reference Skills Required

#### Flutter Core (Expert)
- Strong Dart knowledge: async/await, isolates/Compute, streams, extensions, generics
- Widget lifecycle and rendering pipeline (build, layout, paint)
- Platform channels for native integrations (IAP, ads, game services)
- State management (Riverpod/Bloc/Provider) with proper separation from game logic
- Custom painters and `RenderObject` for advanced effects

#### Game Development Concepts (Senior)
- Vector math and coordinate systems (world vs local vs screen)
- Delta time and frame-independent movement (always use `dt` in `update`)
- Game loop patterns (fixed timestep vs variable, update vs render separation)
- Spatial partitioning for collision optimization (quadtree, grid)
- ECS (Entity-Component-System) architecture principles
- Interpolation and easing functions for smooth motion

#### Graphics & Animation
- Sprite atlases and batching for draw call optimization
- Shader basics for custom effects (`FragmentShader`, `ImageShader`)
- Spine/Rive/Lottie for complex cutscenes and UI animations
- Tilemap integration with Tiled (`flame_tiled`) and infinite procedurally generated maps
- Parallax backgrounds with multiple layers
- 9-patch scaling for UI elements

#### Mathematics
- Trigonometry for angles, trajectories, circular motion
- Interpolation (lerp, slerp, spline) for smooth transitions and camera follow
- Quaternions for 3D rotations (when using Forge2D with 3D-like physics)
- Probability distributions and randomness for game balance (weighted random, noise functions)
- Bezier curves for path finding and projectile motion

#### Platform-Specific (Production)
- In-app purchases setup per platform (StoreKit, Google Play Billing)
- AdMob/AdSense/AdColony integration patterns (banner, interstitial, rewarded)
- Game Center/Google Play Games Services (achievements, leaderboards, saved games)
- Push notifications for engagement and retention
- Deep linking and app clips for viral mechanics

#### Tooling & Workflow
- Git LFS for large binary assets (sprites, audio, tilemaps)
- CI/CD for mobile builds (Codemagic, GitHub Actions, Bitrise)
- Firebase Crashlytics + Analytics integration
- A/B testing frameworks (Firebase Remote Config, Optimizely)
- Unity/Blender/Spine export pipelines to Flutter formats (.png sequences, .json, .fnt)
- Versioning strategy for game saves and asset updates

#### Advanced Flame-Specific
- Custom components extending `PositionComponent` for specialized behavior
- Effect system (`MoveEffect`, `ScaleEffect`, `SequenceEffect`) for declarative animations
- `TimerComponent` and `IntervalTimer` for timed events
- `SpawnComponent` for wave-based enemy generation
- `JoystickComponent` for mobile controls
- `NineTileBoxComponent` for scalable UI panels
- `ParallaxComponent` for infinite backgrounds

#### Multiplayer & Networking
- **Nakama**: Open-source game server integration (realtime, matchmaking, leaderboards)
- **Firebase**: Firestore for state sync, Realtime Database for low-latency updates
- **Supabase**: PostgreSQL-based alternative with realtime subscriptions
- **WebSockets**: Custom socket implementation for deterministic lockstep games
- State reconciliation and client-side prediction techniques

---

### When NOT to use this skill
- Building simple UI animations or non-game interactive experiences (use standard Flutter)
- Prototyping game ideas without performance requirements (simpler setup is faster)
- 3D games beyond simple 2.5D (consider Unity/Godot for full 3D)
- Projects where web bundle size is critical (Flame adds overhead)
- Teams unfamiliar with Dart/Flutter (learning curve investment required)

---

*This skill treats you as a senior architect, not just an implementer - always consider scalability, maintainability, and player experience first. Challenge requirements that don't serve the core gameplay loop, and advocate for technical decisions that prevent technical debt in the animation/render pipeline.*