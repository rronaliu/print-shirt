<script setup lang="ts">
import { watch } from "vue";
import { storeToRefs } from "pinia";

import type { ShirtColorId, ShirtSize } from "@/stores/order";
import { useOrderStore } from "@/stores/order";

type ShirtOption = {
  id: ShirtColorId;
  name: string;
  swatch: string;
};

const props = defineProps<{
  shirtColors: ShirtOption[];
  sizes: ShirtSize[];
}>();

const emit = defineEmits<{
  submit: [];
}>();

const orderStore = useOrderStore();
const {
  customerName,
  phone,
  address,
  companyEmail,
  color,
  size,
  quantity,
  unitPrice,
  totalPrice,
  pricingLabel
} = storeToRefs(orderStore);

watch(quantity, value => {
  quantity.value = Math.max(1, Number(value) || 1);
});
</script>

<template>
  <article class="panel config-panel">
    <div class="panel-head">
      <h2>Order Setup</h2>
    </div>

    <div class="field-block">
      <label>Shirt color</label>
      <div class="swatch-grid">
        <button
          v-for="shirt in props.shirtColors"
          :key="shirt.id"
          type="button"
          class="swatch"
          :class="{ active: color === shirt.id }"
          :aria-label="`Select ${shirt.name}`"
          @click="color = shirt.id"
        >
          <span class="dot" :style="{ backgroundColor: shirt.swatch }" />
          <span>{{ shirt.name }}</span>
        </button>
      </div>
    </div>

    <div class="field-grid">
      <label>
        Size (men)
        <select v-model="size">
          <option
            v-for="shirtSize in props.sizes"
            :key="shirtSize"
            :value="shirtSize"
          >
            {{ shirtSize }}
          </option>
        </select>
      </label>

      <label>
        Quantity
        <input v-model.number="quantity" type="number" min="1" />
      </label>
    </div>

    <div class="price-box">
      <p class="tier">{{ pricingLabel }}</p>
      <p>
        <strong>{{ unitPrice }} EUR</strong> per shirt
      </p>
      <p class="total">Total: {{ totalPrice }} EUR</p>
    </div>

    <div class="field-grid single">
      <label>
        Printing company email (fixed)
        <input v-model.trim="companyEmail" type="email" readonly />
      </label>
    </div>

    <div class="field-grid single">
      <label>
        Customer name
        <input v-model.trim="customerName" type="text" placeholder="John Doe" />
      </label>
      <label>
        Phone number
        <input
          v-model.trim="phone"
          type="tel"
          placeholder="+383 (0)XX XXX XXX"
        />
      </label>
      <label>
        Delivery address
        <textarea
          v-model.trim="address"
          rows="3"
          placeholder="Street, city, zip"
        />
      </label>
    </div>

    <button type="button" class="btn btn-submit" @click="emit('submit')">
      Submit order via email
    </button>

    <p class="mail-note">
      Email clients usually cannot attach files automatically from the browser.
      The design filename is included and should be attached before sending.
    </p>
  </article>
</template>

<style scoped>
.panel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 1rem;
  box-shadow: 0 10px 26px rgba(23, 33, 33, 0.08);
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.7rem;
  margin-bottom: 0.8rem;
}

.panel-head h2 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
}

.pill {
  background: var(--bg-soft);
  border: 1px solid var(--line);
  border-radius: 999px;
  font-size: 0.72rem;
  padding: 0.25rem 0.65rem;
  white-space: nowrap;
}

.field-block label,
.field-grid label {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-weight: 700;
  color: #1f2937;
}

.swatch-grid {
  margin-top: 0.55rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
}

.swatch {
  border: 1px solid var(--line);
  background: #fff;
  color: #111827;
  border-radius: 10px;
  padding: 0.45rem 0.55rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  text-align: left;
}

.swatch.active {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(11, 139, 118, 0.2);
}

.dot {
  width: 1rem;
  height: 1rem;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.25);
}

.field-grid {
  margin-top: 0.95rem;
  display: grid;
  gap: 0.75rem;
}

input,
select,
textarea {
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 0.65rem 0.7rem;
  background: #fff;
}

.price-box {
  margin-top: 0.95rem;
  background: #f7faf7;
  border: 1px solid #d8e8de;
  border-radius: 12px;
  padding: 0.78rem;
}

.tier {
  margin: 0;
  color: #0f5132;
  font-size: 0.88rem;
}

.total {
  margin-bottom: 0;
  font-size: 1.06rem;
  font-weight: 800;
}

.btn {
  border: none;
  border-radius: 12px;
  padding: 0.62rem 0.95rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-submit {
  margin-top: 1rem;
  width: 100%;
  background: #172121;
  color: #fff;
  padding: 0.78rem;
}

.btn-submit:hover {
  background: #0f1919;
}

.mail-note {
  margin: 0.55rem 0 0;
  color: var(--ink-muted);
  font-size: 0.88rem;
}

@media (min-width: 800px) {
  .field-grid {
    grid-template-columns: 1fr 1fr;
  }

  .field-grid.single {
    grid-template-columns: 1fr;
  }

  .swatch-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
