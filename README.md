# NBA Fantasy Bets

A full-stack web application for betting on NBA games with virtual currency. Users can create accounts, place bets on upcoming NBA games, and track their performance on a leaderboard.

## Features

- User authentication (register, login, profile management)
- Real-time NBA game odds from The Odds API
- Virtual currency betting system
- Leaderboard to track user performance
- Responsive design for desktop and mobile

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Authentication**: JWT
- **API Integration**: The Odds API for NBA game data

## Local Development

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB instance
- The Odds API key

### Setup

1. **Clone the repository**

```bash
git clone https://github.com/bettingmightbefun/NBA-FantasyBets.git
cd NBA-FantasyBets
```

2. **Set up environment variables**

Create a `.env` file in the server directory:

```
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
ODDS_API_KEY=your_odds_api_key
NODE_ENV=development
```

3. **Install dependencies**

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

4. **Start the application**

You can use the included batch file to start both the server and client:

```bash
# From the root directory
./start-app.bat
```

Or start them manually:

```bash
# Start the server
cd server
npm run dev

# In a new terminal, start the client
cd client
npm run dev
```

5. **Access the application**

- Frontend: http://localhost:3000
- Backend API: http://localhost:5001

## Deployment

See the [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions on deploying the application to Netlify and Render.

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/profile` - Get user profile

### Users

- `GET /api/users/leaderboard` - Get user leaderboard
- `GET /api/users/bets` - Get user bets
- `PUT /api/users/profile` - Update user profile

### Odds

- `GET /api/odds` - Get upcoming games
- `GET /api/odds/live` - Get live games
- `GET /api/odds/finished` - Get finished games
- `GET /api/odds/:id` - Get game by ID

### Bets

- `POST /api/bets` - Place a bet
- `GET /api/bets` - Get user bets
- `GET /api/bets/:id` - Get bet by ID
- `DELETE /api/bets/:id` - Cancel a bet

## License

This project is licensed under the MIT License.

## Acknowledgements

- [The Odds API](https://the-odds-api.com/) for providing sports betting odds
- [NBA API](https://www.nba.com/stats/) for NBA game data
- [Material UI](https://mui.com/) for the UI components
- [Chart.js](https://www.chartjs.org/) for data visualization 