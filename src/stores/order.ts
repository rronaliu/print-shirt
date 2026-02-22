import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export type ShirtColorId = 'white' | 'black' | 'grey' | 'blue' | 'green' | 'red'
export type ShirtSize = 'S' | 'M' | 'L' | 'XL' | 'XXL'

export const useOrderStore = defineStore('order', () => {
  const customerName = ref('')
  const phone = ref('')
  const address = ref('')
  const companyEmail = ref('rronaliu95@gmail.com')

  const color = ref<ShirtColorId>('white')
  const size = ref<ShirtSize>('M')
  const quantity = ref(1)

  const unitPrice = computed(() => {
    if (quantity.value >= 30) return 7
    if (quantity.value >= 15) return 9
    if (quantity.value >= 6) return 12
    return 15
  })

  const totalPrice = computed(() => unitPrice.value * quantity.value)

  const pricingLabel = computed(() => {
    if (quantity.value >= 30) return 'Bulk tier: 30+ shirts at 7 EUR each'
    if (quantity.value >= 15) return 'Volume tier: 15-29 shirts at 9 EUR each'
    if (quantity.value >= 6) return 'Team tier: 6-14 shirts at 12 EUR each'
    return 'Base tier: 1-5 shirts at 15 EUR each'
  })

  return {
    customerName,
    phone,
    address,
    companyEmail,
    color,
    size,
    quantity,
    unitPrice,
    totalPrice,
    pricingLabel,
  }
})
