# Pre-Deployment Checklist

## ☑️ Before Deploying to Vercel

### 1. Code Preparation
- [x] All features implemented and tested locally
- [ ] No console errors in browser
- [ ] All imports are correct
- [ ] No unused dependencies
- [ ] Code is clean and commented where needed

### 2. Environment Setup
- [ ] `.env` file exists with all Firebase credentials
- [ ] `.env.example` is updated with all required variables
- [ ] `.gitignore` includes `.env` file
- [ ] Firebase credentials are correct and valid

### 3. Firebase Configuration
- [ ] Firebase project created
- [ ] Authentication enabled (Email/Password)
- [ ] Firestore database created
- [ ] Storage bucket created
- [ ] Firestore rules deployed (from `firestore.rules`)
- [ ] Storage rules deployed (from `storage.rules`)
- [ ] Test user created for testing

### 4. Build Test
```bash
cd motor-shop-frontend
npm install
npm run build
npm run preview
```
- [ ] Build completes without errors
- [ ] Preview works locally
- [ ] All pages load correctly
- [ ] Images display properly

### 5. Dependencies Check
```bash
npm outdated
npm audit
```
- [ ] All dependencies are installed
- [ ] No critical vulnerabilities
- [ ] Package.json scripts are correct

### 6. Git Setup (if using GitHub)
- [ ] Git repository initialized
- [ ] `.gitignore` configured
- [ ] Initial commit made
- [ ] Repository pushed to GitHub

### 7. Vercel Account
- [ ] Vercel account created
- [ ] Vercel CLI installed (optional)
- [ ] Logged into Vercel

---

## 🚀 Deployment Process

### Method 1: Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to project
cd motor-shop-frontend

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Method 2: GitHub Integration
1. Push code to GitHub
2. Go to vercel.com
3. Import GitHub repository
4. Configure build settings
5. Add environment variables
6. Deploy

---

## 🔐 Environment Variables to Add in Vercel

Copy these from your `.env` file:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

**How to add in Vercel Dashboard:**
1. Go to Project Settings
2. Click "Environment Variables"
3. Add each variable name and value
4. Select "Production", "Preview", and "Development"
5. Click "Save"

---

## ✅ Post-Deployment Testing

### Test Each Module:

#### 1. Authentication
- [ ] Login with test account works
- [ ] Logout works
- [ ] Signup creates new user
- [ ] Password reset sends email
- [ ] Protected routes redirect to login

#### 2. Dashboard
- [ ] Metrics display correctly
- [ ] Charts load with real data
- [ ] Recent transactions show
- [ ] Low stock alerts appear
- [ ] No loading errors

#### 3. Inventory
- [ ] Products list loads
- [ ] Add new product works
- [ ] Edit product works
- [ ] Delete product works
- [ ] Image upload works
- [ ] Filters work (category, brand, status)
- [ ] Search works
- [ ] Category/Brand manager works

#### 4. Sales (POS)
- [ ] Products load in POS
- [ ] Add to cart works
- [ ] Quantity adjustment works
- [ ] Discount calculation works
- [ ] Complete sale works
- [ ] Inventory updates after sale
- [ ] Transaction ID is generated
- [ ] Confirmation modal appears
- [ ] Category/brand filters work

#### 5. Transaction History
- [ ] Transactions load
- [ ] Pagination works (10 per page)
- [ ] Search works
- [ ] Date filters work
- [ ] Transaction details modal works
- [ ] CSV export works
- [ ] Custom transaction IDs display

#### 6. Reports
- [ ] Real data loads from Firebase
- [ ] Metrics calculate correctly
- [ ] Charts display properly
- [ ] Period filters work (Daily/Weekly/Monthly)
- [ ] Top products show
- [ ] Category breakdown appears
- [ ] CSV export works

#### 7. Settings
- [ ] Settings page loads
- [ ] User profile saves
- [ ] Shop settings save
- [ ] Password change works
- [ ] Notifications preferences save
- [ ] Security info displays

---

## 🐛 Common Issues & Solutions

### Issue: Build Fails
**Solution:**
```bash
# Clear cache and rebuild
rm -rf node_modules
rm package-lock.json
npm install
npm run build
```

### Issue: Environment Variables Not Working
**Solution:**
1. Ensure all variables start with `VITE_`
2. Redeploy after adding variables
3. Check for typos in variable names

### Issue: Firebase Connection Error
**Solution:**
1. Verify Firebase config values
2. Check Firebase project is active
3. Ensure domain is whitelisted in Firebase

### Issue: Images Not Loading
**Solution:**
1. Deploy Storage rules
2. Check CORS settings in Firebase
3. Verify image URLs are correct

### Issue: 404 on Page Refresh
**Solution:**
- Ensure `vercel.json` has rewrite rules (already configured)

---

## 📱 Mobile Testing

Test on different devices:
- [ ] Mobile phone (Chrome/Safari)
- [ ] Tablet (iPad/Android)
- [ ] Desktop (Chrome/Firefox/Edge/Safari)

Responsive features to test:
- [ ] Navigation menu
- [ ] Forms are usable
- [ ] Tables scroll horizontally
- [ ] Modals display correctly
- [ ] Touch interactions work

---

## 🔒 Security Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] Firebase rules are restrictive
- [ ] Storage rules limit file size
- [ ] Authentication is required for all routes
- [ ] API keys are environment variables
- [ ] HTTPS is enabled (Vercel does this)
- [ ] No sensitive data in console logs

---

## 📊 Performance Checklist

- [ ] Initial page load < 3 seconds
- [ ] Images are optimized
- [ ] No memory leaks
- [ ] Database queries are efficient
- [ ] Charts render smoothly
- [ ] No unnecessary re-renders

---

## 🎉 Go-Live Checklist

### Before Announcing:
- [ ] All features tested and working
- [ ] No critical bugs
- [ ] Data is backed up
- [ ] User documentation ready
- [ ] Support contact set up
- [ ] Team trained on system

### After Go-Live:
- [ ] Monitor error logs
- [ ] Watch Firebase usage
- [ ] Check Vercel analytics
- [ ] Collect user feedback
- [ ] Plan for updates

---

## 📞 Emergency Contacts

### If Something Goes Wrong:

**Rollback Deployment:**
```bash
# In Vercel dashboard:
# 1. Go to Deployments
# 2. Find previous working deployment
# 3. Click "..." menu
# 4. Select "Promote to Production"
```

**Firebase Issues:**
- Firebase Console: https://console.firebase.google.com
- Firebase Status: https://status.firebase.google.com

**Vercel Issues:**
- Vercel Dashboard: https://vercel.com/dashboard
- Vercel Status: https://vercel-status.com

---

## ✨ Ready to Deploy!

Once all checkboxes are ✅, you're ready to deploy to production!

**Good luck! 🚀**
