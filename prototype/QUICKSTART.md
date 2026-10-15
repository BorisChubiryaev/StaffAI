# Quick Start Guide

Get the React prototype running in 5 minutes.

## 1. Install Dependencies

```bash
cd prototype
npm install
```

This installs:
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Radix UI components
- Lucide icons

**Time:** ~2-3 minutes

## 2. Start Development Server

```bash
npm run dev
```

You should see:
```
> Next.js 14.2.3
> ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

**Open browser:** http://localhost:3000

## 3. Explore Prototypes

The home page shows 4 interactive prototypes:

### 🎤 Customer Chat Interface
**Path:** `/customer/chat`

- Simulate describing staffing needs to AI
- See how AI asks clarifying questions
- Review structured request confirmation
- Click "Yes, confirm" to see the confirmation modal

**Time to explore:** 5 minutes

### 📋 My Requests Dashboard  
**Path:** `/customer/requests`

- View all your staffing requests
- See request status and AI analysis
- Review contractor options
- Quick actions for staff messaging

**Time to explore:** 3 minutes

### 👥 Staff Review Workspace
**Path:** `/staff/review`

- Split-panel interface: left (request details) + right (chat)
- See full AI analysis with confidence score
- Review identified roles and gaps
- Select contractor from options
- Chat with customer directly

**Time to explore:** 5 minutes

### ⚙️ Admin Settings
**Path:** `/admin`

- Request template management
- Reference data catalogs
- System settings UI

**Time to explore:** 2 minutes

## 4. Interact with Prototypes

### Customer Chat
1. Type a message (or press Suggestion buttons)
2. Watch AI respond (simulated 800ms delay)
3. After ~5 exchanges, confirmation modal appears
4. Click "✏️ Change" or "✅ Confirm"

### Staff Review
1. Scroll through left panel to see all details
2. Click a contractor card to select it (turns blue)
3. Type message in right panel chat
4. Press Send or Enter to send message

### My Requests
1. Browse request cards
2. Click "View Details" to expand
3. See AI analysis, confidence, gaps
4. Action buttons at bottom

## 5. Modify Mock Data (Optional)

Edit `lib/demo-store.tsx` to change:
- Request details
- Contractor options
- Clarification questions
- Messages

Changes auto-reload in browser (Fast Refresh).

## 6. Production Build (Optional)

```bash
npm run build
npm start
```

Creates optimized build in `.next/` folder.

## 7. Deploy to Vercel (When Ready)

```bash
# Option 1: Push to GitHub, connect to Vercel UI
git push origin main

# Option 2: Direct deployment
npm install -g vercel
vercel --prod
```

Takes ~1 minute, live instantly.

## 📚 File Structure at a Glance

```
prototype/
├── app/
│   ├── page.tsx               ← Home (4 prototype links)
│   ├── customer/
│   │   ├── chat/page.tsx      ← Chat interface
│   │   └── requests/page.tsx   ← Requests list
│   ├── staff/
│   │   └── review/page.tsx     ← Staff workspace
│   └── admin/page.tsx          ← Admin panel
├── lib/
│   ├── types.ts               ← TypeScript types
│   └── demo-store.tsx         ← Mock data + сценарий демо
└── README.md                  ← Full documentation
```

## 🎨 Customization Quick Tips

### Change Logo/Title
Edit `app/layout.tsx`:
```tsx
export const metadata: Metadata = {
  title: 'Your App Name',
  description: 'Your description',
}
```

### Change Colors
Edit `tailwind.config.ts`:
```ts
accent: '#your-color-here'
```

### Add New Page
1. Create `app/new-page/page.tsx`
2. Add to home navigation
3. Add route link in `app/page.tsx`

## ❓ Troubleshooting

### Port 3000 Already in Use
```bash
# Use different port
npm run dev -- -p 3001
```

### Module Not Found Error
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Changes Not Showing
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### Installation Fails
```bash
# Try with npm@latest
npm install -g npm@latest
npm install
```

## ✅ Testing Checklist

- [ ] Home page loads with 4 prototype cards
- [ ] Chat page has message input and sends work
- [ ] Requests page shows 2 requests with status badges
- [ ] Staff review shows left/right panels
- [ ] Clicking contractor selects it (turns blue)
- [ ] Admin page shows templates and settings
- [ ] Responsive on mobile (resize browser or use DevTools)
- [ ] All links work and navigate correctly

## 🎯 Next Actions

1. **Review Prototype** - Walk through each screen
2. **Verify UX** - Does this match the TS vision?
3. **Feedback** - What works? What needs adjustment?
4. **Approve/Iterate** - Ready for dev, or need changes?
5. **Deploy** - `vercel --prod` when ready

## 📞 Need Help?

- **React/Next.js docs:** https://nextjs.org/docs
- **Tailwind docs:** https://tailwindcss.com/docs
- **TypeScript docs:** https://www.typescriptlang.org/docs
- **Vercel docs:** https://vercel.com/docs

---

**Time to running:** ~5 minutes  
**Time to explore:** ~15 minutes  
**Ready to show stakeholders:** Yes ✅
