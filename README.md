# E-Commerce Inventory Management System

> A full-stack MERN inventory management platform with role-based access control, real-time stock alerts, and order lifecycle tracking.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://e-commerce-inventory-management-sys.vercel.app)
[![API](https://img.shields.io/badge/API-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://ecommerce-inventory-api-lsgf.onrender.com)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/ruchitadarur20/E-Commerce-Inventory-Management-System)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

---

## Live Demo

| Service | URL |
|---------|-----|
| Frontend | https://e-commerce-inventory-management-sys.vercel.app |
| Backend API | https://ecommerce-inventory-api-lsgf.onrender.com |

**Demo credentials**

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@demo.com` | `demo1234` |
| Viewer | `viewer@demo.com` | `demo1234` |

> Admins can create, edit, and delete products and update order statuses. Viewers have read-only access.

---

## Screenshots

> Add screenshots here after deployment.
>
> Suggested captures: Login page · Dashboard KPI cards · Products table with low-stock badges · Orders table with status dropdown

---

## Features

- **JWT Authentication** — secure login with 7-day token expiry; credentials persisted in `localStorage`
- **Role-Based Access Control** — `admin` and `viewer` roles enforced on both frontend routes and backend middleware
- **Product Management** — full CRUD (admin), name/category search, pagination, compound MongoDB index on `{ category, name }`
- **Low Stock Alerts** — dashboard badge count and alert table for any product at or below its configurable threshold
- **Order Management** — create orders with real-time stock validation; auto-generated order numbers; populated product refs
- **Order Status Tracking** — five-stage lifecycle (`pending → processing → shipped → delivered → cancelled`); admin dropdown with optimistic UI updates
- **Live Dashboard** — KPI cards for total products, total orders, and low-stock item count
- **Seed Script** — one-command database seeding with demo users and sample products

---

## Tech Stack

### Frontend

![React](https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite_5-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_3-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router_v6-CA4245?style=flat-square&logo=react-router&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat-square&logo=axios&logoColor=white)

### Backend

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=flat-square&logo=mongoose&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)
![bcryptjs](https://img.shields.io/badge/bcryptjs-003A70?style=flat-square)

### DevOps

![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=flat-square&logo=render&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat-square&logo=github-actions&logoColor=white)

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- A [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (free tier works)

### 1. Clone the repository

```bash
git clone https://github.com/ruchitadarur20/E-Commerce-Inventory-Management-System.git
cd E-Commerce-Inventory-Management-System
```

### 2. Set up the backend

```bash
cd server
npm install
```

Create `server/.env` (see [Environment Variables](#environment-variables) below), then:

```bash
npm run dev        # development with nodemon
npm start          # production
```

Seed the database with demo users and sample products:

```bash
npm run seed
```

### 3. Set up the frontend

Open a new terminal from the project root:

```bash
cd client
npm install
```

Create `client/.env` (see below), then:

```bash
npm run dev        # http://localhost:3000
npm run build      # production build
```

---

## Environment Variables

### `server/.env`

```env
PORT=5001
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

> **Note:** If your MongoDB password contains special characters (e.g. `@`), URL-encode them — `@` becomes `%40`.

### `client/.env`

```env
VITE_API_URL=http://localhost:5001/api
```

---

## API Endpoints

### Authentication &nbsp;`/api/auth`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/register` | Public | Register a new user |
| `POST` | `/login` | Public | Login and receive a JWT |

### Products &nbsp;`/api/products`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/` | Protected | List products — supports `?name=`, `?category=`, `?page=`, `?limit=` |
| `GET` | `/low-stock` | Protected | Products at or below their `lowStockThreshold` |
| `GET` | `/:id` | Protected | Get a single product |
| `POST` | `/` | Admin | Create a product |
| `PUT` | `/:id` | Admin | Update a product |
| `DELETE` | `/:id` | Admin | Delete a product |

### Orders &nbsp;`/api/orders`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/` | Protected | List all orders |
| `GET` | `/:id` | Protected | Get a single order |
| `POST` | `/` | Protected | Create an order (validates stock, deducts quantities) |
| `PUT` | `/:id/status` | Admin | Update order status |

---

## Project Structure

```
E-Commerce-Inventory-Management-System/
├── client/                          # React TypeScript frontend
│   ├── src/
│   │   ├── api/
│   │   │   └── axiosInstance.ts     # Axios client with auth interceptor
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── context/
│   │   │   └── AuthContext.tsx      # Auth state, login/logout, token persistence
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── ProductsPage.tsx
│   │   │   └── OrdersPage.tsx
│   │   ├── types/
│   │   │   └── index.ts             # Shared TypeScript interfaces
│   │   └── App.tsx                  # Router and layout setup
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
│
├── server/                          # Node.js Express backend
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                # Mongoose connection
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── productController.js
│   │   │   └── orderController.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js    # protect + adminOnly
│   │   │   └── errorMiddleware.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Product.js
│   │   │   └── Order.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── productRoutes.js
│   │   │   └── orderRoutes.js
│   │   └── utils/
│   │       ├── generateToken.js
│   │       └── seedData.js          # Database seeder
│   ├── server.js
│   └── package.json
│
└── README.md
```

---

## License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">Built with the MERN stack &mdash; MongoDB · Express · React · Node.js</p>
