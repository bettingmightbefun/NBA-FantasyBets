import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Typography,
  Alert,
  Chip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  SportsCricket as BettingIcon,
  History as HistoryIcon,
  Leaderboard as LeaderboardIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { oddsAPI, betAPI } from '../services/api';
import { formatDate, formatTime, formatOdds } from '../utils/formatters';

// Turn off all debug logging
const DEBUG = false;

const Dashboard = () => {
  const { user } = useAuth();
  const [upcomingGames, setUpcomingGames] = useState([]);
  const [recentBets, setRecentBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Only fetch data once on mount and when refresh is clicked
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (!isMounted) return;
      
      try {
        setLoading(true);
        setError('');
        
        // Fetch upcoming games
        const gamesResponse = await oddsAPI.getUpcomingGames();
        if (!isMounted) return;
        setUpcomingGames(gamesResponse.data.slice(0, 5));
        
        // Fetch recent bets
        const betsResponse = await betAPI.getUserBets();
        if (!isMounted) return;
        setRecentBets(betsResponse.data.slice(0, 5));
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching dashboard data:', err.message);
        setError(`Failed to load dashboard data: ${err.response?.data?.message || err.message}`);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [refreshKey]); // Only depend on refreshKey, not on any function

  const handleRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  // Calculate win rate with safety checks
  const winRate = user && user.betsPlaced > 0
    ? Math.round(((user.betsWon || 0) / user.betsPlaced) * 100)
    : 0;

  // Safe access to user properties with defaults
  const userBalance = user?.balance || 0;
  const userBetsPlaced = user?.betsPlaced || 0;
  const userBetsWon = user?.betsWon || 0;
  const userTotalWagered = user?.totalWagered || 0;
  const userTotalWon = user?.totalWon || 0;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading dashboard data...
        </Typography>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="warning">
          User data could not be loaded. Please try logging in again.
        </Alert>
        <Button 
          component={RouterLink} 
          to="/login" 
          variant="contained" 
          sx={{ mt: 2 }}
        >
          Go to Login
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          Dashboard
        </Typography>
        <Button 
          startIcon={<RefreshIcon />} 
          onClick={handleRefresh}
          variant="outlined"
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
          <Button 
            onClick={handleRefresh} 
            size="small" 
            sx={{ ml: 2 }}
          >
            Retry
          </Button>
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Balance
              </Typography>
              <Typography variant="h4" component="div">
                ${userBalance.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Win Rate
              </Typography>
              <Typography variant="h4" component="div">
                {winRate}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {userBetsWon} wins / {userBetsPlaced} bets
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Wagered
              </Typography>
              <Typography variant="h4" component="div">
                ${userTotalWagered.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Won
              </Typography>
              <Typography variant="h4" component="div">
                ${userTotalWon.toFixed(2)}
              </Typography>
              <Typography 
                variant="body2" 
                color={userTotalWon > userTotalWagered ? 'success.main' : 'error.main'}
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                {userTotalWon > userTotalWagered ? (
                  <>
                    <TrendingUpIcon fontSize="small" sx={{ mr: 0.5 }} />
                    Profit: ${(userTotalWon - userTotalWagered).toFixed(2)}
                  </>
                ) : (
                  <>
                    <TrendingDownIcon fontSize="small" sx={{ mr: 0.5 }} />
                    Loss: ${(userTotalWagered - userTotalWon).toFixed(2)}
                  </>
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Links */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Quick Links
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Button
              component={RouterLink}
              to="/betting"
              variant="outlined"
              startIcon={<BettingIcon />}
              fullWidth
              sx={{ py: 1 }}
            >
              Place Bets
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              component={RouterLink}
              to="/history"
              variant="outlined"
              startIcon={<HistoryIcon />}
              fullWidth
              sx={{ py: 1 }}
            >
              Bet History
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              component={RouterLink}
              to="/leaderboard"
              variant="outlined"
              startIcon={<LeaderboardIcon />}
              fullWidth
              sx={{ py: 1 }}
            >
              Leaderboard
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={4}>
        {/* Upcoming Games */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Upcoming Games
              </Typography>
              <Button component={RouterLink} to="/betting" size="small">
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {upcomingGames.length === 0 ? (
              <Typography variant="body1" sx={{ textAlign: 'center', py: 3 }}>
                No upcoming games found.
              </Typography>
            ) : (
              upcomingGames.map((game) => (
                <Box key={game._id} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Grid container alignItems="center">
                    <Grid item xs={12} sm={8}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {game.homeTeam} vs {game.awayTeam}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(game.startTime)} • {formatTime(game.startTime)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4} sx={{ textAlign: 'center', mt: { xs: 2, sm: 0 } }}>
                      <Button
                        component={RouterLink}
                        to={`/betting/${game._id}`}
                        variant="contained"
                        size="small"
                      >
                        Bet Now
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              ))
            )}
          </Paper>
        </Grid>

        {/* Recent Bets */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Recent Bets
              </Typography>
              <Button component={RouterLink} to="/history" size="small">
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {recentBets.length === 0 ? (
              <Typography variant="body1" sx={{ textAlign: 'center', py: 3 }}>
                No recent bets found.
              </Typography>
            ) : (
              recentBets.map((bet) => (
                <Box key={bet._id} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Grid container>
                    <Grid item xs={8}>
                      <Typography variant="subtitle2">
                        {bet.gameDetails?.homeTeam || 'Home'} vs {bet.gameDetails?.awayTeam || 'Away'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {bet.betType}: {bet.betDetails}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(bet.createdAt)}
                      </Typography>
                    </Grid>
                    <Grid item xs={4} sx={{ textAlign: 'right' }}>
                      <Typography variant="subtitle2">
                        ${bet.amount.toFixed(2)}
                      </Typography>
                      <Chip
                        size="small"
                        label={bet.status}
                        color={
                          bet.status === 'Won' ? 'success' :
                          bet.status === 'Lost' ? 'error' :
                          'default'
                        }
                        sx={{ mt: 1 }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              ))
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 