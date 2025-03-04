import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Alert,
  Divider,
  TablePagination,
  TextField,
  Grid
} from '@mui/material';
import { Delete as DeleteIcon, Check as CheckIcon, Close as CloseIcon, AccountBalance as BalanceIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';

const AdminPanel = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Balance management state
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [userToUpdateBalance, setUserToUpdateBalance] = useState(null);
  const [newBalance, setNewBalance] = useState('');
  const [balanceError, setBalanceError] = useState('');

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAllUsers();
      setUsers(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load users. You may not have admin privileges.');
      setLoading(false);
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Open delete confirmation dialog
  const handleOpenDeleteDialog = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  // Close delete confirmation dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  // Delete user
  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await userAPI.deleteUser(userToDelete._id);
      
      // Update users list
      setUsers(users.filter(u => u._id !== userToDelete._id));
      
      // Show success message
      setSuccessMessage(`User ${userToDelete.username} has been deleted successfully.`);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
      // Close dialog
      handleCloseDeleteDialog();
    } catch (err) {
      setError(`Failed to delete user: ${err.response?.data?.message || err.message}`);
      console.error('Error deleting user:', err);
      handleCloseDeleteDialog();
    }
  };

  // Open balance update dialog
  const handleOpenBalanceDialog = (user) => {
    setUserToUpdateBalance(user);
    setNewBalance(user.balance.toString());
    setBalanceDialogOpen(true);
    setBalanceError('');
  };

  // Close balance update dialog
  const handleCloseBalanceDialog = () => {
    setBalanceDialogOpen(false);
    setUserToUpdateBalance(null);
    setNewBalance('');
    setBalanceError('');
  };

  // Update user balance
  const handleUpdateBalance = async () => {
    if (!userToUpdateBalance) return;

    // Validate balance
    const balanceValue = parseFloat(newBalance);
    if (isNaN(balanceValue) || balanceValue < 0) {
      setBalanceError('Please enter a valid positive number');
      return;
    }

    try {
      // Call API to update user balance
      await userAPI.updateUser(userToUpdateBalance._id, {
        ...userToUpdateBalance,
        balance: balanceValue
      });
      
      // Update users list
      setUsers(users.map(u => 
        u._id === userToUpdateBalance._id 
          ? { ...u, balance: balanceValue } 
          : u
      ));
      
      // Show success message
      setSuccessMessage(`${userToUpdateBalance.username}'s balance has been updated to ${formatCurrency(balanceValue)}.`);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
      // Close dialog
      handleCloseBalanceDialog();
    } catch (err) {
      setError(`Failed to update balance: ${err.response?.data?.message || err.message}`);
      console.error('Error updating balance:', err);
      handleCloseBalanceDialog();
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Check if current user is admin
  if (user && !user.isAdmin) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          You do not have permission to access the Admin Panel.
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading admin panel...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin Panel
      </Typography>
      
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          User Management
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Admin</TableCell>
                <TableCell align="right">Balance</TableCell>
                <TableCell align="right">Bets Placed</TableCell>
                <TableCell align="right">Win/Loss</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((userItem) => (
                  <TableRow key={userItem._id}>
                    <TableCell>{userItem.username}</TableCell>
                    <TableCell>
                      {userItem.isAdmin ? (
                        <Chip 
                          icon={<CheckIcon />} 
                          label="Yes" 
                          color="primary" 
                          size="small" 
                        />
                      ) : (
                        <Chip 
                          icon={<CloseIcon />} 
                          label="No" 
                          variant="outlined" 
                          size="small" 
                        />
                      )}
                    </TableCell>
                    <TableCell align="right">{formatCurrency(userItem.balance)}</TableCell>
                    <TableCell align="right">{userItem.betsPlaced}</TableCell>
                    <TableCell align="right">{userItem.betsWon}/{userItem.betsLost}</TableCell>
                    <TableCell>{formatDate(userItem.createdAt)}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <IconButton 
                          color="primary" 
                          onClick={() => handleOpenBalanceDialog(userItem)}
                          title="Update Balance"
                          sx={{ mr: 1 }}
                        >
                          <BalanceIcon />
                        </IconButton>
                        <IconButton 
                          color="error" 
                          onClick={() => handleOpenDeleteDialog(userItem)}
                          disabled={userItem._id === user._id} // Prevent deleting yourself
                          title="Delete User"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={users.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      
      {/* Balance Management Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Balance Management
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Typography variant="body1" paragraph>
          Use the balance icon in the actions column to update a user's balance. You can add or remove funds as needed.
        </Typography>
        
        <Alert severity="info" sx={{ mb: 2 }}>
          Tip: To give a user more funds, simply update their balance to a higher amount. To remove funds, update to a lower amount.
        </Alert>
      </Paper>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Confirm User Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete user "{userToDelete?.username}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Balance Update Dialog */}
      <Dialog
        open={balanceDialogOpen}
        onClose={handleCloseBalanceDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update User Balance</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Update the balance for user "{userToUpdateBalance?.username}".
          </DialogContentText>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Current Balance:
              </Typography>
              <Typography variant="h6">
                {userToUpdateBalance ? formatCurrency(userToUpdateBalance.balance) : '$0.00'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                autoFocus
                margin="dense"
                label="New Balance"
                type="number"
                fullWidth
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                error={!!balanceError}
                helperText={balanceError}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                }}
                inputProps={{
                  min: 0,
                  step: 100,
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBalanceDialog}>Cancel</Button>
          <Button onClick={handleUpdateBalance} color="primary" variant="contained">
            Update Balance
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminPanel; 