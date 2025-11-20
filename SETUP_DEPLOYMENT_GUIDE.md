# Student Marketplace - Setup & Deployment Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Running the Application](#running-the-application)
6. [Testing](#testing)
7. [Production Deployment](#production-deployment)
8. [Docker Deployment](#docker-deployment)
9. [CI/CD Pipeline](#cicd-pipeline)
10. [Monitoring & Maintenance](#monitoring--maintenance)
11. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- **Node.js**: Version 18.0 or higher
- **Python**: Version 3.8 or higher
- **Git**: Latest version
- **Docker**: Version 20.0+ (optional, for containerized deployment)
- **Redis**: Version 6.0+ (for caching and rate limiting)

### Development Tools
- **Code Editor**: VS Code (recommended) with extensions:
  - Python
  - TypeScript and JavaScript
  - Tailwind CSS IntelliSense
  - Prettier
  - ESLint
- **API Testing**: Postman or Insomnia
- **Database Management**: DB Browser for SQLite (development)

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/PuvadonKub/Vibe_Coding_Workshop.git
cd Vibe_Coding_Workshop
```

### 2. Backend Setup

#### Create Python Virtual Environment
```bash
cd backend
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

#### Install Python Dependencies
```bash
pip install -r requirements.txt
```

#### Install Additional Security Dependencies
```bash
pip install bleach slowapi redis
```

### 3. Frontend Setup

#### Install Node.js Dependencies
```bash
cd ../  # Return to root directory
npm install
```

#### Install Additional Development Dependencies
```bash
npm install -D @rollup/plugin-visualizer cypress @cypress/vite-dev-server
```

### 4. Redis Setup (Optional but Recommended)

#### On Windows (using Chocolatey)
```powershell
choco install redis-64
redis-server
```

#### On macOS (using Homebrew)
```bash
brew install redis
brew services start redis
```

#### On Ubuntu/Debian
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
```

## Environment Configuration

### Backend Environment Variables

Create `backend/.env` file:

```env
# Database Configuration
DATABASE_URL=sqlite:///./marketplace.db

# JWT Configuration
SECRET_KEY=your-super-secret-jwt-key-here-minimum-32-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
ENVIRONMENT=development

# CORS Configuration
CORS_ORIGINS=["http://localhost:5173", "http://localhost:8080"]
PRODUCTION_ORIGIN=https://your-production-domain.com

# File Upload Configuration
MAX_FILE_SIZE=5242880  # 5MB
UPLOAD_DIR=uploads
ALLOWED_EXTENSIONS=.jpg,.jpeg,.png,.webp

# Security Configuration
RATE_LIMIT_ENABLED=true
REDIS_URL=redis://localhost:6379/0

# Email Configuration (Optional)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Logging Configuration
LOG_LEVEL=INFO
LOG_FILE=app.log
```

### Frontend Environment Variables

Create `.env` file in project root:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT=10000

# Application Configuration
VITE_APP_NAME=Student Marketplace
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=development

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_CHAT=false
VITE_ENABLE_NOTIFICATIONS=true

# Upload Configuration
VITE_MAX_FILE_SIZE=5242880
VITE_UPLOAD_CHUNK_SIZE=1048576

# External Services
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
VITE_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key

# Development Tools
VITE_ENABLE_MOCK_API=false
VITE_SHOW_DEBUG_INFO=true
```

### Production Environment Variables

Create `backend/.env.production`:

```env
# Database Configuration (Use PostgreSQL in production)
DATABASE_URL=postgresql://username:password@localhost:5432/marketplace_prod

# Security Configuration
SECRET_KEY=your-production-secret-key-64-characters-minimum-for-security
ENVIRONMENT=production

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000

# CORS Configuration
CORS_ORIGINS=["https://your-domain.com"]
PRODUCTION_ORIGIN=https://your-domain.com

# Redis Configuration
REDIS_URL=redis://redis-server:6379/0

# Logging Configuration
LOG_LEVEL=WARNING
LOG_FILE=/var/log/marketplace/app.log

# Monitoring
SENTRY_DSN=your-sentry-dsn-url
NEW_RELIC_LICENSE_KEY=your-new-relic-key
```

## Database Setup

### Development Database (SQLite)

```bash
cd backend

# Initialize Alembic (if not already done)
alembic init alembic

# Create initial migration
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head

# Create sample data (optional)
python scripts/seed_data.py
```

### Production Database (PostgreSQL)

#### Install PostgreSQL
```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql
brew services start postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE marketplace_prod;
CREATE USER marketplace_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE marketplace_prod TO marketplace_user;
\q
```

#### Setup Production Database
```bash
# Update DATABASE_URL in .env.production
export DATABASE_URL="postgresql://marketplace_user:secure_password@localhost:5432/marketplace_prod"

# Run migrations
alembic upgrade head
```

## Running the Application

### Development Mode

#### Start Backend Server
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Start Frontend Development Server
```bash
# In new terminal, from project root
npm run dev
```

#### Start Redis (if installed locally)
```bash
redis-server
```

### Application URLs
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

### Production Mode

#### Backend Production Server
```bash
cd backend
source venv/bin/activate
export ENVIRONMENT=production
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

#### Frontend Production Build
```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Serve with static server
npx serve dist
```

## Testing

### Backend Testing

```bash
cd backend
source venv/bin/activate

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_products.py

# Run security tests
python security_test.py --url http://localhost:8000
```

### Frontend Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests with Cypress
npm run cy:open  # Interactive mode
npm run cy:run   # Headless mode
```

### Integration Testing

```bash
# Start test environment
docker-compose -f docker-compose.test.yml up -d

# Run full integration tests
npm run test:integration

# Cleanup
docker-compose -f docker-compose.test.yml down
```

## Production Deployment

### Manual Deployment

#### 1. Server Setup (Ubuntu 20.04 LTS)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install nginx python3-pip python3-venv nodejs npm redis-server postgresql postgresql-contrib certbot python3-certbot-nginx -y

# Install PM2 for process management
sudo npm install -g pm2
```

#### 2. Application Deployment

```bash
# Clone repository
git clone https://github.com/PuvadonKub/Vibe_Coding_Workshop.git
cd Vibe_Coding_Workshop

# Setup backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn

# Setup database
alembic upgrade head

# Build frontend
cd ../
npm install
npm run build

# Configure PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 3. Nginx Configuration

Create `/etc/nginx/sites-available/studentmarketplace`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Frontend (React app)
    location / {
        root /var/www/studentmarketplace/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Upload files
    location /uploads/ {
        alias /var/www/studentmarketplace/backend/uploads/;
        expires 1y;
        add_header Cache-Control "public";
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    
    location /auth/ {
        limit_req zone=api burst=5;
        proxy_pass http://127.0.0.1:8000/auth/;
        # ... other proxy settings
    }
}
```

#### 4. SSL Certificate

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/studentmarketplace /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

#### 5. PM2 Ecosystem Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'marketplace-api',
      script: 'gunicorn',
      args: 'app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 127.0.0.1:8000',
      cwd: './backend',
      interpreter: './backend/venv/bin/python',
      env: {
        ENVIRONMENT: 'production'
      },
      log_file: '/var/log/pm2/marketplace-api.log',
      out_file: '/var/log/pm2/marketplace-api-out.log',
      error_file: '/var/log/pm2/marketplace-api-error.log',
      restart_delay: 4000,
      max_restarts: 10
    }
  ]
};
```

## Docker Deployment

### Docker Configuration Files

#### Backend Dockerfile

Create `backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV ENVIRONMENT=production

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads/images

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser
RUN chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Expose port
EXPOSE 8000

# Run application
CMD ["gunicorn", "app.main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

#### Frontend Dockerfile

Create `Dockerfile`:

```dockerfile
# Multi-stage build
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose Configuration

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - marketplace-network

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/marketplace
      - REDIS_URL=redis://redis:6379/0
      - ENVIRONMENT=production
    depends_on:
      - db
      - redis
    volumes:
      - ./backend/uploads:/app/uploads
    networks:
      - marketplace-network

  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=marketplace
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - marketplace-network

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    networks:
      - marketplace-network

volumes:
  postgres_data:
  redis_data:

networks:
  marketplace-network:
    driver: bridge
```

### Running with Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up --build -d
```

## CI/CD Pipeline

### GitHub Actions Configuration

Create `.github/workflows/ci-cd.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v3

    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'

    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install Python dependencies
      run: |
        cd backend
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        pip install pytest pytest-cov

    - name: Install Node.js dependencies
      run: |
        npm ci

    - name: Run Python tests
      run: |
        cd backend
        pytest --cov=app --cov-report=xml

    - name: Run Frontend tests
      run: |
        npm test

    - name: Run Security tests
      run: |
        cd backend
        python security_test.py --url http://localhost:8000

    - name: Build Frontend
      run: |
        npm run build

    - name: Upload coverage reports
      uses: codecov/codecov-action@v3

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - uses: actions/checkout@v3

    - name: Deploy to production
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /var/www/studentmarketplace
          git pull origin main
          npm install
          npm run build
          cd backend
          source venv/bin/activate
          pip install -r requirements.txt
          alembic upgrade head
          pm2 restart marketplace-api
          sudo systemctl reload nginx
```

## Monitoring & Maintenance

### Application Monitoring

#### Health Checks
```bash
# API health check
curl http://localhost:8000/health

# Database connectivity check
curl http://localhost:8000/api/info
```

#### Log Monitoring
```bash
# PM2 logs
pm2 logs marketplace-api

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Application logs
tail -f backend/app.log
```

### Performance Monitoring

#### Database Performance
```sql
-- Monitor slow queries (PostgreSQL)
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

#### Redis Monitoring
```bash
# Redis stats
redis-cli info stats

# Monitor Redis performance
redis-cli monitor
```

### Security Updates

#### Regular Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Python packages
cd backend
pip install --upgrade -r requirements.txt

# Update Node.js packages
npm update

# Security audit
npm audit
pip-audit
```

## Troubleshooting

### Common Issues

#### Backend Issues

**Database Connection Failed**
```bash
# Check database status
sudo systemctl status postgresql

# Check connection string
python -c "from app.database import engine; engine.connect()"
```

**Redis Connection Failed**
```bash
# Check Redis status
sudo systemctl status redis-server

# Test Redis connection
redis-cli ping
```

**Permission Errors**
```bash
# Fix upload directory permissions
sudo chown -R www-data:www-data uploads/
sudo chmod -R 755 uploads/
```

#### Frontend Issues

**Build Failures**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**API Connection Issues**
```bash
# Check environment variables
cat .env

# Verify API endpoint
curl http://localhost:8000/health
```

### Performance Issues

**Slow Database Queries**
```sql
-- Check missing indexes
EXPLAIN ANALYZE SELECT * FROM products WHERE category_id = 'uuid';
```

**High Memory Usage**
```bash
# Monitor process memory
ps aux | grep -E "(python|node|nginx)"

# Check system memory
free -h
```

**Rate Limiting Issues**
```bash
# Check Redis for rate limit data
redis-cli keys "*rate_limit*"

# Monitor rate limit logs
grep "Rate limit" backend/app.log
```

### Emergency Recovery

#### Database Backup and Restore
```bash
# Backup PostgreSQL database
pg_dump marketplace_prod > backup_$(date +%Y%m%d).sql

# Restore database
psql marketplace_prod < backup_20231201.sql
```

#### Application Recovery
```bash
# Restart all services
pm2 restart all
sudo systemctl restart nginx redis-server postgresql

# Check service status
pm2 status
sudo systemctl status nginx
```

### Getting Help

- **Documentation**: Check API docs at `/docs`
- **Logs**: Always check application and system logs first
- **GitHub Issues**: Report bugs and feature requests
- **Community**: Join our Discord server for support

---

This setup and deployment guide provides comprehensive instructions for getting the Student Marketplace application running in both development and production environments. Follow the appropriate sections based on your deployment needs.