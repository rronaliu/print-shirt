<script setup lang="ts">
import { ref } from "vue";

import FabricDropArea from "@/components/FabricDropArea.vue";
import UploadHistoryPanel from "@/components/UploadHistoryPanel.vue";
import type { HistoryUploadSelection } from "@/types/uploads";

type ShirtOption = {
  id: string;
  name: string;
  swatch: string;
  image: string;
};

const props = defineProps<{
  activeShirt: ShirtOption;
}>();

const emit = defineEmits<{
  "design-file-change": [value: File | null];
}>();

const designFile = ref<File | null>(null);
const designError = ref("");
const selectedHistoryUpload = ref<HistoryUploadSelection | null>(null);

function onFileChange(file: File | null) {
  designFile.value = file;
  emit("design-file-change", file);
}

function onErrorChange(error: string) {
  designError.value = error;
}

function onSelectUpload(upload: HistoryUploadSelection) {
  selectedHistoryUpload.value = upload;
}
</script>

<template>
  <article class="panel preview-panel">
    <div class="panel-head">
      <h2>Design Preview</h2>
      <span class="pill">Front print area</span>
    </div>

    <div class="shirt-stage">
      <img
        class="shirt-photo"
        :src="props.activeShirt.image"
        :alt="`${props.activeShirt.name} men's shirt`"
      />
      <FabricDropArea
        :history-upload="selectedHistoryUpload"
        @file-change="onFileChange"
        @error-change="onErrorChange"
      />
    </div>

    <p class="hint">Move and resize the artwork directly on the shirt area.</p>
    <p v-if="designFile" class="file-name">Loaded: {{ designFile.name }}</p>
    <p v-if="designError" class="error">{{ designError }}</p>

    <UploadHistoryPanel
      :latest-file="designFile"
      @select-upload="onSelectUpload"
    />
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

.shirt-stage {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  background: transparent;
  min-height: 420px;
}

.shirt-photo {
  width: 100%;
  display: block;
  user-select: none;
  pointer-events: none;
}

.hint,
.file-name {
  margin: 0.55rem 0 0;
  color: var(--ink-muted);
  font-size: 0.88rem;
}

.error {
  margin: 0.55rem 0 0;
  color: #b91c1c;
  font-weight: 600;
}
</style>
