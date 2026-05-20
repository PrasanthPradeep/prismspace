// Matrix Component - Vanilla JavaScript Implementation
class Matrix {
    constructor(element, options = {}) {
        this.element = element;
        this.rows = options.rows || 7;
        this.cols = options.cols || 7;
        this.fps = options.fps || 20;
        this.size = options.size || 10;
        this.gap = options.gap || 2;
        this.brightness = options.brightness || 1;
        this.currentFrameIndex = 0;
        this.isAnimating = false;
        this.animationId = null;
        this.lastFrameTime = 0;
        this.pixels = [];
        
        // Animation types
        this.animationTypes = ['wave', 'pulse', 'loader', 'snake', 'rain', 'spiral'];
        this.currentAnimationType = 0;
        this.frames = this.createAnimationFrames(this.animationTypes[0]);
        
        // Game state for Snake game
        this.gameMode = false;
        this.snakeBody = [];
        this.snakeDirection = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.food = null;
        this.score = 0;
        this.gameOver = false;
        this.gameSpeed = 200; // ms between moves
        this.lastMoveTime = 0;
        this.handleClick = () => {
            this.cycleAnimation();
        };
        this.handleMouseDown = (e) => {
            if (e.button === 2) {
                e.preventDefault();
                this.showSnakeGameDialog();
            }
        };
        this.handleContextMenu = (e) => {
            e.preventDefault();
        };
        this.handleKeyDown = (e) => {
            this.onKeyDown(e);
        };
        
        this.init();
    }

    init() {
        this.createSVG();
        this.addClickHandler();
        this.addKeyboardControls();
        this.startAnimation();
    }

    addClickHandler() {
        this.element.addEventListener('click', this.handleClick);
        this.element.addEventListener('mousedown', this.handleMouseDown);
        this.element.addEventListener('contextmenu', this.handleContextMenu);
    }
    
    addKeyboardControls() {
        document.addEventListener('keydown', this.handleKeyDown);
    }

    onKeyDown(e) {
        if (this.gameMode) {
            switch (e.key) {
                case 'ArrowUp':
                    if (this.snakeDirection.y !== 1) {
                        this.nextDirection = { x: 0, y: -1 };
                    }
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                    if (this.snakeDirection.y !== -1) {
                        this.nextDirection = { x: 0, y: 1 };
                    }
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                    if (this.snakeDirection.x !== 1) {
                        this.nextDirection = { x: -1, y: 0 };
                    }
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                    if (this.snakeDirection.x !== -1) {
                        this.nextDirection = { x: 1, y: 0 };
                    }
                    e.preventDefault();
                    break;
                case ' ':
                    if (this.gameOver) {
                        this.startSnakeGame();
                    }
                    e.preventDefault();
                    break;
                case 'Escape':
                    this.exitGameMode();
                    this.closeSnakeGameDialog();
                    e.preventDefault();
                    break;
            }
        }
    }

    cycleAnimation() {
        // Exit game mode if active
        if (this.gameMode) {
            this.exitGameMode();
            this.closeSnakeGameDialog();
            return;
        }
        
        this.currentAnimationType = (this.currentAnimationType + 1) % this.animationTypes.length;
        const animationType = this.animationTypes[this.currentAnimationType];
        
        this.frames = this.createAnimationFrames(animationType);
        this.currentFrameIndex = 0;
        
        // Update tooltip
        const container = this.element.closest('.matrix-container');
        if (container) {
            const animationName = animationType;
            container.title = `Matrix Display - ${animationName.charAt(0).toUpperCase() + animationName.slice(1)} animation (Click to change)`;
        }
        
        // Add visual feedback for animation change
        this.element.style.transform = 'scale(0.9)';
        setTimeout(() => {
            this.element.style.transform = 'scale(1)';
        }, 150);
    }
    
    showSnakeGameDialog() {
        // Check if dialog already exists
        if (document.getElementById('snake-game-dialog')) {
            return;
        }
        
        // Create dialog
        const dialog = document.createElement('div');
        dialog.id = 'snake-game-dialog';
        dialog.className = 'snake-game-dialog';
        
        // Create game display
        const gameDisplay = document.createElement('div');
        gameDisplay.id = 'snake-game-display';
        gameDisplay.className = 'snake-game-display';
        
        // Create controls
        const controls = document.createElement('div');
        controls.className = 'snake-controls';
        controls.innerHTML = `
            <div class="score">Score: <span id="game-score">0</span></div>
            <div class="controls">Use ↑ ↓ ← → to move, ESC to exit</div>
            <button id="restart-game" class="game-button">Restart</button>
            <button id="close-game" class="game-button">Close</button>
        `;
        
        // Add elements to dialog
        dialog.appendChild(gameDisplay);
        dialog.appendChild(controls);
        
        // Position dialog next to matrix container
        const container = this.element.closest('.matrix-container');
        if (container) {
            const rect = container.getBoundingClientRect();
            dialog.style.left = `${rect.right + 20}px`;
            dialog.style.top = `${rect.top}px`;
            
            // Add dialog to body
            document.body.appendChild(dialog);
            
            // Create a standalone Snake game
            this.createSnakeGame();
            
            // Add event listeners for buttons
            document.getElementById('restart-game').addEventListener('click', () => {
                this.restartSnakeGame();
            });
            
            document.getElementById('close-game').addEventListener('click', () => {
                this.closeSnakeGameDialog();
            });
        }
    }
    
    createSnakeGame() {
        // Create a simple snake game directly in the dialog
        const gameDisplay = document.getElementById('snake-game-display');
        if (!gameDisplay) return;
        
        // Create SVG for game
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', (this.size + this.gap) * 10);
        svg.setAttribute('height', (this.size + this.gap) * 10);
        svg.classList.add('matrix-svg');
        gameDisplay.appendChild(svg);
        
        // Game state
        this.gameSnake = {
            body: [{ x: 5, y: 5 }],
            direction: { x: 1, y: 0 },
            nextDirection: { x: 1, y: 0 },
            food: null,
            score: 0,
            gameOver: false,
            svg: svg,
            pixels: [],
            animationId: null,
            lastMoveTime: 0,
            speed: 200
        };
        
        // Create pixels
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                const pixel = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                pixel.setAttribute('x', x * (this.size + this.gap));
                pixel.setAttribute('y', y * (this.size + this.gap));
                pixel.setAttribute('width', this.size);
                pixel.setAttribute('height', this.size);
                pixel.setAttribute('rx', 2);
                pixel.setAttribute('ry', 2);
                pixel.setAttribute('fill', '#00ff88');
                pixel.setAttribute('opacity', 0.1);
                pixel.classList.add('matrix-pixel');
                svg.appendChild(pixel);
                
                if (!this.gameSnake.pixels[y]) {
                    this.gameSnake.pixels[y] = [];
                }
                this.gameSnake.pixels[y][x] = pixel;
            }
        }
        
        // Place food
        this.placeSnakeFood();
        
        // Start game loop
        this.startSnakeGameLoop();
        
        // Add keyboard controls
        this.addSnakeKeyboardControls();
    }
    
    addSnakeKeyboardControls() {
        // Remove existing handler if any
        if (this.snakeKeyHandler) {
            document.removeEventListener('keydown', this.snakeKeyHandler);
        }
        
        // Create new handler
        this.snakeKeyHandler = (e) => {
            switch(e.key) {
                case 'ArrowUp':
                    if (this.gameSnake.direction.y !== 1) {
                        this.gameSnake.nextDirection = { x: 0, y: -1 };
                    }
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                    if (this.gameSnake.direction.y !== -1) {
                        this.gameSnake.nextDirection = { x: 0, y: 1 };
                    }
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                    if (this.gameSnake.direction.x !== 1) {
                        this.gameSnake.nextDirection = { x: -1, y: 0 };
                    }
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                    if (this.gameSnake.direction.x !== -1) {
                        this.gameSnake.nextDirection = { x: 1, y: 0 };
                    }
                    e.preventDefault();
                    break;
                case ' ':
                    if (this.gameSnake.gameOver) {
                        this.restartSnakeGame();
                    }
                    e.preventDefault();
                    break;
                case 'Escape':
                    this.closeSnakeGameDialog();
                    e.preventDefault();
                    break;
            }
        };
        
        // Add the handler
        document.addEventListener('keydown', this.snakeKeyHandler);
    }
    
    startSnakeGameLoop() {
        // Clear any existing animation
        if (this.gameSnake.animationId) {
            cancelAnimationFrame(this.gameSnake.animationId);
        }
        
        // Game loop
        const gameLoop = (timestamp) => {
            // Move snake at specific intervals
            if (timestamp - this.gameSnake.lastMoveTime > this.gameSnake.speed) {
                this.updateSnakeGame();
                this.gameSnake.lastMoveTime = timestamp;
            }
            
            // Render game
            this.renderSnakeGame();
            
            // Continue loop if game is not over
            if (!this.gameSnake.gameOver) {
                this.gameSnake.animationId = requestAnimationFrame(gameLoop);
            }
        };
        
        // Start loop
        this.gameSnake.animationId = requestAnimationFrame(gameLoop);
    }
    
    updateSnakeGame() {
        if (this.gameSnake.gameOver) return;
        
        // Update direction
        this.gameSnake.direction = this.gameSnake.nextDirection;
        
        // Calculate new head position
        const head = this.gameSnake.body[0];
        const newHead = {
            x: head.x + this.gameSnake.direction.x,
            y: head.y + this.gameSnake.direction.y
        };
        
        // Check for collision with walls
        if (newHead.x < 0 || newHead.x >= 10 || newHead.y < 0 || newHead.y >= 10) {
            this.gameSnake.gameOver = true;
            return;
        }
        
        // Check for collision with self
        for (const segment of this.gameSnake.body) {
            if (segment.x === newHead.x && segment.y === newHead.y) {
                this.gameSnake.gameOver = true;
                return;
            }
        }
        
        // Add new head
        this.gameSnake.body.unshift(newHead);
        
        // Check for food
        if (this.gameSnake.food && newHead.x === this.gameSnake.food.x && newHead.y === this.gameSnake.food.y) {
            // Increase score
            this.gameSnake.score++;
            
            // Update score display
            const scoreElement = document.getElementById('game-score');
            if (scoreElement) {
                scoreElement.textContent = this.gameSnake.score;
            }
            
            // Place new food
            this.placeSnakeFood();
            
            // Increase speed
            if (this.gameSnake.speed > 50) {
                this.gameSnake.speed -= 5;
            }
        } else {
            // Remove tail if no food was eaten
            this.gameSnake.body.pop();
        }
    }
    
    renderSnakeGame() {
        // Reset all pixels
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                const pixel = this.gameSnake.pixels[y][x];
                pixel.setAttribute('opacity', 0.1);
                pixel.classList.remove('matrix-pixel-active');
            }
        }
        
        // Render snake
        for (const segment of this.gameSnake.body) {
            if (segment.x >= 0 && segment.x < 10 && segment.y >= 0 && segment.y < 10) {
                const pixel = this.gameSnake.pixels[segment.y][segment.x];
                pixel.setAttribute('opacity', 1);
                pixel.classList.add('matrix-pixel-active');
            }
        }
        
        // Render food
        if (this.gameSnake.food) {
            const pixel = this.gameSnake.pixels[this.gameSnake.food.y][this.gameSnake.food.x];
            pixel.setAttribute('opacity', 1);
            pixel.classList.add('matrix-pixel-active');
            
            // Make food blink
            const opacity = 0.7 + 0.3 * Math.sin(Date.now() / 200);
            pixel.setAttribute('opacity', opacity);
        }
        
        // Visual feedback for game over
        if (this.gameSnake.gameOver) {
            for (const segment of this.gameSnake.body) {
                if (segment.x >= 0 && segment.x < 10 && segment.y >= 0 && segment.y < 10) {
                    const pixel = this.gameSnake.pixels[segment.y][segment.x];
                    pixel.setAttribute('opacity', 0.5 + 0.5 * Math.sin(Date.now() / 100));
                }
            }
        }
    }
    
    placeSnakeFood() {
        // Find all empty cells
        const emptyCells = [];
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                // Check if this cell is occupied by snake
                let isSnake = false;
                for (const segment of this.gameSnake.body) {
                    if (segment.x === x && segment.y === y) {
                        isSnake = true;
                        break;
                    }
                }
                if (!isSnake) {
                    emptyCells.push({ x, y });
                }
            }
        }
        
        // Place food in random empty cell
        if (emptyCells.length > 0) {
            this.gameSnake.food = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        } else {
            // No empty cells, player wins!
            this.gameSnake.gameOver = true;
        }
    }
    
    restartSnakeGame() {
        // Reset game state
        this.gameSnake.body = [{ x: 5, y: 5 }];
        this.gameSnake.direction = { x: 1, y: 0 };
        this.gameSnake.nextDirection = { x: 1, y: 0 };
        this.gameSnake.score = 0;
        this.gameSnake.gameOver = false;
        this.gameSnake.speed = 200;
        
        // Update score display
        const scoreElement = document.getElementById('game-score');
        if (scoreElement) {
            scoreElement.textContent = this.gameSnake.score;
        }
        
        // Place food
        this.placeSnakeFood();
        
        // Restart game loop if needed
        if (!this.gameSnake.animationId) {
            this.startSnakeGameLoop();
        }
    }
    
    closeSnakeGameDialog() {
        const dialog = document.getElementById('snake-game-dialog');
        if (dialog) {
            // Clean up game resources
            if (this.gameSnake && this.gameSnake.animationId) {
                cancelAnimationFrame(this.gameSnake.animationId);
            }
            
            // Remove keyboard event listener
            if (this.snakeKeyHandler) {
                document.removeEventListener('keydown', this.snakeKeyHandler);
                this.snakeKeyHandler = null;
            }
            
            // Clear game state
            this.gameSnake = null;
            
            // Remove dialog
            document.body.removeChild(dialog);
        }
    }
    
    enterGameMode() {
        this.gameMode = true;
        this.startSnakeGame();
        
        // Update tooltip
        const container = this.element.closest('.matrix-container');
        if (container) {
            container.title = `Matrix Snake Game - Use arrow keys to play, ESC to exit`;
        }
        
        // Add visual feedback
        this.element.classList.add('game-mode');
        this.element.style.transform = 'scale(1.1)';
        setTimeout(() => {
            this.element.style.transform = 'scale(1)';
        }, 300);
    }
    
    exitGameMode() {
        this.gameMode = false;
        this.gameOver = false;
        
        // Update tooltip
        const container = this.element.closest('.matrix-container');
        if (container) {
            container.title = `Matrix Display - Click to change animation`;
        }
        
        this.element.classList.remove('game-mode');
        
        // Return to current animation
        this.frames = this.createAnimationFrames(this.animationTypes[this.currentAnimationType]);
        this.currentFrameIndex = 0;
    }
    
    startSnakeGame() {
        // Reset game state
        this.snakeBody = [
            { x: Math.floor(this.cols / 2), y: Math.floor(this.rows / 2) }
        ];
        this.snakeDirection = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.score = 0;
        this.gameOver = false;
        this.placeFood();
        
        // Update score display
        const scoreElement = document.getElementById('game-score');
        if (scoreElement) {
            scoreElement.textContent = this.score;
        }
    }
    
    placeFood() {
        // Find all empty cells
        const emptyCells = [];
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                // Check if this cell is occupied by snake
                let isSnake = false;
                for (const segment of this.snakeBody) {
                    if (segment.x === x && segment.y === y) {
                        isSnake = true;
                        break;
                    }
                }
                if (!isSnake) {
                    emptyCells.push({ x, y });
                }
            }
        }
        
        // Place food in random empty cell
        if (emptyCells.length > 0) {
            this.food = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        } else {
            // No empty cells, player wins!
            this.gameOver = true;
        }
    }

    createAnimationFrames(type) {
        switch(type) {
            case 'wave':
                return this.createWaveFrames();
            case 'pulse':
                return this.createPulseFrames();
            case 'loader':
                return this.createLoaderFrames();
            case 'snake':
                return this.createSnakeFrames();
            case 'rain':
                return this.createRainFrames();
            case 'spiral':
                return this.createSpiralFrames();
            case 'gameSnake':
                return this.createEmptyGameFrames();
            default:
                return this.createWaveFrames();
        }
    }
    
    createEmptyGameFrames() {
        // For game mode, we'll create a single empty frame
        // The actual game rendering happens in updateFrame
        return [this.createEmptyFrame()];
    }
    
    createRainFrames() {
        const frames = [];
        const frameCount = 20;
        const dropCount = Math.ceil(this.cols / 2);
        
        // Create drops with random positions and speeds
        const drops = [];
        for (let i = 0; i < dropCount; i++) {
            drops.push({
                x: Math.floor(Math.random() * this.cols),
                y: -Math.floor(Math.random() * this.rows),
                speed: 0.5 + Math.random() * 1.5,
                length: 2 + Math.floor(Math.random() * 3)
            });
        }
        
        for (let frame = 0; frame < frameCount; frame++) {
            const f = this.createEmptyFrame();
            
            // Update and render each drop
            for (const drop of drops) {
                drop.y += drop.speed;
                
                // Reset drop if it goes off screen
                if (drop.y - drop.length > this.rows) {
                    drop.y = -Math.floor(Math.random() * 3);
                    drop.x = Math.floor(Math.random() * this.cols);
                }
                
                // Render drop
                for (let i = 0; i < drop.length; i++) {
                    const y = Math.floor(drop.y) - i;
                    if (y >= 0 && y < this.rows) {
                        const brightness = 1 - (i / drop.length);
                        this.setPixel(f, y, drop.x, brightness);
                    }
                }
            }
            
            frames.push(f);
        }
        
        return frames;
    }
    
    createSpiralFrames() {
        const frames = [];
        const frameCount = 24;
        const centerX = Math.floor(this.cols / 2);
        const centerY = Math.floor(this.rows / 2);
        const maxRadius = Math.max(this.rows, this.cols);
        
        for (let frame = 0; frame < frameCount; frame++) {
            const f = this.createEmptyFrame();
            const phase = (frame / frameCount) * Math.PI * 2;
            
            for (let radius = 0.5; radius < maxRadius; radius += 0.5) {
                const angle = phase + radius * 0.8;
                const x = Math.floor(centerX + Math.cos(angle) * radius);
                const y = Math.floor(centerY + Math.sin(angle) * radius);
                
                if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
                    const brightness = 1 - (radius / maxRadius);
                    this.setPixel(f, y, x, brightness);
                }
            }
            
            frames.push(f);
        }
        
        return frames;
    }

    createSVG() {
        const width = this.cols * (this.size + this.gap) - this.gap;
        const height = this.rows * (this.size + this.gap) - this.gap;
        
        this.element.innerHTML = `
            <svg width="${width}" height="${height}" 
                 viewBox="0 0 ${width} ${height}" 
                 xmlns="http://www.w3.org/2000/svg" 
                 class="matrix-svg">
                <defs>
                    <radialGradient id="matrix-pixel-on" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stop-color="currentColor" stop-opacity="1" />
                        <stop offset="70%" stop-color="currentColor" stop-opacity="0.85" />
                        <stop offset="100%" stop-color="currentColor" stop-opacity="0.6" />
                    </radialGradient>
                    <radialGradient id="matrix-pixel-off" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stop-color="rgba(255,255,255,0.1)" stop-opacity="1" />
                        <stop offset="100%" stop-color="rgba(255,255,255,0.05)" stop-opacity="0.7" />
                    </radialGradient>
                    <filter id="matrix-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>
                <style>
                    .matrix-pixel {
                        transition: opacity 300ms ease-out, transform 150ms ease-out;
                        transform-origin: center;
                    }
                    .matrix-pixel-active {
                        filter: url(#matrix-glow);
                    }
                </style>
                ${this.createPixels()}
            </svg>
        `;

        const svg = this.element.querySelector('.matrix-svg');
        const pixelNodes = svg ? Array.from(svg.querySelectorAll('.matrix-pixel')) : [];
        this.pixels = [];

        for (let row = 0; row < this.rows; row++) {
            this.pixels[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.pixels[row][col] = pixelNodes[row * this.cols + col] || null;
            }
        }
    }

    getPixel(row, col) {
        return this.pixels[row]?.[col] || null;
    }

    createPixels() {
        let pixels = '';
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const x = col * (this.size + this.gap) + this.size / 2;
                const y = row * (this.size + this.gap) + this.size / 2;
                const radius = (this.size / 2) * 0.9;
                
                pixels += `
                    <circle 
                        class="matrix-pixel" 
                        id="pixel-${row}-${col}"
                        cx="${x}" 
                        cy="${y}" 
                        r="${radius}" 
                        fill="url(#matrix-pixel-off)" 
                        opacity="0.1"
                    />
                `;
            }
        }
        return pixels;
    }

    createWaveFrames() {
        const frames = [];
        const frameCount = 24;
        
        for (let frame = 0; frame < frameCount; frame++) {
            const f = this.createEmptyFrame();
            const phase = (frame / frameCount) * Math.PI * 2;

            for (let col = 0; col < this.cols; col++) {
                const colPhase = (col / this.cols) * Math.PI * 2;
                const height = Math.sin(phase + colPhase) * 2.5 + 3.5;
                const row = Math.floor(height);

                if (row >= 0 && row < this.rows) {
                    this.setPixel(f, row, col, 1);
                    const frac = height - row;
                    if (row > 0) this.setPixel(f, row - 1, col, 1 - frac);
                    if (row < this.rows - 1) this.setPixel(f, row + 1, col, frac);
                }
            }
            frames.push(f);
        }
        
        return frames;
    }

    createPulseFrames() {
        const frames = [];
        const frameCount = 16;
        const center = Math.floor(this.rows / 2);
        
        for (let frame = 0; frame < frameCount; frame++) {
            const f = this.createEmptyFrame();
            const phase = (frame / frameCount) * Math.PI * 2;
            const intensity = (Math.sin(phase) + 1) / 2;

            this.setPixel(f, center, center, 1);

            const radius = Math.floor((1 - intensity) * 3) + 1;
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (Math.abs(dist - radius) < 0.7) {
                        this.setPixel(f, center + dy, center + dx, intensity * 0.6);
                    }
                }
            }
            frames.push(f);
        }
        
        return frames;
    }

    createLoaderFrames() {
        const frames = [];
        const frameCount = 12;
        const center = Math.floor(this.rows / 2);
        const radius = 2.5;

        for (let frame = 0; frame < frameCount; frame++) {
            const f = this.createEmptyFrame();
            for (let i = 0; i < 8; i++) {
                const angle = (frame / frameCount) * Math.PI * 2 + (i / 8) * Math.PI * 2;
                const x = Math.round(center + Math.cos(angle) * radius);
                const y = Math.round(center + Math.sin(angle) * radius);
                const brightness = 1 - i / 10;
                this.setPixel(f, y, x, Math.max(0.2, brightness));
            }
            frames.push(f);
        }

        return frames;
    }

    createSnakeFrames() {
        const frames = [];
        const path = [];
        let x = 0, y = 0, dx = 1, dy = 0;
        const visited = new Set();

        // Generate snake path
        while (path.length < this.rows * this.cols) {
            path.push([y, x]);
            visited.add(`${y},${x}`);

            const nextX = x + dx;
            const nextY = y + dy;

            if (nextX >= 0 && nextX < this.cols && nextY >= 0 && nextY < this.rows && !visited.has(`${nextY},${nextX}`)) {
                x = nextX;
                y = nextY;
            } else {
                const newDx = -dy;
                const newDy = dx;
                dx = newDx;
                dy = newDy;

                const nextX = x + dx;
                const nextY = y + dy;

                if (nextX >= 0 && nextX < this.cols && nextY >= 0 && nextY < this.rows && !visited.has(`${nextY},${nextX}`)) {
                    x = nextX;
                    y = nextY;
                } else {
                    break;
                }
            }
        }

        const snakeLength = 5;
        for (let frame = 0; frame < path.length; frame++) {
            const f = this.createEmptyFrame();

            for (let i = 0; i < snakeLength; i++) {
                const idx = frame - i;
                if (idx >= 0 && idx < path.length) {
                    const [y, x] = path[idx];
                    const brightness = 1 - i / snakeLength;
                    this.setPixel(f, y, x, brightness);
                }
            }
            frames.push(f);
        }

        return frames;
    }

    createEmptyFrame() {
        return Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
    }

    setPixel(frame, row, col, value) {
        if (row >= 0 && row < frame.length && col >= 0 && col < frame[0].length) {
            frame[row][col] = Math.max(0, Math.min(1, value));
        }
    }

    clamp(value) {
        return Math.max(0, Math.min(1, value));
    }

    updateFrame() {
        if (this.gameMode) {
            this.updateSnakeGame();
            return;
        }
        
        if (!this.frames || this.frames.length === 0) return;
        
        const currentFrame = this.frames[this.currentFrameIndex];
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const pixel = this.getPixel(row, col);
                if (!pixel) continue;
                
                const value = currentFrame[row] ? currentFrame[row][col] || 0 : 0;
                const opacity = this.clamp(this.brightness * value);
                const isActive = opacity > 0.5;
                const isOn = opacity > 0.05;
                
                pixel.setAttribute('opacity', isOn ? opacity : 0.1);
                pixel.setAttribute('fill', isOn ? 'url(#matrix-pixel-on)' : 'url(#matrix-pixel-off)');
                
                if (isActive) {
                    pixel.classList.add('matrix-pixel-active');
                    pixel.style.transform = 'scale(1.1)';
                } else {
                    pixel.classList.remove('matrix-pixel-active');
                    pixel.style.transform = 'scale(1)';
                }
            }
        }
    }
    
    updateSnakeGame() {
        const currentTime = performance.now();
        
        // Only update game state at game speed intervals
        if (!this.gameOver && currentTime - this.lastMoveTime >= this.gameSpeed) {
            this.lastMoveTime = currentTime;
            this.updateSnakePosition();
        }
        
        // Render game state
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const pixel = this.getPixel(row, col);
                if (!pixel) continue;
                
                let value = 0;
                let isFood = false;
                let isSnakeHead = false;
                
                // Check if this is food
                if (this.food && this.food.x === col && this.food.y === row) {
                    value = 1;
                    isFood = true;
                }
                
                // Check if this is snake
                for (let i = 0; i < this.snakeBody.length; i++) {
                    const segment = this.snakeBody[i];
                    if (segment.x === col && segment.y === row) {
                        value = 1;
                        isSnakeHead = (i === 0); // First segment is head
                        break;
                    }
                }
                
                const opacity = this.clamp(this.brightness * value);
                
                // Special styling for food and snake head
                if (isFood) {
                    // Food pulses
                    const pulsePhase = (currentTime % 1000) / 1000;
                    const pulseValue = 0.7 + 0.3 * Math.sin(pulsePhase * Math.PI * 2);
                    pixel.setAttribute('opacity', pulseValue);
                    pixel.setAttribute('fill', 'url(#matrix-pixel-on)');
                    pixel.style.transform = 'scale(1.2)';
                    pixel.classList.add('matrix-pixel-active');
                } else if (isSnakeHead) {
                    // Snake head is brighter
                    pixel.setAttribute('opacity', 1);
                    pixel.setAttribute('fill', 'url(#matrix-pixel-on)');
                    pixel.style.transform = 'scale(1.2)';
                    pixel.classList.add('matrix-pixel-active');
                } else if (value > 0) {
                    // Snake body
                    pixel.setAttribute('opacity', opacity);
                    pixel.setAttribute('fill', 'url(#matrix-pixel-on)');
                    pixel.style.transform = 'scale(1.1)';
                    pixel.classList.add('matrix-pixel-active');
                } else {
                    // Empty cell
                    pixel.setAttribute('opacity', 0.1);
                    pixel.setAttribute('fill', 'url(#matrix-pixel-off)');
                    pixel.style.transform = 'scale(1)';
                    pixel.classList.remove('matrix-pixel-active');
                }
            }
        }
        
        // Game over effect
        if (this.gameOver) {
            const phase = (currentTime % 1000) / 1000;
            const flashValue = phase < 0.5 ? 1 : 0.2;
            
            for (const segment of this.snakeBody) {
                const pixel = this.getPixel(segment.y, segment.x);
                if (pixel) {
                    pixel.setAttribute('opacity', flashValue);
                }
            }
        }
    }
    
    updateSnakePosition() {
        if (this.gameOver) return;
        
        // Update direction
        this.snakeDirection = this.nextDirection;
        
        // Calculate new head position
        const head = this.snakeBody[0];
        const newHead = {
            x: head.x + this.snakeDirection.x,
            y: head.y + this.snakeDirection.y
        };
        
        // Check for collision with walls
        if (newHead.x < 0 || newHead.x >= this.cols || newHead.y < 0 || newHead.y >= this.rows) {
            this.gameOver = true;
            return;
        }
        
        // Check for collision with self
        for (const segment of this.snakeBody) {
            if (segment.x === newHead.x && segment.y === newHead.y) {
                this.gameOver = true;
                return;
            }
        }
        
        // Add new head
        this.snakeBody.unshift(newHead);
        
        // Check for food
        if (this.food && this.food.x === newHead.x && this.food.y === newHead.y) {
            // Eat food
            this.score++;
            
            // Update score display - look for game-score in any context
            const scoreElement = document.getElementById('game-score');
            if (scoreElement) {
                scoreElement.textContent = this.score;
            }
            
            // Place new food
            this.placeFood();
            
            // Speed up slightly as score increases
            if (this.score % 3 === 0 && this.gameSpeed > 100) {
                this.gameSpeed -= 10;
            }
        } else {
            // Remove tail if no food eaten
            this.snakeBody.pop();
        }
    }

    startAnimation() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        this.lastFrameTime = performance.now();
        this.animate();
    }

    stopAnimation() {
        this.isAnimating = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    animate() {
        if (!this.isAnimating) return;
        
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;
        const frameInterval = 1000 / this.fps;
        
        if (deltaTime >= frameInterval) {
            this.updateFrame();
            this.currentFrameIndex = (this.currentFrameIndex + 1) % this.frames.length;
            this.lastFrameTime = currentTime;
        }
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    destroy() {
        this.stopAnimation();
        this.element.innerHTML = '';
        
        // Remove event listeners
        if (this.element) {
            this.element.removeEventListener('click', this.handleClick);
            this.element.removeEventListener('mousedown', this.handleMouseDown);
            this.element.removeEventListener('contextmenu', this.handleContextMenu);
        }
        document.removeEventListener('keydown', this.handleKeyDown);
        
        // Clear references
        this.frames = null;
        this.pixels = null;
    }

    show() {
        const matrixAction = document.querySelector('.matrix-action');
        if (matrixAction) {
            matrixAction.style.display = 'flex';
        }
    }

    hide() {
        const matrixAction = document.querySelector('.matrix-action');
        if (matrixAction) {
            matrixAction.style.display = 'none';
        }
    }
}

// Global matrix instance
let globalMatrix = null;

// Matrix visibility functions
function toggleMatrix(enabled) {
    if (enabled) {
        showMatrix();
    } else {
        hideMatrix();
    }
    localStorage.setItem('matrixEnabled', enabled);
    if (typeof window.markSettingsSectionDirty === 'function') {
        window.markSettingsSectionDirty('extras');
    }
}

function showMatrix() {
    const matrixContainer = document.getElementById('matrix-display');
    const matrixAction = document.querySelector('.matrix-action');
    
    if (matrixAction) {
        matrixAction.style.display = 'flex';
    }
    
    if (matrixContainer && !globalMatrix) {
        globalMatrix = new Matrix(matrixContainer, {
            rows: 7,
            cols: 7,
            fps: 20,
            size: 8,
            gap: 1,
            brightness: 0.8
        });
    }
}

function hideMatrix() {
    const matrixAction = document.querySelector('.matrix-action');
    if (matrixAction) {
        matrixAction.style.display = 'none';
    }
    
    if (globalMatrix) {
        globalMatrix.destroy();
        globalMatrix = null;
    }
}

// Initialize Matrix when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if matrix is enabled (default: true)
    const matrixEnabled = localStorage.getItem('matrixEnabled') !== 'false';
    
    if (matrixEnabled) {
        showMatrix();
    } else {
        hideMatrix();
    }
    
    // Update settings toggle if it exists
    const matrixToggle = document.getElementById('matrixDisplay');
    if (matrixToggle) {
        matrixToggle.checked = matrixEnabled;
    }
});
