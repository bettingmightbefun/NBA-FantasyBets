import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  TextField,
  Button,
  Divider,
  Chip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import { formatOdds } from '../utils/formatters';

const BetslipContainer = styled(Paper)(({ theme }) => ({
  backgroundColor: '#121212',
  color: theme.palette.common.white,
  borderRadius: '4px',
  overflow: 'hidden',
  marginBottom: theme.spacing(2),
  border: '1px solid #2A2A2A',
}));

const BetslipHeader = styled(Box)(({ theme }) => ({
  backgroundColor: '#1E1E1E',
  padding: theme.spacing(1.5, 2),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

const BetslipContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
}));

const BetInfo = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(2),
}));

const TeamInfo = styled(Box)(({ theme }) => ({
  flex: 1,
}));

const WagerInputContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: theme.spacing(2),
  gap: theme.spacing(2),
}));

const WagerInput = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    color: 'white',
    '& fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.23)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
    },
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  '& .MuiInputAdornment-root': {
    color: 'rgba(255, 255, 255, 0.7)',
  },
}));

const LiveChip = styled(Chip)({
  backgroundColor: '#E53935',
  color: 'white',
  fontWeight: 'bold',
  fontSize: '0.75rem',
  height: '24px',
  marginRight: '8px',
});

const CashOutChip = styled(Chip)({
  backgroundColor: 'white',
  color: 'black',
  fontWeight: 'bold',
  fontSize: '0.75rem',
  height: '24px',
});

const Betslip = ({ bet, onRemove, onPlaceBet }) => {
  const [wagerAmount, setWagerAmount] = useState('');
  const [toWinAmount, setToWinAmount] = useState('');

  const handleWagerChange = (e) => {
    const amount = e.target.value;
    setWagerAmount(amount);
    
    // Calculate potential winnings based on odds
    if (amount && !isNaN(amount) && bet.odds) {
      const decimalOdds = parseFloat(bet.odds);
      const potentialWin = (parseFloat(amount) * decimalOdds).toFixed(2);
      setToWinAmount(potentialWin);
    } else {
      setToWinAmount('');
    }
  };

  const handleToWinChange = (e) => {
    const amount = e.target.value;
    setToWinAmount(amount);
    
    // Calculate wager amount based on desired winnings
    if (amount && !isNaN(amount) && bet.odds) {
      const decimalOdds = parseFloat(bet.odds);
      const wagerNeeded = (parseFloat(amount) / decimalOdds).toFixed(2);
      setWagerAmount(wagerNeeded);
    } else {
      setWagerAmount('');
    }
  };

  return (
    <BetslipContainer elevation={0}>
      <BetslipHeader>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Betslip
          </Typography>
        </Box>
        <IconButton size="small" onClick={onRemove} sx={{ color: 'white' }}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </BetslipHeader>
      
      <BetslipContent>
        <BetInfo>
          <TeamInfo>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              {bet.team}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <LiveChip label="LIVE" size="small" />
              <Typography variant="caption" color="rgba(255, 255, 255, 0.7)">
                {bet.matchup}
              </Typography>
            </Box>
            <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
              {bet.betType}
            </Typography>
          </TeamInfo>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <Typography variant="body1" fontWeight="bold">
              {bet.line && bet.line > 0 ? '+' : ''}{bet.line || formatOdds(bet.odds)}
            </Typography>
            <CashOutChip label="CASH OUT" size="small" />
          </Box>
        </BetInfo>
        
        <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', my: 2 }} />
        
        <WagerInputContainer>
          <WagerInput
            label="WAGER"
            variant="outlined"
            size="small"
            fullWidth
            value={wagerAmount}
            onChange={handleWagerChange}
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
            }}
          />
          
          <WagerInput
            label="TO WIN"
            variant="outlined"
            size="small"
            fullWidth
            value={toWinAmount}
            onChange={handleToWinChange}
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
            }}
          />
        </WagerInputContainer>
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Button 
            variant="contained" 
            color="primary" 
            fullWidth
            disabled={!wagerAmount || isNaN(wagerAmount) || parseFloat(wagerAmount) <= 0}
            onClick={() => onPlaceBet(wagerAmount, toWinAmount)}
          >
            Place Bet
          </Button>
        </Box>
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Button 
            variant="text" 
            color="error" 
            onClick={onRemove}
            startIcon={<DeleteIcon />}
            sx={{ color: '#f44336' }}
          >
            Remove all selections
          </Button>
        </Box>
      </BetslipContent>
    </BetslipContainer>
  );
};

export default Betslip; 