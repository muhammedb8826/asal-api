# ASAL API

A NestJS-based REST API for the ASAL business management system with JWT authentication and PostgreSQL database.

## Features

- 🔐 JWT Authentication (Access & Refresh Tokens)
- 👤 User Management
- 🗄️ PostgreSQL Database with TypeORM
- 📊 Business Entity Management
- 🔄 Automatic Database Synchronization
- 🌱 Database Seeding

## Tech Stack

- **Framework:** NestJS
- **Database:** PostgreSQL
- **ORM:** TypeORM
- **Authentication:** JWT (Passport)
- **Validation:** class-validator
- **Language:** TypeScript

## Prerequisites

- Node.js (v18+)
- PostgreSQL (v12+)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd asal-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=your_password
   DB_DATABASE=asal
   DB_SYNCHRONIZE=true
   DB_LOGGING=true

   # Application Configuration
   PORT=3001

   # JWT Secrets
   AT_SECRET=your_access_token_secret
   RT_SECRET=your_refresh_token_secret
   ```

4. **Set up PostgreSQL**
   - Install PostgreSQL locally or use Docker
   - Create a database named `asal`
   - Update the `.env` file with your database credentials

## Running the Application

1. **Start the application**
   ```bash
   npm run start:dev
   ```

2. **Seed the database** (optional)
   ```bash
   npm run seed
   ```

The API will be available at `http://localhost:3001`

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST   | `/signup` | Register new user | No |
| POST   | `/signin` | Login user | No |
| POST   | `/logout` | Logout user | Yes |
| POST   | `/refresh` | Refresh access token | Yes |

### Key Endpoints

| Area | Method | Endpoint | Description |
|------|--------|----------|-------------|
| Categories | GET | `/categories` | List categories |
| Categories | POST | `/categories` | Create category |
| Categories | GET | `/categories/:id` | Get category by id |
| Categories | PATCH | `/categories/:id` | Update category |
| Categories | DELETE | `/categories/:id` | Delete category |
| Unit Categories | GET | `/unit-categories` | List unit categories |
| Unit Categories | POST | `/unit-categories` | Create unit category |
| Unit Categories | GET | `/unit-categories/:id` | Get unit category by id |
| Unit Categories | PATCH | `/unit-categories/:id` | Update unit category |
| Unit Categories | DELETE | `/unit-categories/:id` | Delete unit category |
| UOMs | GET | `/uoms` | List units of measure (filter by unitCategoryId) |
| UOMs | POST | `/uoms` | Create unit of measure |
| UOMs | GET | `/uoms/:id` | Get UOM by id |
| UOMs | PATCH | `/uoms/:id` | Update UOM |
| UOMs | DELETE | `/uoms/:id` | Delete UOM |
| Products | GET | `/products` | List products | 
| Products | POST | `/products` | Create product (with image upload) |
| Products | GET | `/products/:id` | Get product by id |
| Products | PATCH | `/products/:id` | Update product (with image upload) |
| Products | DELETE | `/products/:id` | Delete product |

See `CATEGORY_CRUD_GUIDE.md` (Categories), `UOM_CATEGORY_API.md` (Unit Categories & UOMs), and `PRODUCT_CRUD_GUIDE.md` (Products) for full request/response payloads and validation rules.

### Example Usage

**Register a new user:**
```bash
curl -X POST http://localhost:3001/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "phone": "+1234567890",
    "address": "123 Main Street"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3001/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Access protected endpoint:**
```bash
curl -X POST http://localhost:3001/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Database Schema

The application includes the following main entities:

- **User** - User management and authentication
- **FixedCost** - Business fixed costs tracking
- **Purchase** - Purchase management
- **Sale** - Sales management
- **Product** - Product management with image upload
- **Category** - Item categorization
- **UnitCategory** - Measurement dimensions (e.g., Weight, Length)
- **UOM** - Units of Measure (e.g., Kilogram, Gram) with conversion rates
- **Customer** - Customer information
- **Vendor** - Vendor information

## Authentication Flow

1. **Registration/Login** → Receive access and refresh tokens
2. **API Requests** → Include access token in Authorization header
3. **Token Expiry** → Use refresh token to get new access token
4. **Logout** → Invalidate refresh token

## Default Admin User

After running the seed command, you can login with:

- **Email:** `admin@asal.com`
- **Password:** `password`

## Development

### Available Scripts

- `npm run start` - Start the application
- `npm run start:dev` - Start in development mode with hot reload
- `npm run start:debug` - Start in debug mode
- `npm run build` - Build the application
- `npm run seed` - Seed the database
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Project Structure

```
src/
├── auth/           # Authentication module
├── common/         # Shared utilities and guards
├── config/         # Configuration files
├── decorators/     # Custom decorators
├── entities/       # Database entities
├── enums/          # Enumerations
├── app.module.ts   # Main application module
├── main.ts         # Application entry point
└── seed.ts         # Database seeding script
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 5432 |
| `DB_USERNAME` | Database username | postgres |
| `DB_PASSWORD` | Database password | - |
| `DB_DATABASE` | Database name | asal |
| `DB_SYNCHRONIZE` | Auto-sync schema | true |
| `DB_LOGGING` | Enable query logging | false |
| `PORT` | Application port | 3001 |
| `AT_SECRET` | Access token secret | - |
| `RT_SECRET` | Refresh token secret | - |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the UNLICENSED license.

## Support

For support and questions, please contact the development team.