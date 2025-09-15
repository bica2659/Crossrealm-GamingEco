// models/index.js - Database Models for CrossRealm Gaming
const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
    walletAddress: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    username: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 20
    },
    stats: {
        gamesPlayed: { type: Number, default: 0 },
        gamesWon: { type: Number, default: 0 },
        rating: { type: Number, default: 1500 },
        totalWinnings: { type: Number, default: 0 }
    },
    createdAt: { type: Date, default: Date.now },
    lastActive: { type: Date, default: Date.now }
});

// Game Schema
const gameSchema = new mongoose.Schema({
    gameType: {
        type: String,
        required: true,
        enum: ['chess', 'checkers']
    },
    players: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    stake: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: 'waiting',
        enum: ['waiting', 'active', 'completed', 'cancelled']
    },
    winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: { type: Date, default: Date.now }
});

// Create Models
const User = mongoose.model('User', userSchema);
const Game = mongoose.model('Game', gameSchema);

module.exports = { User, Game };
