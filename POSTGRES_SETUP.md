# PostgreSQL Setup Instructions

## Installing PostgreSQL

### Windows

1. **Download PostgreSQL:**
   - Go to https://www.postgresql.org/download/windows/
   - Download the latest version installer
   - Run the installer

2. **During Installation:**
   - Set a password for `postgres` user (remember this!)
   - Port: Keep default `5432`
   - Locale: Default

3. **Verify Installation:**
   ```cmd
   psql --version
   ```

### Mac (using Homebrew)

```bash
# Install PostgreSQL
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Create your user (optional)
createuser -s postgres
```

### Linux (Ubuntu/Debian)

```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Switch to postgres user
sudo -i -u postgres
```

## Creating the Database

### Method 1: Using psql (Command Line)

```bash
# Connect to PostgreSQL
psql -U postgres

# In psql prompt, create database:
CREATE DATABASE course_file_management;

# Exit
\q
```

### Method 2: Using pgAdmin (GUI)

1. Open pgAdmin (comes with PostgreSQL installation)
2. Right-click on "Databases" → Create → Database
3. Name: `course_file_management`
4. Click Save

## Project Configuration

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Update `.env` with your PostgreSQL credentials:**
   ```
   PORT=5000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=course_file_management
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password_here
   JWT_SECRET=your_secure_secret_key
   NODE_ENV=development
   ```

3. **Install dependencies:**
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

   The server will:
   - Connect to PostgreSQL
   - Automatically create all tables
   - Start on http://localhost:5000
   - Frontend on http://localhost:3000

## Verify PostgreSQL is Running

### Windows
Check Services app or run:
```cmd
pg_isready
```

### Mac
```bash
brew services list
```

### Linux
```bash
sudo systemctl status postgresql
```

## Common Issues

### "Connection refused" Error

1. **Check if PostgreSQL is running:**
   - Windows: Check Services
   - Mac: `brew services list`
   - Linux: `sudo systemctl status postgresql`

2. **Check connection details in `.env`:**
   - Host should be `localhost`
   - Port should be `5432` (default)
   - Verify username and password

### "Authentication failed" Error

1. **Reset postgres password (if forgotten):**

   **Linux:**
   ```bash
   sudo -u postgres psql
   ALTER USER postgres PASSWORD 'newpassword';
   \q
   ```

   **Windows/Mac:**
   - Use pgAdmin to reset password
   - Or reinstall PostgreSQL

### Port Already in Use

If port 5432 is occupied:
1. Change `DB_PORT` in `.env` to another port (e.g., 5433)
2. Or stop the conflicting service

## Database Management

### View Tables
```bash
psql -U postgres -d course_file_management
\dt
```

### Reset Database
```bash
psql -U postgres
DROP DATABASE course_file_management;
CREATE DATABASE course_file_management;
\q
```

Then restart your server - tables will be recreated automatically.

## Default Test Account

After starting the server:

1. Go to http://localhost:3000
2. Register with:
   - Role: `admin` for full access
   - Role: `coordinator` for course management
   - Role: `faculty` for document submission

## Next Steps

Once the server starts successfully:

1. Register an admin account
2. Create courses
3. Assign coordinators
4. Assign faculty to sections
5. Test document upload workflow

## Troubleshooting

If you still face issues:

1. Check server logs for detailed error messages
2. Verify `.env` file has correct credentials
3. Ensure PostgreSQL service is running
4. Try connecting with psql manually to verify credentials
5. Check firewall settings (port 5432 should be open)
