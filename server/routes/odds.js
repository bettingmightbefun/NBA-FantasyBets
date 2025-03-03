const express = require('express');
const router = express.Router();
const { 
  getUpcomingGames, 
  getGameById, 
  getLiveGames, 
  getFinishedGames 
} = require('../controllers/oddsController');
const { protect } = require('../middleware/auth');

// Protected routes
router.get('/', protect, getUpcomingGames);
router.get('/live', protect, getLiveGames);
router.get('/finished', protect, getFinishedGames);
router.get('/:id', protect, getGameById);

module.exports = router; 