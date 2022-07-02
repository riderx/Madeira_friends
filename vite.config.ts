/// <reference types="vitest" />
import path from 'path'
import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import Pages from 'vite-plugin-pages'
import Layouts from 'vite-plugin-vue-layouts'
import Icons from 'unplugin-icons/vite'
import { viteCommonjs, esbuildCommonjs } from '@originjs/vite-plugin-commonjs'
import { fileURLToPath, URL } from "url"
import WindiCSS from 'vite-plugin-windicss'
import { VitePWA } from 'vite-plugin-pwa'
import VueI18n from '@intlify/vite-plugin-vue-i18n'
import Inspect from 'vite-plugin-inspect'
import EnvironmentPlugin from 'vite-plugin-environment'
import pack from './package.json'
import keys from './configs.json'

const getRightKey = (branch: string, keyname: 'base_domain' | 'supa_anon' | 'supa_url'): string => {
  if (branch === 'development')
    return keys[keyname].development
  else if (branch === 'local')
    return keys[keyname].local
  return keys[keyname].prod
}

const getUrl = (branch = ''): string => {
  if (branch === 'local')
    return `http://${getRightKey(branch, 'base_domain')}`
  else if (branch === 'development')
    return `http://${getRightKey(branch, 'base_domain')}`
  else
    return `https://${getRightKey('prod', 'base_domain')}`
}

const base_api = 'api'
const vapidKey = 'BAbAF7CHF3OtBe0XNC_n8XPe__f-uQhGHYIdQ2pztpeHkYwiCo3T6MyuxqnOIRjZMWG6i3z36yq4wVWQKoCQqdY'
const markdownWrapperClasses = 'prose prose-sm m-auto text-left'
const guestPath = ['/login', '/register', '/register-pro', '/forgot_password', '/onboarding/confirm_email', '/onboarding/phone_code', '/onboarding/pro_signup']

export default defineConfig({
  resolve: {
    alias: {
      '~/': `${path.resolve(__dirname, 'src')}/`,
      // "@ionic/vue-router": fileURLToPath(new URL("./node_modules/@ionic/vue-router/dist/index.esm.js", import.meta.url)),
      // "@ionic/vue/css": fileURLToPath(new URL("./node_modules/@ionic/vue/css", import.meta.url)),
      // "@ionic/vue": fileURLToPath(new URL("./node_modules/@ionic/vue/dist/index.esm.js", import.meta.url)),
    },
  },
  build: {
    sourcemap: true,
  },
  plugins: [
    // esbuildCommonjs(['react-calendar','react-date-picker']) 
    viteCommonjs(),
    Vue({
      include: [/\.vue$/, /\.md$/],
    }),

    EnvironmentPlugin({
      VITE_APP_VERSION: pack.version,
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || getRightKey(process.env.BRANCH || '', 'supa_anon'),
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || getRightKey(process.env.BRANCH || '', 'supa_url'),
      VITE_VAPID_KEY: process.env.VITE_VAPID_KEY || vapidKey,
      VITE_NETLIFY_URL: `${getUrl(process.env.BRANCH)}/${base_api}`,
      VITE_APP_URL: `${getUrl(process.env.BRANCH)}`,
      VITE_BRANCH: process.env.BRANCH || 'prod',
    }, { defineOn: 'import.meta.env' }),

    // https://github.com/hannoeru/vite-plugin-pages
    Pages({
      extensions: ['vue', 'md'],
      extendRoute(route) {
        if (guestPath.includes(route.path))
          return route
        // Augment the route with meta that indicates that the route requires authentication.
        return {
          ...route,
          meta: { ...route.meta, middleware: 'auth' },
        }
      },
    }),

    // https://github.com/JohnCampionJr/vite-plugin-vue-layouts
    Layouts(),

    // https://github.com/antfu/unplugin-icons
    Icons({
      autoInstall: true,
    }),

    // https://github.com/antfu/vite-plugin-windicss
    WindiCSS({
      safelist: markdownWrapperClasses,
    }),

    // https://github.com/antfu/vite-plugin-pwa
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'safari-pinned-tab.svg'],
      srcDir: 'src/service-worker',
      filename: 'sw.ts',
      strategies: 'injectManifest',
      injectRegister: null,
      workbox: {
        cleanupOutdatedCaches: true,
      },
      manifest: {
        name: '9moispourtoi',
        short_name: '9M',
        theme_color: '#faa29e',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),

    // https://github.com/intlify/bundle-tools/tree/main/packages/vite-plugin-vue-i18n
    VueI18n({
      runtimeOnly: true,
      compositionOnly: true,
      include: [path.resolve(__dirname, 'locales/**')],
    }),

    // https://github.com/antfu/vite-plugin-inspect
    Inspect({
      // change this to enable inspect for debugging
      enabled: false,
    }),
  ],
  server: {
    fs: {
      strict: true,
    },
    open: true,
  },
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      '@ionic/vue',
      '@ionic/vue-router',
      '@vueuse/core',
      '@vueuse/head',
    ],
    exclude: [
      'vue-demi',
    ],
    esbuildOptions:{
      plugins:[
        esbuildCommonjs(['keen-slider', 'vue-tel-input', 'vue-cal']) 
      ]
    }
  },
  // https://github.com/vitest-dev/vitest
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'jsdom',
    deps: {
      inline: ['@vue', '@vueuse', 'vue-demi'],
    },
  },
})
