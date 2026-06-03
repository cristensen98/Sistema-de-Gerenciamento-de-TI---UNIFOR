module.exports = {
  apps: [
    {
      name: 'sti-app',
      script: './server.ts',
      interpreter: 'tsx',
      // Modo produção
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        DB_PATH: 'sisti.db',
        PORT: 3000
      },
      // Auto-restart se o processo caia
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      // Logs
      out_file: 'logs/out.log',
      error_file: 'logs/error.log',
      log_file: 'logs/combined.log',
      time: true,
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,
      // Retry config
      max_restarts: 10,
      min_uptime: '10s'
    }
  ],
  // Configuração de clustering (não usar no Windows)
  deploy: {
    production: {
      user: 'node',
      host: 'your.server.com',
      ref: 'origin/master',
      repo: 'git@github.com:repo.git',
      path: '/var/www/sti-app',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};
