import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth'

import Account from '../views/Account.vue'
import Auth from '../views/Auth.vue'
import MyListings from '../views/creator/MyListings.vue'
import Event from '../views/Event.vue'
import EventDetails from '../views/EventDetails.vue'
import Landing from '../views/Landing.vue'
import MyBookings from '../views/MyBookings.vue'
import RentalDetails from '../views/RentalDetails.vue'
import Rentals from '../views/Rentals.vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: Landing,
    meta: { requiresAuth: false },
  },
  {
    path: '/app',
    redirect: '/app/events',
    meta: { requiresAuth: true },
  },
  {
    path: '/app/events',
    component: Event,
    meta: { requiresAuth: true },
  },
  {
    path: '/auth',
    component: Auth,
    meta: { requiresAuth: false },
  },
  {
    path: '/app/account',
    component: Account,
    meta: { requiresAuth: true },
  },
  {
    path: '/app/rentals',
    component: Rentals,
    meta: { requiresAuth: true },
  },
  {
    path: '/app/events/:id',
    component: EventDetails,
    meta: { requiresAuth: true },
  },
  {
    path: '/app/rentals/:id',
    component: RentalDetails,
    meta: { requiresAuth: true },
  },
  {
    path: '/app/bookings',
    component: MyBookings,
    meta: { requiresAuth: true },
  },
  {
    path: '/app/creator',
    meta: { requiresAuth: true },
    component: MyListings,
  },
]

export function setupRouterGuards(router: any) {
  router.beforeEach(async (to: any, from: any, next: any) => {
    const authStore = useAuthStore()
    const requiresAuth = to.matched.some(
      (record: any) => record.meta.requiresAuth,
    )

    // If auth state is still loading, wait for it to complete
    if (authStore.loading) {
      try {
        await authStore.initUser()
      }
      catch (error) {
        console.error('Error initializing user:', error)
      }
    }

    // Now check route requirements with the loaded auth state
    if (requiresAuth && !authStore.user) {
      // Save the original destination for redirect after login
      sessionStorage.setItem('redirectPath', to.fullPath)
      next('/auth')
    }
    else if (
      !requiresAuth
      && authStore.user
      && (to.path === '/auth' || to.path === '/auth')
    ) {
      // If user is logged in and tries to access login/auth pages, redirect to app
      next('/app')
    }
    else {
      next()
    }
  })
}
