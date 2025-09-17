// server.js - Production Backend Server for CrossRealm Gaming
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const compression = require('compression');
require('dotenv').config();

// Initialize Express App
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: ['http://localhost:3000', 'https://crossrealm.netlify.app'],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

app.use(helmet());
app.use(cors({
    origin: ['http://localhost:3000', 'https://crossrealm.netlify.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(compression());
app.use(express.json());  // Keep only one
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Contract configuration endpoint
app.get('/api/config', (req, res) => {
    res.json({
        contractAddress: CONTRACT_ADDRESS,
        networkId: 1116,
        rpcUrl: process.env.CORE_RPC_URL || 'https://rpc.coredao.org/',
        networkName: 'Core Blockchain Mainnet'
    });
});

// Contract interaction routes
app.post('/api/contract/create-game', async (req, res) => {
    try {
        const { gameType, stake } = req.body;
        res.json({
            success: true,
            message: 'Game creation initiated',
            contractAddress: CONTRACT_ADDRESS,
            gameType,
            stake
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Basic Routes
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.get('/api/stats', (req, res) => {
    res.json({
        onlinePlayers: Math.floor(Math.random() * 500) + 200,
        activeGames: Math.floor(Math.random() * 100) + 50,
        dailyVolume: (Math.random() * 1000 + 500).toFixed(1),
        totalPrizePool: (Math.random() * 500 + 300).toFixed(1)
    });
});

// Contract configuration
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const CONTRACT_ABI = [
    "function createGame(uint8 gameType) external payable",
    "function joinGame(uint256 gameId) external payable", 
    "function completeGame(uint256 gameId, uint8 result) external",
    "function withdraw(uint256 amount) external",
    "function getGame(uint256 gameId) external view returns (tuple)",
    "function getPlayerBalance(address player) external view returns (uint256)",
    "function gameCounter() external view returns (uint256)",
    "event GameCreated(uint256 indexed gameId, address indexed creator, uint8 gameType, uint256 stake)",
    "event GameJoined(uint256 indexed gameId, address indexed player2, uint256 totalStake)",
    "event GameCompleted(uint256 indexed gameId, address indexed winner, uint8 result, uint256 prize)"
];

// Contract interaction routes
app.post('/api/contract/create-game', async (req, res) => {
    try {
        const { gameType, stake } = req.body;
        
        // This would interact with your deployed contract
        // For now, return success response
        res.json({
            success: true,
            message: 'Game creation initiated',
            contractAddress: CONTRACT_ADDRESS,
            gameType,
            stake
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/contract/games/:gameId', async (req, res) => {
    try {
        const { gameId } = req.params;
        
        // This would query your deployed contract
        res.json({
            gameId,
            contractAddress: CONTRACT_ADDRESS,
            // Game data would come from contract
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/contract/balance/:address', async (req, res) => {
    try {
        const { address } = req.params;
        
        // Query player balance from your contract
        res.json({
            address,
            balance: "0.0000",
            contractAddress: CONTRACT_ADDRESS
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Game state management
const gameRooms = new Map();
const activeGames = new Map();
const playerSessions = new Map();

// Chess board initialization
function initializeBoard(gameType) {
    if (gameType === 'chess') {
        return [
            ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
            ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
            ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
        ];
    } else if (gameType === 'checkers') {
        const board = Array(8).fill(null).map(() => Array(8).fill(null));
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 8; col++) {
                if ((row + col) % 2 === 1) {
                    board[row][col] = 'b';
                }
            }
        }
        for (let row = 5; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if ((row + col) % 2 === 1) {
                    board[row][col] = 'r';
                }
            }
        }
        return board;
    }
}

// Add all the validateMove, applyMove, checkGameEnd functions here...

// Move validation function - add this right after initializeBoard
function validateMove(board, from, to, gameType, player) {
    const [fromRow, fromCol] = from;
    const [toRow, toCol] = to;
    const piece = board[fromRow][fromCol];
    
    if (!piece) return false;
    
    if (gameType === 'chess') {
        return validateChessMove(board, from, to, piece, player);
    } else {
        return validateCheckersMove(board, from, to, piece, player);
    }
}

// Chess validation - add this after validateMove
function validateChessMove(board, from, to, piece, player) {
    const [fromRow, fromCol] = from;
    const [toRow, toCol] = to;
    
    const isWhite = piece === piece.toUpperCase();
    const isPlayerPiece = (player === 0 && isWhite) || (player === 1 && !isWhite);
    
    if (!isPlayerPiece) return false;
    
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    
    switch (piece.toLowerCase()) {
        case 'p':
            const direction = isWhite ? -1 : 1;
            const startRow = isWhite ? 6 : 1;
            
            if (fromCol === toCol) {
                if (toRow === fromRow + direction && !board[toRow][toCol]) return true;
                if (fromRow === startRow && toRow === fromRow + 2 * direction && !board[toRow][toCol]) return true;
            } else if (colDiff === 1 && toRow === fromRow + direction && board[toRow][toCol]) {
                return true;
            }
            return false;
        case 'r':
            return (rowDiff === 0 || colDiff === 0) && isPathClear(board, from, to);
        case 'n':
            return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
        case 'b':
            return rowDiff === colDiff && isPathClear(board, from, to);
        case 'q':
            return (rowDiff === 0 || colDiff === 0 || rowDiff === colDiff) && isPathClear(board, from, to);
        case 'k':
            return rowDiff <= 1 && colDiff <= 1;
        default:
            return false;
    }
}

// Checkers validation - add this after validateChessMove
function validateCheckersMove(board, from, to, piece, player) {
    const [fromRow, fromCol] = from;
    const [toRow, toCol] = to;
    
    const isRedPiece = piece.toLowerCase() === 'r';
    const isPlayerPiece = (player === 0 && isRedPiece) || (player === 1 && !isRedPiece);
    
    if (!isPlayerPiece) return false;
    
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    
    if (rowDiff !== colDiff) return false;
    if (board[toRow][toCol]) return false;
    
    if (rowDiff === 1) {
        if (piece === 'r' && toRow <= fromRow) return false;
        if (piece === 'b' && toRow >= fromRow) return false;
        return true;
    }
    
    if (rowDiff === 2) {
        const middleRow = (fromRow + toRow) / 2;
        const middleCol = (fromCol + toCol) / 2;
        const middlePiece = board[middleRow][middleCol];
        
        if (!middlePiece) return false;
        
        const isMiddleRed = middlePiece.toLowerCase() === 'r';
        const isOpponentPiece = (isRedPiece && !isMiddleRed) || (!isRedPiece && isMiddleRed);
        
        return isOpponentPiece;
    }
    
    return false;
}

// Path checking helper - add this after validateCheckersMove
function isPathClear(board, from, to) {
    const [fromRow, fromCol] = from;
    const [toRow, toCol] = to;
    
    const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
    const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;
    
    let currentRow = fromRow + rowStep;
    let currentCol = fromCol + colStep;
    
    while (currentRow !== toRow || currentCol !== toCol) {
        if (board[currentRow][currentCol]) return false;
        currentRow += rowStep;
        currentCol += colStep;
    }
    
    return true;
}

// Apply move function - add this after isPathClear
function applyMove(board, from, to, gameType) {
    if (gameType === 'checkers') {
        return applyCheckersMove(board, from, to);
    } else {
        const newBoard = board.map(row => [...row]);
        const [fromRow, fromCol] = from;
        const [toRow, toCol] = to;
        
        newBoard[toRow][toCol] = newBoard[fromRow][fromCol];
        newBoard[fromRow][fromCol] = null;
        
        return newBoard;
    }
}

// Checkers move application - add this after applyMove
function applyCheckersMove(board, from, to) {
    const newBoard = board.map(row => [...row]);
    const [fromRow, fromCol] = from;
    const [toRow, toCol] = to;
    
    const piece = newBoard[fromRow][fromCol];
    newBoard[toRow][toCol] = piece;
    newBoard[fromRow][fromCol] = null;
    
    const rowDiff = Math.abs(toRow - fromRow);
    if (rowDiff === 2) {
        const middleRow = (fromRow + toRow) / 2;
        const middleCol = (fromCol + toCol) / 2;
        newBoard[middleRow][middleCol] = null;
    }
    
    if (piece === 'r' && toRow === 0) {
        newBoard[toRow][toCol] = 'R';
    } else if (piece === 'b' && toRow === 7) {
        newBoard[toRow][toCol] = 'B';
    }
    
    return newBoard;
}

// Game end checking - add this after applyCheckersMove
function checkGameEnd(gameState) {
    if (gameState.gameType === 'checkers') {
        return checkCheckersGameEnd(gameState);
    } else {
        return checkChessGameEnd(gameState);
    }
}

// Chess game end check - add this after checkGameEnd
function checkChessGameEnd(gameState) {
    const hasPlayerPieces = (player) => {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = gameState.board[row][col];
                if (piece) {
                    const isWhite = piece === piece.toUpperCase();
                    if ((player === 0 && isWhite) || (player === 1 && !isWhite)) {
                        return true;
                    }
                }
            }
        }
        return false;
    };
    
    if (!hasPlayerPieces(0)) {
        return { isGameOver: true, winner: 1, reason: 'Player 1 captured all pieces' };
    }
    if (!hasPlayerPieces(1)) {
        return { isGameOver: true, winner: 0, reason: 'Player 2 captured all pieces' };
    }
    
    return { isGameOver: false };
}

// Checkers game end check - add this after checkChessGameEnd
function checkCheckersGameEnd(gameState) {
    let redPieces = 0;
    let blackPieces = 0;
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = gameState.board[row][col];
            if (piece) {
                if (piece.toLowerCase() === 'r') redPieces++;
                if (piece.toLowerCase() === 'b') blackPieces++;
            }
        }
    }
    
    if (redPieces === 0) {
        return { isGameOver: true, winner: 1, reason: 'Black captured all red pieces' };
    }
    if (blackPieces === 0) {
        return { isGameOver: true, winner: 0, reason: 'Red captured all black pieces' };
    }
    
    return { isGameOver: false };
}

// Blockchain settlement - add this after checkCheckersGameEnd
async function settleGame(gameId, winnerIndex) {
    try {
        const gameState = activeGames.get(gameId);
        if (!gameState) return;
        
        const provider = new ethers.providers.JsonRpcProvider(process.env.CORE_RPC_URL);
        const wallet = new ethers.Wallet(process.env.ORACLE_PRIVATE_KEY, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
        
        const tx = await contract.completeGame(gameId, winnerIndex, { gasLimit: 200000 });
        console.log('Settlement transaction:', tx.hash);
        await tx.wait();
        console.log('Game settled on blockchain:', gameId);
        
    } catch (error) {
        console.error('Settlement failed:', error);
    }
}

// Enhanced WebSocket handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // Player authentication
    socket.on('authenticate', async (data) => {
        const { walletAddress, signature } = data;
        // Verify wallet signature here
        socket.walletAddress = walletAddress;
        playerSessions.set(walletAddress, socket.id);
        socket.emit('authenticated', { success: true });
    });
    
    // Join game room
    socket.on('joinGame', async (gameId) => {
        try {
            let gameState = activeGames.get(gameId);
            
            if (!gameState) {
                // Initialize new game
                gameState = {
                    id: gameId,
                    players: [],
                    board: initializeBoard('chess'), // or 'checkers'
                    currentPlayer: 0,
                    status: 'waiting',
                    moveHistory: [],
                    createdAt: new Date()
                };
                activeGames.set(gameId, gameState);
            }
            
            // Add player to game
            if (gameState.players.length < 2 && !gameState.players.includes(socket.walletAddress)) {
                gameState.players.push(socket.walletAddress);
                socket.join(`game-${gameId}`);
                
                if (gameState.players.length === 2) {
                    gameState.status = 'active';
                    io.to(`game-${gameId}`).emit('gameStarted', gameState);
                }
                
                socket.emit('gameJoined', gameState);
                socket.to(`game-${gameId}`).emit('playerJoined', {
                    player: socket.walletAddress,
                    gameState
                });
            }
        } catch (error) {
            socket.emit('error', { message: 'Failed to join game' });
        }
    });
    
    // Handle moves
    socket.on('makeMove', async (data) => {
        try {
            const { gameId, from, to, piece } = data;
            const gameState = activeGames.get(gameId);
            
            if (!gameState || gameState.status !== 'active') {
                return socket.emit('error', { message: 'Game not active' });
            }
            
            // Verify player turn
            const playerIndex = gameState.players.indexOf(socket.walletAddress);
            if (playerIndex !== gameState.currentPlayer) {
                return socket.emit('error', { message: 'Not your turn' });
            }
            
            // Validate move
            const isValidMove = validateMove(gameState.board, from, to, gameState.gameType, playerIndex);
            if (!isValidMove) {
                return socket.emit('error', { message: 'Invalid move' });
            }
            
            // Apply move
            gameState.board = applyMove(gameState.board, from, to);
            gameState.moveHistory.push({ from, to, player: playerIndex, timestamp: new Date() });
            gameState.currentPlayer = (gameState.currentPlayer + 1) % 2;
            
            // Check for game end
            const gameResult = checkGameEnd(gameState);
            if (gameResult.isGameOver) {
                gameState.status = 'completed';
                gameState.winner = gameResult.winner;
                gameState.endReason = gameResult.reason;
                
                // Trigger blockchain settlement
                await settleGame(gameId, gameResult.winner);
                
                io.to(`game-${gameId}`).emit('gameEnded', {
                    gameState,
                    winner: gameResult.winner,
                    reason: gameResult.reason
                });
            } else {
                // Broadcast move to all players
                io.to(`game-${gameId}`).emit('moveMade', {
                    gameState,
                    move: { from, to, player: playerIndex }
                });
            }
            
        } catch (error) {
            socket.emit('error', { message: 'Move failed' });
        }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
        if (socket.walletAddress) {
            playerSessions.delete(socket.walletAddress);
        }
    });
});

// Start Server
const PORT = process.env.PORT || 5000;

// Connect to MongoDB (optional for now)
if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI)
        .then(() => console.log('✅ Connected to MongoDB'))
        .catch(err => console.log('⚠️ MongoDB connection failed:', err.message));
}

// Serve static files
app.use(express.static('public'));

// Serve the main game interface
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

server.listen(PORT, () => {
    console.log(`🚀 CrossRealm Gaming Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
