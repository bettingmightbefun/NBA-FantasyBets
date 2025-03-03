import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Typography,
  Alert,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Paper,
  Chip,
} from '@mui/material';
import { Search as SearchIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { oddsAPI } from '../services/api';
import { formatDate, formatTime, formatOdds } from '../utils/formatters';

const BettingPage = () => {
  const [games, setGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchGames = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      console.log('Fetching upcoming games...');
      const response = await oddsAPI.getUpcomingGames();
      console.log('API Response:', response);
      console.log('Games data:', response.data);
      
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        setGames(response.data);
        setFilteredGames(response.data);
        console.log(`Loaded ${response.data.length} games`);
      } else {
        console.log('No games found in API response');
        setGames([]);
        setFilteredGames([]);
        setError('No upcoming games found. Please check back later or refresh.');
      }
    } catch (err) {
      console.error('Error fetching games:', err);
      setError('Failed to load upcoming games. Please try again.');
      setGames([]);
      setFilteredGames([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    fetchGames();

    // Set up polling to refresh odds every 5 minutes
    const intervalId = setInterval(fetchGames, 5 * 60 * 1000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [fetchGames, refreshKey]);

  useEffect(() => {
    // Filter games based on search term
    if (searchTerm.trim() === '') {
      setFilteredGames(games);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = games.filter(
        (game) =>
          game.homeTeam.toLowerCase().includes(term) ||
          game.awayTeam.toLowerCase().includes(term)
      );
      setFilteredGames(filtered);
    }
  }, [searchTerm, games]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Group games by date
  const groupGamesByDate = () => {
    const grouped = {};
    
    filteredGames.forEach((game) => {
      const date = new Date(game.startTime).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
      
      if (!grouped[date]) {
        grouped[date] = [];
      }
      
      grouped[date].push(game);
    });
    
    return grouped;
  };

  const groupedGames = groupGamesByDate();
  const dates = Object.keys(groupedGames);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        NBA Betting
      </Typography>

      {/* Search and Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search teams..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                Last updated:
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {new Date().toLocaleTimeString()}
              </Typography>
              <Chip
                label="Live Odds"
                color="primary"
                size="small"
                sx={{ ml: 2 }}
              />
              <Button 
                startIcon={<RefreshIcon />} 
                onClick={handleRefresh} 
                sx={{ ml: 2 }}
                variant="outlined"
                size="small"
              >
                Refresh
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              REFRESH
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Tabs for bet types */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="All Games" />
          <Tab label="Moneyline" />
          <Tab label="Spread" />
          <Tab label="Total" />
        </Tabs>
      </Paper>

      {filteredGames.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No games found matching your search criteria.
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            sx={{ mt: 2 }}
          >
            Refresh Games
          </Button>
        </Box>
      ) : (
        dates.map((date) => (
          <Box key={date} sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              {date}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={3}>
              {groupedGames[date].map((game) => (
                <Grid item xs={12} key={game._id}>
                  <Card sx={{ mb: 2 }}>
                    <CardContent>
                      <Grid container spacing={2}>
                        {/* Game Info */}
                        <Grid item xs={12} md={3}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {game.homeTeam} vs {game.awayTeam}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {formatTime(game.startTime)}
                            </Typography>
                          </Box>
                        </Grid>
                        
                        {/* Moneyline */}
                        <Grid item xs={12} sm={4} md={3}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              Moneyline
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 1 }}>
                              <Box>
                                <Typography variant="body2">{game.homeTeam}</Typography>
                                <Typography variant="body1" fontWeight="bold">
                                  {formatOdds(game.odds?.moneyline?.home)}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="body2">{game.awayTeam}</Typography>
                                <Typography variant="body1" fontWeight="bold">
                                  {formatOdds(game.odds?.moneyline?.away)}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Grid>
                        
                        {/* Spread */}
                        <Grid item xs={12} sm={4} md={3}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              Spread
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 1 }}>
                              <Box>
                                <Typography variant="body2">{game.homeTeam}</Typography>
                                <Typography variant="body1" fontWeight="bold">
                                  {game.odds?.spread?.home} ({formatOdds(game.odds?.spread?.homeOdds)})
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="body2">{game.awayTeam}</Typography>
                                <Typography variant="body1" fontWeight="bold">
                                  {game.odds?.spread?.away} ({formatOdds(game.odds?.spread?.awayOdds)})
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Grid>
                        
                        {/* Total */}
                        <Grid item xs={12} sm={4} md={2}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              Total
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 1 }}>
                              <Box>
                                <Typography variant="body2">Over</Typography>
                                <Typography variant="body1" fontWeight="bold">
                                  {game.odds?.total?.over} ({formatOdds(game.odds?.total?.overOdds)})
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="body2">Under</Typography>
                                <Typography variant="body1" fontWeight="bold">
                                  {game.odds?.total?.under} ({formatOdds(game.odds?.total?.underOdds)})
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Grid>
                        
                        {/* Bet Button */}
                        <Grid item xs={12} md={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Button
                            component={RouterLink}
                            to={`/games/${game._id}`}
                            variant="contained"
                            color="primary"
                            fullWidth
                          >
                            Bet
                          </Button>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))
      )}
    </Box>
  );
};

export default BettingPage; 