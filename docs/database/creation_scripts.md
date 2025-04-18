# MongoDB Creation Scripts and Seeding Guide

This document outlines how to create and populate MongoDB collections for the Uber Simulation project.

---

## Collections Created
The following collections are automatically created when seeded:

- `drivers`
- `customers`
- `rides`
- `bills`
- `admins`
- `reviews`

Each collection is created and populated with sample data using the corresponding seed script.

---

## Seed Script Paths

All scripts are located inside the `middleware/scripts/` directory.

| Script File            | Collection  | Purpose                  |
|------------------------|-------------|--------------------------|
| `seedDriver.js`        | drivers     | Inserts test drivers     |
| `seedCustomer.js`      | customers   | Inserts test customers   |
| `seedRide.js`          | rides       | Inserts test ride data   |
| `seedBill.js`          | bills       | Inserts billing records  |
| `seedAdmin.js`         | admins      | Inserts admin users      |
| `seedReview.js`        | reviews     | Inserts review examples  |

---

## How to Seed Data

### 1. Set Up `.env`

In the root folder (`uber-simulation-system/`), create a `.env` file with the following content:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster236.4ozrrvt.mongodb.net/uber_simulation?retryWrites=true&w=majority&appName=Cluster236
```

Note: Do not share `.env` in version control. It should be listed in `.gitignore`.

### 2. Install Dependencies (if not already installed)

```bash
cd middleware
npm install
```

### 3. Run Seed Scripts

```bash
node scripts/seedDriver.js
node scripts/seedCustomer.js
node scripts/seedRide.js
node scripts/seedBill.js
node scripts/seedAdmin.js
node scripts/seedReview.js
```

Each script connects to MongoDB, inserts sample data, and logs a message upon success.

---

## Expected Outcome

After running the seed scripts, open MongoDB Compass or the Atlas web interface and check:

- Database: `uber_simulation`
- Collections: `drivers`, `customers`, `rides`, `bills`, `admins`, `reviews`

Each collection should contain at least one sample document.

---

## Optional: Clean or Reset Collections

To reset data, you can manually drop collections in Compass or write a script to remove and reinsert data.

Once seeding is complete, notify the middleware team so they can begin API development and testing.

---

Maintained by: Tier 3 - Database (Kushal)

