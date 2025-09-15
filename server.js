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

// WebSocket handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
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
