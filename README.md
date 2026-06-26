# Smart-Reco-Engine

Smart-Reco-Engine is a MERN product substitution demo. The backend ranks same-category alternatives with a transparent scoring formula, then optionally uses Gemini only to write the human-readable reason. The frontend is a Vite React app wired to the Express API for product CRUD, inventory updates, and generated recommendations.

## Stack

- Frontend: React, Vite, Material UI, lucide-react
- Backend: Node.js, Express, Mongoose
- Database: MongoDB Atlas or local MongoDB
- AI explanation layer: Gemini via `@google/generative-ai`

## Project Structure

```text
backend/
  src/
    app.js
    config/db.js
    controllers/
    models/
    routes/
    services/
  seed/seed.js
frontend/
  src/
    api.js
    ProductCatalog.jsx
    Inventory.jsx
    CustomerShopping.jsx
    Cart.jsx
```

## API Flow

- `GET /api/products` lists catalog products.
- `POST /api/products`, `PUT /api/products/:id`, and `DELETE /api/products/:id` power the admin catalog.
- `GET /api/inventory`, `POST /api/inventory`, and `PUT /api/inventory/:id` power stock views and stock edits.
- `POST /api/recommendations/generate-recommendations` runs the recommendation engine and saves reasons.
- `GET /api/recommendations/:productId` reads cached recommendation rows.
- `GET /api/analytics/top-recommended` returns the most frequently recommended products.

## Recommendation Formula

The ranking engine uses the documented 0-100 rule-based formula:

```text
score = 40 * categoryMatch
      + 20 * priceSimilarity
      + 20 * (candidate.rating / 5)
      + 20 * inStock
```

Only same-category candidates qualify. In-stock alternatives sort ahead before score tie-breaking. Gemini is not used for ranking; it only writes or falls back to a short explanation string.

## Local Setup

1. Install backend dependencies:

```bash
cd backend
npm ci
cp .env.example .env
```

2. Fill `backend/.env`:

```text
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=optional_gemini_key
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
```

3. Seed demo data:

```bash
npm run seed
```

4. Start the backend:

```bash
npm run dev
```

5. Install and start the frontend:

```bash
cd ../frontend
npm ci
cp .env.example .env
npm run dev
```

The frontend reads `VITE_API_URL`, defaulting to `http://localhost:5000/api`.

## Deployment Notes

- Render backend env vars: `MONGO_URI`, `GEMINI_API_KEY`, `PORT`, `CLIENT_ORIGIN`.
- Vercel frontend env var: `VITE_API_URL=https://your-render-service.onrender.com/api`.
- Set `CLIENT_ORIGIN` to the deployed Vercel origin so CORS allows browser requests.
- For Atlas with Render, configure the network access allowlist for the backend host.

## Validation

Current checks:

```bash
cd frontend && npm run lint
cd frontend && npm run build
cd backend && node --check src/app.js
```
