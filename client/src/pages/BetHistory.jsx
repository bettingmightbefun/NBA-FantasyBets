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
  Chip,
  CircularProgress,
  TablePagination,
  Button,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { betAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext';

const BetHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchBets = async () => {
      try {
        setLoading(true);
        const response = await betAPI.getUserBets();
        
        console.log('Bet response data:', response.data);
        
        if (!response.data || !Array.isArray(response.data)) {
          console.error('Invalid bet data format:', response.data);
          setError('Invalid bet data received from server');
          setLoading(false);
          return;
        }
        
        // Process the bets to ensure proper data formatting
        const processedBets = response.data
          .filter(bet => bet) // Filter out null/undefined bets
          .map(bet => {
            console.log('Processing bet:', bet);
            
            // Ensure we have a valid bet object
            if (!bet || typeof bet !== 'object') {
              console.error('Invalid bet object:', bet);
              return null;
            }
            
            // Ensure bet has required fields
            if (!bet._id) {
              console.error('Bet missing ID:', bet);
              return null;
            }
            
            return {
              ...bet,
              // Ensure potential winnings is a valid number
              potentialWinnings: isNaN(bet.potentialWinnings) ? 
                calculatePotentialWinnings(bet.amount, bet.odds) : 
                bet.potentialWinnings,
              // Ensure amount is a valid number
              amount: isNaN(bet.amount) ? 0 : bet.amount,
              // Ensure status is valid
              status: bet.status || 'pending'
            };
          })
          .filter(bet => bet !== null); // Remove any null entries
        
        console.log('Processed bets:', processedBets);
        
        setBets(processedBets);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching bets:', err);
        setError(`Failed to load bet history: ${err.response?.data?.message || err.message}`);
        setLoading(false);
      }
    };

    fetchBets();
  }, []);

  // Calculate potential winnings based on amount and odds
  const calculatePotentialWinnings = (amount, odds) => {
    if (!amount || !odds) return 0;
    
    if (odds > 0) {
      // Positive odds (e.g. +150)
      return amount * (odds / 100);
    } else {
      // Negative odds (e.g. -200)
      return amount * (100 / Math.abs(odds));
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'won':
        return 'success';
      case 'lost':
        return 'error';
      case 'pending':
        return 'error'; // Changed from 'warning' to 'error' for red color
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    // Change 'pending' to 'LIVE'
    return status === 'pending' ? 'LIVE' : status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  };

  const formatCurrency = (amount) => {
    if (isNaN(amount) || amount === null || amount === undefined) {
      return '$0.00';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Format the selection text based on bet type and selection
  const formatSelection = (bet) => {
    if (!bet.betSelection) return '-';
    
    try {
      switch (bet.betType) {
        case 'moneyline':
          return bet.betSelection; // Team name
        case 'spread':
          // Format as "Team -3.5" or "Team +3.5"
          if (!bet.game || !bet.game.odds || !bet.game.odds.spread) {
            return bet.betSelection;
          }
          const spreadValue = bet.game?.odds?.spread?.value || '';
          const sign = bet.betSelection === bet.game?.homeTeam ? '-' : '+';
          return `${bet.betSelection} ${sign}${Math.abs(spreadValue)}`;
        case 'total':
          // Format as "Over 220.5" or "Under 220.5"
          if (!bet.game || !bet.game.odds || !bet.game.odds.total) {
            return `${bet.betSelection.charAt(0).toUpperCase() + bet.betSelection.slice(1)}`;
          }
          const totalValue = bet.game?.odds?.total?.value || '';
          return `${bet.betSelection.charAt(0).toUpperCase() + bet.betSelection.slice(1)} ${totalValue}`;
        default:
          return bet.betSelection;
      }
    } catch (error) {
      console.error('Error formatting selection:', error, bet);
      return bet.betSelection || '-';
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading bet history...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Bet History
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom>
          View all your past and pending bets
        </Typography>
      </Box>
      
      {bets.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            You haven't placed any bets yet
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/betting')}
            sx={{ mt: 2 }}
          >
            Place Your First Bet
          </Button>
        </Paper>
      ) : (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader aria-label="bet history table">
              <TableHead>
                <TableRow>
                  <TableCell>Game</TableCell>
                  <TableCell>Bet Type</TableCell>
                  <TableCell>Selection</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">Potential Winnings</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Placed At</TableCell>
                  <TableCell>Settled At</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bets
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((bet) => (
                    <TableRow 
                      key={bet._id}
                      hover
                      onClick={() => bet.game?._id ? navigate(`/games/${bet.game._id}`) : null}
                      sx={{ cursor: bet.game?._id ? 'pointer' : 'default' }}
                    >
                      <TableCell component="th" scope="row">
                        {bet.game?.homeTeam || 'Unknown'} vs {bet.game?.awayTeam || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {bet.betType ? bet.betType.charAt(0).toUpperCase() + bet.betType.slice(1) : '-'}
                      </TableCell>
                      <TableCell>{formatSelection(bet)}</TableCell>
                      <TableCell align="right">{formatCurrency(bet.amount)}</TableCell>
                      <TableCell align="right">{formatCurrency(bet.potentialWinnings)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={getStatusLabel(bet.status)} 
                          color={getStatusColor(bet.status)} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>{formatDate(bet.createdAt)}</TableCell>
                      <TableCell>
                        {bet.settledAt ? formatDate(bet.settledAt) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={bets.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}
    </Container>
  );
};

export default BetHistory; 