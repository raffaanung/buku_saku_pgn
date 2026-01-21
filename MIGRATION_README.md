# Migration Guide: Node/React/Postgres -> Python/Laravel/MySQL

This project has been converted to a new stack as requested:
- **Frontend**: Laravel (Blade + Tailwind + Alpine.js)
- **Backend API**: Python (FastAPI)
- **Database**: MySQL

## Prerequisites
1.  **MySQL Server** installed and running.
2.  **Python 3.10+** installed.
3.  **PHP 8.1+** and **Composer** installed.
4.  **Node.js** (for compiling Tailwind assets in Laravel).

## Step 1: Database Setup
1.  Create a MySQL database named `buku_saku`.
2.  Import the schema:
    ```bash
    mysql -u root -p buku_saku < database_mysql/schema.sql
    ```

## Step 2: Python Backend Setup
1.  Navigate to `backend_python`.
2.  Create a `.env` file based on your configuration (or edit `database.py` directly if for dev).
    Example `.env`:
    ```
    DATABASE_URL=mysql+pymysql://root:password@localhost/buku_saku
    ```
3.  Run the setup script:
    ```bash
    run_python_backend.bat
    ```
    The API will start at `http://127.0.0.1:8000`.

## Step 3: Laravel Frontend Setup
1.  Run the setup script to initialize the Laravel project:
    ```bash
    laravel_code/setup.bat
    ```
    *Note: This runs `composer create-project` which downloads the framework.*
2.  **Copy the custom code**:
    Copy the contents of `laravel_code/app`, `laravel_code/resources`, and `laravel_code/routes` into `frontend_laravel`, overwriting existing files.
    - `laravel_code/app/Http/Controllers/AuthController.php` -> `frontend_laravel/app/Http/Controllers/AuthController.php`
    - `laravel_code/resources/views/*` -> `frontend_laravel/resources/views/*`
    - `laravel_code/routes/web.php` -> `frontend_laravel/routes/web.php`
    - `laravel_code/tailwind.config.js` -> `frontend_laravel/tailwind.config.js`
    - `laravel_code/resources/css/app.css` -> `frontend_laravel/resources/css/app.css`
3.  Configure Laravel environment:
    - Edit `frontend_laravel/.env`.
    - Set `PYTHON_API_URL=http://127.0.0.1:8000`.
4.  Run the frontend:
    ```bash
    cd frontend_laravel
    npm run dev
    php artisan serve --port=8001
    ```
    Access the app at `http://127.0.0.1:8001`.

## Architecture Notes
- The **Laravel Frontend** acts as the UI layer. It handles the "View" (Blade templates) and communicates with the **Python Backend** for all data operations.
- The **Python Backend** is a REST API that talks to the **MySQL Database**.
- **Auth**: Laravel forwards login credentials to Python. Python returns a JWT. Laravel stores this JWT in the session and sends it in the Authorization header for subsequent API requests.
