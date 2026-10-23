# Setup Instructions

## Prerequisites

1. **Node.js** (v18 or higher)
2. **MongoDB** installed and running locally

## MongoDB Setup

### Option 1: Install MongoDB Community Edition

#### Windows:
1. Download from https://www.mongodb.com/try/download/community
2. Run the installer
3. Start MongoDB service:
   ```
   net start MongoDB
   ```

#### Mac (using Homebrew):
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Linux (Ubuntu):
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Option 2: Use MongoDB Atlas (Cloud)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a cluster
4. Get your connection string
5. Update `.env` with the Atlas connection string

## Project Setup

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Update `.env` with your settings:**
   ```
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/course_file_management
   JWT_SECRET=your_secure_secret_key_here
   NODE_ENV=development
   ```

3. **Install server dependencies:**
   ```bash
   npm install
   ```

4. **Install client dependencies:**
   ```bash
   cd client
   npm install
   cd ..
   ```

5. **Create uploads directory:**
   ```bash
   mkdir uploads
   ```

6. **Start the application:**
   ```bash
   npm run dev
   ```

   This will start both:
   - Backend server on http://localhost:5000
   - Frontend on http://localhost:3000

## Verify MongoDB is Running

Run this command to check if MongoDB is accessible:

```bash
mongosh
```

If it connects, you're good to go! If not, make sure MongoDB service is running.

## Troubleshooting

### MongoDB Connection Error

If you see: `Operation users.findOne() buffering timed out`

1. **Check if MongoDB is running:**
   - Windows: `sc query MongoDB` or check Services
   - Mac: `brew services list`
   - Linux: `sudo systemctl status mongod`

2. **Try connection string with 127.0.0.1 instead of localhost:**
   ```
   MONGODB_URI=mongodb://127.0.0.1:27017/course_file_management
   ```

3. **Check MongoDB port:**
   ```bash
   netstat -an | grep 27017
   ```

### Port Already in Use

If port 5000 or 3000 is already in use:

1. Change the port in `.env`:
   ```
   PORT=5001
   ```

2. Or kill the process using the port:
   - Windows: `netstat -ano | findstr :5000` then `taskkill /PID <PID> /F`
   - Mac/Linux: `lsof -ti:5000 | xargs kill -9`

## Default Test Account

After first registration, you can create accounts with different roles:

- Role: `admin` - Full system access
- Role: `coordinator` - Course file management
- Role: `faculty` - Document submission

## Next Steps

1. Register an admin account
2. Create a course
3. Assign a coordinator
4. Assign faculty to sections
5. Test document upload workflow
