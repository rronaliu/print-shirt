<script setup lang="ts">
type ShirtOption = {
  id: string
  name: string
  swatch: string
  image: string
}

const props = defineProps<{
  activeShirt: ShirtOption
  visible: boolean
  designImageUrl?: string | null
}>()
</script>

<template>
  <aside class="preview-nav" :class="{ 'is-visible': props.visible }" aria-hidden="!props.visible">
    <div class="preview-nav-inner">
      <img class="preview-nav-thumb" :src="props.activeShirt.image" :alt="`${props.activeShirt.name} shirt preview`" />
      <img
        v-if="props.designImageUrl"
        class="preview-nav-design-thumb"
        :src="props.designImageUrl"
        alt="Selected design"
      />
      <div class="preview-nav-copy">
        <p>Design Preview</p>
        <span>{{ props.activeShirt.name }}</span>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.preview-nav {
  display: none;
}

@media (max-width: 799px) {
  .preview-nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 40;
    display: block;
    transform: translateY(-100%);
    transition: transform 180ms ease;
  }

  .preview-nav.is-visible {
    transform: translateY(0);
  }

  .preview-nav-inner {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    background: var(--panel);
    border-bottom: 1px solid var(--line);
    padding: 0.45rem 0.8rem;
  }

  .preview-nav-thumb {
    width: 38px;
    height: 38px;
    border-radius: 8px;
    object-fit: cover;
    border: 1px solid var(--line);
  }

  .preview-nav-design-thumb {
    width: 38px;
    height: 38px;
    border-radius: 8px;
    object-fit: cover;
    border: 1px solid var(--line);
  }

  .preview-nav-copy p {
    margin: 0;
    font-size: 0.78rem;
    font-weight: 800;
    line-height: 1.2;
  }

  .preview-nav-copy span {
    font-size: 0.72rem;
    color: var(--ink-muted);
  }
}
</style>
