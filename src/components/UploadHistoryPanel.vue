<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { HistoryUploadSelection } from "@/types/uploads";

type UploadRecord = {
  id: string;
  name: string;
  type: string;
  size: number;
  savedAt: string;
  dataUrl: string;
};

const STORAGE_KEY = "print-shirt.upload-history.v1";
const MAX_UPLOADS = 10;
const AVATAR_SIZE = 56;
const AVATAR_GAP = 8;

const props = defineProps<{
  latestFile: File | null;
}>();

const emit = defineEmits<{
  "select-upload": [value: HistoryUploadSelection];
}>();

const rootRef = ref<HTMLElement | null>(null);
const stripRef = ref<HTMLElement | null>(null);
const uploads = ref<UploadRecord[]>([]);
const visibleSlots = ref(1);
const showOverflow = ref(false);
let resizeObserver: ResizeObserver | null = null;

const orderedUploads = computed(() => uploads.value.slice().reverse());

const hasOverflow = computed(
  () => orderedUploads.value.length > visibleSlots.value
);

const visibleUploads = computed(() => {
  if (!hasOverflow.value) return orderedUploads.value;
  return orderedUploads.value.slice(0, Math.max(visibleSlots.value - 1, 0));
});

const overflowUploads = computed(() => {
  if (!hasOverflow.value) return [];
  return orderedUploads.value.slice(Math.max(visibleSlots.value - 1, 0));
});

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      uploads.value = [];
      return;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      uploads.value = [];
      return;
    }

    uploads.value = parsed
      .filter((item): item is UploadRecord => {
        return (
          typeof item?.id === "string" &&
          typeof item?.name === "string" &&
          typeof item?.type === "string" &&
          typeof item?.size === "number" &&
          typeof item?.savedAt === "string" &&
          typeof item?.dataUrl === "string"
        );
      })
      .slice(-MAX_UPLOADS);
  } catch {
    uploads.value = [];
  }
}

function persistUploads(nextUploads: UploadRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUploads));
    uploads.value = nextUploads;
    return true;
  } catch {
    return false;
  }
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

async function saveUpload(file: File) {
  const dataUrl = await fileToDataUrl(file);
  const existingIndex = uploads.value.findIndex(
    upload => upload.dataUrl === dataUrl
  );

  if (existingIndex >= 0) {
    return;
  }

  const nextRecord: UploadRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    type: file.type || "image/png",
    size: file.size,
    savedAt: new Date().toISOString(),
    dataUrl
  };

  let nextUploads = [...uploads.value, nextRecord];

  if (nextUploads.length > MAX_UPLOADS) {
    nextUploads = nextUploads.slice(nextUploads.length - MAX_UPLOADS);
  }

  // Keep newest uploads: on localStorage quota errors, evict oldest until save succeeds.
  while (nextUploads.length > 0) {
    if (persistUploads(nextUploads)) return;
    nextUploads = nextUploads.slice(1);
  }
}

function useUpload(upload: UploadRecord) {
  showOverflow.value = false;
  emit("select-upload", {
    id: upload.id,
    name: upload.name,
    type: upload.type,
    dataUrl: upload.dataUrl,
    nonce: Date.now()
  });
}

function removeUpload(uploadId: string) {
  const nextUploads = uploads.value.filter(upload => upload.id !== uploadId);
  persistUploads(nextUploads);
}

function recalculateVisibleSlots() {
  const width = stripRef.value?.clientWidth ?? 0;
  if (width <= 0) {
    visibleSlots.value = 1;
    return;
  }

  const slots = Math.floor((width + AVATAR_GAP) / (AVATAR_SIZE + AVATAR_GAP));
  visibleSlots.value = Math.max(1, slots);
}

function onDocumentClick(event: MouseEvent) {
  if (!rootRef.value) return;
  if (!rootRef.value.contains(event.target as Node)) {
    showOverflow.value = false;
  }
}

onMounted(() => {
  readStorage();
  recalculateVisibleSlots();

  if (stripRef.value) {
    resizeObserver = new ResizeObserver(() => {
      recalculateVisibleSlots();
    });
    resizeObserver.observe(stripRef.value);
  }

  document.addEventListener("click", onDocumentClick);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  document.removeEventListener("click", onDocumentClick);
});

watch(
  () => props.latestFile,
  async file => {
    if (!file) return;

    try {
      await saveUpload(file);
      recalculateVisibleSlots();
    } catch {
      // Keep upload flow safe even if localStorage is unavailable.
    }
  }
);
</script>

<template>
  <section ref="rootRef" class="upload-history">
    <div class="history-head">
      <p>Previous uploads</p>
      <span>{{ uploads.length }}/{{ MAX_UPLOADS }}</span>
    </div>

    <div ref="stripRef" class="avatars-row">
      <div
        v-for="upload in visibleUploads"
        :key="upload.id"
        class="avatar"
        role="button"
        tabindex="0"
        :title="upload.name"
        @click="useUpload(upload)"
        @keydown.enter.prevent="useUpload(upload)"
        @keydown.space.prevent="useUpload(upload)"
      >
        <img :src="upload.dataUrl" :alt="upload.name" />
        <span
          class="remove-badge"
          role="button"
          aria-label="Remove upload"
          @click.stop="removeUpload(upload.id)"
        />
      </div>

      <div
        v-if="hasOverflow"
        class="avatar avatar-more"
        role="button"
        tabindex="0"
        @click="showOverflow = !showOverflow"
        @keydown.enter.prevent="showOverflow = !showOverflow"
        @keydown.space.prevent="showOverflow = !showOverflow"
      >
        ...
      </div>
    </div>

    <div
      v-if="showOverflow && overflowUploads.length > 0"
      class="overflow-popover"
    >
      <div
        v-for="upload in overflowUploads"
        :key="upload.id"
        class="popover-item"
        role="button"
        tabindex="0"
        @click="useUpload(upload)"
        @keydown.enter.prevent="useUpload(upload)"
        @keydown.space.prevent="useUpload(upload)"
      >
        <span
          class="remove-badge"
          role="button"
          aria-label="Remove upload"
          @click.stop="removeUpload(upload.id)"
        />
        <img :src="upload.dataUrl" :alt="upload.name" />
        <span class="clip-filename">{{ upload.name }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.upload-history {
  position: relative;
  margin-top: 0.7rem;
  padding-top: 0.55rem;
  border-top: 1px dashed var(--line);
  width: 100%;
}

.history-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
  color: var(--ink-muted);
}

.history-head p {
  margin: 0;
  font-weight: 700;
}

.avatars-row {
  display: flex;
  gap: 8px;
  width: 100%;
  overflow: visible;
}

.avatar {
  position: relative;
  width: 56px;
  height: 56px;
  flex: 0 0 56px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: #fff;
  padding: 0;
  cursor: pointer;
  overflow: visible;
}

.avatar:focus-visible,
.popover-item:focus-visible {
  outline: 2px solid #0b8b76;
  outline-offset: 2px;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
}

.avatar-more {
  display: grid;
  place-items: center;
  color: #334155;
  font-weight: 800;
  font-size: 1rem;
}

.remove-badge {
  position: absolute;
  top: -9px;
  right: -9px;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #0f172a;
  display: grid;
  place-items: center;
  font-size: 0.7rem;
  font-weight: 800;
  line-height: 1;
  z-index: 2;
}

.remove-badge::before {
  content: "\00D7";
  font-size: 18px;
}

.overflow-popover {
  position: absolute;
  top: calc(100% + 0.35rem);
  right: 0;
  z-index: 20;
  width: min(320px, 100%);
  max-height: 220px;
  overflow: auto;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 12px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.16);
  padding: 0.45rem;
  display: grid;
  gap: 0.4rem;
  overflow-x: hidden;
}

.popover-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #fff;
  text-align: left;
  padding: 0.35rem;
  cursor: pointer;
}

.popover-item img {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  object-fit: cover;
}

.popover-item span {
  font-size: 0.8rem;
  color: #1f2937;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.clip-filename {
  text-overflow: ellipsis;
  overflow: hidden;
  width: 200px;
}
</style>
