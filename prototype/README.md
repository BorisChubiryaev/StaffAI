# IT Staffing Platform Prototype

> **Статус: демо-прототип (UX-иллюстрация), не основа продукта.** Всё замокано. Прототип реализует часть target-state
> (автосоздание Epic/Story в СберТрек, создание ЗНР напрямую в ЛК, голосовой ввод) и собственную статусную модель —
> по отношению к MVP источником истины являются `../docs/` и спецификации в `../specs/`. Расхождения: `../docs/sources/README.md`.
>
> При деплое на Vercel укажите **Root Directory = `prototype`**.

AI-assisted workflow for recruiting IT specialists. This is an interactive React/Next.js prototype demonstrating the core workflows and UX described in the Technical Specification v2.0.

## 🎯 What This Prototype Shows

This prototype demonstrates the **critical path workflows** from the TS:

### 1. **Customer Chat Interface** (`/customer/chat`)
- Conversational AI intake where customer describes staffing needs
- AI asks clarifying questions about roles, timeline, requirements
- Structured request confirmation view
- Mock AI responses and analysis

### 2. **My Requests Dashboard** (`/customer/requests`)
- Customer view of all their staffing requests
- Request status tracking (Draft, AI Processing, Staff Review, etc.)
- AI confidence score and analysis display
- Contractor options preview
- Quick actions (View Details, Message Staff, Review & Sign)

### 3. **Staff Review Workspace** (`/staff/review`)
- Pre-filled request card with AI analysis
- AI confidence score and reasoning
- Identified roles, gaps, and recommendations
- Contractor options with ratings and lead times
- Budget and timeline information
- Built-in chat for staff ↔ customer communication
- Generated artifact downloads (Specification Draft, Jira Epic)

### 4. **Admin Settings** (`/admin`)
- Request template management
- Reference data (roles, contractors, contracts, CI codes)
- System configuration UI
- (Not fully functional - demonstrative only)

## 📋 Key Features

✓ Conversational workflow UI  
✓ Structured request confirmation  
✓ Customer dashboard with request tracking  
✓ Staff review with AI analysis  
✓ Contractor selection interface  
✓ In-app messaging (staff ↔ customer)  
✓ Status state machine visualization  
✓ Mock data from TS example  
✓ Responsive design  
✓ Accessible components  

## 🛠️ Tech Stack

- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible component primitives
- **Lucide Icons** - SVG icons

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ and npm/yarn

### Local Development

```bash
# Navigate to project directory
cd prototype

# Install dependencies
npm install

# Run development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
npm start
```

## 🚀 Deployment to Vercel

### Option 1: Connect GitHub (Recommended)

1. Push this project to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/staffing-app-prototype.git
   git push -u origin main
   ```

2. Go to [Vercel.com](https://vercel.com)
3. Click "New Project"
4. Connect your GitHub repository
5. Click "Deploy"

The app will be live in ~1 minute. Vercel will automatically rebuild on each push to main.

### Option 2: Direct Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from project directory
vercel

# For production deployment
vercel --prod
```

### Option 3: Manual Build + Deploy

```bash
# Build the project
npm run build

# Deploy the .next folder to any Node.js hosting (Vercel, Heroku, etc.)
```

## 📂 Project Structure

```
prototype/
├── app/
│   ├── page.tsx                    # Home/navigation hub
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Global styles
│   ├── customer/
│   │   ├── chat/page.tsx          # AI conversation interface
│   │   └── requests/page.tsx       # My requests dashboard
│   ├── staff/
│   │   └── review/page.tsx         # Staff review workspace
│   └── admin/page.tsx              # Admin settings
├── lib/
│   ├── types.ts                    # TypeScript types/interfaces
│   └── demo-store.tsx              # Mock data + demo scenario
├── tailwind.config.ts              # Tailwind configuration
├── tsconfig.json                   # TypeScript configuration
├── next.config.js                  # Next.js configuration
├── package.json                    # Dependencies
└── README.md                        # This file
```

## 🎨 UI Design Principles

This prototype follows the design principles from TS v2.0:

- **Minimalist & Modern** - White background, blue accent (#3b82f6)
- **No Overdesign** - Focus on functionality and clarity
- **Accessible** - WCAG compliant, semantic HTML
- **Responsive** - Works on desktop, tablet, and mobile
- **Service-oriented** - Reduce bureaucracy, focus on user goals

## 📊 Mock Data

All data is mocked and matches the example from the TS:

- **Request REQ-2026-00521** - Full team (10 people) for System Z
  - 3 Java backend devs (2 middle, 1 senior)
  - 2 System analysts
  - 1 Frontend developer (senior)
  - 1 DevOps engineer (senior)
  - 2 QA engineers (middle)

- **Contractor Options** - Tech Solutions LLC and DevOps Hub with ratings and lead times
- **AI Analysis** - 92% confidence with identified gaps and recommendations

To modify mock data, edit `lib/demo-store.tsx`.

## 🔧 Customization

### Change Colors
Edit `tailwind.config.ts`:
```ts
colors: {
  accent: '#3b82f6',  // Blue
  'accent-dark': '#1e40af',
}
```

### Change Mock Data
Edit `lib/demo-store.tsx`:
- Add/remove requests
- Modify contractor options
- Update clarification questions

### Add Real Backend
1. Create API routes in `app/api/`
2. Replace mock data with API calls
3. Add authentication if needed

## 📱 Responsive Design

The prototype is fully responsive:
- Mobile: Single column, stacked layout
- Tablet: Two column for staff review
- Desktop: Full width with all panels visible

## 🔐 Security Notes

This is a **prototype/demo** version:
- ❌ No authentication
- ❌ No backend API
- ❌ No database
- ❌ Mock data only
- ❌ Not for production use

For production, add:
- OAuth/OIDC authentication
- API with proper validation
- Database (PostgreSQL recommended)
- Rate limiting
- HTTPS everywhere
- Audit logging
- Data encryption

## 🐛 Known Limitations

1. All data is mocked (no real AI/Giga-chat integration)
2. No backend API - data resets on page refresh
3. No file uploads/downloads (buttons present but non-functional)
4. No real email/chat notifications
5. No integration with Jira, SberTrack, or other external systems
6. Limited form validation

These are intentionally left for the development team to implement.

## 📖 Next Steps

After this prototype is approved:

1. **Setup Development Environment**
   - Create GitHub repository
   - Setup CI/CD with Vercel
   - Configure staging/production environments

2. **Develop Backend**
   - Create Node.js/Python API
   - Implement database schema
   - Setup Giga-chat integration
   - Add authentication

3. **Implement Core Features**
   - Real conversational AI
   - Request persistence
   - File generation (Specs, Jira)
   - Email notifications
   - External integrations

4. **Testing & QA**
   - Unit tests
   - Integration tests
   - E2E tests
   - Performance testing
   - Security testing

5. **Deployment**
   - Production environment setup
   - Monitoring & logging
   - Backup & disaster recovery
   - User training

## 📞 Support

For questions about the prototype:
1. Review project docs: `../docs/` (start with `../docs/onboarding.md`)
2. Check `lib/types.ts` for data structures
3. Review component comments in `app/**/*.tsx`

## 📄 License

This prototype is for internal bank use only.

---

**Demo Version:** v2.3  
**Created:** May 2026  
**Ready for:** Development handoff, stakeholder presentation

---

## 📋 Changelog

### v2.3 (May 2026)
- **СберТрек wizard**: интерактивный выбор — привязка существующего Epic/Story или AI-генерация нового backlog (Epic + 4 Story с редактированием и явным подтверждением)
- **Мультиканальный ввод**: voice dictation mock (🎙), file upload mock (📎) с чипами вложений и AI-анализом файлов
- **Полноэкранный редактор спецификации**: 13 секций по шаблону DOCX, таблицы с inline-редактированием, Story-ссылки в требованиях/этапах/стоимости, бейджи статуса (AI заполнено / Требует проверки / Проверено штабом)
- **ЗНР в Личном кабинете**: переименование из «Отправить на согласование в ЛК», форма с маршрутом согласования и утверждающим лицом, анимированный прогресс создания, success-экран с номером и ссылкой
- **Staff workspace**: показ 4 Story с ключами, блок файлов заказчика, кнопка «Открыть спецификацию» открывает полноэкранный редактор

### v2.2 (April 2026)
- Базовый workflow: customer chat → staff review → contractor selection → spec draft → LK
- AI-анализ запроса, структурированный запрос, артефакты (Epic, Spec, Config)
- DOCX-экспорт спецификации
