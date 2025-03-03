import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  CircularProgress,
  Avatar,
  Tabs,
  Tab,
  Chip
} from '@mui/material';
import { userAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext';

const Leaderboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await userAPI.getLeaderboard();
        setUsers(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load leaderboard');
        setLoading(false);
        console.error('Error fetching leaderboard:', err);
      }
    };

    fetchLeaderboard();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const calculateWinRate = (won, lost) => {
    const total = won + lost;
    if (total === 0) return 0;
    return (won / total) * 100;
  };

  const sortUsers = (users) => {
    switch (tabValue) {
      case 0: // Balance
        return [...users].sort((a, b) => b.balance - a.balance);
      case 1: // Win Rate
        return [...users].sort((a, b) => 
          calculateWinRate(b.betsWon, b.betsLost) - calculateWinRate(a.betsWon, a.betsLost)
        );
      case 2: // Total Won
        return [...users].sort((a, b) => b.totalWon - a.totalWon);
      default:
        return users;
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading leaderboard...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography variant="h5" color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      </Container>
    );
  }

  const sortedUsers = sortUsers(users);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Leaderboard
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom>
          See how you stack up against other bettors
        </Typography>
      </Box>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="leaderboard tabs"
          centered
        >
          <Tab label="Balance" />
          <Tab label="Win Rate" />
          <Tab label="Total Won" />
        </Tabs>
      </Box>
      
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table aria-label="leaderboard table">
            <TableHead>
              <TableRow>
                <TableCell>Rank</TableCell>
                <TableCell>User</TableCell>
                <TableCell align="right">Balance</TableCell>
                <TableCell align="right">Win Rate</TableCell>
                <TableCell align="right">Bets Won</TableCell>
                <TableCell align="right">Bets Lost</TableCell>
                <TableCell align="right">Total Won</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedUsers.map((userData, index) => {
                const isCurrentUser = userData._id === user?._id;
                const winRate = calculateWinRate(userData.betsWon, userData.betsLost);
                
                return (
                  <TableRow 
                    key={userData._id}
                    sx={{ 
                      backgroundColor: isCurrentUser ? 'rgba(25, 118, 210, 0.08)' : 'inherit',
                      '&:hover': {
                        backgroundColor: isCurrentUser ? 'rgba(25, 118, 210, 0.12)' : 'rgba(0, 0, 0, 0.04)',
                      }
                    }}
                  >
                    <TableCell>
                      {index + 1}
                      {index < 3 && (
                        <Box component="span" sx={{ ml: 1 }}>
                          {index === 0 && '🥇'}
                          {index === 1 && '🥈'}
                          {index === 2 && '🥉'}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          sx={{ 
                            width: 32, 
                            height: 32, 
                            mr: 1,
                            bgcolor: `#${((Math.random() * 0xffffff) << 0).toString(16).padStart(6, '0')}`
                          }}
                        >
                          {userData.username.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          {userData.username}
                          {isCurrentUser && (
                            <Chip 
                              label="You" 
                              size="small" 
                              color="primary" 
                              sx={{ ml: 1, height: 20 }} 
                            />
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="right">{formatCurrency(userData.balance)}</TableCell>
                    <TableCell align="right">{winRate.toFixed(1)}%</TableCell>
                    <TableCell align="right">{userData.betsWon}</TableCell>
                    <TableCell align="right">{userData.betsLost}</TableCell>
                    <TableCell align="right">{formatCurrency(userData.totalWon)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default Leaderboard; 