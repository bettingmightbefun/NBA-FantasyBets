# NBA Fantasy Bets

A live 24/7 fantasy betting platform for NBA games where you and your friends can place bets with virtual currency throughout the NBA season.

## Features

- **Live Odds**: Real-time NBA betting odds that update hourly
- **Multiple Bet Types**: Place bets on money lines, spreads, and totals
- **User Accounts**: Create an account to track your betting history and performance
- **Leaderboard**: Compete with friends to see who has the best betting record
- **Season-Long Stats**: Track your betting performance throughout the NBA season
- **Responsive Design**: Fully responsive UI that works on desktop and mobile devices
- **Secure Authentication**: JWT-based authentication with enhanced error handling and logging

## Recent Updates

- **Enhanced Authentication System**: Improved user authentication with better token management and error handling
- **Detailed Logging**: Added comprehensive logging throughout the application for easier debugging
- **Improved Error Handling**: Better error messages and recovery mechanisms for API failures
- **User Password Support**: Added optional password authentication for increased security
- **Offline Support**: Improved resilience against temporary API outages
- **Performance Optimizations**: Reduced bundle size and improved loading times

## Tech Stack

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- Axios for API requests
- Node-cron for scheduled tasks
- Winston for logging

### Frontend
- React with React Router
- Material UI for components and styling
- Axios for API requests
- Chart.js for data visualization
- Context API for state management

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account (free tier)
- API key from The Odds API (free tier with 500 requests/month)

### MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create an account
2. Click "Build a Database" and select the FREE tier (M0 Sandbox)
3. Choose AWS as the provider and select a region close to you
4. Click "Create Cluster" (this will take a few minutes to provision)
5. When prompted to set up security:
   - Create a database user (remember this username and password)
   - For network access, choose "Allow access from anywhere" for simplicity
6. Once your cluster is created, click "Connect"
7. Select "Connect your application"
8. Copy the connection string - it will look like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
9. Replace `<username>` and `<password>` with your database user credentials
10. Update the MONGODB_URI in your .env file with this connection string, adding the database name:
    ```
    MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/nba-fantasy-bets?retryWrites=true&w=majority
    ```

### Installation

1. Clone the repository
```
git clone https://github.com/bettingmightbefun/NBA-FantasyBets.git
cd NBA-FantasyBets
```

2. Install dependencies for both server and client
```
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Configure environment variables
   - Create a `.env` file in the server directory based on the `.env.example` file
   - Add your MongoDB Atlas connection string, JWT secret, and The Odds API key
   - Example .env file:
     ```
     NODE_ENV=development
     PORT=5000
     MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/nba-fantasy-bets?retryWrites=true&w=majority
     JWT_SECRET=your_secure_jwt_secret_key
     ODDS_API_KEY=your_odds_api_key
     ```

4. Start the development servers
```
# Start the backend server
cd server
npm run dev

# Start the frontend client
cd ../client
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/profile` - Get user profile

### Users
- `GET /api/users/leaderboard` - Get user leaderboard
- `GET /api/users/bets` - Get user's betting history

### Odds
- `GET /api/odds` - Get upcoming games with odds
- `GET /api/odds/live` - Get live games
- `GET /api/odds/finished` - Get finished games
- `GET /api/odds/:id` - Get a specific game with odds

### Bets
- `POST /api/bets` - Place a new bet
- `GET /api/bets` - Get user's bets
- `GET /api/bets/:id` - Get a specific bet
- `DELETE /api/bets/:id` - Cancel a bet

## Deployment

The application is deployed on Render.com with the following configuration:

### Backend Service
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**: Configure the same variables as in your .env file

### Frontend Static Site
- **Build Command**: `cd client && npm install && npm run build`
- **Publish Directory**: `client/dist`

## Troubleshooting

### Common Issues

1. **MongoDB Connection Issues**
   - Ensure your IP is whitelisted in MongoDB Atlas
   - Verify your connection string is correct
   - Check that your database user has the correct permissions

2. **Authentication Problems**
   - Clear your browser's local storage if you experience login issues
   - Ensure your JWT_SECRET is properly set in the .env file
   - Check server logs for detailed error messages

3. **API Rate Limiting**
   - The free tier of The Odds API has a limit of 500 requests per month
   - Consider upgrading if you need more requests

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [The Odds API](https://the-odds-api.com/) for providing sports betting odds
- [NBA API](https://www.nba.com/stats/) for NBA game data
- [Material UI](https://mui.com/) for the UI components
- [Chart.js](https://www.chartjs.org/) for data visualization 