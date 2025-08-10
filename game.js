const titleScreen = document.getElementById('titleScreen');
const difficultyScreen = document.getElementById('difficultyScreen');
const gameContainer = document.getElementById('gameContainer');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const statusMessage = document.getElementById('statusMessage');
const score1Element = document.getElementById('score1');
const score2Element = document.getElementById('score2');
const player2Name = document.getElementById('player2Name');
const player2Controls = document.getElementById('player2Controls');
const hitValue = document.getElementById('hitValue');
const hitBarFill = document.getElementById('hitBarFill');
const musicToggle = document.getElementById('musicToggle');
const sfxToggle = document.getElementById('sfxToggle');

const twoPlayerBtn = document.getElementById('twoPlayerBtn');
const aiPlayerBtn = document.getElementById('aiPlayerBtn');
const backBtn = document.getElementById('backBtn');
const menuBtn = document.getElementById('menuBtn');
const difficultyButtons = document.querySelectorAll('.difficulty-button');

canvas.width = 1200;
canvas.height = 600;

const PADDLE_WIDTH = 20;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 15;
const PROJECTILE_SIZE = 10;
const PADDLE_SPEED = 7;
const PROJECTILE_SPEED = 6;
const INITIAL_BALL_SPEED = 6;
const BALL_SPEED_INCREMENT = 0.75;
const IMMOBILIZE_DURATION = 2000;
const PROJECTILE_COOLDOWN = 500;
const WIN_SCORE = 5;

class Paddle {
    constructor(x, y, color, controls) {
        this.x = x;
        this.y = y;
        this.width = PADDLE_WIDTH;
        this.height = PADDLE_HEIGHT;
        this.color = color;
        this.controls = controls;
        this.dy = 0;
        this.immobilized = false;
        this.immobilizeTimer = 0;
    }

    update() {
        if (!this.immobilized) {
            this.y += this.dy * PADDLE_SPEED;
            this.y = Math.max(0, Math.min(canvas.height - this.height, this.y));
        } else {
            if (Date.now() - this.immobilizeTimer > IMMOBILIZE_DURATION) {
                this.immobilized = false;
            }
        }
    }

    draw(isFlashing = false, flashTimer = 0) {
        if (isFlashing) {
            // Cycle through colors for retro flash effect
            const colors = ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#ff00ff', '#ffffff'];
            const colorIndex = Math.floor(flashTimer / 10) % colors.length;
            ctx.fillStyle = colors[colorIndex];
        } else {
            ctx.fillStyle = this.immobilized ? '#808080' : this.color;
        }
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        if (this.immobilized) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);
        }
    }

    immobilize() {
        this.immobilized = true;
        this.immobilizeTimer = Date.now();
    }

    shoot() {
        if (!this.immobilized) {
            return true;
        }
        return false;
    }
}

class Ball {
    constructor() {
        this.reset();
    }

    reset(towardsPlayer2 = Math.random() > 0.5) {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.size = BALL_SIZE;
        this.speed = INITIAL_BALL_SPEED;
        const angle = (Math.random() - 0.5) * Math.PI / 4;
        this.dx = Math.cos(angle) * this.speed * (towardsPlayer2 ? 1 : -1);
        this.dy = Math.sin(angle) * this.speed;
        this.trail = [];
        this.hitCount = 0;
        this.flashEffect = 0;
        this.maxHits = 10;
    }

    update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 10) {
            this.trail.shift();
        }

        this.x += this.dx;
        this.y += this.dy;

        // Bounce off top and bottom walls
        if (this.y - this.size <= 0 || this.y + this.size >= canvas.height) {
            this.dy = -this.dy;
            this.y = this.y - this.size <= 0 ? this.size : canvas.height - this.size;
        }

        // Bounce off left and right walls
        if (this.x - this.size <= 0 || this.x + this.size >= canvas.width) {
            this.dx = -this.dx;
            this.x = this.x - this.size <= 0 ? this.size : canvas.width - this.size;
        }
    }

    draw() {
        // Simple trail
        this.trail.forEach((point, index) => {
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = index / this.trail.length * 0.3;
            ctx.fillRect(point.x - this.size/2, point.y - this.size/2, this.size, this.size);
        });
        ctx.globalAlpha = 1;

        // Flash effect
        if (this.flashEffect > 0) {
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(this.x - this.size * 1.5, this.y - this.size * 1.5, this.size * 3, this.size * 3);
            this.flashEffect -= 0.1;
        }
        
        // Draw square ball with color based on hits
        const intensity = Math.min(this.hitCount / this.maxHits, 1);
        if (intensity > 0.66) {
            ctx.fillStyle = '#ff0000';
        } else if (intensity > 0.33) {
            ctx.fillStyle = '#ffff00';
        } else {
            ctx.fillStyle = '#ffffff';
        }
        ctx.fillRect(this.x - this.size, this.y - this.size, this.size * 2, this.size * 2);
    }

    randomizeDirection(shooterOwner = null) {
        // Generate angle avoiding too vertical (near 90° or 270°)
        const minHorizontalAngle = Math.PI / 6; // 30 degrees from vertical
        const maxVerticalAngle = Math.PI / 3; // 60 degrees spread
        let angle;
        
        if (shooterOwner === 'player1') {
            // Ball should move toward player 2 (right)
            // Random angle between 30° and -30° (right side)
            angle = (Math.random() - 0.5) * maxVerticalAngle;
        } else if (shooterOwner === 'player2') {
            // Ball should move toward player 1 (left)
            // Random angle between 150° and 210° (left side)
            angle = Math.PI + (Math.random() - 0.5) * maxVerticalAngle;
        } else {
            // No shooter specified, use original random behavior
            const quadrant = Math.floor(Math.random() * 4);
            switch(quadrant) {
                case 0: // Top-right
                    angle = Math.random() * (Math.PI/2 - 2*minHorizontalAngle) + minHorizontalAngle;
                    break;
                case 1: // Top-left
                    angle = Math.random() * (Math.PI/2 - 2*minHorizontalAngle) + Math.PI/2 + minHorizontalAngle;
                    break;
                case 2: // Bottom-left
                    angle = Math.random() * (Math.PI/2 - 2*minHorizontalAngle) + Math.PI + minHorizontalAngle;
                    break;
                case 3: // Bottom-right
                    angle = Math.random() * (Math.PI/2 - 2*minHorizontalAngle) + 3*Math.PI/2 + minHorizontalAngle;
                    break;
            }
        }
        
        if (this.hitCount < this.maxHits) {
            this.hitCount++;
            this.flashEffect = 1.0;
            this.speed = Math.min(this.speed + BALL_SPEED_INCREMENT, INITIAL_BALL_SPEED * 3);
            this.dx = Math.cos(angle) * this.speed;
            this.dy = Math.sin(angle) * this.speed;
        } else {
            // Max hits reached, just randomize direction without speed increase
            this.flashEffect = 0.5;
            const currentSpeed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
            this.dx = Math.cos(angle) * currentSpeed;
            this.dy = Math.sin(angle) * currentSpeed;
        }
    }

    checkPaddleCollision(paddle) {
        if (this.x - this.size <= paddle.x + paddle.width &&
            this.x + this.size >= paddle.x &&
            this.y - this.size <= paddle.y + paddle.height &&
            this.y + this.size >= paddle.y) {
            return true;
        }
        return false;
    }
}

class Projectile {
    constructor(x, y, direction, color, owner) {
        this.x = x;
        this.y = y;
        this.size = PROJECTILE_SIZE;
        this.dx = direction * PROJECTILE_SPEED;
        this.color = color;
        this.active = true;
        this.owner = owner;
    }

    update() {
        this.x += this.dx;
        
        if (this.x < 0 || this.x > canvas.width) {
            this.active = false;
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.size, this.y - this.size, this.size * 2, this.size * 2);
    }

    checkBallCollision(ball) {
        const dist = Math.sqrt(Math.pow(this.x - ball.x, 2) + Math.pow(this.y - ball.y, 2));
        return dist < this.size + ball.size;
    }

    checkPaddleCollision(paddle) {
        return this.x - this.size <= paddle.x + paddle.width &&
               this.x + this.size >= paddle.x &&
               this.y - this.size <= paddle.y + paddle.height &&
               this.y + this.size >= paddle.y;
    }
}

class AI {
    constructor(paddle, difficulty) {
        this.paddle = paddle;
        this.difficulty = difficulty;
        
        // More dramatic difficulty scaling
        const difficultySettings = {
            1: { reaction: 800, accuracy: 0.15, shoot: 0.002, dodge: 0.0, prediction: 0.1, moveSpeed: 0.3 },
            2: { reaction: 600, accuracy: 0.25, shoot: 0.004, dodge: 0.05, prediction: 0.2, moveSpeed: 0.4 },
            3: { reaction: 450, accuracy: 0.35, shoot: 0.006, dodge: 0.1, prediction: 0.3, moveSpeed: 0.5 },
            4: { reaction: 350, accuracy: 0.45, shoot: 0.008, dodge: 0.2, prediction: 0.4, moveSpeed: 0.6 },
            5: { reaction: 250, accuracy: 0.55, shoot: 0.012, dodge: 0.35, prediction: 0.5, moveSpeed: 0.7 },
            6: { reaction: 180, accuracy: 0.65, shoot: 0.018, dodge: 0.5, prediction: 0.6, moveSpeed: 0.8 },
            7: { reaction: 120, accuracy: 0.75, shoot: 0.025, dodge: 0.65, prediction: 0.7, moveSpeed: 0.9 },
            8: { reaction: 80, accuracy: 0.85, shoot: 0.035, dodge: 0.8, prediction: 0.8, moveSpeed: 1.0 },
            9: { reaction: 40, accuracy: 0.92, shoot: 0.045, dodge: 0.9, prediction: 0.9, moveSpeed: 1.1 },
            10: { reaction: 10, accuracy: 0.98, shoot: 0.06, dodge: 0.98, prediction: 0.98, moveSpeed: 1.2 }
        };
        
        const settings = difficultySettings[difficulty];
        this.reactionTime = settings.reaction;
        this.accuracy = settings.accuracy;
        this.shootProbability = settings.shoot;
        this.dodgeAbility = settings.dodge;
        this.predictionAbility = settings.prediction;
        this.moveSpeedMultiplier = settings.moveSpeed;
        this.lastDecision = Date.now();
        this.targetY = paddle.y;
    }

    update(ball, projectiles, opponentPaddle) {
        const now = Date.now();
        
        if (now - this.lastDecision > this.reactionTime) {
            this.lastDecision = now;
            
            const incomingProjectile = projectiles.find(p => 
                p.owner === 'player1' && 
                p.dx > 0 && 
                p.x < this.paddle.x
            );
            
            // Priority 1: Dodge incoming projectiles
            if (incomingProjectile && Math.random() < this.dodgeAbility) {
                const projFutureY = incomingProjectile.y;
                const dodgeDistance = 40 + (this.difficulty * 5);
                
                if (projFutureY < this.paddle.y + this.paddle.height / 2) {
                    this.targetY = Math.min(canvas.height - this.paddle.height, this.paddle.y + dodgeDistance);
                } else {
                    this.targetY = Math.max(0, this.paddle.y - dodgeDistance);
                }
            } 
            // Priority 2: Avoid the ball
            else if (ball.dx > 0 && ball.x > canvas.width * (0.5 - this.predictionAbility * 0.3)) {
                // Predict where ball will be when it reaches paddle
                const timeToPaddle = (this.paddle.x - ball.x) / Math.abs(ball.dx);
                const predictedY = ball.y + (ball.dy * timeToPaddle * this.predictionAbility);
                
                const ballFutureY = Math.random() < this.predictionAbility ? predictedY : ball.y;
                const dangerZone = this.paddle.height * (0.8 - this.accuracy * 0.6);
                
                // Check if ball is heading toward paddle
                const ballInDangerZone = ballFutureY >= this.paddle.y - 10 && 
                                        ballFutureY <= this.paddle.y + this.paddle.height + 10;
                
                if (ballInDangerZone) {
                    // AI tries to avoid the ball based on difficulty
                    if (Math.random() < this.accuracy) {
                        // Smart avoidance: move to opposite side of where ball is heading
                        if (ballFutureY < this.paddle.y + this.paddle.height / 2) {
                            this.targetY = Math.min(canvas.height - this.paddle.height, ballFutureY + this.paddle.height + 20);
                        } else {
                            this.targetY = Math.max(0, ballFutureY - this.paddle.height - 20);
                        }
                    } else {
                        // Panic move (less accurate)
                        this.targetY = Math.random() < 0.5 ? 0 : canvas.height - this.paddle.height;
                    }
                } else {
                    // Position strategically when ball is safe
                    const centerY = canvas.height / 2 - this.paddle.height / 2;
                    const optimalY = ballFutureY < canvas.height / 2 ? 
                                   canvas.height * 0.75 - this.paddle.height / 2 : 
                                   canvas.height * 0.25 - this.paddle.height / 2;
                    
                    this.targetY = Math.random() < this.accuracy ? optimalY : centerY;
                }
            } else {
                // Default positioning when ball is far away
                this.targetY = canvas.height / 2 - this.paddle.height / 2;
            }
            
            // Add error based on difficulty (less error at higher difficulties)
            const maxError = 100 * (1 - this.accuracy);
            const error = (Math.random() - 0.5) * maxError;
            this.targetY += error;
            
            // Clamp target position
            this.targetY = Math.max(0, Math.min(canvas.height - this.paddle.height, this.targetY));
        }
        
        // Movement execution with speed multiplier
        const diff = this.targetY - this.paddle.y;
        const moveThreshold = 5 / this.moveSpeedMultiplier;
        
        if (Math.abs(diff) > moveThreshold) {
            // Apply movement speed multiplier (slower at low difficulties)
            const moveSpeed = Math.sign(diff) * this.moveSpeedMultiplier;
            this.paddle.dy = moveSpeed;
        } else {
            this.paddle.dy = 0;
        }
        
        // Shooting logic - more strategic at higher difficulties
        const player2HasProjectile = projectiles.some(p => p.owner === 'player2' && p.active);
        if (!player2HasProjectile && Math.random() < this.shootProbability) {
            // Smarter shooting at higher difficulties
            const tacticalShoot = this.difficulty >= 5 && (
                (ball.dx < 0 && ball.x < canvas.width * 0.5) || // Ball coming toward opponent
                (Math.abs(ball.y - opponentPaddle.y - opponentPaddle.height/2) < 50) || // Ball near opponent
                (opponentPaddle.immobilized === false && Math.random() < this.accuracy * 0.5) // Strategic immobilization
            );
            
            const randomShoot = Math.random() < this.shootProbability;
            
            if (tacticalShoot || randomShoot) {
                return true;
            }
        }
        
        return false;
    }
}

class Game {
    constructor() {
        this.player1 = new Paddle(40, canvas.height / 2 - PADDLE_HEIGHT / 2, '#00ffff', {
            up: 'KeyW',
            down: 'KeyS',
            shoot: 'KeyD'
        });
        
        this.player2 = new Paddle(canvas.width - 40 - PADDLE_WIDTH, canvas.height / 2 - PADDLE_HEIGHT / 2, '#ff00ff', {
            up: 'ArrowUp',
            down: 'ArrowDown',
            shoot: 'ArrowLeft'
        });
        
        this.ball = new Ball();
        this.projectiles = [];
        this.score1 = 0;
        this.score2 = 0;
        this.gameState = 'menu';
        this.gameMode = null;
        this.aiDifficulty = 5;
        this.ai = null;
        this.keys = {};
        this.isPaused = false;
        this.countdownTimer = 0;
        this.countdownValue = 0;
        this.freezeTimer = 0;
        this.flashingPaddle = null; // 'player1' or 'player2'
        this.lastScorer = null; // Track who scored last
        this.lastShootTime = { player1: 0, player2: 0 }; // Track last shoot time for cooldown
        this.victoryAnimation = null; // Victory animation state
        this.victoryParticles = []; // Particles for victory effect
        this.finalScoreWinner = null; // Track winner for transition state
        
        this.setupEventListeners();
        this.setupMenuListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            // Handle pause
            if ((e.code === 'KeyP' || e.code === 'Escape') && this.gameState === 'playing') {
                this.togglePause();
                return;
            }
            
            this.keys[e.code] = true;
            
            if (e.code === 'Space') {
                if (this.gameState === 'waiting') {
                    this.start();
                } else if (this.gameState === 'ended') {
                    this.reset();
                    this.gameState = 'waiting';
                    statusMessage.textContent = 'Press SPACE to start!';
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    setupMenuListeners() {
        twoPlayerBtn.addEventListener('click', () => {
            this.gameMode = 'twoPlayer';
            this.showGameScreen();
            player2Name.textContent = 'Player 2';
            player2Controls.textContent = '↑/↓ • ←';
        });

        aiPlayerBtn.addEventListener('click', () => {
            this.gameMode = 'ai';
            this.showDifficultyScreen();
        });

        backBtn.addEventListener('click', () => {
            this.showTitleScreen();
        });

        menuBtn.addEventListener('click', () => {
            this.gameState = 'menu';
            arcadeAudio.stopMusic();
            this.showTitleScreen();
        });

        difficultyButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.aiDifficulty = parseInt(button.dataset.level);
                this.gameMode = 'ai';
                this.ai = new AI(this.player2, this.aiDifficulty);
                this.showGameScreen();
                player2Name.textContent = `AI (Lvl ${this.aiDifficulty})`;
                player2Controls.textContent = 'AI Controlled';
            });
        });
    }

    showTitleScreen() {
        titleScreen.style.display = 'flex';
        difficultyScreen.style.display = 'none';
        gameContainer.style.display = 'none';
    }

    showDifficultyScreen() {
        titleScreen.style.display = 'none';
        difficultyScreen.style.display = 'flex';
        gameContainer.style.display = 'none';
    }

    showGameScreen() {
        titleScreen.style.display = 'none';
        difficultyScreen.style.display = 'none';
        gameContainer.style.display = 'flex';
        this.gameState = 'waiting';
        this.reset();
    }

    reset() {
        this.score1 = 0;
        this.score2 = 0;
        this.ball.reset();
        this.projectiles = [];
        this.player1.y = canvas.height / 2 - PADDLE_HEIGHT / 2;
        this.player2.y = canvas.height / 2 - PADDLE_HEIGHT / 2;
        this.player1.immobilized = false;
        this.player2.immobilized = false;
        this.victoryAnimation = null;
        this.victoryParticles = [];
        statusMessage.textContent = 'Press SPACE to start!';
        this.updateScore();
        this.updateHitCounter();
    }

    start() {
        this.gameState = 'playing';
        this.ball.reset();
        this.projectiles = [];
        statusMessage.textContent = '';
        arcadeAudio.playGameStartSound();
        arcadeAudio.startMusic();
    }

    handleInput(countdownMode = false) {
        this.player1.dy = 0;
        
        if (this.gameMode === 'twoPlayer') {
            this.player2.dy = 0;
            if (this.keys[this.player2.controls.up]) this.player2.dy = -1;
            if (this.keys[this.player2.controls.down]) this.player2.dy = 1;
            
            // No shooting during countdown
            if (!countdownMode && this.keys[this.player2.controls.shoot]) {
                const now = Date.now();
                const player2HasProjectile = this.projectiles.some(p => p.owner === 'player2' && p.active);
                // Add cooldown check to prevent immediate re-firing
                if (!player2HasProjectile && this.player2.shoot() && now - this.lastShootTime.player2 >= PROJECTILE_COOLDOWN) {
                    this.projectiles.push(new Projectile(
                        this.player2.x,
                        this.player2.y + this.player2.height / 2,
                        -1,
                        this.player2.color,
                        'player2'
                    ));
                    this.lastShootTime.player2 = now;
                    arcadeAudio.playShootSound();
                }
            }
        }
        
        if (this.keys[this.player1.controls.up]) this.player1.dy = -1;
        if (this.keys[this.player1.controls.down]) this.player1.dy = 1;
        
        // No shooting during countdown
        if (!countdownMode && this.keys[this.player1.controls.shoot]) {
            const now = Date.now();
            const player1HasProjectile = this.projectiles.some(p => p.owner === 'player1' && p.active);
            // Add cooldown check to prevent immediate re-firing
            if (!player1HasProjectile && this.player1.shoot() && now - this.lastShootTime.player1 >= PROJECTILE_COOLDOWN) {
                this.projectiles.push(new Projectile(
                    this.player1.x + this.player1.width,
                    this.player1.y + this.player1.height / 2,
                    1,
                    this.player1.color,
                    'player1'
                ));
                this.lastShootTime.player1 = now;
                arcadeAudio.playShootSound();
            }
        }
    }

    update() {
        if ((this.gameState !== 'playing' && this.gameState !== 'showing_final_score') || this.isPaused) return;
        
        // If showing final score, just decrement freeze timer but don't update game
        if (this.gameState === 'showing_final_score') {
            if (this.freezeTimer > 0) {
                this.freezeTimer--;
                // Auto-transition to victory screen when freeze ends
                if (this.freezeTimer === 0) {
                    this.gameState = 'ended';
                    arcadeAudio.stopMusic();
                    arcadeAudio.playGameOverSound();
                    this.startVictoryAnimation(this.finalScoreWinner);
                    const winner = this.finalScoreWinner === 'player1' ? 'Player 1' : 
                                  (this.gameMode === 'ai' ? `AI Level ${this.aiDifficulty}` : 'Player 2');
                    const color = this.finalScoreWinner === 'player1' ? '#00ffff' : '#ff00ff';
                    statusMessage.innerHTML = `<span class="winner-message" style="color: ${color};">${winner} Wins! Press SPACE to play again</span>`;
                }
            }
            return; // Don't update anything else when showing final score
        }
        
        // Handle freeze period after scoring
        if (this.freezeTimer > 0) {
            this.freezeTimer--;
            
            // When freeze ends, reset ball and start countdown (unless game is over)
            if (this.freezeTimer === 0 && this.gameState === 'playing') {
                this.flashingPaddle = null;
                // Ball moves toward the scorer (disadvantage for scoring)
                const towardsPlayer2 = this.lastScorer === 'player2';
                this.ball.reset(towardsPlayer2);
                this.updateHitCounter();
                this.startCountdown();
            }
            return; // Don't update anything else during freeze
        }
        
        // Handle countdown after scoring
        if (this.countdownTimer > 0) {
            this.countdownTimer--;
            
            // Update countdown value for display (3, 2, 1)
            const newValue = Math.ceil(this.countdownTimer / 60);
            if (newValue !== this.countdownValue && newValue > 0) {
                this.countdownValue = newValue;
                arcadeAudio.playHitSound(); // Use hit sound for countdown beeps
            }
            
            // Players can move during countdown
            this.handleInput(true); // true = countdown mode (no shooting)
            this.player1.update();
            this.player2.update();
            
            // AI can move but not shoot during countdown
            if (this.gameMode === 'ai' && this.ai) {
                this.ai.update(this.ball, this.projectiles, this.player1);
            }
            
            // Ball doesn't move during countdown
            return;
        }
        
        this.handleInput();
        
        if (this.gameMode === 'ai' && this.ai) {
            const shouldShoot = this.ai.update(this.ball, this.projectiles, this.player1);
            if (shouldShoot) {
                const now = Date.now();
                const player2HasProjectile = this.projectiles.some(p => p.owner === 'player2' && p.active);
                // Add cooldown check for AI as well
                if (!player2HasProjectile && this.player2.shoot() && now - this.lastShootTime.player2 >= PROJECTILE_COOLDOWN) {
                    this.projectiles.push(new Projectile(
                        this.player2.x,
                        this.player2.y + this.player2.height / 2,
                        -1,
                        this.player2.color,
                        'player2'
                    ));
                    this.lastShootTime.player2 = now;
                    arcadeAudio.playShootSound();
                }
            }
        }
        
        this.player1.update();
        this.player2.update();
        this.ball.update();
        
        this.projectiles = this.projectiles.filter(projectile => {
            projectile.update();
            
            if (projectile.checkBallCollision(this.ball)) {
                this.ball.randomizeDirection(projectile.owner);
                this.updateHitCounter();
                arcadeAudio.playHitSound();
                return false;
            }
            
            if (projectile.dx > 0 && projectile.checkPaddleCollision(this.player2)) {
                this.player2.immobilize();
                arcadeAudio.playImmobilizeSound();
                return false;
            }
            
            if (projectile.dx < 0 && projectile.checkPaddleCollision(this.player1)) {
                this.player1.immobilize();
                arcadeAudio.playImmobilizeSound();
                return false;
            }
            
            return projectile.active;
        });
        
        if (this.ball.checkPaddleCollision(this.player1)) {
            this.score2++;
            this.flashingPaddle = 'player1';
            this.lastScorer = 'player2';
            this.freezeTimer = 120; // 2 seconds at 60fps
            this.updateScore();
            arcadeAudio.playScoreSound();
            this.checkWin();
            if (this.gameState === 'playing') { // Only countdown if game not ended
                this.projectiles = []; // Clear all projectiles
                // Don't reset ball or start countdown yet - wait for freeze to end
            }
        }
        
        if (this.ball.checkPaddleCollision(this.player2)) {
            this.score1++;
            this.flashingPaddle = 'player2';
            this.lastScorer = 'player1';
            this.freezeTimer = 120; // 2 seconds at 60fps
            this.updateScore();
            arcadeAudio.playScoreSound();
            this.checkWin();
            if (this.gameState === 'playing') { // Only countdown if game not ended
                this.projectiles = []; // Clear all projectiles
                // Don't reset ball or start countdown yet - wait for freeze to end
            }
        }
    }

    updateScore() {
        score1Element.textContent = this.score1;
        score2Element.textContent = this.score2;
    }

    updateHitCounter() {
        if (hitValue && hitBarFill) {
            hitValue.textContent = this.ball.hitCount;
            const percentage = (this.ball.hitCount / this.ball.maxHits) * 100;
            hitBarFill.style.width = percentage + '%';
        }
    }

    checkWin() {
        if (this.score1 >= WIN_SCORE) {
            this.gameState = 'showing_final_score';
            this.finalScoreWinner = 'player1';
            statusMessage.innerHTML = ''; // Clear status, let the canvas show "Player Scores!"
        } else if (this.score2 >= WIN_SCORE) {
            this.gameState = 'showing_final_score';
            this.finalScoreWinner = 'player2';
            statusMessage.innerHTML = ''; // Clear status, let the canvas show "Player Scores!"
        }
    }
    
    startVictoryAnimation(winner) {
        this.victoryAnimation = {
            winner: winner,
            timer: 0
        };
        
        // Create victory particles
        const winnerPaddle = winner === 'player1' ? this.player1 : this.player2;
        const color = winner === 'player1' ? '#00ffff' : '#ff00ff';
        
        for (let i = 0; i < 50; i++) {
            this.victoryParticles.push({
                x: winnerPaddle.x + winnerPaddle.width / 2,
                y: winnerPaddle.y + winnerPaddle.height / 2,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                size: Math.random() * 8 + 4,
                color: color,
                life: 1.0
            });
        }
    }
    
    updateVictoryAnimation() {
        if (!this.victoryAnimation) return;
        
        this.victoryAnimation.timer++;
        
        // Update particles
        this.victoryParticles = this.victoryParticles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.3; // Gravity
            particle.life -= 0.015;
            return particle.life > 0;
        });
        
        // Add new particles periodically
        if (this.victoryAnimation.timer % 10 === 0 && this.victoryParticles.length < 100) {
            const winnerPaddle = this.victoryAnimation.winner === 'player1' ? this.player1 : this.player2;
            const color = this.victoryAnimation.winner === 'player1' ? '#00ffff' : '#ff00ff';
            
            for (let i = 0; i < 5; i++) {
                this.victoryParticles.push({
                    x: winnerPaddle.x + winnerPaddle.width / 2,
                    y: winnerPaddle.y + winnerPaddle.height / 2,
                    vx: (Math.random() - 0.5) * 8,
                    vy: -Math.random() * 8 - 2,
                    size: Math.random() * 6 + 3,
                    color: color,
                    life: 1.0
                });
            }
        }
    }

    draw() {
        // Clear with solid black
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Simple dotted center line (hide during countdowns, scoring, and victory)
        const showCenterLine = this.gameState === 'playing' && 
                               this.countdownTimer === 0 && 
                               this.freezeTimer === 0 &&
                               !this.victoryAnimation &&
                               !this.isPaused;
        
        if (showCenterLine) {
            ctx.fillStyle = '#ffffff';
            for (let i = 0; i < canvas.height; i += 20) {
                ctx.fillRect(canvas.width / 2 - 2, i, 4, 10);
            }
        }
        
        // Draw particles behind paddles
        this.victoryParticles.forEach(particle => {
            ctx.globalAlpha = particle.life;
            ctx.fillStyle = particle.color;
            ctx.fillRect(particle.x - particle.size/2, particle.y - particle.size/2, particle.size, particle.size);
        });
        ctx.globalAlpha = 1;
        
        // Draw paddles
        this.player1.draw(this.flashingPaddle === 'player1', this.freezeTimer);
        this.player2.draw(this.flashingPaddle === 'player2', this.freezeTimer);
        
        this.ball.draw();
        
        this.projectiles.forEach(projectile => projectile.draw());
        
        // Draw score display during freeze (including final score state)
        if (this.freezeTimer > 0 && this.lastScorer && (this.gameState === 'playing' || this.gameState === 'showing_final_score')) {
            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 48px Courier New';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const scorerName = this.lastScorer === 'player1' ? 'Player 1' : 
                               (this.gameMode === 'ai' ? `AI Level ${this.aiDifficulty}` : 'Player 2');
            ctx.fillText(`${scorerName} Scores!`, canvas.width / 2, canvas.height / 2 - 100);
            
            ctx.font = 'bold 72px Courier New';
            ctx.fillText(`${this.score1} - ${this.score2}`, canvas.width / 2, canvas.height / 2 - 30);
            
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
        }
        
        // Draw pause indicator
        if (this.isPaused) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 48px Courier New';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
            
            ctx.font = '24px Courier New';
            ctx.fillText('Press P or ESC to resume', canvas.width / 2, canvas.height / 2 + 60);
            
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
        }
        
        // Draw countdown (above the ball position)
        if (this.countdownValue > 0 && this.countdownTimer > 0) {
            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 72px Courier New';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // Position countdown above the ball
            ctx.fillText(this.countdownValue, canvas.width / 2, canvas.height / 2 - 100);
            
            ctx.font = '24px Courier New';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('Get Ready!', canvas.width / 2, canvas.height / 2 - 50);
            
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
        }
        
        // Draw victory screen
        if (this.victoryAnimation) {
            // Big GAME OVER text
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Rainbow effect for GAME OVER (no pulsing)
            const colors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3'];
            const colorIndex = Math.floor(this.victoryAnimation.timer / 5) % colors.length;
            ctx.fillStyle = colors[colorIndex];
            ctx.font = 'bold 72px Courier New';
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 150);
            
            // Winner text with glow
            const winnerColor = this.victoryAnimation.winner === 'player1' ? '#00ffff' : '#ff00ff';
            ctx.fillStyle = winnerColor;
            ctx.font = 'bold 48px Courier New';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Glow effect
            ctx.shadowColor = winnerColor;
            ctx.shadowBlur = 20 + Math.sin(this.victoryAnimation.timer * 0.1) * 10;
            
            const winnerName = this.victoryAnimation.winner === 'player1' ? 'PLAYER 1' : 
                               (this.gameMode === 'ai' ? `AI LEVEL ${this.aiDifficulty}` : 'PLAYER 2');
            ctx.fillText(`${winnerName} WINS!`, canvas.width / 2, canvas.height / 2 - 50);
            
            // Final score
            ctx.shadowBlur = 0;
            ctx.font = 'bold 64px Courier New';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`${this.score1} - ${this.score2}`, canvas.width / 2, canvas.height / 2 + 30);
            
            // Press space to continue (blinking)
            if (Math.floor(this.victoryAnimation.timer / 30) % 2 === 0) {
                ctx.font = '24px Courier New';
                ctx.fillStyle = '#ffffff';
                ctx.fillText('Press SPACE to play again', canvas.width / 2, canvas.height / 2 + 100);
            }
            
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            arcadeAudio.stopMusic();
            statusMessage.textContent = 'Game Paused - Press P or ESC to resume';
        } else {
            if (!arcadeAudio.musicMuted) {
                arcadeAudio.startMusic();
            }
            statusMessage.textContent = '';
        }
    }
    
    startCountdown() {
        this.countdownTimer = 180; // 3 seconds at 60 FPS
        this.countdownValue = 3;
    }
    
    run() {
        this.update();
        this.updateVictoryAnimation();
        if (this.gameState !== 'menu') {
            this.draw();
        }
        requestAnimationFrame(() => this.run());
    }
}

// Initialize audio toggle buttons
function initAudioControls() {
    // Set initial state based on saved preferences
    updateMusicToggle(!arcadeAudio.musicMuted);
    updateSFXToggle(!arcadeAudio.sfxMuted);
    
    musicToggle.addEventListener('click', () => {
        const isOn = arcadeAudio.toggleMusic();
        updateMusicToggle(isOn);
        if (isOn && game.gameState === 'playing') {
            arcadeAudio.playMusicLoop();
        }
    });
    
    sfxToggle.addEventListener('click', () => {
        const isOn = arcadeAudio.toggleSFX();
        updateSFXToggle(isOn);
    });
}

function updateMusicToggle(isOn) {
    const label = musicToggle.querySelector('.toggle-label');
    if (isOn) {
        musicToggle.classList.remove('muted');
        label.textContent = 'Music: ON';
    } else {
        musicToggle.classList.add('muted');
        label.textContent = 'Music: OFF';
    }
}

function updateSFXToggle(isOn) {
    const label = sfxToggle.querySelector('.toggle-label');
    if (isOn) {
        sfxToggle.classList.remove('muted');
        label.textContent = 'SFX: ON';
    } else {
        sfxToggle.classList.add('muted');
        label.textContent = 'SFX: OFF';
    }
}

const game = new Game();
initAudioControls();
game.run();