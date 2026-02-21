# 📱 NetPulse Frontend Implementation Plan (Phase 46-65)

**Document Version:** 1.0  
**Created:** February 21, 2026  
**Target Completion:** March 7-10, 2026 (~14-18 days)  
**Priority:** 🔴 CRITICAL - Blocks MVP Launch

---

## 🎯 Executive Summary

**Goal:** Build a complete, production-ready monitoring dashboard UI for NetPulse UpGuardX  
**Scope:** Phases 46-65 (20 phases)  
**Team:** 1 Developer  
**Estimated Effort:** 80-100 hours  
**Timeline:** 14-18 days (8-10 hrs/day)  

### Current Status
- ✅ 4/20 phases complete (Login, Register, Password Reset, 2FA Setup)
- 🟨 Dashboard scaffold started (40%)
- 🟥 16/20 phases remaining

---

## 📋 Phase Breakdown & Implementation Plan

### Phase 46: Initialize Next.js 14 App Router Project ✅
**Status:** Complete  
**Components:** ✅ App Router, ✅ Layout structure, ✅ Page routing

### Phase 47: Configure TailwindCSS and shadcn/ui ✅
**Status:** Complete  
**Components:** ✅ TailwindCSS, ✅ shadcn/ui components, ✅ ESLint config

---

## 🎨 Phase 48-52: Authentication & Dashboard Layout (3-4 Days)

### Phase 48: Build the Authentication UI ✅
**Status:** Complete (85% - minor improvements needed)

**Deliverables:**
- ✅ Login page (`/login`)
- ✅ Register page (`/register`)
- ✅ 2FA setup page
- ✅ Password reset flow

**Files:**
```
apps/web/src/app/
├── login/
│   └── page.tsx         ✅ Complete
├── register/
│   └── page.tsx         ✅ Complete
├── forgot-password/
│   └── page.tsx         ✅ Complete
├── reset-password/
│   └── page.tsx         ✅ Complete
└── components/
    └── two-factor-setup.tsx    ✅ Complete
```

**Remaining Tasks:**
- [ ] Add session persistence (store JWT in browser)
- [ ] Implement logout functionality
- [ ] Add error toast notifications
- [ ] Test all auth flows end-to-end

**Estimated Time:** 4-6 hours

---

### Phase 49: Create Main Dashboard Layout ⚠️ (In Progress)
**Status:** 40% complete (scaffold exists)

**Deliverables:**
1. **Sidebar Navigation Component**
   - [ ] Navigation menu with active state
   - [ ] Collapsible sidebar (responsive)
   - [ ] User profile dropdown
   - [ ] Organization switcher

2. **Header/Top Bar Component**
   - [ ] Breadcrumb navigation
   - [ ] Search bar
   - [ ] Notifications badge
   - [ ] User menu

3. **Main Layout**
   - [ ] Responsive grid (sidebar + main content)
   - [ ] Dark/light mode toggle (Phase 61)
   - [ ] Mobile hamburger menu

**Files to Create:**
```
apps/web/src/components/
├── layout/
│   ├── sidebar.tsx          🟨 In Progress (Partial)
│   ├── header.tsx           🔴 New
│   ├── breadcrumb.tsx       🔴 New
│   ├── user-menu.tsx        🔴 New
│   └── layout.tsx           🔴 New
└── dashboard/
    └── layout-wrapper.tsx   🔴 New
```

**Implementation Details:**

```typescript
// apps/web/src/components/layout/sidebar.tsx
export interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  badge?: number;
  children?: NavItem[];
}

const NAV_ITEMS: NavItem[] = [
  { icon: HomeIcon, label: "Dashboard", href: "/dashboard" },
  { icon: MonitorIcon, label: "Monitors", href: "/dashboard/monitors" },
  { icon: AlertIcon, label: "Incidents", href: "/dashboard/incidents" },
  { icon: BellIcon, label: "Alerts", href: "/dashboard/alerts" },
  {
    icon: SettingsIcon,
    label: "Settings",
    href: "/dashboard/settings",
    children: [
      { icon: UserIcon, label: "Profile", href: "/dashboard/settings/profile" },
      { icon: ShieldIcon, label: "Security", href: "/dashboard/settings/security" },
      { icon: UsersIcon, label: "Team", href: "/dashboard/settings/team" },
      { icon: DatabaseIcon, label: "Integrations", href: "/dashboard/settings/integrations" },
    ]
  },
];
```

**Estimated Time:** 6-8 hours

---

### Phase 50: Implement API Client with ky & TanStack Query 🟨
**Status:** 30% complete (utilities exist, hooks need expansion)

**Deliverables:**
1. **API Client Setup** (`lib/api.ts`)
   - ✅ ky HTTP client configured
   - ✅ Base URL, headers, error handling
   - [x] JWT token injection middleware
   - [x] API error interceptor

2. **React Query Hooks** (new file: `lib/hooks/queries.ts`)
   - [ ] `useMonitors()` - Get all monitors
   - [ ] `useMonitor(id)` - Get single monitor
   - [ ] `useMonitorChecks(monitorId)` - Get check history
   - [ ] `useIncidents()` - Get all incidents
   - [ ] `useAlerts()` - Get all alerts
   - [ ] `useOrganization()` - Get org data
   - [ ] `useUser()` - Get current user

3. **React Query Mutations** (new file: `lib/hooks/mutations.ts`)
   - [ ] `useCreateMonitor()` - Create monitor
   - [ ] `useUpdateMonitor()` - Edit monitor
   - [ ] `useDeleteMonitor()` - Delete monitor
   - [ ] `useCreateAlert()` - Create alert rule
   - [ ] `useResolveIncident()` - Mark incident resolved

**Files to Create/Update:**
```
apps/web/src/lib/
├── api.ts                   ✅ Exists (needs JWT headers)
├── hooks/
│   ├── queries.ts           🔴 New (40+ lines each)
│   ├── mutations.ts         🔴 New (50+ lines each)
│   └── useAuth.ts           🔴 New
└── store/
    └── auth-store.ts        🔴 New (Zustand for session)
```

**Code Example:**

```typescript
// lib/hooks/queries.ts
import { useQuery } from '@tanstack/react-query';
import { ky } from 'ky';

export const useMonitors = () => {
  return useQuery({
    queryKey: ['monitors'],
    queryFn: async () => {
      const response = await ky.get('http://localhost:3001/api/monitors', {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      return response.json();
    },
    staleTime: 30000, // 30 seconds
  });
};
```

**Estimated Time:** 8-10 hours

---

## 📊 Phase 51-56: Core Dashboard Pages (5-7 Days)

### Phase 51: Build Monitor Listing Page 🔴 (NOT STARTED)
**Status:** 0% complete  
**Priority:** 🔴 CRITICAL

**Deliverables:**
1. **Monitor Table/List**
   - [ ] Column: Name, URL, Status, Uptime %, Last Check, Actions
   - [ ] Status badge (Up/Down/Degraded)
   - [ ] Uptime percentage visualization (mini bar chart)
   - [ ] Clickable rows (navigate to detail)

2. **Filtering & Search**
   - [ ] Search by monitor name
   - [ ] Filter by status (Up, Down, Degraded)
   - [ ] Filter by region
   - [ ] Sort by uptime/name

3. **Actions**
   - [ ] Create New Monitor button (opens wizard)
   - [ ] Edit monitor (inline or detail page)
   - [ ] Delete monitor (with confirmation)
   - [ ] Pause/Resume monitoring

4. **Pagination**
   - [ ] Show 25/50/100 items per page
   - [ ] Next/Previous navigation
   - [ ] Jump to page

**File Structure:**
```
apps/web/src/app/(dashboard)/monitors/
├── page.tsx                 🔴 New (Main list)
├── _components/
│   ├── monitor-table.tsx    🔴 New
│   ├── monitor-filters.tsx  🔴 New
│   ├── status-badge.tsx     🔴 New
│   └── uptime-mini-chart.tsx 🔴 New
└── [id]/
    └── page.tsx             (Phase 54)
```

**Component Code Skeleton:**

```typescript
// apps/web/src/app/(dashboard)/monitors/page.tsx
'use client';

import { useMonitors } from '@/lib/hooks/queries';
import { useState } from 'react';
import { MonitorTable } from './_components/monitor-table';
import { MonitorFilters } from './_components/monitor-filters';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function MonitorsPage() {
  const { data: monitors, isLoading, error } = useMonitors();
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    region: 'all',
  });

  if (isLoading) return <div>Loading monitors...</div>;
  if (error) return <div>Error loading monitors</div>;

  const filteredMonitors = monitors?.filter((m) => {
    // Apply filtering logic
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Monitors</h1>
        <Link href="/dashboard/monitors/new">
          <Button>+ New Monitor</Button>
        </Link>
      </div>

      <MonitorFilters filters={filters} onChange={setFilters} />
      <MonitorTable monitors={filteredMonitors} />
    </div>
  );
}
```

**Estimated Time:** 6-8 hours

---

### Phase 52: Create Monitor Wizard (Multi-step Form) 🔴 (NOT STARTED)
**Status:** 0% complete  
**Priority:** 🔴 CRITICAL

**Deliverables:**
1. **Step 1: Basic Info**
   - [ ] Monitor name
   - [ ] Monitor type selector (HTTP, TCP, ICMP, DNS, SSL)
   - [ ] Target URL/address

2. **Step 2: Probe Configuration**
   - [ ] Port (for TCP)
   - [ ] HTTP method, headers, body
   - [ ] Expected status codes
   - [ ] Body match pattern
   - [ ] Timeout configuration

3. **Step 3: Schedule & Regions**
   - [ ] Check interval (30s - 1hr)
   - [ ] Regions to probe from
   - [ ] Enable/disable monitoring

4. **Step 4: Notifications**
   - [ ] Alert channels to notify
   - [ ] Alert rules (after consecutive failures)

5. **Review & Create**
   - [ ] Summary of configuration
   - [ ] Create monitor button

**Files:**
```
apps/web/src/app/(dashboard)/monitors/new/
├── page.tsx                 🔴 New (Wizard container)
└── _components/
    ├── step-1-basic.tsx     🔴 New
    ├── step-2-config.tsx    🔴 New
    ├── step-3-schedule.tsx  🔴 New
    ├── step-4-alerts.tsx    🔴 New
    ├── step-5-review.tsx    🔴 New
    └── wizard-nav.tsx       🔴 New
```

**Estimated Time:** 8-10 hours

---

### Phase 53: Real-time Updates via WebSockets ⚠️ (FUTURE)
**Status:** Scheduled after phase 55  
**Note:** Will implement Server-Sent Events (SSE) as simpler alternative

**Deliverables:**
- [ ] WebSocket connection setup
- [ ] Live status updates
- [ ] New incident notifications (toast)
- [ ] Auto-refresh monitor list

**Estimated Time:** 6-8 hours

---

### Phase 54: Build Monitor Detail Page 🔴 (NOT STARTED)
**Status:** 0% complete  
**Priority:** 🔴 HIGH

**Deliverables:**
1. **Monitor Header**
   - [ ] Name, URL, status badge
   - [ ] Uptime % (24h, 7d, 30d, all-time)
   - [ ] Last check time, response time

2. **Status Overview Tab**
   - [ ] Current status (Up/Down/Degraded)
   - [ ] Status history (last 24hrs)
   - [ ] Recent checks table

3. **Configuration Tab**
   - [ ] Probe settings (read-only or editable)
   - [ ] Edit button (goes to edit form)
   - [ ] Delete button

4. **Incidents Tab**
   - [ ] List of incidents for this monitor
   - [ ] Duration, start time, resolution
   - [ ] Incident detail link

5. **Actions**
   - [ ] Edit monitor
   - [ ] Pause/Resume monitoring
   - [ ] Manual check trigger
   - [ ] Delete monitor

**Files:**
```
apps/web/src/app/(dashboard)/monitors/[id]/
├── page.tsx                 🔴 New (Main detail page)
├── _components/
│   ├── monitor-header.tsx   🔴 New
│   ├── status-tabs.tsx      🔴 New
│   ├── checks-table.tsx     🔴 New
│   └── incidents-list.tsx   🔴 New
└── edit/
    └── page.tsx             (Phase 52 variant)
```

**Estimated Time:** 6-8 hours

---

### Phase 55: Integrate Charting (Recharts) 🔴 (NOT STARTED)
**Status:** 0% complete  
**Priority:** 🔴 HIGH

**Deliverables:**
1. **Latency History Chart**
   - [ ] Line chart showing response times
   - [ ] Time range selector (1h, 24h, 7d, 30d)
   - [ ] Min/Max/Avg indicators
   - [ ] Hover tooltip with exact values

2. **Uptime Trend Chart**
   - [ ] Bar chart showing uptime %
   - [ ] Comparison period selector
   - [ ] Color coding (down = red, degraded = yellow, up = green)

3. **Incident Timeline**
   - [ ] Event markers on chart
   - [ ] Clickable incidents (drill into detail)

**Dependencies:**
```
npm install recharts recharts-to-png
```

**Files:**
```
apps/web/src/components/charts/
├── latency-chart.tsx        🔴 New
├── uptime-chart.tsx         🔴 New
└── incident-timeline.tsx    🔴 New
```

**Code Example:**

```typescript
// components/charts/latency-chart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function LatencyChart({ data, timeRange }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        <Line type="monotone" dataKey="latency" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

**Estimated Time:** 4-6 hours

---

### Phase 56: Create Incident Timeline View 🔴 (NOT STARTED)
**Status:** 0% complete  
**Priority:** 🔴 HIGH

**Deliverables:**
1. **Incident List Page**
   - [ ] List of all incidents across all monitors
   - [ ] Columns: Monitor, Duration, Start Time, End Time, Status
   - [ ] Filter by monitor, date range, status
   - [ ] Search by monitor name

2. **Incident Detail Modal/Page**
   - [ ] Incident timeline (when it started/ended)
   - [ ] Affected monitor details
   - [ ] Alerts sent during incident
   - [ ] Resolution actions

3. **Timeline Visualization**
   - [ ] Horizontal timeline showing incident blocks
   - [ ] Start/end markers
   - [ ] Hover tooltip with details

**Files:**
```
apps/web/src/app/(dashboard)/incidents/
├── page.tsx                 🔴 New (Incident list)
├── _components/
│   ├── incident-table.tsx   🔴 New
│   ├── incident-filters.tsx 🔴 New
│   └── incident-timeline.tsx 🔴 New
└── [id]/
    └── page.tsx             🔴 New (Detail page)
```

**Estimated Time:** 5-7 hours

---

## ⚙️ Phase 57-64: Settings & Advanced Features (3-4 Days)

### Phase 57: Organization Settings & Member Management 🔴 (NOT STARTED)
**Status:** 0% complete  
**Priority:** 🟡 MEDIUM

**Deliverables:**
1. **Organization General Settings**
   - [ ] Organization name
   - [ ] Domain/slug
   - [ ] Logo upload

2. **Team Members**
   - [ ] List of members with roles
   - [ ] Invite new member (email)
   - [ ] Change member role
   - [ ] Remove member

3. **Invitations**
   - [ ] Pending invitations list
   - [ ] Resend invitation
   - [ ] Revoke invitation

**Estimated Time:** 4-6 hours

---

### Phase 58: RBAC Management UI 🔴 (NOT STARTED)
**Status:** 0% complete  
**Priority:** 🟡 MEDIUM

**Deliverables:**
1. **Roles Overview**
   - [ ] List of available roles (Admin, Manager, Viewer)
   - [ ] Permissions matrix
   - [ ] Custom role creation (optional)

2. **Member Permissions**
   - [ ] Per-monitor access control
   - [ ] Role assignment
   - [ ] Permission preview

**Estimated Time:** 3-5 hours

---

### Phase 59: API Key Management 🔴 (NOT STARTED)
**Status:** 0% complete  
**Priority:** 🟡 MEDIUM

**Deliverables:**
1. **API Keys List**
   - [ ] List all API keys
   - [ ] Last used timestamp
   - [ ] Scopes/permissions

2. **Create New Key**
   - [ ] Generate new key
   - [ ] Copy to clipboard
   - [ ] Name the key
   - [ ] Set permissions

3. **Manage Keys**
   - [ ] Rotate key
   - [ ] Delete key
   - [ ] View key scopes

**Estimated Time:** 3-5 hours

---

### Phase 60: Notification Settings UI 🔴 (NOT STARTED)
**Status:** 0% complete  
**Priority:** 🟡 MEDIUM

**Deliverables:**
1. **Notification Channels**
   - [ ] Email configuration
   - [ ] Slack integration
   - [ ] Discord integration
   - [ ] Custom webhooks
   - [ ] Telegram (when implemented)

2. **Alert Rules Setup**
   - [ ] Create alert rules (threshold, conditions)
   - [ ] Assign to channels
   - [ ] Test alert

3. **Notification Preferences**
   - [ ] Do Not Disturb hours
   - [ ] Notification frequency
   - [ ] Alert grouping

**Estimated Time:** 5-7 hours

---

### Phase 61: Dark/Light Mode Support 🔴 (NOT STARTED)
**Status:** 0% complete  
**Priority:** 🟢 LOW

**Deliverables:**
1. **Theme Provider Setup**
   - [ ] next-themes integration
   - [ ] Dark/light CSS variables
   - [ ] System preference detection

2. **Theme Toggle**
   - [ ] Toggle button in header/footer
   - [ ] Persist preference

**Estimated Time:** 2-3 hours

---

### Phase 62: Search & Filtering 🔴 (NOT STARTED)
**Status:** 0% complete  
**Priority:** 🟡 MEDIUM

**Deliverables:**
1. **Global Search**
   - [ ] Search monitors, incidents, alerts
   - [ ] Command palette (Cmd+K)
   - [ ] Recent searches

2. **Advanced Filters**
   - [ ] Multi-select filters
   - [ ] Date range pickers
   - [ ] Save filter presets

**Estimated Time:** 4-6 hours

---

### Phase 63: Responsive Design for Mobile 🔴 (NOT STARTED)
**Status:** 0% complete  
**Priority:** 🟡 MEDIUM

**Deliverables:**
1. **Mobile Navigation**
   - [ ] Hamburger menu (sidebar collapses)
   - [ ] Bottom tab navigation (optional)
   - [ ] Touch-friendly buttons

2. **Responsive Tables**
   - [ ] Stack on mobile
   - [ ] Swipeable actions
   - [ ] Collapsible rows

3. **Mobile Optimizations**
   - [ ] Adjusted typography
   - [ ] Optimized spacing
   - [ ] Touch targets (min 44px)

**Estimated Time:** 4-6 hours

---

### Phase 64: Breadcrumb & Navigation Logic 🔴 (NOT STARTED)
**Status:** 0% complete  
**Priority:** 🟢 LOW

**Deliverables:**
1. **Breadcrumb Navigation**
   - [ ] Dynamic breadcrumb generation
   - [ ] Clickable breadcrumb links
   - [ ] Home icon

2. **Navigation Context**
   - [ ] Active page highlighting
   - [ ] Page transitions
   - [ ] History management

**Estimated Time:** 2-4 hours

---

## 🧪 Phase 65: E2E Testing (2-3 Days)

### Phase 65: E2E Testing with Playwright 🔴 (NOT STARTED)
**Status:** 0% complete  
**Priority:** 🔴 CRITICAL

**Deliverables:**
1. **Authentication Flow Tests**
   - [ ] Login workflow
   - [ ] Registration workflow
   - [ ] Password reset
   - [ ] 2FA flow

2. **Monitor Management Tests**
   - [ ] Create monitor
   - [ ] Edit monitor
   - [ ] Delete monitor
   - [ ] View monitor details

3. **Dashboard Navigation Tests**
   - [ ] Navigate to all pages
   - [ ] Verify data loads
   - [ ] Click all buttons

4. **Search & Filter Tests**
   - [ ] Global search
   - [ ] Monitor filtering
   - [ ] Date range selection

**Files:**
```
apps/web/e2e/
├── auth.spec.ts             🔴 New
├── monitors.spec.ts         🔴 New
├── dashboard.spec.ts        🔴 New
└── fixtures/
    └── test-data.ts         🔴 New
```

**Configuration:**
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

**Estimated Time:** 6-8 hours

---

## 📦 Technology Stack & Dependencies

### Current Stack ✅
```json
{
  "next": "^14.0.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "typescript": "^5.4.2",
  "tailwindcss": "^3.4.1",
  "shadcn-ui": "latest"
}
```

### Required Additions
```bash
# Data fetching & caching
npm install @tanstack/react-query@latest ky

# State management
npm install zustand

# Charting
npm install recharts date-fns

# Form handling
npm install react-hook-form zod @hookform/resolvers

# Date/time utilities
npm install date-fns dayjs

# UI components (additional)
npm install lucide-react

# E2E Testing
npm install -D @playwright/test

# Theme management
npm install next-themes

# Command palette
npm install cmdk

# Toast notifications
npm install sonner
```

**Installation:**
```bash
cd /home/boni/Documents/netpulse/apps/web
npm install @tanstack/react-query ky zustand recharts date-fns react-hook-form zod @hookform/resolvers lucide-react sonner next-themes cmdk
npm install -D @playwright/test
```

---

## 🏗️ Folder Structure

```
apps/web/src/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                 (Dashboard home)
│   │   ├── monitors/
│   │   │   ├── page.tsx             (Phase 51)
│   │   │   ├── new/page.tsx         (Phase 52)
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx         (Phase 54)
│   │   │   │   └── edit/page.tsx    (Phase 52 variant)
│   │   │   └── _components/         (Phase 51-55)
│   │   ├── incidents/
│   │   │   ├── page.tsx             (Phase 56)
│   │   │   ├── [id]/page.tsx        (Phase 56)
│   │   │   └── _components/         (Phase 56)
│   │   ├── alerts/
│   │   │   ├── page.tsx
│   │   │   └── _components/
│   │   └── settings/
│   │       ├── page.tsx
│   │       ├── profile/page.tsx
│   │       ├── team/page.tsx
│   │       └── integrations/page.tsx
│   ├── login/page.tsx               ✅ (Phase 48)
│   ├── register/page.tsx            ✅ (Phase 48)
│   ├── forgot-password/page.tsx     ✅ (Phase 48)
│   ├── reset-password/page.tsx      ✅ (Phase 48)
│   ├── layout.tsx
│   ├── page.tsx                     (Landing)
│   └── globals.css
├── components/
│   ├── ui/                          ✅ shadcn/ui
│   ├── layout/
│   │   ├── sidebar.tsx              (Phase 49)
│   │   ├── header.tsx               (Phase 49)
│   │   ├── breadcrumb.tsx           (Phase 64)
│   │   └── user-menu.tsx            (Phase 49)
│   ├── charts/
│   │   ├── latency-chart.tsx        (Phase 55)
│   │   ├── uptime-chart.tsx         (Phase 55)
│   │   └── incident-timeline.tsx    (Phase 56)
│   ├── dashboard/
│   │   ├── monitor-table.tsx        (Phase 51)
│   │   ├── incident-table.tsx       (Phase 56)
│   │   └── status-badge.tsx         (Phase 51)
│   ├── auth/
│   │   ├── auth-provider.tsx        ✅
│   │   └── login-form.tsx
│   └── common/
│       ├── loading-skeleton.tsx
│       ├── empty-state.tsx
│       └── error-boundary.tsx
├── lib/
│   ├── api.ts                       ✅ (Phase 50)
│   ├── utils.ts                     ✅
│   ├── store/
│   │   ├── auth-store.ts            (Phase 50)
│   │   └── ui-store.ts
│   ├── hooks/
│   │   ├── queries.ts               (Phase 50)
│   │   ├── mutations.ts             (Phase 50)
│   │   ├── useAuth.ts               (Phase 50)
│   │   └── useNotification.ts
│   └── types/
│       └── api.ts                   ✅
├── providers/
│   ├── query-provider.tsx
│   ├── theme-provider.tsx
│   └── notification-provider.tsx
└── styles/
    └── globals.css                  ✅
```

---

## 📅 Implementation Timeline

### Week 1 (Days 1-7)

| Day | Phase | Tasks | Hours | Status |
|-----|-------|-------|-------|--------|
| 1 | 48 | Fix auth UI, JWT persistence | 6 | 🟨 In Progress |
| 2 | 49 | Complete dashboard layout | 8 | 🔴 Not Started |
| 3 | 50 | API client & React Query setup | 6 | 🔴 Not Started |
| 4 | 51 | Monitor listing page | 8 | 🔴 Not Started |
| 5 | 52 | Monitor wizard form | 8 | 🔴 Not Started |
| 6 | 53 | WebSocket/SSE setup | 6 | 🔴 Not Started |
| 7 | 54 | Monitor detail page | 8 | 🔴 Not Started |
| **Week 1 Total** | | | **50 hours** | |

### Week 2 (Days 8-14)

| Day | Phase | Tasks | Hours | Status |
|-----|-------|-------|-------|--------|
| 8 | 55 | Recharts integration | 6 | 🔴 Not Started |
| 9 | 56 | Incident timeline | 6 | 🔴 Not Started |
| 10 | 57-58 | Settings & RBAC | 8 | 🔴 Not Started |
| 11 | 59-60 | API Keys & Notifications | 8 | 🔴 Not Started |
| 12 | 61-64 | Dark mode & Navigation | 8 | 🔴 Not Started |
| 13 | 63 | Mobile responsive design | 6 | 🔴 Not Started |
| 14 | 65 | E2E Testing (half) | 6 | 🔴 Not Started |
| **Week 2 Total** | | | **48 hours** | |

### Week 3 (Days 15-18)
| Day | Phase | Tasks | Hours | Status |
|-----|-------|-------|-------|--------|
| 15 | 65 | E2E Testing completion | 4 | 🔴 Not Started |
| 16 | Polish | Bug fixes & UI polish | 4 | 🔴 Not Started |
| 17 | Optimize | Performance optimization | 4 | 🔴 Not Started |
| 18 | Deploy | Testing & deployment | 4 | 🔴 Not Started |
| **Week 3 Total** | | | **16 hours** | |

**Total Estimated Hours:** 114 hours (best case) / 140 hours (realistic)  
**Per Day Average:** 8-10 hours  
**Total Timeline:** 14-18 days (2.5-3 weeks)

---

## 🔌 API Integration Points

### Required Backend Endpoints (Verify Implemented)

```
✅ Authentication
  POST   /api/auth/login
  POST   /api/auth/register
  POST   /api/auth/refresh-token
  POST   /api/auth/2fa/setup
  POST   /api/auth/2fa/verify
  POST   /api/auth/logout

✅ Monitors (Phase 51-54)
  GET    /api/monitors              (list with filters)
  GET    /api/monitors/:id          (detail)
  POST   /api/monitors              (create)
  PATCH  /api/monitors/:id          (update)
  DELETE /api/monitors/:id          (delete)
  POST   /api/monitors/:id/check    (manual check)
  GET    /api/monitors/:id/checks   (check history)
  POST   /api/monitors/:id/pause    (pause monitoring)
  POST   /api/monitors/:id/resume   (resume monitoring)

🟨 Incidents (Phase 56)
  GET    /api/incidents
  GET    /api/incidents/:id
  PATCH  /api/incidents/:id/resolve
  GET    /api/monitors/:id/incidents

✅ Alerts (Phase 60)
  GET    /api/alerts
  POST   /api/alerts                (create rule)
  PATCH  /api/alerts/:id            (update rule)
  DELETE /api/alerts/:id
  GET    /api/alert-channels        (available channels)
  GET    /api/alert-logs            (history)

✅ Organization (Phase 57-58)
  GET    /api/orgs/:id
  PATCH  /api/orgs/:id              (update)
  GET    /api/orgs/:id/members
  POST   /api/orgs/:id/members       (invite)
  PATCH  /api/orgs/:id/members/:id  (change role)
  DELETE /api/orgs/:id/members/:id  (remove)

✅ API Keys (Phase 59)
  GET    /api/api-keys
  POST   /api/api-keys              (create)
  DELETE /api/api-keys/:id
  PATCH  /api/api-keys/:id/rotate

✅ Current User
  GET    /api/me                    (current user)
  PATCH  /api/me                    (update profile)
  POST   /api/me/password           (change password)
```

---

## ✅ Checklist for Phase Start

- [ ] Install all required dependencies
- [ ] Review API responses & types
- [ ] Setup React Query & API client
- [ ] Create @types/api.ts with all DTO types
- [ ] Setup Zustand auth store
- [ ] Create test fixtures for mock data
- [ ] Setup Playwright configuration
- [ ] Create development .env.local with API URL
- [ ] Test base auth flow (login → dashboard)
- [ ] Create Figma/design reference (if available)
- [ ] Setup git feature branches
- [ ] Create GitHub milestones for each phase

---

## 📝 Development Guidelines

### Code Quality
- Use TypeScript strict mode
- Follow existing code patterns
- Add JSDoc comments for complex logic
- Keep components under 300 lines
- Extract reusable logic into custom hooks

### Performance
- Use React.memo for expensive components
- Implement lazy loading for pages (`next/dynamic`)
- Optimize images with next/image
- Debounce search inputs (300ms)
- Paginate large lists

### Accessibility
- Add ARIA labels to interactive elements
- Ensure keyboard navigation
- Use semantic HTML elements
- Test with screen readers
- Maintain 4.5:1 contrast ratio

### Testing
- Write tests for critical user flows
- Mock API responses in tests
- Test error states
- Test loading states
- Test edge cases (empty data, long names)

---

## 🐛 Common Pitfalls to Avoid

1. **Infinite Loops** - Don't fetch inside useEffect without dependencies
2. **Memory Leaks** - Always cleanup subscriptions & timers
3. **Stale Data** - Invalidate React Query caches appropriately
4. **CORS Issues** - Ensure backend has correct CORS headers
5. **JWT Expiry** - Implement token refresh logic
6. **Missing Error Handling** - Show errors to users clearly
7. **No Loading States** - Always show feedback during async operations
8. **Hardcoded URLs** - Use environment variables for API endpoints
9. **Inconsistent Styling** - Use Tailwind classes consistently
10. **No Mobile Testing** - Test on actual mobile devices or DevTools

---

## 🚀 Success Criteria

### Phase Completion Criteria (Each Phase)
✅ Code written and tested locally  
✅ No TypeScript errors  
✅ Follows existing code style  
✅ Components render without errors  
✅ API integration working  
✅ Mobile responsive (if applicable)  
✅ Committed to git with clear message  

### MVP Completion (Phase 45 → 65)
✅ All pages render without errors  
✅ Authentication flow working end-to-end  
✅ Can create and view monitors  
✅ Dashboard displays real data  
✅ Mobile UI is usable  
✅ No console errors  
✅ Performance acceptable (<3s load time)  
✅ E2E tests passing  
✅ Deployable to production  

---

## 📞 Resources & References

### Next.js 14 Docs
- [App Router](https://nextjs.org/docs/app)
- [API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Deployment](https://nextjs.org/docs/deployment)

### React Query
- [Documentation](https://tanstack.com/query/latest)
- [Best Practices](https://tanstack.com/query/latest/docs/react/guides/important-defaults)

### shadcn/ui
- [Component Library](https://ui.shadcn.com)
- [Customization](https://ui.shadcn.com/docs/installation/next)

### Testing
- [Playwright](https://playwright.dev)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)

---

## 📊 Progress Tracking

Track your progress here:

```
Phase 46: Initialize Next.js ................................. ✅ (Day 0)
Phase 47: Configure TailwindCSS & shadcn/ui ................ ✅ (Day 0)
Phase 48: Build Auth UI ..................................... 🟨 (30%)
Phase 49: Dashboard Layout .................................. ⚪ (0%)
Phase 50: API Client & React Query ......................... ⚪ (0%)
Phase 51: Monitor Listing ................................... ⚪ (0%)
Phase 52: Monitor Wizard .................................... ⚪ (0%)
Phase 53: WebSockets/SSE .................................... ⚪ (0%)
Phase 54: Monitor Detail .................................... ⚪ (0%)
Phase 55: Charting (Recharts) ............................... ⚪ (0%)
Phase 56: Incident Timeline ................................. ⚪ (0%)
Phase 57: Org Settings & Members ............................ ⚪ (0%)
Phase 58: RBAC Management ................................... ⚪ (0%)
Phase 59: API Key Management ................................ ⚪ (0%)
Phase 60: Notification Settings ............................. ⚪ (0%)
Phase 61: Dark/Light Mode ................................... ⚪ (0%)
Phase 62: Search & Filtering ................................ ⚪ (0%)
Phase 63: Mobile Responsive ................................. ⚪ (0%)
Phase 64: Navigation & Breadcrumbs .......................... ⚪ (0%)
Phase 65: E2E Testing ........................................ ⚪ (0%)
```

---

> **Plan Created:** February 21, 2026  
> **Last Updated:** February 21, 2026  
> **Next Review:** Daily standup  
> **NetPulse Dev Team**
