# Shop Ledger

A small inventory app for a shop. Every stock change is saved as a "movement" (purchase, sale, return or adjustment), and the current stock of a product is always worked out from those movements. Nobody can type a stock number in directly.

Built with Next.js (App Router), MongoDB with Mongoose, and Tailwind CSS.

## How to set up and run

You need Node.js 20.6 or newer and a MongoDB database that runs as a replica set (I use transactions, and MongoDB only supports them on a replica set).

1. Install packages:

   npm install

2. Copy the example env file and fill it in:

   cp .env.example .env

   - MONGODB_URI: your MongoDB connection string
   - AUTH_SECRET: any long random string (for example from `openssl rand -base64 32`)

3. Database options:
   - MongoDB Atlas (free tier) works straight away, just paste its connection string.
   - Or run MongoDB locally with Docker:

     docker run -d --name mongo -p 27017:27017 mongo:7 --replSet rs0
     docker exec mongo mongosh --eval 'rs.initiate({_id:"rs0",members:[{_id:0,host:"127.0.0.1:27017"}]})'

     and use MONGODB_URI=mongodb://127.0.0.1:27017/shop_ledger?replicaSet=rs0

4. Load demo data:

   npm run seed

5. Start the app:

   npm run dev

   Then open http://localhost:3000

6. Run the tests:

   npm test

   The tests start their own in-memory MongoDB replica set, so no setup is needed. The first run downloads a MongoDB binary, so it needs internet.

### Demo logins

| Role  | Email           | Password    |
|-------|-----------------|-------------|
| Owner | owner@shop.test | password123 |
| Staff | staff@shop.test | password123 |

The owner can do everything. Staff can only record sales and returns.

## Data model

There are three collections.

**User**: name, email, passwordHash (bcrypt), role ("owner" or "staff").

**Product**: sku (unique), name, category, unit, price, lowStockThreshold, and a small `lockVersion` number that is only used for concurrency (explained below). There is no stock field on purpose.

**Movement**: product, type (purchase / sale / return / adjustment), quantity, delta, reason, date, user and userName. Movements are only ever added, never edited. `delta` is the signed effect on stock: negative for a sale, positive for a purchase or return, and for an adjustment it keeps the sign the owner typed.

Current stock of a product = the sum of `delta` over all its movements, calculated with a MongoDB aggregation. The product page also shows a running balance after each movement.

## Main design decisions

**Stock can never go negative, even with two sales at the same moment.**
Every movement is saved inside a MongoDB transaction (`recordMovement` in `src/lib/stock.js`). The first thing the transaction does is update the product document (`$inc` on `lockVersion`). So two transactions for the same product conflict with each other. MongoDB aborts one and `withTransaction` retries it. On the retry it can see the first sale, so the check "stock + delta must not be below 0" uses the real number and rejects the second sale with a clear error. I wrote tests for two sales of the last item and for 12 parallel sales of a product with 5 units.

**Roles are checked on the server.**
Each API route calls `requireUser()` (in `src/lib/auth.js`). It reads a signed httpOnly cookie, then loads the user from the database, so the role is never trusted from the browser. Creating, editing and deleting products and the CSV export are owner only. The allowed movement types per role are checked again inside `recordMovement`, so staff can't record a purchase or adjustment even by calling the API directly. The UI also hides those options, but that is only for convenience.

**Validation is on the server.**
All inputs are checked with Zod. Errors come back per field and the forms show them next to the inputs. Quantities must be whole numbers, an adjustment can't be zero, and dates can't be in the future.

**Other choices.**
- A product that already has movements can't be deleted, so the history stays complete.
- The CSV export protects against spreadsheet formula injection.
- The layout is mobile first: bottom navigation and bottom-sheet forms on phones, sidebar and tables on laptops.

## What is finished

- Products with SKU, name, category, unit, price and low-stock threshold
- Movements (purchase in, sale out, return, adjustment) with quantity, reason, date and user
- Current stock calculated from movements
- Low-stock list and a page per product with its movement history
- Owner and staff roles, checked on the server
- Search and category filter, dashboard with a 14-day chart
- Stretch: CSV stock report (owner only)
- Seed script with demo data, `.env.example`, and 10 automated tests (stock calculation, negative stock, concurrent sales, roles, validation)

## What isn't finished

- Suppliers and purchase orders (the optional stretch feature)
- Screen to manage users, and change password (users come from the seed script)
- Rate limiting on login
- Pagination for long product lists and long histories
- Browser end-to-end tests

## What I would do with more time

- Add suppliers and purchase orders, where marking an order as received creates purchase movements using the same transaction code
- Add an idempotency key to the movement API so a double click or a retried request can't record the same sale twice
- Add user management, login rate limiting and pagination
- Deploy it (Vercel plus MongoDB Atlas) and add a live demo link

## AI tools I used

I used Claude to help scaffold the project and to draft the stock and transaction code, the tests and the UI. I then went through the code to understand how it works, especially the transaction and locking logic, the role checks and the stock calculation, and I explain these in my video.

## Demo

- Live demo: not deployed yet
- Video: add your Google Drive link here
