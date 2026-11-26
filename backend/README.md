# KindRoute Backend (Express.js + MongoDB)

KindRoute's complete Node.js / Express.js backend powered by MongoDB and Mongoose.

## 🚀 Features

- **Authentication & Authorization**:
  - User signup and login with secure **bcrypt** password hashing
  - JWT token generation & verification middleware
  - Role management: **Donor** and **NGO**
  - **Dynamic Role Switching**: Switch between Donor and NGO workspaces on the fly (`POST /api/auth/switch-role`)
- **Donation Management**:
  - Donors can post new donations with categories, quantities, locations, descriptions, and coordinates
  - NGOs can browse, filter (by category/search/status), and **reserve** donations (`POST /api/donations/:id/reserve`)
  - NGOs can release reservations if necessary (`POST /api/donations/:id/release`)
  - Mark deliveries as completed/verified (`POST /api/donations/:id/complete`), automatically awarding kindness points (+120 pts) to the donor in MongoDB
- **NGO Requirements / Community Needs**:
  - List and create community needs/urgencies
- **Platform Analytics**:
  - Total donations, delivered items, active NGOs, community impact points
- **Seed Script**:
  - Pre-populate demo accounts (Alex Morgan - Donor, Robin Hood Army - NGO, Goonj Foundation - NGO), sample donations, and community needs

---

## 🛠️ Environment Variables Setup

Open `backend/.env` (or copy from `backend/.env.example`):

```env
PORT=5000
NODE_ENV=development

# MongoDB Connection String:
# For Local MongoDB:
MONGODB_URI=mongodb://127.0.0.1:27017/kindroute

# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/kindroute?retryWrites=true&w=majority

# JWT Secret Key
JWT_SECRET=kindroute_secret_jwt_key_2026_super_secure

# Frontend Client URL (for CORS)
CLIENT_URL=http://localhost:5173
```

---

## 🏃 Running the Backend

From the project root:

```bash
# Option 1: Run directly from root
npm run backend

# Option 2: Navigate into backend folder
cd backend
npm run dev
```

For production mode:
```bash
cd backend
npm start
```

---

## 🌱 Seeding Demo Data

Once your `MONGODB_URI` is configured in `backend/.env`:

```bash
# From root:
npm run seed

# Or from backend/:
cd backend
npm run seed
```

This populates:
1. **Donor Account**: `alex@kindroute.org` / `password123`
2. **NGO Account 1**: `robinhood@kindroute.org` / `password123`
3. **NGO Account 2**: `goonj@kindroute.org` / `password123`
4. Sample food, clothing, book, and electronic donations
5. Community urgent requirements

---

## 📡 API Reference

### 1. Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user or NGO account | Public |
| `POST` | `/api/auth/login` | Login user, returns JWT token | Public |
| `GET` | `/api/auth/me` | Get currently authenticated user profile | Private (Bearer token) |
| `PUT` | `/api/auth/profile` | Update profile information | Private |
| `POST` | `/api/auth/switch-role` | Switch role between `donor` and `ngo` | Private |

### 2. Donations (`/api/donations`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/donations` | List all donations (supports `?category=`, `?status=`, `?search=`) | Public |
| `GET` | `/api/donations/:id` | Get single donation details by ID or code (`KR-xxxx`) | Public |
| `POST` | `/api/donations` | Post a new donation | Public / Auth |
| `POST` | `/api/donations/:id/reserve` | NGO reserves/receives a donation | Public / Auth |
| `POST` | `/api/donations/:id/release` | Release reserved donation back to Available | Public / Auth |
| `POST` | `/api/donations/:id/complete` | Complete pickup / verify delivery (+120 kindness pts) | Public / Auth |
| `DELETE` | `/api/donations/:id` | Delete donation | Public / Auth |

### 3. NGO Needs (`/api/needs`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/needs` | Get all NGO requirements and requests | Public |
| `POST` | `/api/needs` | Post a community need | Public / Auth |
| `DELETE` | `/api/needs/:id` | Remove a need | Public / Auth |

### 4. Platform Stats (`/api/stats`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/stats` | Get total donations, delivered count, points, active NGOs | Public |

### 5. Health Check (`/api/health`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/health` | Check backend server status | Public |
