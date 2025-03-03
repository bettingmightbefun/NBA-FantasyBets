import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  styled,
} from '@mui/material';
import { Search as SearchIcon, Refresh as RefreshIcon, ArrowForwardIos as ArrowIcon } from '@mui/icons-material';
import { oddsAPI } from '../services/api';
import { formatDate, formatTime, formatOdds } from '../utils/formatters';

// Styled components for the modern design
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: '16px 8px',
  borderBottom: `1px solid ${theme.palette.divider}`,
  '&.header': {
    backgroundColor: theme.palette.mode === 'dark' ? '#1A1A1A' : theme.palette.grey[100],
    color: theme.palette.text.secondary,
    fontSize: '0.75rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? '#2A2A2A' : theme.palette.grey[50],
    cursor: 'pointer',
  },
}));

const OddsButton = styled(Button)(({ theme }) => ({
  width: '100%',
  justifyContent: 'center',
  borderRadius: 4,
  padding: '8px',
  backgroundColor: theme.palette.mode === 'dark' ? '#2A2A2A' : theme.palette.grey[100],
  color: theme.palette.text.primary,
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? '#3A3A3A' : theme.palette.grey[200],
  },
}));

const TeamLogo = styled('div')(({ theme }) => ({
  width: 30,
  height: 30,
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: theme.spacing(1),
}));

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
        // Sort games by start time
        const sortedGames = [...response.data].sort((a, b) => 
          new Date(a.startTime) - new Date(b.startTime)
        );
        
        setGames(sortedGames);
        setFilteredGames(sortedGames);
        console.log(`Loaded ${sortedGames.length} games`);
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
    console.log('Manually refreshing games...');
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    fetchGames();

    // Set up polling to refresh odds every 15 minutes
    const intervalId = setInterval(fetchGames, 15 * 60 * 1000);

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

  // Get team abbreviation
  const getTeamAbbreviation = (teamName) => {
    const words = teamName.split(' ');
    if (words.length === 1) return teamName.substring(0, 3).toUpperCase();
    return words[words.length - 1].substring(0, 3).toUpperCase();
  };

  // Format time for display
  const getGameTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

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
        NBA Odds
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

      {/* Tabs for leagues */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="NBA" />
          <Tab label="MLB" disabled />
          <Tab label="NFL" disabled />
          <Tab label="NHL" disabled />
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
            
            <TableContainer component={Paper} sx={{ mb: 3, backgroundColor: 'background.paper' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <StyledTableCell className="header" width="40%">TEAMS</StyledTableCell>
                    <StyledTableCell className="header" align="center" width="20%">SPREAD</StyledTableCell>
                    <StyledTableCell className="header" align="center" width="20%">MONEY</StyledTableCell>
                    <StyledTableCell className="header" align="center" width="20%">TOTAL</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {groupedGames[date].map((game) => (
                    <React.Fragment key={game._id}>
                      {/* Away Team Row */}
                      <StyledTableRow 
                        component={RouterLink} 
                        to={`/games/${game._id}`}
                        sx={{ textDecoration: 'none' }}
                      >
                        <StyledTableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <TeamLogo>{getTeamAbbreviation(game.awayTeam)}</TeamLogo>
                            <Box>
                              <Typography variant="body1">{game.awayTeam}</Typography>
                              <Typography variant="caption" color="text.secondary">@</Typography>
                            </Box>
                          </Box>
                        </StyledTableCell>
                        <StyledTableCell align="center">
                          <OddsButton>
                            <Box>
                              <Typography variant="body2">
                                {game.odds?.spread?.away > 0 ? '+' : ''}{game.odds?.spread?.away}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatOdds(game.odds?.spread?.awayOdds)}
                              </Typography>
                            </Box>
                          </OddsButton>
                        </StyledTableCell>
                        <StyledTableCell align="center">
                          <OddsButton>
                            <Typography variant="body2">
                              {game.odds?.moneyline?.away > 0 ? '+' : ''}{game.odds?.moneyline?.away}
                            </Typography>
                          </OddsButton>
                        </StyledTableCell>
                        <StyledTableCell align="center">
                          <OddsButton>
                            <Box>
                              <Typography variant="body2">
                                O {game.odds?.total?.over}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatOdds(game.odds?.total?.overOdds)}
                              </Typography>
                            </Box>
                          </OddsButton>
                        </StyledTableCell>
                      </StyledTableRow>

                      {/* Home Team Row */}
                      <StyledTableRow 
                        component={RouterLink} 
                        to={`/games/${game._id}`}
                        sx={{ textDecoration: 'none', borderBottom: '8px solid transparent' }}
                      >
                        <StyledTableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <TeamLogo>{getTeamAbbreviation(game.homeTeam)}</TeamLogo>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography variant="body1">{game.homeTeam}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {getGameTime(game.startTime)} ET
                              </Typography>
                            </Box>
                          </Box>
                        </StyledTableCell>
                        <StyledTableCell align="center">
                          <OddsButton>
                            <Box>
                              <Typography variant="body2">
                                {game.odds?.spread?.home > 0 ? '+' : ''}{game.odds?.spread?.home}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatOdds(game.odds?.spread?.homeOdds)}
                              </Typography>
                            </Box>
                          </OddsButton>
                        </StyledTableCell>
                        <StyledTableCell align="center">
                          <OddsButton>
                            <Typography variant="body2">
                              {game.odds?.moneyline?.home > 0 ? '+' : ''}{game.odds?.moneyline?.home}
                            </Typography>
                          </OddsButton>
                        </StyledTableCell>
                        <StyledTableCell align="center">
                          <OddsButton>
                            <Box>
                              <Typography variant="body2">
                                U {game.odds?.total?.under}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatOdds(game.odds?.total?.underOdds)}
                              </Typography>
                            </Box>
                          </OddsButton>
                        </StyledTableCell>
                      </StyledTableRow>
                      
                      {/* More wagers row */}
                      <StyledTableRow>
                        <StyledTableCell colSpan={4} sx={{ textAlign: 'right', py: 0.5 }}>
                          <Button 
                            component={RouterLink}
                            to={`/games/${game._id}`}
                            endIcon={<ArrowIcon fontSize="small" />}
                            size="small"
                            sx={{ textTransform: 'none' }}
                          >
                            More wagers
                          </Button>
                        </StyledTableCell>
                      </StyledTableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ))
      )}
    </Box>
  );
};

export default BettingPage; 