
# TableTap

TableTap is a modern, open-source restaurant management system that allows customers to browse the menu and place orders directly from their table using a QR code. This project is built with Next.js, Supabase, and Tailwind CSS.

## Features

*   **QR Code Ordering:** Customers can scan a QR code to access the menu and place orders.
*   **Real-time Order Tracking:** Restaurants can track orders in real-time.
*   **Menu Management:** Restaurants can easily manage their menu, including categories and items.
*   **Dashboard and Analytics:** Restaurants have access to a dashboard with key metrics and analytics.

## Getting Started

To get started with TableTap, you'll need to have a Supabase project. You can create one for free at [supabase.com](https://supabase.com).

### 1. Clone the repository

```bash
git clone https://github.com/your-username/tabletap.git
cd tabletap
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root of your project and add the following environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

You can find these keys in your Supabase project's settings.

### 4. Run the database migrations

To set up the database schema, you need to run the SQL scripts in the `scripts` folder. You can do this in two ways:

**Option 1: Using `psql` (if you have it installed)**

Run the following command, replacing `YOUR_DATABASE_URL` with your actual Supabase database connection string:

```bash
psql "YOUR_DATABASE_URL" -f scripts/001_create_tables.sql
psql "YOUR_DATABASE_URL" -f scripts/002_update_loyalty_system.sql
psql "YOUR_DATABASE_URL" -f scripts/003_sample_data.sql
psql "YOUR_DATABASE_URL" -f scripts/004_fix_sample_restaurant_id.sql
psql "YOUR_DATABASE_URL" -f scripts/005_fix_order_rls_policies.sql
psql "YOUR_DATABASE_URL" -f scripts/006_create_storage_bucket.sql
psql "YOUR_DATABASE_URL" -f scripts/007_add_performance_indexes.sql
psql "YOUR_DATABASE_URL" -f scripts/008_create_revenue_functions.sql
```

**Option 2: Using the Supabase SQL Editor**

1.  Go to your Supabase project's dashboard.
2.  Click on the "SQL Editor" tab.
3.  Copy the content of each SQL file from the `scripts` folder and paste it into the SQL Editor.
4.  Click the "Run" button to execute the script.

You need to run the scripts in the correct order, from `001` to `008`.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.

## License

This project is licensed under the MIT License.
