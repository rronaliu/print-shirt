<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";

import DesignPreviewPanel from "@/components/DesignPreviewPanel.vue";
import DesignPreviewPanelNav from "@/components/DesignPreviewPanelNav.vue";
import OrderSetupPanel from "@/components/OrderSetupPanel.vue";

import type { ShirtColorId, ShirtSize } from "@/stores/order";
import { useOrderStore } from "@/stores/order";

import whiteShirt from "@/assets/shirt-colors/white-shirt.png";
import blackShirt from "@/assets/shirt-colors/black-shirt.png";
import greyShirt from "@/assets/shirt-colors/grey-shirt.png";
import blueShirt from "@/assets/shirt-colors/blue-shirt.png";
import greenShirt from "@/assets/shirt-colors/green-shirt.png";
import redShirt from "@/assets/shirt-colors/red-shirt.png";

type ShirtColorOption = {
  id: ShirtColorId;
  name: string;
  swatch: string;
  image: string;
};

const shirtColors: ShirtColorOption[] = [
  { id: "white", name: "White", swatch: "#f8fafc", image: whiteShirt },
  { id: "black", name: "Black", swatch: "#111827", image: blackShirt },
  { id: "grey", name: "Grey", swatch: "#9ca3af", image: greyShirt },
  { id: "blue", name: "Blue", swatch: "#2563eb", image: blueShirt },
  { id: "green", name: "Green", swatch: "#16a34a", image: greenShirt },
  { id: "red", name: "Red", swatch: "#dc2626", image: redShirt }
];

const sizes: ShirtSize[] = ["S", "M", "L", "XL", "XXL"];

const orderStore = useOrderStore();
const {
  customerName,
  phone,
  address,
  color,
  size,
  quantity,
  unitPrice,
  totalPrice
} = storeToRefs(orderStore);
const MAIL_TO = "rronaliu95@gmail.com";

const activeShirt = computed(
  () => shirtColors.find(shirt => shirt.id === color.value) ?? shirtColors[0]
);
const quantitySafe = computed(() => Math.max(1, Number(quantity.value) || 1));

const designFile = ref<File | null>(null);
const selectedDesignImageUrl = ref<string | null>(null);
const orderSetupAnchorRef = ref<HTMLElement | null>(null);
const isMobileViewport = ref(false);
const isPreviewMobileSticky = ref(false);

function updateViewportFlags() {
  isMobileViewport.value = window.matchMedia("(max-width: 799px)").matches;
}

function updateStickyState() {
  if (!isMobileViewport.value || !orderSetupAnchorRef.value) {
    isPreviewMobileSticky.value = false;
    return;
  }

  const anchorTop = orderSetupAnchorRef.value.getBoundingClientRect().top;
  isPreviewMobileSticky.value = anchorTop <= 0;
}

function onDesignFileChange(file: File | null) {
  designFile.value = file;
}

watch(designFile, nextFile => {
  if (selectedDesignImageUrl.value) {
    URL.revokeObjectURL(selectedDesignImageUrl.value);
    selectedDesignImageUrl.value = null;
  }

  if (!nextFile) return;
  selectedDesignImageUrl.value = URL.createObjectURL(nextFile);
});

const orderSummary = computed(() => {
  return [
    `Product: Men's shirt`,
    `Color: ${activeShirt.value.name}`,
    `Size: ${size.value}`,
    `Quantity: ${quantitySafe.value}`,
    `Price per shirt: ${unitPrice.value} EUR`,
    `Total: ${totalPrice.value} EUR`,
    `Customer: ${customerName.value || "N/A"}`,
    `Phone: ${phone.value || "N/A"}`,
    `Address: ${address.value || "N/A"}`,
    `Design file: ${
      designFile.value ? designFile.value.name : "No file attached"
    }`
  ].join("\n");
});

function submitOrder() {
  if (!customerName.value || !phone.value || !address.value) {
    alert("Please fill name, phone, and address before submitting.");
    return;
  }

  if (!designFile.value) {
    alert("Please upload a design before submitting your order.");
    return;
  }

  const subject = `Shirt Print Order - ${customerName.value}`;
  const body = `${orderSummary.value}\n\nNote: attach the uploaded design file (${designFile.value.name}) to this email before sending.`;

  window.location.href = `mailto:${encodeURIComponent(
    MAIL_TO
  )}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

onMounted(() => {
  updateViewportFlags();
  updateStickyState();
  window.addEventListener("resize", updateViewportFlags);
  window.addEventListener("resize", updateStickyState);
  window.addEventListener("scroll", updateStickyState, { passive: true });
});

onBeforeUnmount(() => {
  if (selectedDesignImageUrl.value) {
    URL.revokeObjectURL(selectedDesignImageUrl.value);
    selectedDesignImageUrl.value = null;
  }
  window.removeEventListener("resize", updateViewportFlags);
  window.removeEventListener("resize", updateStickyState);
  window.removeEventListener("scroll", updateStickyState);
});
</script>

<template>
  <main class="order-studio">
    <DesignPreviewPanelNav
      :active-shirt="activeShirt"
      :visible="isPreviewMobileSticky"
      :design-image-url="selectedDesignImageUrl"
    />

    <section class="content-grid">
      <DesignPreviewPanel :active-shirt="activeShirt" @design-file-change="onDesignFileChange" />
      <div ref="orderSetupAnchorRef">
        <OrderSetupPanel
          :shirt-colors="shirtColors"
          :sizes="sizes"
          @submit="submitOrder"
        />
      </div>
    </section>
  </main>
</template>

<style scoped>
.order-studio {
  width: min(1200px, 100% - 2rem);
  margin: 0 auto;
  padding: 1.2rem 0 2.5rem;
}

.content-grid {
  margin-top: 1rem;
  display: grid;
  gap: 1rem;
}

@media (min-width: 800px) {
  .content-grid {
    grid-template-columns: 1.1fr 0.9fr;
  }
}
</style>
