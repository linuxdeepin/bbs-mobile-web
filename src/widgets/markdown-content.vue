<template>
  <view class="markdown-content" @click="contentClick">
    <template v-for="(block, index) in rendered.blocks" :key="index">
      <scroll-view v-if="block.type === 'table'" class="markdown-table-scroll" :scroll-x="true">
        <view :style="{ minWidth: '100%', width: block.minWidth + 'px' }">
          <rich-text :nodes="block.html" :user-select="true" />
        </view>
      </scroll-view>
      <view v-else class="markdown-html taro_html" v-html="block.html"></view>
    </template>
  </view>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import Taro from '@tarojs/taro';
import { prepareContent } from '@/utils/markdown';

if (process.env.TARO_ENV !== 'h5') require('@tarojs/taro/html.css');

const props = withDefaults(defineProps<{
  content: string;
  format?: 'auto' | 'markdown';
  interactive?: boolean;
}>(), { format: 'auto', interactive: true });
const emit = defineEmits<{ preview: [] }>();
const rendered = computed(() => prepareContent(props.content || '', process.env.SERVER, props.format));

function contentClick(event: any) {
  if (!props.interactive) {
    event.preventDefault?.();
    return;
  }
  let target = event.target;
  while (target && target !== event.currentTarget) {
    const data = target.dataset || {};
    if (data.tag === 'img' && rendered.value.images.includes(data.src)) {
      emit('preview');
      Taro.previewImage({ current: data.src, urls: rendered.value.images });
      return;
    }
    if (data.tag === 'a' && data.href) {
      const post = data.href.match(/^(?:https?:\/\/bbs\.deepin\.org(?:\.cn)?)?\/post\/(\d+)(?:[?#].*)?$/i);
      if (post) {
        event.preventDefault?.();
        Taro.navigateTo({ url: `/pages/thread/thread?id=${post[1]}` });
      } else if (process.env.TARO_ENV !== 'h5') {
        Taro.setClipboardData({ data: data.href });
      }
      return;
    }
    target = target.parentElement || target.parentNode;
  }
}
</script>

<style lang="scss">
.markdown-content {
  width: 100%;
  min-width: 0;
  overflow-wrap: anywhere;
  line-height: 1.7;
  user-select: text;

  .markdown-table-scroll { width: 100%; margin: 12px 0; }
  .markdown-html {
    p, .h5-p { margin: 0.6em 0; }
    h1, h2, h3, h4, h5, h6,
    .h5-h1, .h5-h2, .h5-h3, .h5-h4, .h5-h5, .h5-h6 { font-weight: bold; margin: 1em 0 0.5em; line-height: 1.4; }
    h1, .h5-h1 { font-size: 1.6em; }
    h2, .h5-h2 { font-size: 1.4em; }
    h3, .h5-h3 { font-size: 1.2em; }
    ul, ol, .h5-ul, .h5-ol { padding-left: 1.5em; margin: 0.6em 0; }
    ul, .h5-ul { list-style: disc; }
    ol, .h5-ol { list-style: decimal; }
    li, .h5-li { display: list-item; }
    blockquote, .h5-blockquote { margin: 0.6em 0; padding-left: 12px; border-left: 3px solid #888; color: var(--text-desc-color); }
    pre, .h5-pre { display: block; overflow-x: auto; white-space: pre; padding: 12px; border-radius: 6px; background: var(--reply-bg-color); }
    code, .h5-code { font-family: monospace; padding: 0 3px; background: var(--reply-bg-color); }
    pre code, .h5-pre .h5-code { white-space: pre; padding: 0; }
    a, .h5-a { color: #1890ff; text-decoration: underline; }
    img, .h5-img { max-width: 100%; vertical-align: middle; }
    img.emoji, .h5-img.emoji { width: 32px; height: 32px; }
    strong, b, .h5-strong, .h5-b { font-weight: bold; }
    em, i, .h5-em, .h5-i { font-style: italic; }
    del, s, .h5-del, .h5-s { text-decoration: line-through; }
    hr, .h5-hr { margin: 1em 0; border: 0; border-top: 1px solid #888; }
  }
}
</style>
