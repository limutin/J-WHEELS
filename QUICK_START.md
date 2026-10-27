# Quick Start Guide

Get up and running in 5 minutes!

## 1. Install Dependencies

```bash
npm install
```

## 2. Setup Firebase

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Email/Password Authentication
3. Create a Firestore Database (test mode)
4. Copy your Firebase config

## 3. Configure Environment

```bash
copy .env.example .env
```

Edit `.env` and add your Firebase credentials.

## 4. Start Development Server

```bash
npm run dev
```

Open http://localhost:5173

## 5. Create First User

1. Click "Contact admin for access" or go to `/signup`
2. Create your account
3. In Firebase Console → Firestore → `users` collection
4. Change your user's `role` field to `"admin"`
5. Refresh browser

## Default Login (After Setup)

- Email: The email you registered with
- Password: The password you created

## Features Available

✅ **Dashboard** - Metrics and analytics  
✅ **Inventory** - Product management  
✅ **Sales/POS** - Point of sale system  
✅ **Reports** - Business insights  
✅ **Settings** - Shop configuration  

## Need More Help?

See **SETUP_GUIDE.md** for detailed instructions.

---

**Important:** Don't forget to set proper Firestore security rules before going to production!
