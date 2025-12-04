const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/LoginPage.vue'),
        meta: { requiresGuest: true }
      }
    ]
  },
  {
    path: '/app',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: 'dashboard' // Admin akan ke dashboard, pegawai akan di redirect dari LoginPage langsung ke transactions
      },
      {
        path: 'dashboard',
        component: () => import('pages/DashboardPage.vue'),
        meta: { roles: ['pemilik'] } // Hanya pemilik yang bisa akses dashboard
      },
      {
        path: 'transactions',
        component: () => import('pages/TransactionsPage.vue')
      },
      {
        path: 'transactions/create',
        component: () => import('pages/TransactionFormPage.vue')
      },
      {
        path: 'transactions/edit/:id',
        component: () => import('pages/TransactionFormPage.vue'),
        props: true
      },
      {
        path: 'users',
        component: () => import('pages/UsersPage.vue'),
        meta: { roles: ['pemilik'] }
      },
      {
        path: 'reports',
        component: () => import('pages/ReportsPage.vue'),
        meta: { roles: ['pemilik'] }
      }
    ]
  },
  // Redirect legacy paths
  {
    path: '/dashboard',
    redirect: '/app/dashboard'
  },
  {
    path: '/transactions',
    redirect: '/app/transactions'
  },
  {
    path: '/users',
    redirect: '/app/users'
  },
  {
    path: '/reports',
    redirect: '/app/reports'
  },
  // Always leave this as last one
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
