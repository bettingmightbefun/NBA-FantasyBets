import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  Divider,
  Chip,
  CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { oddsAPI } from '../services/api.js';
import { formatOdds, americanToDecimal } from '../utils/formatters.js';

const GameDetails = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGameDetails = async () => {
      try {
        setLoading(true);
        const response = await oddsAPI.getGameById(gameId);
        setGame(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load game details');
        setLoading(false);
        console.error('Error fetching game details:', err);
      }
    };

    fetchGameDetails();
  }, [gameId]);

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading game details...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
          Back
        </Button>
        <Typography variant="h5" color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      </Container>
    );
  }

  if (!game) {
    return (
      <Container sx={{ mt: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
          Back
        </Button>
        <Typography variant="h5" sx={{ mt: 2 }}>
          Game not found
        </Typography>
      </Container>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'primary';
      case 'in_progress':
        return 'success';
      case 'finished':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
        Back
      </Button>
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4">
              {game.homeTeam} vs {game.awayTeam}
            </Typography>
            <Chip 
              label={game.status} 
              color={getStatusColor(game.status)} 
              variant="outlined" 
            />
          </Box>
          
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            {formatDate(game.startTime)}
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          {game.status === 'in_progress' || game.status === 'finished' ? (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                Score
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="h6">{game.homeTeam}: {game.homeScore}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h6">{game.awayTeam}: {game.awayScore}</Typography>
                </Grid>
              </Grid>
            </Box>
          ) : null}
          
          <Typography variant="h5" gutterBottom>
            Betting Odds
          </Typography>
          
          <Grid container spacing={3}>
            {/* Moneyline */}
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Moneyline
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body1">{game.homeTeam}</Typography>
                      <Typography variant="h6">
                        {formatOdds(game.odds?.moneyline?.home)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body1">{game.awayTeam}</Typography>
                      <Typography variant="h6">
                        {formatOdds(game.odds?.moneyline?.away)}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Spread */}
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Spread
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body1">{game.homeTeam}</Typography>
                      <Typography variant="h6">
                        {game.odds?.spread?.home > 0 ? '+' : ''}{game.odds?.spread?.home} ({formatOdds(game.odds?.spread?.homeOdds)})
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body1">{game.awayTeam}</Typography>
                      <Typography variant="h6">
                        {game.odds?.spread?.away > 0 ? '+' : ''}{game.odds?.spread?.away} ({formatOdds(game.odds?.spread?.awayOdds)})
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Total */}
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Total
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body1">Over</Typography>
                      <Typography variant="h6">
                        {game.odds?.total?.over} ({formatOdds(game.odds?.total?.overOdds)})
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body1">Under</Typography>
                      <Typography variant="h6">
                        {game.odds?.total?.under} ({formatOdds(game.odds?.total?.underOdds)})
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              onClick={() => navigate(`/betting/${gameId}`)}
              disabled={game.status !== 'scheduled'}
            >
              Place Bet
            </Button>
          </Box>
        </CardContent>
      </Card>
      
      <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
        Last updated: {new Date(game.lastUpdated).toLocaleString()}
      </Typography>
    </Container>
  );
};

export default GameDetails; 