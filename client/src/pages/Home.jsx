import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Stack,
  useTheme,
} from '@mui/material';
import {
  SportsCricket as BettingIcon,
  Leaderboard as LeaderboardIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();
  const theme = useTheme();

  const features = [
    {
      icon: <BettingIcon fontSize="large" />,
      title: 'Live NBA Betting',
      description: 'Place bets on NBA games with real-time odds that update every hour. Bet on money lines, spreads, and totals.',
    },
    {
      icon: <LeaderboardIcon fontSize="large" />,
      title: 'Leaderboard',
      description: 'Compete with friends to see who has the best betting record. Track wins, losses, and total earnings.',
    },
    {
      icon: <TimelineIcon fontSize="large" />,
      title: 'Season-Long Stats',
      description: 'Track your betting performance throughout the NBA season with detailed statistics and history.',
    },
  ];

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          pt: 8,
          pb: 6,
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(https://images.unsplash.com/photo-1504450758481-7338eba7524a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: 'white',
        }}
      >
        <Container maxWidth="lg">
          <Typography
            component="h1"
            variant="h2"
            align="center"
            gutterBottom
            sx={{ fontWeight: 'bold' }}
          >
            NBA Fantasy Bets
          </Typography>
          <Typography variant="h5" align="center" paragraph>
            Bet on NBA games with your friends using virtual currency.
            Track your wins, compete on the leaderboard, and enjoy the NBA season!
          </Typography>
          <Stack
            sx={{ pt: 4 }}
            direction="row"
            spacing={2}
            justifyContent="center"
          >
            {user ? (
              <Button
                component={RouterLink}
                to="/dashboard"
                variant="contained"
                size="large"
                sx={{ px: 4, py: 1.5 }}
              >
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button
                  component={RouterLink}
                  to="/register"
                  variant="contained"
                  size="large"
                  sx={{ px: 4, py: 1.5 }}
                >
                  Sign Up
                </Button>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="outlined"
                  size="large"
                  sx={{ px: 4, py: 1.5, color: 'white', borderColor: 'white' }}
                >
                  Login
                </Button>
              </>
            )}
          </Stack>
        </Container>
      </Box>

      {/* Features Section */}
      <Container sx={{ py: 8 }} maxWidth="lg">
        <Typography
          component="h2"
          variant="h3"
          align="center"
          color="text.primary"
          gutterBottom
          sx={{ mb: 6 }}
        >
          Features
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item key={index} xs={12} sm={6} md={4}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                  },
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    display: 'flex',
                    justifyContent: 'center',
                    color: theme.palette.primary.main,
                  }}
                >
                  {feature.icon}
                </Box>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="h3" align="center">
                    {feature.title}
                  </Typography>
                  <Typography align="center">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* How It Works Section */}
      <Box sx={{ bgcolor: 'background.paper', py: 8 }}>
        <Container maxWidth="lg">
          <Typography
            component="h2"
            variant="h3"
            align="center"
            color="text.primary"
            gutterBottom
            sx={{ mb: 6 }}
          >
            How It Works
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  1. Create an Account
                </Typography>
                <Typography paragraph>
                  Sign up for a free account to get started. You'll receive $1,000 in virtual currency.
                </Typography>
                
                <Typography variant="h6" gutterBottom>
                  2. Browse NBA Games
                </Typography>
                <Typography paragraph>
                  View upcoming NBA games with real-time odds that update every hour.
                </Typography>
                
                <Typography variant="h6" gutterBottom>
                  3. Place Your Bets
                </Typography>
                <Typography paragraph>
                  Bet on money lines, spreads, or totals for any NBA game in the next 48 hours.
                </Typography>
                
                <Typography variant="h6" gutterBottom>
                  4. Track Your Progress
                </Typography>
                <Typography paragraph>
                  Watch the games and track your bets. Your winnings will be automatically credited to your account.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <CardMedia
                component="img"
                image="https://images.unsplash.com/photo-1518407613690-d9fc990e795f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
                alt="NBA Game"
                sx={{
                  borderRadius: 2,
                  boxShadow: 3,
                  height: 400,
                  objectFit: 'cover',
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Call to Action */}
      <Box
        sx={{
          bgcolor: theme.palette.primary.main,
          color: 'white',
          py: 6,
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h4" align="center" gutterBottom>
            Ready to start betting?
          </Typography>
          <Typography variant="h6" align="center" paragraph>
            Join now and get $1,000 in virtual currency to bet on NBA games!
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            {user ? (
              <Button
                component={RouterLink}
                to="/dashboard"
                variant="contained"
                color="secondary"
                size="large"
                sx={{ px: 4, py: 1.5 }}
              >
                Go to Dashboard
              </Button>
            ) : (
              <Button
                component={RouterLink}
                to="/register"
                variant="contained"
                color="secondary"
                size="large"
                sx={{ px: 4, py: 1.5 }}
              >
                Sign Up Now
              </Button>
            )}
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: 'background.paper', p: 6 }} component="footer">
        <Typography variant="h6" align="center" gutterBottom>
          NBA Fantasy Bets
        </Typography>
        <Typography
          variant="subtitle1"
          align="center"
          color="text.secondary"
          component="p"
        >
          A fantasy betting platform for NBA fans
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          {'© '}
          {new Date().getFullYear()}
          {' NBA Fantasy Bets. All rights reserved.'}
        </Typography>
      </Box>
    </Box>
  );
};

export default Home; 