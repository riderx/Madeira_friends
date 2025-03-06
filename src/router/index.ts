import { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth'

import Landing from '../views/Landing.vue'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Account from '../views/Account.vue'
import Rentals from '../views/Rentals.vue'
import MyBookings from '../views/MyBookings.vue'
import EventDetails from '../views/EventDetails.vue'
import RentalDetails from '../views/RentalDetails.vue'
import CreatorLayout from '../views/creator/CreatorLayout.vue'
import MyListings from '../views/creator/MyListings.vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: Landing,
    meta: { requiresAuth: false }
  },
  {
    path: '/app',
    redirect: '/app/events',
    meta: { requiresAuth: true }
  },
  {
    path: '/app/events',
    component: Home,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    component: Register,
    meta: { requiresAuth: false }
  },
  {
    path: '/app/account',
    component: Account,
    meta: { requiresAuth: true }
  },
  {
    path: '/app/rentals',
    component: Rentals,
    meta: { requiresAuth: true }
  },
  {
    path: '/app/events/:id',
    component: EventDetails,
    meta: { requiresAuth: true }
  },
  {
    path: '/app/rentals/:id',
    component: RentalDetails,
    meta: { requiresAuth: true }
  },
  {
    path: '/app/bookings',
    component: MyBookings,
    meta: { requiresAuth: true }
  },
  {
    path: '/app/creator',
    component: CreatorLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/app/creator/listings'
      },
      {
        path: 'listings',
        component: MyListings
      }
    ]
  }
]

export function setupRouterGuards(router: any) {
  router.beforeEach(async (to: any, from: any, next: any) => {
    const authStore = useAuthStore()
    const requiresAuth = to.matched.some((record: any) => record.meta.requiresAuth)

    // If auth state is still loading, wait for it to complete
    if (authStore.loading) {
      try {
        await authStore.initUser()
      } catch (error) {
        console.error('Error initializing user:', error)
      }
    }

    // Now check route requirements with the loaded auth state
    if (requiresAuth && !authStore.user) {
      // Save the original destination for redirect after login
      sessionStorage.setItem('redirectPath', to.fullPath)
      next('/login')
    } else if (!requiresAuth && authStore.user && (to.path === '/login' || to.path === '/register')) {
      // If user is logged in and tries to access login/register pages, redirect to app
      next('/app')
    } else {
      next()
    }
  })
}
