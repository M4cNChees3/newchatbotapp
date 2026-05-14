# 🚀 Quick Deployment Checklist

Gunakan checklist ini untuk deployment cepat ke Netlify + Supabase.

---

## 📋 Pre-Deployment Checklist

- [ ] Node.js 18.x atau 20.x terinstall
- [ ] Git repository initialized
- [ ] Supabase account created
- [ ] Netlify account created  
- [ ] Groq API key ready (dari https://console.groq.com)

---

## 🗄️ Supabase Setup (30 menit)

### 1. Create Project
- [ ] Login ke https://supabase.com/dashboard
- [ ] Klik "New Project"
- [ ] Isi: Name, Database Password, Region
- [ ] Tunggu ~2 menit provisioning

### 2. Install & Setup CLI
```bash
npm install -g supabase
supabase login
cd chatbot
supabase link --project-ref tyrdicjqdqtgcorobpld
```

### 3. Push Database
```bash
supabase db push
```
Expected: 5 tables created (athletes, fitness_metrics, nutrition_logs, chat_messages, knowledge_base)

### 4. Deploy Edge Functions
```bash
supabase functions deploy chat
supabase functions deploy process-document
```

### 5. Set API Secret
```bash
supabase secrets set chatbot=<YOUR_GROQ_API_KEY>
```

### 6. Get Credentials
- [ ] Copy Project URL: `https://tyrdicjqdqtgcorobpld.supabase.co`
- [ ] Copy anon key dari Settings → API
- [ ] Simpan untuk step berikutnya!

---

## 🌐 Netlify Deployment (15 menit)

### Option 1: Git Deploy (Recommended)

#### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Ready for deployment"
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

#### Step 2: Connect Netlify
- [ ] Login ke https://app.netlify.com
- [ ] Klik "Add new site" → "Import project"
- [ ] Select GitHub repo
- [ ] Build settings:
  - Build command: `npm run build`
  - Publish directory: `dist`
  - Node version: 20

#### Step 3: Environment Variables
Add di Netlify dashboard (Site settings → Environment variables):
```
VITE_SUPABASE_URL=https://tyrdicjqdqtgcorobpld.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

#### Step 4: Deploy
- [ ] Klik "Deploy site"
- [ ] Tunggu build (~2-3 menit)
- [ ] ✅ Site live di `https://<random-name>.netlify.app`

---

### Option 2: CLI Deploy (Alternative)

```bash
# Install CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify init
netlify env:set VITE_SUPABASE_URL "https://tyrdicjqdqtgcorobpld.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "<your-anon-key>"
netlify deploy --prod
```

---

## ✅ Post-Deployment Testing

### Test Authentication
- [ ] Navigate to deployed URL
- [ ] Sign up dengan email baru
- [ ] Verify dapat login

### Test Core Features
- [ ] Log fitness metrics (weight, body fat)
- [ ] Log nutrition (meal, calories, macros)
- [ ] View metrics charts
- [ ] Ask AI chat question
- [ ] Upload knowledge base document

### Verify Backend
```bash
# Check Edge Functions
supabase functions logs chat
supabase functions logs process-document

# Check database
supabase db diff
```

---

## 🔒 Security Final Check

- [ ] `.env` file NOT committed to git
- [ ] Groq API key di Supabase Secrets (tidak hardcoded)
- [ ] Environment variables set di Netlify
- [ ] HTTPS enabled (automatic)
- [ ] Test RLS: User hanya bisa access data sendiri

### ⚠️ IMPORTANT: Jika Keys Pernah Tercommit
```bash
# Rotate Supabase keys
# 1. Go to Supabase Dashboard → Settings → API
# 2. Reset anon key
# 3. Update di Netlify environment variables
# 4. Redeploy
```

---

## 💰 Cost Verification

- [ ] Supabase: Dalam free tier (500MB DB, 50K MAU)
- [ ] Netlify: Dalam free tier (100GB bandwidth)
- [ ] Groq: Dalam free tier (30 req/min)

Total: **$0/month** ✅

---

## 🐛 Troubleshooting Quick Fixes

### Build Fails
```bash
# Check locally first
npm run build
npm run typecheck
```

### Edge Functions Error
```bash
# Verify secret is set
supabase secrets list

# Check logs
supabase functions logs chat --limit 50
```

### Auth Not Working
```bash
# Verify env vars
netlify env:list

# Check .env file locally
cat .env
```

---

## 📞 Quick Links

- **Supabase Dashboard**: https://supabase.com/dashboard
- **Netlify Dashboard**: https://app.netlify.com
- **Groq Console**: https://console.groq.com
- **Full Guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## ✨ Next Steps After Deployment

1. [ ] Add custom domain di Netlify (optional)
2. [ ] Upload sample knowledge base documents
3. [ ] Test with real athlete data
4. [ ] Setup monitoring/alerts
5. [ ] Share with users!

---

**Estimated Total Time: 45-60 minutes**

Good luck! 🎉
