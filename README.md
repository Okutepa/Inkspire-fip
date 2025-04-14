# INKSPIRE Tattoo Studio Website

A dual-purpose platform featuring a public promotional website and a role-based content management system for a tattoo studio.

## Project Overview

The INKSPIRE Tattoo website consists of two main components:

1. **Public Site** - A promotional website showcasing the tattoo studio, its artists, and portfolio
2. **Admin CMS** - A private content management system with role-based access (admin/artist) for managing content

## Features

### Public Site
- Modern, responsive design
- Artist showcase with bios and specializations
- Tattoo portfolio gallery with filtering options
- About Us section with studio information
- Interactive video section showcasing the studio's work
- Feature cards highlighting studio benefits

### Admin CMS
- Secure JWT-based authentication system
- Role-based access control (admin and artist roles)
- Dashboard with activity overview
- Artist management (admin only)
- Tattoo portfolio management
- Image upload functionality
- Content filtering and search features

## Technology Stack

- **Frontend**:
  - HTML5, CSS3, JavaScript
  - Vue.js (without build step, global Vue object)
  - SASS for CSS preprocessing
  - GSAP for animations
  - Responsive design with custom grid system

- **Backend**:
  - PHP/Lumen framework for API
  - JWT authentication
  - RESTful API architecture
  - MySQL database

## Project Structure

```
htdocs/
└── Inkspire-fip/
    ├── frontend/              # Frontend assets and pages
    │   ├── index.html         # Public-facing promotional site
    │   ├── login.html         # Login page
    │   ├── admin/            
    │   │   └── dashboard.html # Admin dashboard
    │   ├── artist/
    │   │   └── dashboard.html # Artist dashboard
    │   ├── css/               # Compiled CSS files
    │   ├── js/                # JavaScript files
    │   │   ├── main.js        # Main application logic
    │   │   ├── pages/         # Page-specific JS
    │   │   │   ├── login.js   # Login functionality
    │   │   │   └── admin.js   # Admin dashboard logic
    │   │   └── services/
    │   │       └── auth.service.js # Authentication service
    │   ├── images/            # Image assets
    │   └── sass/              # SCSS source files
    │       ├── abstracts/     # Variables, mixins, etc.
    │       ├── base/          # Base styles
    │       ├── components/    # Component styles
    │       └── pages/         # Page-specific styles
    └── api/                   # Lumen backend
        └── public/
            └── api/           # API endpoints
```

## API Endpoints

The backend API is accessible at: `http://localhost:8888/Inkspire-fip/api/public/api`

### Authentication Endpoints
- **POST** `/login` - Authenticate user and get token
- **POST** `/register` - Register new user (admin only)
- **POST** `/logout` - Invalidate current token
- **GET** `/me` - Get current user info

### Resource Endpoints
- **GET/POST** `/artists` - List all artists / Create new artist
- **GET/PUT/DELETE** `/artists/{id}` - Read, update or delete specific artist
- **GET/POST** `/tattoos` - List all tattoos / Create new tattoo
- **GET/PUT/DELETE** `/tattoos/{id}` - Read, update or delete specific tattoo
- **POST** `/contact` - Submit contact form

## Setup and Installation

### Prerequisites
- Web server with PHP 7.4+
- MySQL 5.7+
- Composer (for backend dependencies)

### Backend Setup
1. Navigate to the `api` directory
2. Run `composer install` to install dependencies
3. Configure your database in `.env` file
4. Run migrations: `php artisan migrate`
5. Seed the database: `php artisan db:seed`

### Frontend Setup
1. Configure the API base URL in `js/services/auth.service.js`
2. If using SASS compilation, run your SASS compiler:
   ```
   sass --watch sass:css
   ```

## Usage

### Public Site
Access the public site at: `http://localhost:8888/Inkspire-fip/frontend/index.html`

### Admin CMS
1. Access the login page: `http://localhost:8888/Inkspire-fip/frontend/login.html`
2. Log in with admin or artist credentials
3. You will be redirected to the appropriate dashboard based on your role

#### Test Accounts
- **Admin**: admin@example.com / password
- **Artist**: artist@example.com / password

## Development Guidelines

### SASS Structure
- Use the provided SASS architecture for styling
- Add new component styles in `sass/components/`
- Page-specific styles go in `sass/pages/`
- Use variables from `sass/abstracts/_variables.scss`

### JavaScript
- Add page-specific JS in `js/pages/`
- Use the auth service for authentication-related functionality
- Follow the established pattern for API calls

### API Integration
- All API calls should include appropriate error handling
- Use the auth service to get authentication headers
- Follow RESTful conventions for CRUD operations

## Browser Compatibility
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License
© INKSPIRE Tattoo Studio. All rights reserved.

## Acknowledgments
- GSAP for animation libraries
- Vue.js for frontend reactivity
- Lumen for backend API framework
