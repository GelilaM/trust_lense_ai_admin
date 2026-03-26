# flame-getting-started-reference

Core reference for Flame engine fundamentals, installation, and basic component patterns. Use when establishing foundation knowledge or onboarding to Flame basics.

---

## Flame Getting Started Reference

### Installation & Setup

#### Package Installation
```bash
flutter pub add flame
flutter pub get

```
#### Pubspec.yaml Configuration

dependencies:
  flame: ^1.17.0  # Use latest version
  flutter:
    sdk: flutter

flutter:
  assets:
    - assets/images/
    - assets/audio/
    - assets/tiles/

Core Concepts
GameWidget - The Entry Point
dart
import 'package:flame/game.dart';
import 'package:flutter/material.dart';

void main() {
  runApp(
    GameWidget(
      game: FlameGame(),  // Minimal game instance
    ),
  );
}
FlameGame & World Architecture
dart
// Proper separation of concerns
class MyGame extends FlameGame {
  @override
  Future<void> onLoad() async {
    // Game-level initialization
    world = MyWorld();  // Custom world
    camera.viewport = FixedResolutionViewport(...);
  }
}

class MyWorld extends World {
  @override
  Future<void> onLoad() async {
    // Add game objects to the world
    await add(Player());
  }
}
Component Lifecycle
dart
class MyComponent extends PositionComponent {
  @override
  Future<void> onLoad() async {
    // Async initialization - load sprites, sounds
    // Called once when added to parent
  }
  
  @override
  void onMount() {
    // Synchronous setup after onLoad
    // Parent and game reference available
  }
  
  @override
  void update(double dt) {
    // Frame-by-frame logic (60 times per second)
    // dt = delta time in seconds
  }
  
  @override
  void render(Canvas canvas) {
    // Custom rendering (rarely needed)
    // Prefer using SpriteComponent, etc.
  }
  
  @override
  void onRemove() {
    // Cleanup - dispose resources
  }
}
Basic Component Types
SpriteComponent
dart
class Player extends SpriteComponent {
  Player({Vector2? position}) : super(
    size: Vector2.all(100),
    anchor: Anchor.center,
  ) {
    this.position = position ?? Vector2.zero();
  }

  @override
  Future<void> onLoad() async {
    sprite = await Sprite.load('player.png');
    // Asset must be in assets/images/
  }
}
SpriteAnimationComponent
dart
class AnimatedPlayer extends SpriteAnimationComponent {
  @override
  Future<void> onLoad() async {
    final spriteSheet = SpriteSheet(
      image: await images.load('player_sheet.png'),
      srcSize: Vector2.all(64),  // Frame size
    );
    
    animation = spriteSheet.createAnimation(
      row: 0,  // First row
      stepTime: 0.1,  // Seconds per frame
      from: 0,
      to: 5,  // 6 frames total
    );
    
    size = Vector2.all(64);
    anchor = Anchor.center;
  }
}
Input Handling with Mixins
TapCallbacks
dart
class TappablePlayer extends SpriteComponent with TapCallbacks {
  @override
  void onTapDown(TapDownEvent event) {
    // Finger touched within component bounds
    scale = Vector2.all(0.9);  // Squish effect
  }
  
  @override
  void onTapUp(TapUpEvent event) {
    // Finger lifted within component bounds
    scale = Vector2.all(1.0);  // Reset
    // Trigger action - jump, shoot, interact
  }
  
  @override
  void onTapCancel(TapCancelEvent event) {
    // Finger moved outside bounds
    scale = Vector2.all(1.0);  // Reset without action
  }
}
DraggableCallbacks
dart
class DraggablePiece extends SpriteComponent with DraggableCallbacks {
  @override
  void onDragStart(DragStartEvent event) {
    // Begin drag
    position = event.canvasPosition;
  }
  
  @override
  void onDragUpdate(DragUpdateEvent event) {
    // Move with finger
    position += event.delta;
  }
}
HasGameRef - Access Parent Game
dart
class Enemy extends SpriteComponent with HasGameRef<MyGame> {
  @override
  void update(double dt) {
    // Access game instance
    if (gameRef.world.children.query<Player>().isNotEmpty) {
      // Chase player
    }
  }
}
Asset Directory Structure
text
project_root/
├── assets/
│   ├── images/
│   │   ├── player.png
│   │   ├── enemy.png
│   │   ├── tiles/        # Tilemap tiles
│   │   └── ui/           # Buttons, panels
│   ├── audio/
│   │   ├── sfx/          # Sound effects
│   │   └── bgm/          # Background music
│   ├── tiles/            # Tiled map files
│   └── fonts/           # Custom fonts
└── pubspec.yaml
Common Pitfalls to Avoid
❌ Wrong

dart
// Don't block the game loop with heavy operations
@override
void update(double dt) {
  for(var i = 0; i < 10000; i++) { /* heavy computation */ }
}

// Don't load assets every frame
@override
void render(Canvas canvas) async {
  sprite = await Sprite.load('player.png');  // NO!
}
✅ Correct

dart
// Preload in onLoad
@override
Future<void> onLoad() async {
  sprite = await Sprite.load('player.png');
}

// Cache frequently used sprites
class GameAssets {
  static late Sprite playerSprite;
  static late Sprite enemySprite;
}
Simple Complete Example
dart
import 'package:flame/game.dart';
import 'package:flame/components.dart';
import 'package:flame/input.dart';
import 'package:flutter/material.dart';

void main() {
  runApp(
    GameWidget(
      game: MyGame(),
    ),
  );
}

class MyGame extends FlameGame {
  @override
  Future<void> onLoad() async {
    world = GameWorld();
  }
}

class GameWorld extends World {
  @override
  Future<void> onLoad() async {
    await add(Player(position: Vector2(100, 100)));
  }
}

class Player extends SpriteComponent with TapCallbacks {
  Player({required Vector2 position}) : super(
    size: Vector2.all(80),
    anchor: Anchor.center,
  ) {
    this.position = position;
  }

  @override
  Future<void> onLoad() async {
    sprite = await Sprite.load('player.png');
  }
  
  @override
  void onTapUp(TapUpEvent event) {
    position += Vector2(10, 0);  // Move right on tap
  }
}
When to Use This Reference
First-time Flame users: Understanding basic setup and component lifecycle

Code reviews: Verifying proper Flame patterns and anti-patterns

Debugging: Confirming correct onLoad/update/render usage

Onboarding: Teaching new team members Flame fundamentals

Architecture decisions: Determining when to extend World vs FlameGame

Asset management: Setting up proper asset directory structure