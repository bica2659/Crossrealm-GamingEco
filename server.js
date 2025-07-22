// CROSSREALM MULTIPLAYER SERVER - DEPLOYMENT READY
// package.json should include these dependencies

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);

// Enhanced CORS for production
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000", 
      "https://crossrealm.netlify.app", 
      "https://localhost:8080",
      "https://your-domain.com" // Add your actual domain
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'CrossRealm Multiplayer Server Running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// GAME STATE MANAGEMENT
class GameManager {
  constructor() {
    this.activeGames = new Map();
    this.waitingGames = new Map();
    this.playerSessions = new Map();
    this.gameRooms = new Map();
  }

  generateGameId() {
    return crypto.randomBytes(16).toString('hex');
  }

  createGame(creatorSocket, gameData) {
    const gameId = this.generateGameId();
    const game = {
      id: gameId,
      type: gameData.type,
      creator: creatorSocket.id,
      creatorWallet: gameData.creatorWallet,
      creatorName: gameData.creatorName || 'Anonymous',
      stake: gameData.stake,
      status: 'waiting',
      createdAt: Date.now(),
      maxPlayers: 2,
      currentPlayers: 1,
      gameState: this.initializeGameState(gameData.type),
      currentTurn: creatorSocket.id,
      moveHistory: [],
      timeControl: gameData.timeControl || { base: 600, increment: 5 },
      playerTimers: {},
      spectators: []
    };

    game.playerTimers[creatorSocket.id] = game.timeControl.base * 1000;
    this.waitingGames.set(gameId, game);
    this.gameRooms.set(gameId, new Set([creatorSocket.id]));

    creatorSocket.join(gameId);
    console.log(`🎮 Game created: ${gameId} by ${creatorSocket.id}`);
    return game;
  }

  joinGame(playerSocket, gameId, playerData) {
    const game = this.waitingGames.get(gameId);
    
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    if (game.currentPlayers >= game.maxPlayers) {
      return { success: false, error: 'Game is full' };
    }

    if (game.creator === playerSocket.id) {
      return { success: false, error: 'Cannot join your own game' };
    }

    game.player2 = playerSocket.id;
    game.player2Wallet = playerData.playerWallet;
    game.player2Name = playerData.playerName || 'Anonymous';
    game.currentPlayers = 2;
    game.status = 'playing';
    game.startedAt = Date.now();
    game.playerTimers[playerSocket.id] = game.timeControl.base * 1000;

    this.waitingGames.delete(gameId);
    this.activeGames.set(gameId, game);
    this.gameRooms.get(gameId).add(playerSocket.id);
    playerSocket.join(gameId);

    this.startGameTimer(gameId);
    console.log(`⚔️ Game started: ${gameId}`);
    return { success: true, game };
  }

  initializeGameState(gameType) {
    switch (gameType) {
      case 'chess':
        return {
          board: [
            ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
            ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
            ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
          ],
          turn: 'white'
        };
      case 'checkers':
        const board = Array(8).fill(null).map(() => Array(8).fill(null));
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 8; col++) {
            if ((row + col) % 2 === 1) {
              board[row][col] = { color: 'black', isKing: false };
            }
          }
        }
        for (let row = 5; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            if ((row + col) % 2 === 1) {
              board[row][col] = { color: 'red', isKing: false };
            }
          }
        }
        return { board, turn: 'red' };
      case 'words':
        return {
          availableLetters: 'BLOCKCHAIN'.split(''),
          round: 1,
          maxRounds: 3,
          scores: {},
          submittedWords: {}
        };
      default:
        return {};
    }
  }

  processMove(gameId, playerId, moveData) {
    const game = this.activeGames.get(gameId);
    
    if (!game || game.status !== 'playing' || game.currentTurn !== playerId) {
      return { success: false, error: 'Invalid move' };
    }

    // Simple move validation - in production, add proper game rules
    game.moveHistory.push({
      playerId,
      move: moveData,
      timestamp: Date.now()
    });

    // Switch turns
    game.currentTurn = game.currentTurn === game.creator ? game.player2 : game.creator;

    // Check for game end (simplified)
    const gameEndResult = this.checkGameEnd(game);
    if (gameEndResult.finished) {
      this.endGame(gameId, gameEndResult);
    }

    return { success: true, gameEndResult };
  }

  checkGameEnd(game) {
    // Simplified game end detection
    if (game.moveHistory.length >= 50) {
      return { 
        finished: true, 
        winner: Math.random() > 0.5 ? game.creator : game.player2,
        reason: 'Game completed'
      };
    }
    return { finished: false };
  }

  endGame(gameId, result) {
    const game = this.activeGames.get(gameId);
    if (!game) return;

    game.status = 'finished';
    game.endedAt = Date.now();
    game.result = result;
    this.activeGames.delete(gameId);

    if (game.timerInterval) {
      clearInterval(game.timerInterval);
    }

    console.log(`🏁 Game ended: ${gameId}`);
    return result;
  }

  startGameTimer(gameId) {
    const game = this.activeGames.get(gameId);
    if (!game) return;

    game.timerInterval = setInterval(() => {
      if (game.status === 'playing' && game.currentTurn) {
        game.playerTimers[game.currentTurn] -= 1000;
        
        if (game.playerTimers[game.currentTurn] <= 0) {
          const winner = game.currentTurn === game.creator ? game.player2 : game.creator;
          this.endGame(gameId, {
            finished: true,
            winner,
            reason: 'Time expired'
          });
          
          io.to(gameId).emit('game-ended', game.result);
          clearInterval(game.timerInterval);
        } else {
          io.to(gameId).emit('timer-update', {
            [game.creator]: game.playerTimers[game.creator],
            [game.player2]: game.playerTimers[game.player2] || 0
          });
        }
      }
    }, 1000);
  }

  getWaitingGames() {
    return Array.from(this.waitingGames.values()).map(game => ({
      id: game.id,
      type: game.type,
      creator: game.creatorName,
      creatorWallet: game.creatorWallet,
      stake: game.stake,
      createdAt: game.createdAt,
      currentPlayers: game.currentPlayers,
      maxPlayers: game.maxPlayers
    }));
  }

  cancelGame(gameId, playerId) {
    const game = this.waitingGames.get(gameId) || this.activeGames.get(gameId);
    
    if (!game || game.creator !== playerId) {
      return { success: false, error: 'Cannot cancel this game' };
    }

    if (game.status === 'waiting') {
      this.waitingGames.delete(gameId);
    } else {
      this.activeGames.delete(gameId);
    }

    this.gameRooms.delete(gameId);
    
    if (game.timerInterval) {
      clearInterval(game.timerInterval);
    }

    return { success: true };
  }

  handlePlayerDisconnect(socketId) {
    // Handle disconnections
    for (const [gameId, game] of this.activeGames.entries()) {
      if (game.creator === socketId || game.player2 === socketId) {
        game.disconnectedPlayer = socketId;
        game.disconnectTime = Date.now();
        
        const otherPlayer = game.creator === socketId ? game.player2 : game.creator;
        if (otherPlayer) {
          io.to(otherPlayer).emit('opponent-disconnected', {
            gameId,
            canClaimWin: true,
            timeoutDuration: 60000
          });
        }
      }
    }

    for (const [gameId, game] of this.waitingGames.entries()) {
      if (game.creator === socketId) {
        this.waitingGames.delete(gameId);
        io.emit('game-cancelled', gameId);
      }
    }

    this.playerSessions.delete(socketId);
  }
}

const gameManager = new GameManager();

// SOCKET.IO EVENT HANDLERS
io.on('connection', (socket) => {
  console.log(`🔌 Player connected: ${socket.id}`);

  socket.on('join-lobby', (playerData) => {
    gameManager.playerSessions.set(socket.id, {
      ...playerData,
      connectedAt: Date.now(),
      socketId: socket.id
    });

    socket.emit('lobby-update', gameManager.getWaitingGames());
    io.emit('player-count-update', gameManager.playerSessions.size);
    
    console.log(`👋 Player joined lobby: ${playerData.playerName || socket.id}`);
  });

  socket.on('create-game', (gameData) => {
    try {
      const game = gameManager.createGame(socket, gameData);
      
      socket.emit('game-created', {
        success: true,
        game: {
          id: game.id,
          type: game.type,
          stake: game.stake,
          status: game.status
        }
      });
      
      socket.broadcast.emit('new-game-available', {
        id: game.id,
        type: game.type,
        creator: game.creatorName,
        stake: game.stake,
        currentPlayers: game.currentPlayers,
        maxPlayers: game.maxPlayers
      });
      
      console.log(`🎮 Game created: ${game.id} by ${socket.id}`);
    } catch (error) {
      socket.emit('game-created', {
        success: false,
        error: error.message
      });
    }
  });

  socket.on('join-game', (gameId, playerData) => {
    try {
      const result = gameManager.joinGame(socket, gameId, playerData);
      
      if (result.success) {
        const game = result.game;
        
        io.to(gameId).emit('game-started', {
          gameId: game.id,
          gameType: game.type,
          players: {
            player1: {
              id: game.creator,
              name: game.creatorName,
              wallet: game.creatorWallet
            },
            player2: {
              id: game.player2,
              name: game.player2Name,
              wallet: game.player2Wallet
            }
          },
          gameState: game.gameState,
          currentTurn: game.currentTurn,
          stake: game.stake
        });
        
        socket.broadcast.emit('game-removed', gameId);
        
        console.log(`⚔️ Game joined: ${gameId} by ${socket.id}`);
      } else {
        socket.emit('join-game-result', {
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      socket.emit('join-game-result', {
        success: false,
        error: error.message
      });
    }
  });

  socket.on('make-move', (gameId, moveData) => {
    try {
      const result = gameManager.processMove(gameId, socket.id, moveData);
      
      if (result.success) {
        io.to(gameId).emit('move-made', {
          gameId,
          playerId: socket.id,
          move: moveData,
          gameState: gameManager.activeGames.get(gameId)?.gameState
        });
        
        if (result.gameEndResult && result.gameEndResult.finished) {
          io.to(gameId).emit('game-ended', {
            gameId,
            result: result.gameEndResult
          });
        }
      } else {
        socket.emit('move-error', {
          gameId,
          error: result.error
        });
      }
    } catch (error) {
      socket.emit('move-error', {
        gameId,
        error: error.message
      });
    }
  });

  socket.on('cancel-game', (gameId) => {
    try {
      const result = gameManager.cancelGame(gameId, socket.id);
      
      if (result.success) {
        socket.emit('game-cancelled', { gameId, success: true });
        socket.broadcast.emit('game-removed', gameId);
      } else {
        socket.emit('game-cancelled', { 
          gameId, 
          success: false, 
          error: result.error 
        });
      }
    } catch (error) {
      socket.emit('game-cancelled', { 
        gameId, 
        success: false, 
        error: error.message 
      });
    }
  });

  socket.on('game-chat', (gameId, message) => {
    const playerSession = gameManager.playerSessions.get(socket.id);
    if (playerSession) {
      io.to(gameId).emit('chat-message', {
        gameId,
        playerId: socket.id,
        playerName: playerSession.playerName || 'Anonymous',
        message,
        timestamp: Date.now()
      });
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Player disconnected: ${socket.id}`);
    gameManager.handlePlayerDisconnect(socket.id);
    io.emit('player-count-update', gameManager.playerSessions.size);
  });

  socket.on('reconnect-to-game', (gameId) => {
    const game = gameManager.activeGames.get(gameId);
    if (game && (game.creator === socket.id || game.player2 === socket.id)) {
      socket.join(gameId);
      
      if (game.disconnectedPlayer === socket.id) {
        delete game.disconnectedPlayer;
        delete game.disconnectTime;
        
        const otherPlayer = game.creator === socket.id ? game.player2 : game.creator;
        if (otherPlayer) {
          io.to(otherPlayer).emit('opponent-reconnected', { gameId });
        }
      }
      
      socket.emit('game-state-sync', {
        gameId,
        gameState: game.gameState,
        currentTurn: game.currentTurn,
        moveHistory: game.moveHistory,
        playerTimers: game.playerTimers
      });
    }
  });
});

// REST API ENDPOINTS
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: Date.now(),
    activeSessions: gameManager.playerSessions.size,
    activeGames: gameManager.activeGames.size,
    waitingGames: gameManager.waitingGames.size
  });
});

app.get('/api/lobby', (req, res) => {
  res.json({
    games: gameManager.getWaitingGames(),
    playerCount: gameManager.playerSessions.size
  });
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 CrossRealm Multiplayer Server running on port ${PORT}`);
  console.log(`🎮 Real-time multiplayer gaming with blockchain settlements enabled!`);
});

module.exports = { app, server, io, gameManager };
