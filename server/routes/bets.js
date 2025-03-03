const express = require('express');
const router = express.Router();
const { 
  placeBet, 
  getUserBets, 
  getBetById, 
  cancelBet 
} = require('../controllers/betController');
const { protect } = require('../middleware/auth');

// Protected routes
router.post('/', protect, placeBet);
router.get('/', protect, getUserBets);
router.get('/:id', protect, getBetById);
router.delete('/:id', protect, cancelBet);

module.exports = router; 