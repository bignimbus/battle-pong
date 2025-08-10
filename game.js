const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const statusMessage = document.getElementById('statusMessage');
const score1Element = document.getElementById('score1');
const score2Element = document.getElementById('score2');

canvas.width = 800;
canvas.height = 400;

const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 12;
const PROJECTILE_SIZE = 8;
const PADDLE_SPEED = 5;
const PROJECTILE_SPEED = 4;
const INITIAL_BALL_SPEED = 4;
const BALL_SPEED_INCREMENT = 0.5;
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

    draw() {
        ctx.save();
        
        if (this.immobilized) {
            ctx.globalAlpha = 0.5;
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);
        }
        
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.restore();
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
        this.trail.forEach((point, index) => {
            ctx.save();
            ctx.globalAlpha = index / this.trail.length * 0.5;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(point.x, point.y, this.size * (index / this.trail.length), 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    randomizeDirection() {
        const angle = Math.random() * Math.PI * 2;
        this.speed = Math.min(this.speed + BALL_SPEED_INCREMENT, INITIAL_BALL_SPEED * 3);
        this.dx = Math.cos(angle) * this.speed;
        this.dy = Math.sin(angle) * this.speed;
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
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
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

class Game {
    constructor() {
        this.player1 = new Paddle(30, canvas.height / 2 - PADDLE_HEIGHT / 2, '#00ffff', {
            up: 'KeyW',
            down: 'KeyS',
            shoot: 'KeyQ'
        });
        
        this.player2 = new Paddle(canvas.width - 30 - PADDLE_WIDTH, canvas.height / 2 - PADDLE_HEIGHT / 2, '#ff00ff', {
            up: 'ArrowUp',
            down: 'ArrowDown',
            shoot: 'ArrowLeft'
        });
        
        this.ball = new Ball();
        this.projectiles = [];
        this.score1 = 0;
        this.score2 = 0;
        this.gameState = 'waiting';
        this.keys = {};
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'Space' && this.gameState !== 'playing') {
                this.start();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    start() {
        this.gameState = 'playing';
        this.score1 = 0;
        this.score2 = 0;
        this.ball.reset();
        this.projectiles = [];
        this.player1.immobilized = false;
        this.player2.immobilized = false;
        statusMessage.textContent = '';
        this.updateScore();
    }

    handleInput() {
        this.player1.dy = 0;
        this.player2.dy = 0;
        
        if (this.keys[this.player1.controls.up]) this.player1.dy = -1;
        if (this.keys[this.player1.controls.down]) this.player1.dy = 1;
        if (this.keys[this.player2.controls.up]) this.player2.dy = -1;
        if (this.keys[this.player2.controls.down]) this.player2.dy = 1;
        
        if (this.keys[this.player1.controls.shoot]) {
            const player1HasProjectile = this.projectiles.some(p => p.owner === 'player1' && p.active);
            if (!player1HasProjectile && this.player1.shoot()) {
                this.projectiles.push(new Projectile(
                    this.player1.x + this.player1.width,
                    this.player1.y + this.player1.height / 2,
                    1,
                    this.player1.color,
                    'player1'
                ));
            }
        }
        
        if (this.keys[this.player2.controls.shoot]) {
            const player2HasProjectile = this.projectiles.some(p => p.owner === 'player2' && p.active);
            if (!player2HasProjectile && this.player2.shoot()) {
                this.projectiles.push(new Projectile(
                    this.player2.x,
                    this.player2.y + this.player2.height / 2,
                    -1,
                    this.player2.color,
                    'player2'
                ));
            }
        }
    }

    update() {
        if (this.gameState !== 'playing') return;
        
        this.handleInput();
        
        this.player1.update();
        this.player2.update();
        this.ball.update();
        
        this.projectiles = this.projectiles.filter(projectile => {
            projectile.update();
            
            if (projectile.checkBallCollision(this.ball)) {
                this.ball.randomizeDirection();
                return false;
            }
            
            if (projectile.dx > 0 && projectile.checkPaddleCollision(this.player2)) {
                this.player2.immobilize();
                return false;
            }
            
            if (projectile.dx < 0 && projectile.checkPaddleCollision(this.player1)) {
                this.player1.immobilize();
                return false;
            }
            
            return projectile.active;
        });
        
        if (this.ball.checkPaddleCollision(this.player1)) {
            this.score2++;
            this.updateScore();
            this.checkWin();
            this.ball.reset(true);
        }
        
        if (this.ball.checkPaddleCollision(this.player2)) {
            this.score1++;
            this.updateScore();
            this.checkWin();
            this.ball.reset(false);
        }
    }

    updateScore() {
        score1Element.textContent = this.score1;
        score2Element.textContent = this.score2;
    }

    checkWin() {
        if (this.score1 >= WIN_SCORE) {
            this.gameState = 'ended';
            statusMessage.innerHTML = '<span class="winner-message" style="color: #00ffff;">Player 1 Wins! Press SPACE to play again</span>';
        } else if (this.score2 >= WIN_SCORE) {
            this.gameState = 'ended';
            statusMessage.innerHTML = '<span class="winner-message" style="color: #ff00ff;">Player 2 Wins! Press SPACE to play again</span>';
        }
    }

    draw() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
        ctx.restore();
        
        this.player1.draw();
        this.player2.draw();
        this.ball.draw();
        
        this.projectiles.forEach(projectile => projectile.draw());
    }

    run() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.run());
    }
}

const game = new Game();
game.run();