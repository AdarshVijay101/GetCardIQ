# How to Run GetCardIQ (Beginner Guide)

This guide will help you set up and run the GetCardIQ project on your Windows computer.

## Prerequisites

### 1. Install Node.js
You likely already have this, but if not, download and install "LTS" version from [nodejs.org](https://nodejs.org/).

### 2. Install PostgreSQL (Database)
We need a place to store user data.
1.  **Download**: Go to [PostgreSQL Downloads](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads) and download the Windows installer.
2.  **Install**: Run the installer.
    *   **IMPORTANT**: When asked for a **Password** for the `postgres` user, write it down! (e.g., `mysecretpassword`).
    *   Keep the default port `5432`.
3.  **Create Database**:
    *   Open "pgAdmin 4" (installed with Postgres).
    *   Double click "Servers" -> "PostgreSQL" -> Enter your password.
    *   Right click "Databases" -> Create -> Database...
    *   Name it: `getcardiq`
    *   Click Save.

---

## Part 1: Setting up the Server (Backend)

The server handles logic, security, and talking to the bank (Plaid).

1.  **Open Terminal** (Powershell or Command Prompt) and navigate to the `server` folder:
    ```powershell
    cd C:\Users\kadar\.gemini\antigravity\scratch\GetCardIQ\server
    ```

2.  **Configure Environment Variables**:
    *   You should see a file named `.env.example`.
    *   Copy it and name the copy `.env`.
    *   Open `.env` in a text editor (Notepad, VS Code).
    *   **Update `DATABASE_URL`**: Change the password to what you set in Step 2.
        ```
        DATABASE_URL="postgresql://postgres:mysecretpassword@localhost:5432/getcardiq?schema=public"
        ```
    *   (Optional) If you have Plaid keys, add them to `PLAID_CLIENT_ID` and `PLAID_SECRET`.

3.  **Install Dependencies**:
    ```powershell
    npm install
    ```

4.  **Setup Database Tables** (Run this once):
    ```powershell
    npx prisma migrate dev --name init
    ```
    *   If this works, you'll see "The following migration(s) have been applied".

5.  **Start the Server**:
    ```powershell
    npm run dev
    ```
    *   It should say: `Server running on port 4000`.
    *   **Keep this terminal window OPEN.**

---

## Part 2: Setting up the Client (Frontend)

The client is the website you see and interact with.

1.  **Open a NEW Terminal window** (keep the Server one running).

2.  **Navigate to the client folder**:
    ```powershell
    cd C:\Users\kadar\.gemini\antigravity\scratch\GetCardIQ\client
    ```

3.  **Install Dependencies**:
    ```powershell
    npm install
    ```

4.  **Start the Website**:
    ```powershell
    npm run dev
    ```
    *   It should say: `Ready in ...` and point to `http://localhost:3000`.

---

## Part 3: Using the App

1.  Open Chrome or Edge.
2.  Go to: [http://localhost:3000](http://localhost:3000)
3.  You should see the Dashboard!
4.  **To Connect Bank**:
    *   Click "Connect Bank".
    *   A Plaid window will open.
    *   Username: `user_transactions_dynamic` (or `user_good`)
    *   Password: `pass_good` (or any non-empty string)
    *   Success! The app is now simulating a sync.

## Troubleshooting

*   **Error: "connect ECONNREFUSED"**: Your database is not running. Search "Services" in Windows, find "postgresql", and Right Click -> Start.
*   **Error: "Plaid Link... authentication failed"**: Check your `server/.env` file. Make sure `PLAID_CLIENT_ID` and `PLAID_SECRET` are correct and saved.
