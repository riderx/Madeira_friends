<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const router = useRouter()
const { t } = useI18n()
</script>

<template>
  <main class="px-4 py-10 text-center grid place-content-center h-full w-full text-teal-700 dark:text-gray-200">
    <div class="w-full p-8">
      <div>
        <p class="text-4xl">
          Page {{ t('not-found') }}
        </p>
      </div>
      <div>
        <button
          class="p-2 mt-5 rouded rounded-md text-sm bg-sweet-pink-500"
          @click="router.back()"
        >
          {{ t('button.back') }}
        </button>
      </div>
    </div>
  </main>
</template>
