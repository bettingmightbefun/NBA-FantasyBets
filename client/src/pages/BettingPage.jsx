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
  useTheme,
} from '@mui/material';
import { Search as SearchIcon, Refresh as RefreshIcon, ArrowForwardIos as ArrowIcon } from '@mui/icons-material';
import { oddsAPI } from '../services/api';
import { formatDate, formatTime, formatOdds } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

// Styled components for the modern design
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: '12px 8px',
  borderBottom: '1px solid rgba(81, 81, 81, 0.5)',
  color: theme.palette.common.white,
  '&.header': {
    backgroundColor: '#121212',
    color: '#999',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    padding: '8px',
  },
}));

const StyledTableRow = styled(TableRow)(() => ({
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    cursor: 'pointer',
  },
  '&.divider': {
    borderBottom: '8px solid #121212',
  },
  textDecoration: 'none',
}));

const OddsValue = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: '8px 0',
  borderRadius: 0,
  width: '100%',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
}));

const TeamLogo = styled(Box)(({ bgcolor }) => ({
  width: 32,
  height: 32,
  borderRadius: '50%',
  backgroundColor: bgcolor || '#1976d2',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 12,
  color: 'white',
  fontWeight: 'bold',
  fontSize: '0.75rem',
}));

const DateHeader = styled(Typography)(({ theme }) => ({
  padding: '12px 16px',
  backgroundColor: '#000',
  color: theme.palette.common.white,
  fontWeight: 'bold',
}));

const MoreWagersLink = styled(Button)(() => ({
  color: '#4dabf5',
  textTransform: 'none',
  justifyContent: 'flex-end',
  padding: '4px 16px',
  '&:hover': {
    backgroundColor: 'transparent',
    textDecoration: 'underline',
  },
}));

// Team color mapping
const teamColors = {
  'Portland Trail Blazers': '#E03A3E',
  'Philadelphia 76ers': '#006BB6',
  'Golden State Warriors': '#1D428A',
  'Charlotte Hornets': '#1D1160',
  'Washington Wizards': '#002B5C',
  'Miami Heat': '#98002E',
  'Atlanta Hawks': '#E03A3E',
  'Memphis Grizzlies': '#5D76A9',
  'Houston Rockets': '#CE1141',
  'Oklahoma City Thunder': '#007AC1',
  'Sacramento Kings': '#5A2D81',
  'Dallas Mavericks': '#00538C',
  'Detroit Pistons': '#C8102E',
  'Utah Jazz': '#002B5C',
  'Toronto Raptors': '#CE1141',
  'Orlando Magic': '#0077C0',
  'Milwaukee Bucks': '#00471B',
  'New York Knicks': '#F58426',
  'Cleveland Cavaliers': '#860038',
  'Chicago Bulls': '#CE1141',
  'Los Angeles Lakers': '#552583',
  'Boston Celtics': '#007A33',
  'Brooklyn Nets': '#000000',
  'Denver Nuggets': '#0E2240',
  'Indiana Pacers': '#002D62',
  'Los Angeles Clippers': '#C8102E',
  'Minnesota Timberwolves': '#0C2340',
  'New Orleans Pelicans': '#0C2340',
  'Phoenix Suns': '#1D1160',
  'San Antonio Spurs': '#C4CED4',
};

const BettingPage = () => {
  const theme = useTheme();
  const { user, refreshUserData } = useAuth();
  const [games, setGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  // Refresh user data when component mounts
  useEffect(() => {
    refreshUserData().catch(err => {
      console.error('Error refreshing user data:', err);
    });
  }, [refreshUserData]);

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
    
    // For teams with multiple words, use the last word or a custom abbreviation
    if (teamName.includes('Trail Blazers')) return 'BLA';
    if (teamName.includes('76ers')) return '76E';
    if (teamName.includes('Warriors')) return 'WAR';
    if (teamName.includes('Hornets')) return 'HOR';
    if (teamName.includes('Wizards')) return 'WIZ';
    if (teamName.includes('Heat')) return 'HEA';
    
    return words[words.length - 1].substring(0, 3).toUpperCase();
  };

  // Get team color
  const getTeamColor = (teamName) => {
    return teamColors[teamName] || theme.palette.primary.main;
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
    <Box sx={{ bgcolor: '#121212', color: 'white', minHeight: '100vh' }}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ width: '100%', mb: 4 }}>
          {/* Page Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Betting
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ mr: 3, color: 'primary.main' }}>
                Balance: ${user?.balance?.toFixed(2) || '0.00'}
              </Typography>
              <Button 
                variant="outlined" 
                startIcon={<RefreshIcon />} 
                onClick={handleRefresh}
                disabled={loading}
              >
                Refresh
              </Button>
            </Box>
          </Box>

          {/* Search and Filter */}
          <Box sx={{ mb: 3 }}>
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
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.23)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                      },
                    },
                    '& .MuiInputAdornment-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                  <Typography variant="body2" color="rgba(255, 255, 255, 0.7)" sx={{ mr: 1 }}>
                    Last updated:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium" color="white">
                    {new Date().toLocaleTimeString()}
                  </Typography>
                  <Chip
                    label="Live Odds"
                    color="primary"
                    size="small"
                    sx={{ ml: 2 }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Box>

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
          <Paper sx={{ mb: 3, bgcolor: '#1E1E1E' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-selected': {
                    color: 'white',
                  },
                },
              }}
            >
              <Tab label="NBA" />
              <Tab label="MLB" disabled />
              <Tab label="NFL" disabled />
              <Tab label="NHL" disabled />
            </Tabs>
          </Paper>

          {filteredGames.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 5, color: 'white' }}>
              <Typography variant="h6" color="rgba(255, 255, 255, 0.7)" gutterBottom>
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
                <DateHeader variant="subtitle1">
                  {date}
                </DateHeader>
                
                <TableContainer sx={{ bgcolor: '#1E1E1E' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <StyledTableCell className="header" width="40%">TEAMS</StyledTableCell>
                        <StyledTableCell className="header" align="center" width="20%">SPREAD</StyledTableCell>
                        <StyledTableCell className="header" align="center" width="20%">MONEY (DECIMAL)</StyledTableCell>
                        <StyledTableCell className="header" align="center" width="20%">TOTAL</StyledTableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {groupedGames[date].map((game, index) => (
                        <React.Fragment key={game._id}>
                          {/* Away Team Row */}
                          <StyledTableRow 
                            component={RouterLink} 
                            to={`/games/${game._id}`}
                            sx={{ textDecoration: 'none' }}
                          >
                            <StyledTableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <TeamLogo bgcolor={getTeamColor(game.awayTeam)}>
                                  {getTeamAbbreviation(game.awayTeam)}
                                </TeamLogo>
                                <Box>
                                  <Typography variant="body2" color="white">{game.awayTeam}</Typography>
                                  <Typography variant="caption" color="rgba(255, 255, 255, 0.5)">@</Typography>
                                </Box>
                              </Box>
                            </StyledTableCell>
                            <StyledTableCell align="center">
                              <OddsValue>
                                <Typography variant="body2" color="white">
                                  {game.odds?.spread?.away > 0 ? '+' : ''}{game.odds?.spread?.away}
                                </Typography>
                                <Typography variant="caption" color="rgba(255, 255, 255, 0.5)">
                                  {formatOdds(game.odds?.spread?.awayOdds)}
                                </Typography>
                              </OddsValue>
                            </StyledTableCell>
                            <StyledTableCell align="center">
                              <OddsValue>
                                <Typography variant="body1" fontWeight="bold" color="white">
                                  {formatOdds(game.odds?.moneyline?.away)}
                                </Typography>
                              </OddsValue>
                            </StyledTableCell>
                            <StyledTableCell align="center">
                              <OddsValue>
                                <Typography variant="body2" color="white">
                                  O {game.odds?.total?.over}
                                </Typography>
                                <Typography variant="caption" color="rgba(255, 255, 255, 0.5)">
                                  {formatOdds(game.odds?.total?.overOdds)}
                                </Typography>
                              </OddsValue>
                            </StyledTableCell>
                          </StyledTableRow>

                          {/* Home Team Row */}
                          <StyledTableRow 
                            component={RouterLink} 
                            to={`/games/${game._id}`}
                            className="divider"
                          >
                            <StyledTableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <TeamLogo bgcolor={getTeamColor(game.homeTeam)}>
                                  {getTeamAbbreviation(game.homeTeam)}
                                </TeamLogo>
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                  <Typography variant="body2" color="white">{game.homeTeam}</Typography>
                                  <Typography variant="caption" color="rgba(255, 255, 255, 0.5)">
                                    {getGameTime(game.startTime)} ET
                                  </Typography>
                                </Box>
                              </Box>
                            </StyledTableCell>
                            <StyledTableCell align="center">
                              <OddsValue>
                                <Typography variant="body2" color="white">
                                  {game.odds?.spread?.home > 0 ? '+' : ''}{game.odds?.spread?.home}
                                </Typography>
                                <Typography variant="caption" color="rgba(255, 255, 255, 0.5)">
                                  {formatOdds(game.odds?.spread?.homeOdds)}
                                </Typography>
                              </OddsValue>
                            </StyledTableCell>
                            <StyledTableCell align="center">
                              <OddsValue>
                                <Typography variant="body1" fontWeight="bold" color="white">
                                  {formatOdds(game.odds?.moneyline?.home)}
                                </Typography>
                              </OddsValue>
                            </StyledTableCell>
                            <StyledTableCell align="center">
                              <OddsValue>
                                <Typography variant="body2" color="white">
                                  U {game.odds?.total?.under}
                                </Typography>
                                <Typography variant="caption" color="rgba(255, 255, 255, 0.5)">
                                  {formatOdds(game.odds?.total?.underOdds)}
                                </Typography>
                              </OddsValue>
                            </StyledTableCell>
                          </StyledTableRow>
                          
                          {/* More wagers row */}
                          <StyledTableRow>
                            <StyledTableCell colSpan={4} sx={{ p: 0, borderBottom: index === groupedGames[date].length - 1 ? 'none' : '1px solid rgba(81, 81, 81, 0.5)' }}>
                              <MoreWagersLink 
                                component={RouterLink}
                                to={`/games/${game._id}`}
                                endIcon={<ArrowIcon fontSize="small" />}
                                size="small"
                              >
                                More wagers
                              </MoreWagersLink>
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
      </Box>
    </Box>
  );
};

export default BettingPage; 