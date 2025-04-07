const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

const gridSize = 30; // Increased grid size for words
const tileCount = Math.floor(canvas.width / gridSize);

// Animation properties
let snakeEyeAngle = 0;
let foodBounceOffset = 0;
let foodBounceDirection = 1;
let snakeColors = ['#32CD32', '#228B22', '#006400'];
let particleEffects = [];

// Spanish-English word pairs
const wordPairs = [
    { spanish: 'perro', english: 'dog' },
    { spanish: 'gato', english: 'cat' },
    { spanish: 'casa', english: 'house' },
    { spanish: 'agua', english: 'water' },
    { spanish: 'sol', english: 'sun' },
    { spanish: 'luna', english: 'moon' },
    { spanish: 'libro', english: 'book' },
    { spanish: 'árbol', english: 'tree' },
    { spanish: 'pan', english: 'bread' },
    { spanish: 'leche', english: 'milk' }
];

let currentWordPair = null;

let score = 0;
let snake = [
    { x: 10, y: 10 }
];
let food = {
    x: Math.floor(Math.random() * (tileCount - 2)),
    y: Math.floor(Math.random() * (tileCount - 2)),
    word: wordPairs[Math.floor(Math.random() * wordPairs.length)]
};
let dx = 0;
let dy = 0;
let gameSpeed = 100;
let gameLoop;

document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'ArrowUp':
            if (dy !== 1) { dx = 0; dy = -1; }
            break;
        case 'ArrowDown':
            if (dy !== -1) { dx = 0; dy = 1; }
            break;
        case 'ArrowLeft':
            if (dx !== 1) { dx = -1; dy = 0; }
            break;
        case 'ArrowRight':
            if (dx !== -1) { dx = 1; dy = 0; }
            break;
    }
});

function drawGame() {
    // Move snake
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);

    // Check if snake ate food
    if ((head.x === food.x || head.x === food.x + 1) && head.y === food.y) {
        score += 10;
        scoreElement.textContent = `Score: ${score}`;
        generateFood();
        // Create particle effect on food collection
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            particleEffects.push({
                x: head.x * gridSize + gridSize/2,
                y: head.y * gridSize + gridSize/2,
                dx: Math.cos(angle) * 3,
                dy: Math.sin(angle) * 3,
                life: 20,
                color: '#FFD700'
            });
        }
        // Increase speed
        if (gameSpeed > 50) {
            clearInterval(gameLoop);
            gameSpeed -= 2;
            gameLoop = setInterval(drawGame, gameSpeed);
        }
    } else {
        snake.pop();
    }

    // Check collision with walls or self
    if (isGameOver()) {
        clearInterval(gameLoop);
        alert(`Game Over! Score: ${score}`);
        resetGame();
        return;
    }

    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw particles
    particleEffects = particleEffects.filter(particle => {
        particle.x += particle.dx;
        particle.y += particle.dy;
        particle.life--;
        
        if (particle.life > 0) {
            ctx.fillStyle = particle.color + Math.floor(particle.life * 12).toString(16);
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.life/5, 0, Math.PI * 2);
            ctx.fill();
            return true;
        }
        return false;
    });

    // Draw snake with cartoon style
    snake.forEach((segment, index) => {
        // Gradient snake body
        ctx.fillStyle = snakeColors[index % snakeColors.length];
        ctx.beginPath();
        ctx.roundRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2, 5);
        ctx.fill();

        // Draw eyes on head segment
        if (index === 0) {
            const eyeSize = 4;
            const eyeOffset = 5;
            ctx.fillStyle = 'white';
            
            // Calculate eye positions based on direction
            let leftEyeX = segment.x * gridSize + eyeOffset;
            let rightEyeX = segment.x * gridSize + gridSize - eyeOffset - eyeSize;
            let eyeY = segment.y * gridSize + eyeOffset;
            
            // Draw eyes
            ctx.beginPath();
            ctx.arc(leftEyeX, eyeY, eyeSize, 0, Math.PI * 2);
            ctx.arc(rightEyeX, eyeY, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw pupils
            ctx.fillStyle = 'black';
            const pupilOffset = Math.sin(snakeEyeAngle) * 2;
            ctx.beginPath();
            ctx.arc(leftEyeX + pupilOffset, eyeY, 2, 0, Math.PI * 2);
            ctx.arc(rightEyeX + pupilOffset, eyeY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    
    // Animate snake eyes
    snakeEyeAngle += 0.1;

    // Draw word as food with bounce effect
    foodBounceOffset += 0.2 * foodBounceDirection;
    if (Math.abs(foodBounceOffset) > 3) {
        foodBounceDirection *= -1;
    }

    // Draw word background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.roundRect(
        food.x * gridSize,
        food.y * gridSize + foodBounceOffset,
        gridSize * 2,
        gridSize,
        5
    );
    ctx.fill();

    // Draw Spanish word
    ctx.fillStyle = '#ff4444';
    ctx.font = '16px Comic Sans MS';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
        food.word.spanish,
        food.x * gridSize + gridSize,
        food.y * gridSize + gridSize/2 + foodBounceOffset
    );

    // Draw English translation above
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.font = '14px Arial';
    ctx.fillText(
        food.word.english,
        food.x * gridSize + gridSize,
        food.y * gridSize - 10 + foodBounceOffset
    );
}

function generateFood() {
    // Get a new random word pair
    const newWord = wordPairs[Math.floor(Math.random() * wordPairs.length)];
    
    food = {
        x: Math.floor(Math.random() * (tileCount - 2)), // -2 to ensure space for longer words
        y: Math.floor(Math.random() * (tileCount - 2)),
        word: newWord
    };
    
    // Make sure food doesn't spawn on snake
    while (snake.some(segment => 
        (segment.x === food.x || segment.x === food.x + 1) && 
        segment.y === food.y
    )) {
        food = {
            x: Math.floor(Math.random() * (tileCount - 2)),
            y: Math.floor(Math.random() * (tileCount - 2)),
            word: newWord
        };
    }
}

function isGameOver() {
    // Check wall collision
    if (snake[0].x < 0 || snake[0].x >= tileCount || 
        snake[0].y < 0 || snake[0].y >= tileCount) {
        return true;
    }
    
    // Check self collision
    for (let i = 1; i < snake.length; i++) {
        if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) {
            return true;
        }
    }
    return false;
}

function resetGame() {
    snake = [{ x: 10, y: 10 }];
    food = {
        x: Math.floor(Math.random() * (tileCount - 2)),
        y: Math.floor(Math.random() * (tileCount - 2)),
        word: wordPairs[Math.floor(Math.random() * wordPairs.length)]
    };
    dx = 0;
    dy = 0;
    score = 0;
    scoreElement.textContent = `Score: ${score}`;
    gameSpeed = 100;
    gameLoop = setInterval(drawGame, gameSpeed);
}

// Start the game
resetGame();
