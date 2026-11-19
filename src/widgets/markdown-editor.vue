<template>
  <view class="markdown-editor">
    <view class="markdown-toolbar">
      <scroll-view class="markdown-tool-scroll" :scroll-x="true">
        <view class="markdown-tools">
          <nut-button v-for="tool in tools" :key="tool.label" class="markdown-tool" :disabled="disabled || preview"
            size="mini" @mousedown.prevent @click="applyTool(tool)">{{ tool.label }}</nut-button>
        </view>
      </scroll-view>
      <nut-button class="markdown-tool markdown-preview-toggle" size="mini" :disabled="disabled"
        @click="preview = !preview">{{ preview ? '编辑' : '预览' }}</nut-button>
    </view>
    <view v-if="preview" class="markdown-preview" :style="{ minHeight: minHeight + 'px' }">
      <MarkdownContent v-if="modelValue.trim()" :content="modelValue" format="markdown" />
      <text v-else class="markdown-placeholder">输入内容后可预览</text>
    </view>
    <textarea v-else class="markdown-textarea" :value="modelValue" :placeholder="placeholder"
      :disabled="disabled" :maxlength="maxLength" :focus="focused" :selection-start="selectionStart"
      :selection-end="selectionEnd" :cursor="cursor" :show-confirm-bar="false" :hold-keyboard="true"
      :cursor-spacing="24" :style="{ height: textareaHeight + 'px' }" @input="onInput" @blur="onBlur"
      @select="rememberCursor" @keyup="rememberCursor" @click="rememberCursor"
      @linechange="onLineChange" />
    <view v-if="!preview && modelValue.trim()" class="markdown-live-preview">
      <view class="markdown-live-heading">
        <text>实时预览</text>
        <nut-button class="markdown-tool" size="mini" @click="livePreview = !livePreview">
          {{ livePreview ? '收起' : '展开' }}
        </nut-button>
      </view>
      <scroll-view v-if="livePreview" class="markdown-live-content" :scroll-y="true">
        <MarkdownContent :content="previewDraft" format="markdown" :interactive="false" />
      </scroll-view>
    </view>
    <view class="markdown-editor-footer">
      <text>支持 Markdown · 表格、代码、链接</text>
      <text>{{ Array.from(modelValue).length }}/{{ maxLength }}</text>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue';
import Taro from '@tarojs/taro';
import MarkdownContent from './markdown-content.vue';
import { insertMarkdown } from '@/utils/markdown-edit';

const props = withDefaults(defineProps<{
  modelValue: string;
  disabled?: boolean;
  focus?: boolean;
  maxLength?: number;
  minHeight?: number;
  placeholder?: string;
}>(), { disabled: false, focus: false, maxLength: 1000, minHeight: 80, placeholder: '说点什么吧，支持 Markdown…' });
const emit = defineEmits<{ 'update:modelValue': [string]; resize: [] }>();
const preview = ref(false);
const livePreview = ref(true);
const previewDraft = ref(props.modelValue);
let previewTimer: ReturnType<typeof setTimeout> | undefined;
const focused = ref(props.focus);
const cursor = ref(-1);
const selectionStart = ref(-1);
const selectionEnd = ref(-1);
const editorHeight = ref(props.minHeight);
const textareaHeight = computed(() => livePreview.value && props.modelValue.trim()
  ? Math.min(editorHeight.value, Math.max(props.minHeight, 160))
  : editorHeight.value);
let start = props.modelValue.length;
let end = start;

interface Tool { label: string; before: string; after?: string; placeholder?: string }
const tools: Tool[] = [
  { label: '加粗', before: '**', after: '**', placeholder: '文字' },
  { label: '标题', before: '\n## ', after: '\n', placeholder: '标题' },
  { label: '列表', before: '\n- ', after: '\n', placeholder: '列表项' },
  { label: '引用', before: '\n> ', after: '\n', placeholder: '引用内容' },
  { label: '链接', before: '[', after: '](https://)', placeholder: '链接文字' },
  { label: '代码', before: '\n\n```\n', after: '\n```\n', placeholder: '代码' },
  { label: '表格', before: '\n\n| 列一 | 列二 |\n| --- | --- |\n| 内容 | 内容 |\n' },
];

function rememberCursor(event: any) {
  const position = event.detail?.cursor;
  start = event.target?.selectionStart ?? (typeof position === 'number' ? position : props.modelValue.length);
  end = event.target?.selectionEnd ?? start;
}
function onInput(event: any) {
  rememberCursor(event);
  emit('update:modelValue', event.detail?.value ?? event.target?.value ?? '');
}
function onBlur(event: any) {
  rememberCursor(event);
  focused.value = false;
}
function onLineChange(event: any) {
  editorHeight.value = Math.max(props.minHeight, Math.min(260, (event.detail?.lineCount || 1) * 24));
  emit('resize');
}
async function applyTool(tool: Tool) {
  if (props.disabled) return;
  const edit = insertMarkdown(props.modelValue, start, end, tool.before, tool.after, tool.placeholder);
  if (Array.from(edit.value).length > props.maxLength) {
    Taro.showToast({ title: `最多输入${props.maxLength}字`, icon: 'none' });
    return;
  }
  focused.value = false;
  emit('update:modelValue', edit.value);
  start = edit.start;
  end = edit.end;
  preview.value = false;
  await nextTick();
  cursor.value = edit.end;
  selectionStart.value = edit.start;
  selectionEnd.value = edit.end;
  focused.value = true;
}
function insertText(text: string) {
  return applyTool({ label: '', before: text });
}
watch(() => props.focus, value => { focused.value = value; });
watch([preview, livePreview, previewDraft], () => emit('resize'), { flush: 'post' });
watch(() => props.modelValue, value => {
  clearTimeout(previewTimer);
  if (!value.trim()) {
    previewDraft.value = value;
    emit('resize');
  } else {
    previewTimer = setTimeout(() => { previewDraft.value = value; }, 120);
  }
  if (!value) {
    start = end = 0;
    editorHeight.value = props.minHeight;
    cursor.value = selectionStart.value = selectionEnd.value = -1;
  }
}, { flush: 'post' });
onBeforeUnmount(() => clearTimeout(previewTimer));
defineExpose({ insertText });
</script>

<style lang="scss">
.markdown-editor-form .nut-form-item__body,
.markdown-editor-form .nut-form-item__body__slots {
  min-width: 0;
}
.markdown-editor {
  box-sizing: border-box;
  min-width: 0;
  width: 100%;
  border: 1px solid var(--placeholder-color);
  border-radius: 6px;
  overflow: hidden;
  background: var(--send-post-textarea-bg-color);
  color: var(--text-color);

  .markdown-toolbar { display: flex; align-items: center; width: 100%; background: var(--reply-bg-color); }
  .markdown-tool-scroll { flex: 1; min-width: 0; width: 0; }
  .markdown-tools { display: inline-flex; align-items: center; white-space: nowrap; padding: 4Px; gap: 4Px; }
  .markdown-tool { display: inline-flex; flex-shrink: 0; margin: 0; padding: 2Px 8Px; min-height: 28Px; line-height: 24Px; font-size: 12Px; background: transparent; color: var(--text-color); border: 0; }
  .markdown-tool::after { border: none; }
  .markdown-tool[disabled] { color: var(--placeholder-color); }
  .markdown-preview-toggle { color: #1890ff; margin: 0 4Px; }
  .markdown-textarea { box-sizing: border-box; width: 100%; padding: 8Px; line-height: 24Px; font-size: 14Px; background: transparent; color: inherit; }
  .markdown-preview { box-sizing: border-box; max-height: 300Px; overflow-y: auto; padding: 8Px; font-size: 14Px; }
  .markdown-live-preview { border-top: 1px solid var(--placeholder-color); }
  .markdown-live-heading { display: flex; justify-content: space-between; align-items: center; padding: 0 8Px; min-height: 28Px; color: var(--text-desc-color); font-size: 11Px; }
  .markdown-live-content { box-sizing: border-box; width: 100%; height: 150Px; font-size: 14Px; }
  .markdown-live-content .markdown-content { box-sizing: border-box; padding: 0 8Px 8Px; }
  .markdown-placeholder { color: var(--placeholder-color); }
  .markdown-editor-footer { display: flex; justify-content: space-between; padding: 4Px 8Px; font-size: 10Px; color: var(--text-desc-color); }
}
</style>
