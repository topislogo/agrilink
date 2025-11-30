# Setup Guide for AgriLink

Welcome to the AgriLink project! This guide will help you get the project running on your computer.

## Prerequisites
You already have **Node.js** installed, which is the most important tool.

## Step 1: Install Dependencies
You can run this command directly from the main folder:

```bash
npm install
```

(This will automatically install the necessary files in the `agrilink` subfolder for you)

## Step 3: Configure Environment
We have created a configuration file for you (`.env.local`). This file contains "keys" that the app needs.
For now, they are just placeholders. The app will start, but some features (like logging in or uploading images) might not work until you get the real keys from your colleague.

## Step 4: Start the App
To start the website on your computer, run:

```bash
npm run dev
```

After a few seconds, you should see a message saying the server is running.
Open your web browser and go to: [http://localhost:3000](http://localhost:3000)

## Troubleshooting
- If you see "Connection refused" errors for the database, it means you need to install PostgreSQL. Ask your colleague for help with this if needed, or let me know and I can guide you.
