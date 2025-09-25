# Figma Portfolio - Deployment Guide

## 🚀 Deploying to Vercel with MongoDB Atlas

### Prerequisites
1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **MongoDB Atlas Account**: Sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas)

### Step 1: Set up MongoDB Atlas

1. **Create a Cluster**:
   - Log into MongoDB Atlas
   - Create a new project or use existing one
   - Create a free cluster (M0 Sandbox)
   - Choose a cloud provider and region

2. **Configure Database Access**:
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Create a user with read/write permissions
   - Remember the username and password

3. **Configure Network Access**:
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - Add `0.0.0.0/0` to allow access from anywhere (for Vercel)

4. **Get Connection String**:
   - Go to "Databases" and click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with your preferred database name (e.g., `figma-portfolio`)

### Step 2: Deploy to Vercel

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/figma-portfolio.git
   git push -u origin main
   ```

2. **Deploy on Vercel**:
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect the configuration

3. **Set Environment Variables**:
   - In your Vercel project dashboard, go to "Settings" → "Environment Variables"
   - Add the following variables:
     - `MONGODB_URI`: Your MongoDB Atlas connection string
     - `NODE_ENV`: `production`

4. **Deploy**:
   - Click "Deploy" or push changes to your main branch
   - Vercel will automatically build and deploy your app

### Step 3: Configure Domain (Optional)

1. **Custom Domain**:
   - In Vercel project settings, go to "Domains"
   - Add your custom domain
   - Update your DNS settings as instructed

2. **Update CORS Settings**:
   - Update the CORS configuration in `api/index.js`
   - Replace `your-domain.vercel.app` with your actual domain

### Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Set up Environment Variables**:
   ```bash
   cp .env.example .env
   ```
   - Edit `.env` and add your MongoDB connection string

3. **Run Locally**:
   ```bash
   npm run dev
   ```
   - Open http://localhost:3000

### Project Structure
```
figma-portfolio/
├── api/
│   └── index.js          # Express.js API server
├── css/
│   └── styles.css        # Frontend styles
├── js/
│   └── app.js           # Frontend JavaScript
├── index.html           # Main HTML file
├── package.json         # Dependencies and scripts
├── vercel.json          # Vercel configuration
└── .env.example         # Environment variables template
```

### API Endpoints

- `GET /api/prototypes` - Get all prototypes (with optional filtering)
- `GET /api/prototypes/:id` - Get single prototype
- `POST /api/prototypes` - Create new prototype
- `PUT /api/prototypes/:id` - Update prototype
- `DELETE /api/prototypes/:id` - Delete prototype
- `GET /api/health` - Health check

### Features

✅ **Full CRUD Operations** - Create, read, update, delete prototypes
✅ **MongoDB Atlas Storage** - Cloud database storage
✅ **Search & Filter** - Find prototypes by title, description, or tags
✅ **Categories** - Organize prototypes by type
✅ **Figma Integration** - Embed Figma prototypes directly
✅ **Responsive Design** - Works on all devices
✅ **Error Handling** - User-friendly error messages
✅ **Loading States** - Visual feedback during operations

### Troubleshooting

**Common Issues:**

1. **MongoDB Connection Error**:
   - Check your connection string format
   - Ensure IP whitelist includes `0.0.0.0/0`
   - Verify database user credentials

2. **Vercel Deployment Issues**:
   - Check build logs in Vercel dashboard
   - Ensure all environment variables are set
   - Verify `vercel.json` configuration

3. **CORS Issues**:
   - Update the `origin` array in `api/index.js`
   - Add your domain to the allowed origins

4. **API Not Working**:
   - Check the Network tab in browser dev tools
   - Ensure API endpoints are correctly configured
   - Verify MongoDB connection in Vercel function logs

### Support

For issues or questions:
1. Check the Vercel deployment logs
2. Review MongoDB Atlas logs
3. Test API endpoints with tools like Postman
4. Check browser console for frontend errors

Happy designing! 🎨