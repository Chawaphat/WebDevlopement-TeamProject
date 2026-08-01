<img width="1409" height="754" alt="image" src="https://github.com/user-attachments/assets/41222a47-81c0-4868-8f2e-00862dfb01c5" />

# Game Shop Web Application

## 📌 Overview
A full-stack e-commerce web app for browsing and purchasing digital games, built as a team web-development term project. It includes a customer-facing storefront and a separate admin back-office for managing the catalog, orders, and users.

## ✨ Key Features
- **Storefront** — homepage, product browsing, category collections, and product detail pages.
- **Shopping cart & checkout** — add-to-cart, order placement flow, and order receipt/thank-you pages.
- **User accounts** — registration and login with hashed passwords (bcrypt), server-side session-based authentication, and a customer profile page with order history.
- **Role-based access control** — session middleware distinguishes plain users from Admins, with a hardened "main Admin" check (specific email) alongside a general Admin role check for back-office access.
- **Admin back-office** — full CRUD for products and categories, homepage/new-release content management, order history & order detail views, and user management, all under a protected `/backoffice` route group.
- **Persistent sessions** — sessions are stored in MySQL (`express-mysql-session`) rather than in memory, so login state survives server restarts.

## 🛠️ Tech Stack
| Layer | Technology |
|---|---|
| Runtime / Framework | Node.js, Express |
| Templating | EJS (server-rendered views) |
| Database | MySQL (via `mysql2`) , MySQL Workbench|
| Auth & sessions | `express-session` + `express-mysql-session` (DB-backed sessions), `bcryptjs` for password hashing |
| Security | CSRF protection (`csrf`), environment config via `dotenv` |
| Utilities | Lodash |

## 🏗️ Architecture (High Level)
```
Browser
   │  HTTP (session cookie)
   ▼
Express App (app.js)
  ├── Session middleware ── MySQL-backed session store
  ├── Auth guards: checkSession / checkAdmin / checkRoleAdmin
  ├── Route groups
  │     ├── "/"           → webstore routes (public storefront: browse, cart, checkout, profile)
  │     └── "/backoffice"  → backoffice routes (admin-only: products, categories, orders, users)
  ├── Controllers (controller/*)  → e.g. authen.js handles login/registration logic
  ├── Models (model/*)            → baseSQLModel (generic query helper), userModel, listItem
  └── Views (src/views/*.ejs)     → server-rendered pages for webstore & backoffice, each with shared partials (head/nav/footer/sidebar)
        │
        ▼
    MySQL Database
```
The app follows a classic **server-rendered MVC** structure: Express routes delegate to controllers/models for data access and business logic (login, product/category CRUD, orders), and EJS templates render the resulting HTML. Access to the two route groups (public storefront vs. admin back-office) is enforced through layered session-based middleware guards.

## 📸 Screenshots
<img width="1409" height="754" alt="image" src="https://github.com/user-attachments/assets/41222a47-81c0-4868-8f2e-00862dfb01c5" />
<img width="1392" height="750" alt="image" src="https://github.com/user-attachments/assets/c81bf5f8-6a08-4c64-ba68-ee6442eaaa69" />
<img width="722" height="569" alt="image" src="https://github.com/user-attachments/assets/55f8dc79-1e98-4d66-9148-18fa2259ad32" />
<img width="1395" height="735" alt="image" src="https://github.com/user-attachments/assets/72a9d5dd-30a8-4e08-af7c-8d1b8d53900c" />
<img width="658" height="532" alt="image" src="https://github.com/user-attachments/assets/82d9985c-6e0b-4f49-a6ec-1cc5cde12261" />
<img width="1392" height="728" alt="image" src="https://github.com/user-attachments/assets/4b6aa6fe-f894-4012-9b9a-8570f1cf5e4f" />
<img width="1469" height="862" alt="image" src="https://github.com/user-attachments/assets/11d83c03-8b9f-4bb3-b140-512389cc51a5" />






