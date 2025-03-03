# NBA Fantasy Bets Deployment Guide

This guide will walk you through deploying the NBA Fantasy Bets application to free hosting services:
- Frontend (React/Vite) → Netlify
- Backend (Node.js/Express) → Render
- Database (MongoDB) → MongoDB Atlas (already set up)

## Prerequisites

- Your MongoDB Atlas database is already set up and running
- You have built the client application with `npm run build`
- You have the server code ready for deployment

## Step 1: Deploy the Frontend to Netlify

1. **Sign up for Netlify**:
   - Go to [netlify.com](https://netlify.com) and sign up for a free account
   - You can sign up with your GitHub account or email

2. **Deploy the frontend manually**:
   - In the Netlify dashboard, click "Sites" then "Add new site" → "Deploy manually"
   - Drag and drop the `client/dist` folder from your computer onto the upload area
   - Your site will be deployed with a random subdomain (like random-name.netlify.app)

3. **Configure site settings**:
   - After deployment, go to "Site settings" → "Domain management" to customize your site's URL
   - You can use a custom domain if you own one, or use the free Netlify subdomain

4. **Set up environment variables**:
   - Go to "Site settings" → "Environment variables"
   - Add the variable `VITE_API_URL` with the value of your Render backend URL (which you'll get after deploying the backend)
   - Initially, you can set this to a placeholder and update it after deploying the backend

## Step 2: Deploy the Backend to Render

1. **Sign up for Render**:
   - Go to [render.com](https://render.com) and sign up for a free account
   - You can sign up with your GitHub account or email

2. **Deploy the backend**:
   - Click "New" and select "Web Service"
   - Choose "Upload" instead of connecting to GitHub
   - Upload the `server-deploy.zip` file you created
   - Set the following:
     - Name: `nba-fantasy-bets-api` (or any name you prefer)
     - Build Command: `npm install`
     - Start Command: `npm start`
     - Instance Type: Free

3. **Configure environment variables**:
   - In the Render dashboard, go to your web service
   - Click on "Environment" tab
   - Add all the variables from your `.env` file:
     - `PORT`: 10000 (Render uses port 10000 by default)
     - `MONGODB_URI`: Your MongoDB Atlas connection string
     - `JWT_SECRET`: Your JWT secret key
     - `ODDS_API_KEY`: Your Odds API key
     - `NBA_API_KEY`: Your NBA API key (if used)
     - `NODE_ENV`: production

4. **Update CORS settings**:
   - After deployment, you'll need to update your server's CORS settings to allow requests from your Netlify domain
   - You can do this by adding your Netlify domain to the allowed origins in your server code

## Step 3: Connect Frontend to Backend

1. After deploying the backend to Render, copy the URL (something like `https://nba-fantasy-bets-api.onrender.com`)
2. Update the `VITE_API_URL` environment variable in your Netlify site settings with this URL
3. Trigger a new deployment of your site by going to "Deploys" and clicking "Trigger deploy" → "Deploy site"

## Step 4: Test Your Deployed Application

1. Visit your Netlify URL
2. Try to register and log in
3. Navigate to the Betting page to see if NBA games are displayed
4. Test placing bets and other functionality

## Troubleshooting

- **CORS errors**: Make sure your backend allows requests from your Netlify domain
- **API connection issues**: Verify that the `VITE_API_URL` is set correctly in Netlify
- **Database connection issues**: Check that your MongoDB Atlas connection string is correct and that your IP is whitelisted
- **Missing environment variables**: Ensure all required environment variables are set in Render

## Maintenance

- **Free tier limitations**: Be aware that free tiers have limitations:
  - Render free tier services will spin down after periods of inactivity
  - MongoDB Atlas free tier has storage limitations
- **Monitoring**: Regularly check your Render and Netlify dashboards for any issues or errors

## Next Steps

- Consider setting up a custom domain
- Implement CI/CD for automatic deployments
- Add monitoring and logging services
- Set up automated backups for your database 