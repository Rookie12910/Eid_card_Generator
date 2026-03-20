# 🌙 Eid Card Generator

A modern, responsive, and privacy-first web application for generating beautiful custom Eid Mubarak cards. Users can type personalized Bengali messages and names onto premium pre-designed templates and download them instantly.

## ✨ Features

- **Beautiful Premium Templates:** 6 stunning, high-res Islamic card designs to choose from.
- **Dynamic Text Generation:** Bengali text gracefully wraps within specific boundaries tailored to each unique card template.
- **Privacy First (No Server Tracking):** The actual card generation (image rendering) happens entirely in the user's browser using HTML5 Canvas. No names, messages, or images are ever uploaded to or saved on the backend server.
- **Live Counter:** Tracks the total number of cards generated globally (without recording any personal info).
- **Responsive Design:** Works flawlessly on desktop and mobile devices.

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Vite, CSS Modules.
- **Backend:** Python, FastAPI, SQLAlchemy.
- **Database:** SQLite (local development) / PostgreSQL (production).
- **Deployment:** Pre-configured for seamless serverless deployment on Vercel.

## 🚀 Local Development

### Prerequisites
- Node.js (v16+)
- Python (3.9+)

### 1. Setup Backend
Open a terminal in the `backend` directory:
```bash
cd backend
python -m venv .venv
# Activate virtual environment
# On Windows:
.venv\Scripts\activate
# On Mac/Linux:
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```
The backend API will run on `http://127.0.0.1:8000`.

### 2. Setup Frontend
Open a new terminal in the `frontend` directory:
```bash
cd frontend
npm install
npm run dev
```
The frontend will proxy `/api` requests to port `8000` automatically. Open the provided `localhost` URL to view the app!

## 🌍 Deployment to Vercel

This project is fully ready for Vercel deployment via the included `vercel.json` file. 

1. Push the entire project folder to a **GitHub repository**.
2. Log into [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import your new GitHub repository.
4. Leave all build settings as their defaults and click **Deploy**.

### Persistent Database (Optional but Recommended)
Because Vercel serverless functions are ephemeral, the local `sqlite.db` counter will periodically reset to `0`. To maintain a permanent counter:
1. In your Vercel project dashboard, go to the **Storage** tab.
2. Create a new **Vercel Postgres** database.
3. Vercel automatically exposes a `DATABASE_URL` environment variable. The backend code will automatically switch from SQLite to PostgreSQL when it detects this variable!
