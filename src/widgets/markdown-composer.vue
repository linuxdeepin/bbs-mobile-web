<template>
  <nut-popup v-model:visible="visible" position="bottom" round safe-area-inset-bottom
    :close-on-click-overlay="!busy">
    <view class="markdown-composer-panel">
      <view class="markdown-composer-heading">
        <text>{{ title }}</text>
        <nut-button size="small" :disabled="busy" @click="visible = false">收起编辑器</nut-button>
      </view>
      <slot />
    </view>
  </nut-popup>
</template>

<script lang="ts" setup>
const visible = defineModel<boolean>('visible', { default: false });
withDefaults(defineProps<{ title: string; busy?: boolean }>(), { busy: false });
</script>

<style lang="scss">
.markdown-composer-panel {
  box-sizing: border-box;
  max-height: 75vh;
  overflow-y: auto;
  padding: 12Px;
  color: var(--text-color);
  background: var(--page-bg-color);
}
.markdown-composer-heading {
  position: sticky;
  top: -12Px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12Px;
  padding-bottom: 8Px;
  background: var(--page-bg-color);
  font-size: 15Px;
}
.markdown-composer-entry {
  display: flex;
  align-items: center;
  gap: 8Px;
  padding: 12Px 0;
}
.markdown-composer-entry-text {
  flex: 1;
  min-width: 0;
  padding: 10Px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  border: 1px solid var(--placeholder-color);
  border-radius: 6Px;
  color: var(--text-desc-color);
  font-size: 14Px;
}
</style>
