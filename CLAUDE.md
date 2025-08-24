# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Discord bot project called "Taureau Celtique" (v4.2.a) - a French Discord bot for WebDev assistance and project management. The project consists of two main components:

1. **Discord Bot** (`src/`): Node.js Discord bot with slash commands, reminder system, and API server
2. **Web Dashboard** (`site/`): PHP MVC web application for bot management and statistics

## Development Commands

### Bot Development
```bash
# Start the bot in development mode with auto-reload
npm run dev

# Start the bot in production
npm start

# Deploy slash commands to Discord (guild-specific)
npm run deploy

# Deploy commands globally (takes up to 1 hour to propagate)
npm run deploy:global

# Deploy specific command categories
npm run deploy:admin
npm run deploy:db
```

### Advanced Deployment Options
```bash
# Deploy specific category
node src/deploy.js --category general

# Deploy globally with specific category
node src/deploy.js --global --admin

# Show help
node src/deploy.js --help
```

### Web Dashboard
The PHP dashboard requires a web server (Apache/Nginx) and MySQL database. Access via browser after configuring `site/Config/config.php`.

## Architecture

### Bot Structure (`src/`)
- **Commands**: Organized by category in `commands/` (admin, general, moderation, projects, studi)
- **Events**: Discord event handlers in `events/`
- **Utils**: Database connections, logging, reminder management, scheduler
- **API Server**: Express.js server (`api/apiServer.js`) for external integrations
- **Models**: Command base classes and admin command framework

### Command System
Commands use Discord.js SlashCommandBuilder pattern:
- Must export `data` (SlashCommandBuilder) and `execute`/`run` function
- Bot automatically aliases `execute` ↔ `run` for compatibility
- Commands loaded dynamically from category directories

### Database Integration
- MySQL database with connection pooling
- Graceful degradation when DB unavailable (limited mode)
- Initialization scripts in `database/init.sql` and `utils/dbInit.js`

### Web Dashboard Structure (`site/`)
- **MVC Architecture**: Controllers, Models, Views separation
- **Authentication**: Role-based access (Viewer, Editor, Admin)
- **Features**: Resource management, user statistics, Discord integration testing

## Environment Configuration

Required `.env` variables:
```
BOT_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_application_id
GUILD_ID=your_discord_server_id (optional, for guild commands)

# Database (optional - bot runs in limited mode without)
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name

# API Server
API_PORT=3000 (optional, defaults to 3000)
LOG_LEVEL=INFO (optional)
```

## Key Features

### Bot Capabilities
- **Multi-language support**: French primary, extensible language system
- **Project Management**: Create projects, subgroups, member assignment
- **Moderation**: Ban/unban system with "studi" specific moderation
- **Reminders**: Scheduled reminder system with database persistence  
- **Documentation Search**: Built-in docs search with cached resources
- **Admin Commands**: Database management, user roles, statistics

### Caching System
Extensive documentation cache in `src/cache/` covering:
- Frontend frameworks (React, Angular, Vue)
- Backend technologies (Node.js, PHP, Python, Django, Laravel)
- Databases (MySQL, MongoDB, PostgreSQL)
- DevOps tools (Docker, Kubernetes, Git)
- Security resources (OWASP, penetration testing)

### Logging
Structured logging with multiple levels via `utils/logger.js`:
- Console output with colors (chalk)
- File logging to `logs/` directory
- Configurable log levels (DEBUG, INFO, WARN, ERROR, FATAL)

## Development Notes

- **ES Modules**: Project uses `"type": "module"` - use import/export syntax
- **Node.js 20+**: Required for compatibility
- **French Language**: Primary language for user-facing text and documentation
- **Error Handling**: Comprehensive error handling with graceful degradation
- **Security**: Prepared statements for SQL, password hashing, input validation