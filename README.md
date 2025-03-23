# Role Manager with Database Support

A comprehensive application for managing roles and their permissions with a SQLite database backend.

## Overview

This application provides a user interface for:
- Viewing existing roles and their permissions
- Creating new roles
- Cloning roles from existing ones
- Managing permissions for modules, pages, and operations
- Generating SQL scripts for database operations

## Features

- **Database Backend**: All data is stored in a SQLite database
- **Role Management**: Intuitive interface for managing roles and permissions
- **SQL Generation**: Ability to view and copy SQL statements for database operations
- **Template Roles**: Special handling for template roles

## Technical Details

- Built with React, TypeScript, and Vite
- Uses SQLite for data storage
- Follows clean architecture principles with separation of concerns

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
```
git clone https://github.com/yourusername/role-manager.git
cd role-manager
```

2. Install dependencies
```
npm install
```

3. Run the development server
```
npm run dev
```

4. Initialize the database (first time only)
```
npm run migrate
```

## Architecture

### Directory Structure

```
src/
  ├── components/     # UI components
  ├── context/        # React context
  ├── data/           # Static data (for migration)
  ├── services/       # Database services
  ├── styles/         # CSS styles
  ├── types/          # TypeScript models and interfaces
  ├── utils/          # Utility functions
  └── App.tsx         # Main application component
scripts/
  └── migrateData.ts  # Database migration script
```

### Key Files

- **services/db.ts**: Database operations and initialization
- **services/dataMigration.ts**: Migration of static data to the database
- **context/AppContext.tsx**: State management and data operations
- **components/RoleDetail.tsx**: Role editing component
- **components/RoleList.tsx**: Role listing component

## Configuration

The application creates a SQLite database file at `./rolemanager.db`. You can modify the database path in `src/services/db.ts`.

## License

MIT