# MS Admin Dashboard

React 19 + Vite + Tailwind v4 admin panel for the MS shop API in `../server`.

## Run

```bash
# 1. API (in ../server)
npm run seed     # first time: products + superadmin from ADMIN_EMAIL / ADMIN_PASSWORD
npm run dev      # http://localhost:5000

# 2. Dashboard (here)
npm install
npm run dev      # http://localhost:5173
```

In dev, Vite proxies `/api` and `/uploads` to the API (`API_PROXY_TARGET`, default `http://localhost:5000`), so no CORS setup is needed.
For a production build served from a different origin, set `VITE_API_URL` and add the dashboard origin to `CLIENT_URLS` in `server/.env`.

## Structure

```
src/
  api/          client.js (fetch + token + errors), endpoints.js (one function per server route)
  context/      AuthContext (login, session restore, auto-logout on 401), ToastContext
  hooks/        useApi (load/reload/stale-guard), useDebounced
  components/
    layout/     Sidebar, Topbar (search + API health), Layout
    ui/         Icon, Badge, Modal, Feedback, Pagination, Common (cards, fields, toggles…)
    charts/     BarChart
    orders/     NewOrderModal
    products/   ProductFormModal, StockModal, ImagesModal
  pages/        Login, Dashboard, Orders, OrderDetail, Products, Customers, CustomerDetail,
                Settings, TrackOrder, Storefront
  utils/        constants (statuses, areas, theme per status), format (money, dates)
```

## Pages → endpoints

| Page | Endpoints |
|---|---|
| Login / session | `POST /admin/login`, `POST /admin/logout`, `GET /admin/me` (also pinged every 5 min to keep the session alive) |
| Top bar | `GET /health` (polled every 30 s) |
| Dashboard | `GET /admin/dashboard`, `GET /orders?limit=6` |
| Orders | `GET /orders` (status, q, area, from, to, page), `POST /orders` (new phone order) |
| Order detail | `GET /orders/:id`, `PATCH /orders/:id/status`, `PATCH /orders/:id`, `POST /orders/:id/courier`, `POST /orders/:id/courier/sync` |
| Products | `GET /products/admin/all`, `GET /products/admin/:id`, `POST /products`, `PUT /products/:id`, `PATCH /products/:id/stock`, `DELETE /products/:id`, `POST`/`DELETE /products/:id/images` |
| Customers | `GET /customers`, `GET /customers/:id`, `PATCH /customers/:id` |
| Settings | `GET /admin/me`, `PUT /admin/password` |
| Track order | `GET /orders/track/:orderId?phone=` |
| Storefront | `GET /products`, `GET /products/:slug` |

## Theme

Purple (`brand-*`), light red (`blush-*`) and white, defined as Tailwind tokens in `src/index.css`.
Shared classes: `card`, `btn btn-primary|accent|soft|ghost|danger`, `input`, `label`, `table`.
