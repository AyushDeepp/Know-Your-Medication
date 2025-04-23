# Know Your Medication API

Backend API for the Know Your Medication application.

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```
# MongoDB Connection String
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/knowyourmedication?retryWrites=true&w=majority

# JWT Secret for authentication
JWT_SECRET=your_jwt_secret_key_here

# Server Port (Render will provide its own PORT)
PORT=5000

# OpenAI API Key (if you're using OpenAI services)
OPENAI_API_KEY=your_openai_api_key

# Email Configuration (for password reset, notifications, etc.)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Other app-specific settings
APP_URL=https://know-your-medication-api.onrender.com
CLIENT_URL=https://know-your-medication.onrender.com
```

## Deployment to Render.com

1. Create a new Web Service on Render
2. Link to your GitHub repository
3. Configure the service:
   - Name: know-your-medication-api
   - Build Command: `npm install`
   - Start Command: `node server.js`
4. Add all required environment variables
5. Deploy the service

For more information, see [render.yaml](./render.yaml) configuration. 