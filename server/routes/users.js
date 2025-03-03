const express = require('express');
const router = express.Router();
const { 
  getUsers, 
  getUserById, 
  updateUser, 
  deleteUser, 
  getUserBets,
  getLeaderboard
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');

// Protected routes
router.get('/bets', protect, getUserBets);
router.get('/leaderboard', protect, getLeaderboard);

// Admin routes
router.get('/', protect, admin, getUsers);
router.get('/:id', protect, admin, getUserById);
router.put('/:id', protect, admin, updateUser);
router.delete('/:id', protect, admin, deleteUser);

module.exports = router; 