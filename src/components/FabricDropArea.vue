<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Canvas, FabricImage } from "fabric";
import type { HistoryUploadSelection } from "@/types/uploads";

const props = defineProps<{
  historyUpload?: HistoryUploadSelection | null;
}>();

const emit = defineEmits<{
  "file-change": [value: File | null];
  "error-change": [value: string];
}>();

const MOBILE_BREAKPOINT = "(max-width: 799px)";
const DESKTOP_CANVAS = {
  width: 150,
  height: 250,
  maxImageWidth: 150,
  maxImageHeight: 150
};
const MOBILE_CANVAS = {
  width: 120,
  height: 190,
  maxImageWidth: 115,
  maxImageHeight: 135
};

const fileInputRef = ref<HTMLInputElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const designFile = ref<File | null>(null);
const isUploading = ref(false);
const canvasWidth = ref(DESKTOP_CANVAS.width);
const canvasHeight = ref(DESKTOP_CANVAS.height);
const maxImageWidth = ref(DESKTOP_CANVAS.maxImageWidth);
const maxImageHeight = ref(DESKTOP_CANVAS.maxImageHeight);

let fabricCanvas: Canvas | null = null;
let uploadedImage: FabricImage | null = null;

function updateCanvasSizingByViewport() {
  const isMobile = window.matchMedia(MOBILE_BREAKPOINT).matches;
  const preset = isMobile ? MOBILE_CANVAS : DESKTOP_CANVAS;

  canvasWidth.value = preset.width;
  canvasHeight.value = preset.height;
  maxImageWidth.value = preset.maxImageWidth;
  maxImageHeight.value = preset.maxImageHeight;
}

function repositionUploadedImage() {
  if (!uploadedImage || !fabricCanvas) return;

  const scale = Math.min(
    maxImageWidth.value / uploadedImage.width!,
    maxImageHeight.value / uploadedImage.height!,
    1
  );

  uploadedImage.set({
    left: (canvasWidth.value - uploadedImage.width! * scale) / 2,
    top: (canvasHeight.value - uploadedImage.height! * scale) / 2,
    scaleX: scale,
    scaleY: scale
  });
}

function refreshCanvasDimensions() {
  if (!fabricCanvas) return;

  fabricCanvas.setDimensions({
    width: canvasWidth.value,
    height: canvasHeight.value
  });

  repositionUploadedImage();
  fabricCanvas.renderAll();
}

function initCanvas() {
  if (!canvasRef.value) return;

  fabricCanvas = new Canvas(canvasRef.value, {
    preserveObjectStacking: true,
    backgroundColor: "transparent"
  });

  refreshCanvasDimensions();
}

onMounted(() => {
  updateCanvasSizingByViewport();
  initCanvas();
  window.addEventListener("resize", updateCanvasSizingByViewport);
  window.addEventListener("resize", refreshCanvasDimensions);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateCanvasSizingByViewport);
  window.removeEventListener("resize", refreshCanvasDimensions);
  fabricCanvas?.dispose();
  fabricCanvas = null;
});

function openFilePicker() {
  fileInputRef.value?.click();
}

function applyImage(image: FabricImage) {
  if (!fabricCanvas) return;

  if (uploadedImage) {
    fabricCanvas.remove(uploadedImage);
    uploadedImage = null;
  }

  const scale = Math.min(
    maxImageWidth.value / image.width!,
    maxImageHeight.value / image.height!,
    1
  );

  image.set({
    left: (canvasWidth.value - image.width! * scale) / 2,
    top: (canvasHeight.value - image.height! * scale) / 2,
    scaleX: scale,
    scaleY: scale,
    cornerColor: "#0b8b76",
    cornerStrokeColor: "#075047",
    borderColor: "#0b8b76",
    transparentCorners: false
  });

  uploadedImage = image;
  fabricCanvas.add(image);
  fabricCanvas.setActiveObject(image);
  fabricCanvas.renderAll();
}

function dataUrlToFile(dataUrl: string, fileName: string, fileType: string) {
  const parts = dataUrl.split(",");
  const byteString = atob(parts[1] ?? "");
  const bytes = new Uint8Array(byteString.length);

  for (let i = 0; i < byteString.length; i += 1) {
    bytes[i] = byteString.charCodeAt(i);
  }

  return new File([bytes], fileName, { type: fileType || "image/png" });
}

async function addImageToCanvas(file: File) {
  if (!fabricCanvas) return;

  emit("error-change", "");

  if (!file.type.startsWith("image/")) {
    emit("error-change", "Please upload a PNG, JPG, WEBP, or SVG image.");
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    emit("error-change", "File is too large. Max size is 10MB.");
    return;
  }

  const objectUrl = URL.createObjectURL(file);
  isUploading.value = true;

  try {
    const image = await FabricImage.fromURL(objectUrl);
    applyImage(image);

    designFile.value = file;
    emit("file-change", file);
  } catch {
    emit("error-change", "Image could not be loaded. Try another file.");
  } finally {
    isUploading.value = false;
    URL.revokeObjectURL(objectUrl);
  }
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  await addImageToCanvas(file);
  input.value = "";
}

async function onDrop(event: DragEvent) {
  event.preventDefault();
  const file = event.dataTransfer?.files?.[0];
  if (!file) return;
  await addImageToCanvas(file);
}

watch(
  () => props.historyUpload?.nonce,
  async () => {
    const upload = props.historyUpload;
    if (!upload || !fabricCanvas) return;

    emit("error-change", "");
    isUploading.value = true;

    try {
      const image = await FabricImage.fromURL(upload.dataUrl);
      applyImage(image);

      const file = dataUrlToFile(upload.dataUrl, upload.name, upload.type);
      designFile.value = file;
      emit("file-change", file);
    } catch {
      emit("error-change", "Saved image could not be loaded.");
    } finally {
      isUploading.value = false;
    }
  }
);

watch([canvasWidth, canvasHeight], () => {
  refreshCanvasDimensions();
});

function clearDesign() {
  if (!fabricCanvas || !uploadedImage) return;

  fabricCanvas.remove(uploadedImage);
  uploadedImage = null;
  fabricCanvas.renderAll();
  designFile.value = null;
  emit("file-change", null);
  emit("error-change", "");
}
</script>

<template>
  <div class="fabric-controls">
    <div
      class="design-drop-zone"
      :style="{
        '--drop-width': `min(52vw, ${canvasWidth}px)`,
        '--drop-height': `min(64vw, ${canvasHeight}px)`
      }"
      @dragover.prevent
      @drop="onDrop"
    >
      <canvas
        ref="canvasRef"
        :width="canvasWidth"
        :height="canvasHeight"
        class="design-canvas"
      />
      <div v-if="isUploading" class="loading-overlay">Uploading image...</div>
      <div class="drop-overlay">Drop your image here</div>
    </div>

    <div class="actions-row">
      <button
        type="button"
        class="btn btn-primary"
        :disabled="isUploading"
        @click="openFilePicker"
      >
        {{ isUploading ? "Uploading..." : "Upload design" }}
      </button>
      <button
        type="button"
        class="btn btn-ghost"
        :disabled="!designFile || isUploading"
        @click="clearDesign"
      >
        Clear
      </button>
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        class="hidden-input"
        @change="onFileChange"
      />
    </div>
  </div>
</template>

<style scoped>
.fabric-controls {
  position: absolute;
  inset: 0;
}

.design-drop-zone {
  position: absolute;
  left: 50%;
  top: 60%;
  width: var(--drop-width);
  height: var(--drop-height);
  transform: translate(-50%, -50%);
  border: 2px dashed rgba(15, 23, 42, 0.25);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(1px);
}

.design-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.drop-overlay {
  position: absolute;
  inset: auto 0 6px 0;
  text-align: center;
  font-size: 0.76rem;
  color: #334155;
  pointer-events: none;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(17, 24, 39, 0.35);
  color: #fff;
  font-weight: 700;
  font-size: 0.95rem;
  pointer-events: none;
}

.actions-row {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 0.8rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.btn {
  border: none;
  border-radius: 12px;
  padding: 0.62rem 0.95rem;
  font-weight: 700;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--accent);
  color: #fff;
}

.btn-primary:hover {
  background: var(--accent-strong);
}

.btn-ghost {
  background: #f4f4f2;
  color: #1f2937;
  border: 1px solid var(--line);
}

.hidden-input {
  display: none;
}
</style>
