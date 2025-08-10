# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

This is a static web application with no build process:
- **Run locally**: Open `index.html` directly in a web browser
- **Deploy**: Copy all files (index.html, game.js, styles.css) to any web server
- **No dependencies**: No npm, yarn, or package managers needed

## Architecture Overview

Battle Pong is a browser-based multiplayer/AI game built with vanilla JavaScript and HTML5 Canvas. The architecture follows an object-oriented design with clear separation of concerns.

### Core Game Loop Architecture
The game uses a standard `requestAnimationFrame` loop managed by the Game class (game.js:343-612). Game state flows through:
1. **Menu State**: Title screen → Mode selection (2P/AI) → Difficulty selection (AI only)
2. **Game State**: Active gameplay with update/render loop
3. **Game Over State**: Winner display → Return to menu

### Key Architectural Patterns

**Entity System**: All game objects (Paddle, Ball, Projectile) extend from base classes with standard update/draw methods. The Game class orchestrates all entities.

**AI Decision Tree**: The AI class (game.js:208-341) implements a sophisticated behavior system that scales with difficulty:
- Levels affect reaction time, accuracy, prediction depth, and decision-making
- AI makes strategic decisions about dodging, shooting, and positioning based on game state

**Collision System**: Centralized in Game class, handles:
- Ball-paddle collisions (scoring)
- Projectile-ball collisions (deflection + speed increase)
- Projectile-paddle collisions (immobilization)

**Input Handling**: Event-driven system with keyboard controls mapped to player actions. The Game class processes inputs and delegates to appropriate entities.

### Critical Game Mechanics

**Immobilization System**: When a paddle is hit by an opponent's projectile, it's immobilized for 2 seconds. This creates strategic depth as players must balance offense/defense.

**Ball Physics**: The ball increases speed on each projectile hit and randomizes direction, creating escalating tension. Wall bounces preserve momentum while inverting velocity.

**Projectile Behavior**: Projectiles can either immobilize opponents OR deflect the ball (but not both in one shot), forcing tactical decisions.

## Key Implementation Details

- Canvas dimensions: 1200x600 pixels (game.js:350)
- Game runs at 60 FPS via requestAnimationFrame
- Player 1 controls: WASD + Q (shoot)
- Player 2 controls: Arrow keys + Left Arrow (shoot)
- AI difficulty parameters scale exponentially from levels 1-10
- Visual effects use canvas gradients and globalAlpha for glow/trail effects