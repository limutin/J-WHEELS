# Motor Shop Setup Guide

Complete step-by-step guide to get your Motor Shop Inventory & Sales Management System up and running.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Firebase Setup](#firebase-setup)
4. [Running the Application](#running-the-application)
5. [First User Setup](#first-user-setup)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- A **Firebase account** - [Sign up](https://firebase.google.com/)
- A modern web browser (Chrome, Firefox, Edge, Safari)

### Verify Installation

```bash
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

## Installation

### Step 1: Navigate to Project Directory

```bash
cd motor-shop-frontend
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- React and React DOM
- React Router
- Firebase SDK
- Tailwind CSS
- Recharts
- React Hook Form
- Zod
- Lucide React icons

**Note:** Installation may take 2-5 minutes depending on your internet connection.

## Firebase Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name (e.g., "motor-shop-inventory")
4. Follow the setup wizard (Google Analytics is optional)
5. Click **"Create project"**

### Step 2: Register Your Web App

1. In your Firebase project, click the **web icon** (</>)
2. Register app with nickname (e.g., "Motor Shop Web")
3. **Do NOT** check "Firebase Hosting" (unless you plan to use it)
4. Click **"Register app"**
5. **Copy the firebaseConfig object** - you'll need this!

### Step 3: Enable Authentication

1. In Firebase Console, go to **"Build"** → **"Authentication"**
2. Click **"Get started"**
3. Enable **"Email/Password"** provider:
   - Click on "Email/Password"
   - Toggle "Enable"
   - Click "Save"
4. (Optional) Enable **"Google"** provider:
   - Click on "Google"
   - Toggle "Enable"
   - Select a support email
   - Click "Save"

### Step 4: Create Firestore Database

1. In Firebase Console, go to **"Build"** → **"Firestore Database"**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (we'll set up security rules later)
4. Select your preferred location (choose closest to your users)
5. Click **"Enable"**

### Step 5: Configure Firebase in Your App

1. Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```

2. Open `.env` and fill in your Firebase config values:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSyB...your_actual_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123
   ```

3. Update `src/firebase/config.js` to use environment variables:
   ```javascript
   const firebaseConfig = {
     apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
     authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
     projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
     storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
     messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
     appId: import.meta.env.VITE_FIREBASE_APP_ID
   };
   ```

### Step 6: Set Up Firestore Security Rules (Important!)

1. In Firebase Console, go to **"Firestore Database"** → **"Rules"**
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isSignedIn() {
      return request.auth != null;
    }
    
    // Helper function to get user role
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    
    // Helper function to check if user is admin
    function isAdmin() {
      return isSignedIn() && getUserRole() == 'admin';
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && (request.auth.uid == userId || isAdmin());
    }
    
    // Inventory collection
    match /inventory/{document=**} {
      allow read: if isSignedIn();
      allow create, update: if isSignedIn();
      allow delete: if isAdmin();
    }
    
    // Sales collection
    match /sales/{document=**} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if isAdmin();
    }
    
    // Customers collection
    match /customers/{document=**} {
      allow read, write: if isSignedIn();
    }
    
    // Suppliers collection
    match /suppliers/{document=**} {
      allow read, write: if isSignedIn();
    }
  }
}
```

3. Click **"Publish"**

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will start at `http://localhost:5173`

### Production Build

```bash
npm run build
npm run preview
```

## First User Setup

### Creating Your First Admin User

1. Start the development server
2. Navigate to `http://localhost:5173`
3. Click **"Contact admin for access"** or go to `/signup`
4. Fill in the registration form:
   - **Full Name:** Your name
   - **Email:** Your email address
   - **Password:** Strong password (min 6 characters)
5. Click **"Create Account"**

### Setting Admin Role Manually

Since the first user won't have admin privileges by default, you need to set it manually:

1. Go to Firebase Console → Firestore Database
2. Find the `users` collection
3. Click on your user document
4. Edit the `role` field and change it to `admin`
5. Click **"Update"**
6. Refresh your browser

Now you have full admin access!

### Creating Additional Users

As an admin, you can create additional users:
1. Go to Settings page
2. Click "Add New User" in User Management section
3. Or: Share the signup link with your staff

## Testing the Application

### Test with Sample Data

The application comes with sample data for testing. Once logged in:

1. **Dashboard** - View sample metrics and charts
2. **Inventory** - Add test products
3. **Sales/POS** - Process test sales
4. **Reports** - View analytics

### Adding Real Products

1. Go to **Inventory** page
2. Click **"Add New Item"**
3. Fill in product details:
   - Product Name
   - SKU (unique identifier)
   - Category
   - Brand
   - Cost Price
   - Selling Price
   - Quantity
   - Reorder Threshold
4. Click **"Add Item"**

## Troubleshooting

### Common Issues

#### Issue: "npm install" fails

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rmdir /s /q node_modules
del package-lock.json

# Reinstall
npm install
```

#### Issue: Firebase authentication not working

**Solutions:**
1. Check if Auth is enabled in Firebase Console
2. Verify `.env` file has correct values
3. Check browser console for error messages
4. Ensure your domain is authorized in Firebase Console → Authentication → Settings → Authorized domains

#### Issue: Firestore permission denied

**Solutions:**
1. Verify security rules are published
2. Check if user is authenticated
3. Ensure user document exists in `users` collection
4. Check user role in Firestore

#### Issue: "Module not found" errors

**Solution:**
```bash
npm install
```

If persists:
```bash
npm install react-router-dom firebase zustand recharts lucide-react react-hook-form zod @hookform/resolvers
```

#### Issue: Styles not loading

**Solutions:**
1. Check if Tailwind CSS is configured properly
2. Restart dev server: `Ctrl+C` then `npm run dev`
3. Clear browser cache

#### Issue: PowerShell execution policy error (Windows)

**Solution:**
Run PowerShell as Administrator:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Getting Help

If you encounter issues not covered here:

1. Check the browser console for errors (F12)
2. Check Firebase Console for service status
3. Review Firestore security rules
4. Verify all environment variables are set correctly

## Next Steps

Once your application is running:

1. **Customize Settings**
   - Update shop profile in Settings
   - Configure notifications
   - Set up user roles

2. **Add Products**
   - Import your inventory
   - Set up categories
   - Configure pricing

3. **Train Staff**
   - Create user accounts for cashiers
   - Provide POS training
   - Set up role permissions

4. **Go Live**
   - Deploy to production (Firebase Hosting, Vercel, Netlify)
   - Set up domain
   - Enable HTTPS
   - Configure backups

## Production Deployment

### Option 1: Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

### Option 2: Vercel

```bash
npm install -g vercel
vercel login
vercel
```

### Option 3: Netlify

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

---

🎉 **Congratulations!** Your Motor Shop Inventory & Sales Management System is ready to use!

For additional support, refer to the main README.md file.
