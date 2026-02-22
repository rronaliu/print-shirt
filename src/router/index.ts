import { createRouter, createWebHistory } from 'vue-router'

import OrderStudioView from '@/views/OrderStudioView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'order-studio',
      component: OrderStudioView,
    },
  ],
})

export default router
