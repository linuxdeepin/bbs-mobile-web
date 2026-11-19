<template>
  <nut-config-provider :theme="config.theme" class="dialog-page">
    <NavH5 title="发私信" />
    <view class="dialog-content" v-if="!loading" v-for="letter in letters">
      <view class="time">
        {{ formatTime(letter.created_at) }}
      </view>
      <view class="message-box" :class="{ mine_box: letter?.from_id !== receiveUserId }">
        <!-- 头像 -->
        <view class="avatar">
          <nut-avatar size="40" shape="round">
            <img :src="letter.send_user_avatar" />
          </nut-avatar>
        </view>
        <!-- 消息内容气泡 -->
        <MarkdownContent class="message-content" :class="{ mine_content: letter?.from_id !== receiveUserId }"
          :content="letter.note" />
      </view>
    </view>
    <view v-else>
      <view class="skeleton-container">
        <nut-skeleton width="70vw" height="20px" title animated avatar avatarSize="60px" row="10">
        </nut-skeleton>

        <view class="skeleton-container" v-for=" in [1, 2, 3, 4, 5, 6, 7]">
          <nut-skeleton width="70vw" height="20px" title animated avatar avatarSize="40px" row="2">
          </nut-skeleton>
        </view>
      </view>
    </view>
    <!-- 私信回复框 -->
    <nut-row v-if="!loading">
      <nut-col span="20" offset="2">
        <view class="markdown-composer-entry" @click="editorVisible = true">
          <text class="markdown-composer-entry-text">{{ message.trim() || '写一条私信…' }}</text>
          <nut-button size="small" type="primary" @click.stop="editorVisible = true">写私信</nut-button>
        </view>
        <MarkdownComposer v-model:visible="editorVisible" title="写私信" :busy="sending">
        <view class="reply-box">
          <nut-form>
            <nut-form-item class="markdown-editor-form">
                <MarkdownEditor ref="editor" v-model="message" :disabled="sending" :focus="editorVisible" />
              <view class="form-item">
                <img class="emoji-btn" :src="showEmojiList ? KeyboardIcon : SmileIcon"
                  @click="!sending && (showEmojiList = !showEmojiList)" />
                <!-- 发送图片按钮 -->
                <img class="img-btn" :src="Picture" @click="sendImg" />
                <nut-button @click="sendMessage" type="primary" size="small"
                  :loading="sending" :disabled="sending || !message.trim()">发送</nut-button>
              </view>
            </nut-form-item>
          </nut-form>
          <view v-if="showEmojiList">
            <nut-tabs v-model="tabEmojiValue" swipeable type="smile">
              <nut-tab-pane title="小浣熊" pane-key="0">
                <view class="image-list">
                  <view class="image-item" v-for="( emoji, name ) of  customEmoji" @click="clickImage(name)">
                    <img :alt="name" :src="apiServer + '/' + emoji">
                  </view>
                  <view class="image-item" v-for=" _ of Array(10).fill(0) "></view>
                </view>
              </nut-tab-pane>
              <nut-tab-pane title="Emoji" pane-key="1">
                <view class="emoji-list">
                  <view class="emoji-item" v-for=" emoji of unicodeEmoji " @click="!sending && editor?.insertText(emoji)">
                    {{ emoji }}
                  </view>
                  <view class="emoji-item" v-for=" _ of Array(10).fill(0) "></view>
                </view>
              </nut-tab-pane>
            </nut-tabs>
            <view></view>
          </view>
        </view>
        </MarkdownComposer>
      </nut-col>
    </nut-row>
    <nut-toast :msg="prompt.toast.msg" v-model:visible="prompt.toast.visible" :type="prompt.toast.type"
      :duration="prompt.toast.duration" />
  </nut-config-provider>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick, onBeforeUnmount } from "vue";
import Taro, { getCurrentInstance } from "@tarojs/taro";
import { Letter, apiServer, SendLetter } from "@/api";
import { computedAsync } from "@vueuse/core";
import SmileIcon from '@/assets/smile.svg'
import KeyboardIcon from '@/assets/keyboard-26.svg'
import Picture from '@/assets/picture.svg'
import { useAccountStore, usePromptStore, useConfigStore } from "@/stores";
import { formatTime } from "@/utils/format"
import unicodeEmoji from '@/pages/thread/unicodeEmoji.json'
import customEmoji from '@/pages/thread/customEmoji.json'
import NavH5 from '@/widgets/navigation-h5.vue'
import MarkdownContent from '@/widgets/markdown-content.vue'
import MarkdownEditor from '@/widgets/markdown-editor.vue'
import MarkdownComposer from '@/widgets/markdown-composer.vue'
import { createMessage } from '@/utils/markdown'
import { uploadImage, MAX_IMAGE_SIZE } from '@/utils/upload'
import { requestErrorMessage } from '@/utils/errors'

const account = useAccountStore()
const prompt = usePromptStore()
const config = useConfigStore()
const loading = ref(true);
const instance = getCurrentInstance();
const receiveUserId = ref(0);
if (instance.router) {
  receiveUserId.value = Number(instance.router.params.uid || 0);
}
const letters = computedAsync(async () => {
  const { data } = await Letter({ id: receiveUserId.value, isRefresh: 0, sort: 0, offset: 0 })
  return data.data || []
}, [], { evaluating: loading })
const message = ref('')
const editorVisible = ref(false)
const sending = ref(false)
const editor = ref<{ insertText(text: string): void }>()
const showEmojiList = ref(false)
const tabEmojiValue = ref(0)

const appendLetter = async (msg: string) => {
  const { data } = await SendLetter({ id: receiveUserId.value, msg })
  if (data.code !== 0) throw new Error(data.msg || '发送失败')
  letters.value.push({
    ...data.data,
    created_at: new Date().toISOString(),
    note: msg,
    from_id: account.user_info.id,
    send_user_avatar: account.user_info.avatar,
  })
  showEmojiList.value = false
  await nextTick()
  Taro.createSelectorQuery().select('.dialog-page').boundingClientRect().exec(result => {
    if (result[0]) Taro.pageScrollTo({ scrollTop: result[0].height, duration: 300 })
  })
}

const sendMessage = async () => {
  if (sending.value || !message.value.trim()) return
  const draft = message.value
  sending.value = true
  try {
    await appendLetter(createMessage(draft))
    if (message.value === draft) {
      message.value = ''
      editorVisible.value = false
    }
  } catch (error) {
    prompt.showToast('fail', requestErrorMessage(error, '发送失败，请稍后重试'))
  } finally {
    sending.value = false
    }
  }

const sendImg = async () => {
  if (sending.value) return
  sending.value = true
  try {
    const result = await Taro.chooseImage({ count: 1, sizeType: ['compressed'], sourceType: ['album', 'camera'] })
    if (result.tempFiles.some(file => file.size > MAX_IMAGE_SIZE)) throw new Error('图片大小不能超过2M')
    prompt.showToast('loading', '图片发送中…', 0)
    const url = await uploadImage(result.tempFilePaths[0])
    await appendLetter(createMessage('', [url]))
    prompt.showToast('success', '发送成功')
  } catch (error) {
    if (!String(error?.errMsg || '').includes('cancel')) {
      prompt.showToast('fail', requestErrorMessage(error, '图片发送失败，请稍后重试'))
  }
  } finally {
    sending.value = false
  }
}

const clickImage = (name: string) => {
  if (!sending.value) editor.value?.insertText(` :${name}: `)
}

let initialScrollTimer: ReturnType<typeof setTimeout> | undefined
onBeforeUnmount(() => clearTimeout(initialScrollTimer))
watch(letters, (_, old) => {
  // 首次加载滚动到底部
  if (!old.length) {
    // 因为图片加载缓慢，在图片加载完前获取的高度不准确，延迟1秒再滚动
    initialScrollTimer = setTimeout(() => {
      Taro.createSelectorQuery().select('.dialog-page').boundingClientRect().exec((res) => {
        if (!res[0]) return
        Taro.pageScrollTo({
          scrollTop: res[0].height,
          duration: 300
        })
      })
    }, 1000)
    return
  }
})

</script>

<style lang="scss">
.dialog-page {
  width: 100%;
  padding-bottom: 20Px;

  .dialog-content {
    display: flex;
    flex-direction: column;
    padding: 20rpx;

    .time {
      text-align: center;
      color: #999;
      font-size: 24rpx;
      margin: 20rpx;
    }

    .message-box {
      display: flex;
      align-items: center;

      .message-content {
        margin-left: 10px;
        max-width: 80%;
        background: #f4f4f4;
        border-radius: 4px;
        color: rgba(0, 0, 0, 0.85);
        padding: 10px;
        word-break: break-all;
        display: inline-block;

        .h5-a {
          color: #1890ff;
        }

        &.mine_content {
          background: #3266fb;
          color: #fff;
          text-align: right;
          margin-left: 0;
          margin-right: 10px;
        }
      }

    }

    .mine_box {
      flex-direction: row-reverse;
    }
  }

  .reply-box {
    background: var(--page-bg-color);

    form {
      margin-top: 0;
      margin-bottom: 0;
    }

    .form-item {
      display: flex;
      gap: 20rpx;
      color: black;
      align-items: flex-end;
      padding-top: 6Px;
      .nut-button { margin-left: auto; }

      .emoji-btn,
      .img-btn {
        width: 2rem;
        height: 2rem;
      }

      .send-btn {
        height: 2rem;
      }
    }
  }

  .nut-tab-pane {
    background: var(--emoji-pane-bg-color);
  }

  .emoji-list,
  .image-list {
    overflow: auto;
    max-height: 20vh;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
  }

  // 标准emoji表情
  .emoji-item {
    font-size: 1.5rem;
    width: 2.5rem;
  }

  // 小浣熊表情
  .image-item {
    width: 3.5rem;

    img {
      width: 3rem;
      height: 3rem;
    }
  }

  .skeleton-container {
    margin-top: 20px;
    margin-left: 5vw;
    margin-bottom: 50px;
  }
}
</style>