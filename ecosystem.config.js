module.exports = {
  apps: [
    {
      name: 'marketplace-api',
      script: 'gunicorn',
      args: 'app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000',
      cwd: './backend',
      interpreter: './backend/venv/bin/python',
      env: {
        ENVIRONMENT: 'production',
        DATABASE_URL: 'postgresql://username:password@localhost:5432/marketplace_prod',
        REDIS_URL: 'redis://localhost:6379/0',
        SECRET_KEY: 'your-production-secret-key'
      },
      env_staging: {
        ENVIRONMENT: 'staging',
        DATABASE_URL: 'postgresql://username:password@localhost:5432/marketplace_staging',
        REDIS_URL: 'redis://localhost:6379/1'
      },
      instances: 4,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      log_file: '/var/log/pm2/marketplace-api.log',
      out_file: '/var/log/pm2/marketplace-api-out.log',
      error_file: '/var/log/pm2/marketplace-api-error.log',
      time: true,
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ],

  deploy: {
    production: {
      user: 'ubuntu',
      host: ['your-production-server.com'],
      ref: 'origin/main',
      repo: 'https://github.com/PuvadonKub/Vibe_Coding_Workshop.git',
      path: '/var/www/marketplace-production',
      'post-deploy': 'npm install && npm run build && cd backend && pip install -r requirements.txt && alembic upgrade head && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt-get update && apt-get install -y git nodejs npm python3 python3-pip python3-venv postgresql redis-server nginx'
    },
    staging: {
      user: 'ubuntu',
      host: ['your-staging-server.com'],
      ref: 'origin/develop',
      repo: 'https://github.com/PuvadonKub/Vibe_Coding_Workshop.git',
      path: '/var/www/marketplace-staging',
      'post-deploy': 'npm install && npm run build && cd backend && pip install -r requirements.txt && alembic upgrade head && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': 'apt-get update && apt-get install -y git nodejs npm python3 python3-pip python3-venv postgresql redis-server nginx'
    }
  }
};