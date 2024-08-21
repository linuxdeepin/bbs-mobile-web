<template>
  <view class="dialog-page">
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
        <view class="message-content" :class="{ mine_content: letter?.from_id !== receiveUserId }" v-html="letter.note"
          @click="htmlClick($event)">
        </view>
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
        <view class="reply-box">
          <nut-form>
            <nut-form-item>
              <view class="form-item">
                <view class="msg-input" :style="{ height: inputHeight + 0.5 + 'rem' }">
                  <textarea v-model="message" placeholder="说点什么吧..."
                    :style="{ marginTop: '0.5rem', height: inputHeight + 'rem' }" maxlength="1000"
                    show-confirm-bar="false" hold-keyboard="true" cursor-spacing="20" @linechange="lineChange" />
                </view>
                <img class="emoji-btn" :src="showEmojiList ? KeyboardIcon : SmileIcon"
                  @click="showEmojiList = !showEmojiList" />
                <!-- 发送图片按钮 -->
                <img class="img-btn" :src="Picture" @click="sendImg" />
                <nut-button @click="sendMessage" type="primary" size="small"
                  :disabled="message.length == 0">发送</nut-button>
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
                  <view class="emoji-item" v-for=" emoji of unicodeEmoji " @click="message += emoji">
                    {{ emoji }}
                  </view>
                  <view class="emoji-item" v-for=" _ of Array(10).fill(0) "></view>
                </view>
              </nut-tab-pane>
            </nut-tabs>
            <view></view>
          </view>
        </view>
      </nut-col>
    </nut-row>
    <nut-toast :msg="prompt.toast.msg" v-model:visible="prompt.toast.visible" :type="prompt.toast.type"
      :duration="prompt.toast.duration" />
  </view>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from "vue";
import Taro, { getCurrentInstance } from "@tarojs/taro";
import { Element } from '@tarojs/runtime/dist/dom-external/inner-html/parser';
import { TaroElement } from '@tarojs/runtime';
import { TaroEvent } from '@tarojs/components';
import { Letter, apiServer, SendLetter, LetterResponse } from "@/api";
import { computedAsync } from "@vueuse/core";
import SmileIcon from '@/assets/smile.svg'
import KeyboardIcon from '@/assets/keyboard-26.svg'
import Picture from '@/assets/picture.svg'
import { useAccountStore, usePromptStore } from "@/stores";
import { formatTime } from "@/utils/format"
import unicodeEmoji from '@/pages/thread/unicodeEmoji.json'
import customEmoji from '@/pages/thread/customEmoji.json'
import NavH5 from '@/widgets/navigation-h5.vue'

const account = useAccountStore()
const prompt = usePromptStore()
const loading = ref(true);
const instance = getCurrentInstance();
const receiveUserId = ref(0);
if (instance.router) {
  receiveUserId.value = Number(instance.router.params.uid || 0);
  console.log("receiveUserId", receiveUserId.value);
}
const letters = ref<LetterResponse["data"]>([])
computedAsync(async () => {
  const res = await Letter({ id: receiveUserId.value, isRefresh: 0, sort: 0, offset: 0 });
  if (res.data.data !== null)
    letters.value = res.data.data;
}, undefined, { evaluating: loading });
const option = (Taro as any).options
const imageUrls = [] as string[]
const message = ref("")
const showEmojiList = ref(false)
const tabEmojiValue = ref(0)

const sendMessage = async () => {
  console.log("send message ", message.value)
  let val = message.value
  if (val.includes(":")) {
    for (const name of Object.keys(customEmoji)) {
      const reg = new RegExp(`:${name}:`, "g")
      const img = `<img class="emoji" title="${name}" src="${customEmoji[name]}" alt="${name}">`
      val = val.replace(reg, img)
    }
  }
  let msg = `<p>${val}</p>`
  const { data } = await SendLetter({ id: receiveUserId.value, msg: msg })
  if (!data.code) {
    const content = data.data;
    content.created_at = new Date().toISOString();
    content.note = msg
    content.from_id = account.user_info.id
    content.send_user_avatar = account.user_info.avatar
    content.receive_user_avatar = account.user_info.avatar
    letters.value.push(content)
    message.value = ""
    showEmojiList.value = false
    Taro.createSelectorQuery().select('.dialog-page').boundingClientRect().exec((res) => {
      Taro.pageScrollTo({
        scrollTop: res[0].height,
        duration: 300
      })
    })
  }
}

const sendImg = () => {
  console.log("send image")
  Taro.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      console.log("choose image", res)
      const tempFilePaths = res.tempFilePaths
      // 图片大小不能超过2M
      if (res.tempFiles[0].size > 2 * 1024 * 1024) {
        prompt.showToast("fail", "图片大小不能超过2M")
        return
      }
      Taro.uploadFile({
        url: apiServer + '/api/v1/thread/file',
        filePath: tempFilePaths[0],
        name: 'image',
        header: {
          "Cookie": "bbs=" + JSON.parse(Taro.getStorageSync("PAGE_COOKIE"))["taro.com"]["/"]["bbs"]['value']
        },
        formData: {
          "image": tempFilePaths[0]
        },
        success: async (res) => {
          console.log("upload image", res)
          const uploadResData = JSON.parse(res.data)
          // 获取到上传之后的图片地址
          const imgUrl = uploadResData.data[0]
          // 拼接成消息格式
          const msg = `<p><img src='${imgUrl}' style='max-width: 100%' /></p>`
          // 发送图片消息
          const { data } = await SendLetter({ id: receiveUserId.value, msg: msg })
          if (!data.code) {
            const content = data.data;
            content.created_at = new Date().toISOString();
            content.note = msg
            content.from_id = account.user_info.id
            content.send_user_avatar = account.user_info.avatar
            content.receive_user_avatar = account.user_info.avatar
            letters.value.push(content)
            showEmojiList.value = false
            setTimeout(() => {
              Taro.createSelectorQuery().select('.dialog-page').boundingClientRect().exec((res) => {
                Taro.pageScrollTo({
                  scrollTop: res[0].height,
                  duration: 300
                })
              })
            }, 1000)
          }
        },
        fail: err => {
          console.log("upload image fail", err)
          prompt.showToast("fail", "上传图片失败")
        }
      })
    }

  })
}

option.html.transformElement = (el: TaroElement, h5el: Element) => {
  el.setAttribute('data-tag', h5el.tagName)
  switch (el.nodeName) {
    case "image":
      // 图片高度自动缩放
      el.setAttribute('mode', 'widthFix')

      const src = el.getAttribute("src")
      if (!src) {
        break
      }
      // 表情图片拼接服务器地址
      if (src.startsWith("/assets") || src.startsWith("assets")) {
        el.setAttribute('src', apiServer + "/" + src)
        el.style.setProperty('width', '40px')
        el.style.setProperty('height', '40px')
        break
      }

      // 小程序图片不会自动显示宽度，在图片加载后设置图片显示真实宽度，超出屏幕的图片有样式中的 max-width 限制
      el.addEventListener("load", (event: TaroEvent<HTMLImageElement>) => {
        el.style.setProperty('width', event.detail.width + "px")
        imageUrls.push(src)
      }, null)

      // 图片点击预览
      el.addEventListener("tap", () => {
        console.log("preview image", imageUrls)
        Taro.previewImage({
          current: src,
          urls: imageUrls
        })
      }, null)
      break
  }
  return el
}

// 渲染内容点击，在小程序中处理超链接
function htmlClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  const dataset = target.dataset
  console.log("html click", { event, dataset })
  // 是html超链接被点击
  if (dataset["tag"] === "a") {
    const href = target.dataset["href"] || ''
    // 如果是点击的帖子链接，在小程序跳转，否则就复制链接
    if (href.includes("deepin.org")) {
      const result = href.match(/\/post\/(\d+)$/)
      if (result?.length == 2) {
        Taro.navigateTo({
          url: `/pages/thread/thread?id=${result[1]}`,
        })
        return
      }
    }
    Taro.setClipboardData({ data: href })
  }
}

const clickImage = (name: string) => {
  message.value += ` :${name}: `
}

const lineCount = ref(1)
const lineChange = (event: { detail: { lineCount: number, lineHeight: number } }) => {
  console.log(event.detail)
  lineCount.value = event.detail.lineCount
}

const inputHeight = computed(() => {
  const lineNumber = lineCount.value
  if (lineNumber <= 1) {
    return 1.5
  }
  if (lineNumber > 10) {
    return 12
  }
  return lineNumber * 1.2
})

watch(letters, (_, old) => {
  // 首次加载滚动到底部
  if (!old.length) {
    // 因为图片加载缓慢，在图片加载完前获取的高度不准确，延迟1秒再滚动
    setTimeout(() => {
      Taro.createSelectorQuery().select('.dialog-page').boundingClientRect().exec((res) => {
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
  padding-bottom: 20vw;

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
    position: fixed;
    bottom: 0;
    width: 92vw;
    left: 4vw;
    background-color: #fff;

    form {
      margin-top: 0;
      margin-bottom: 0;
    }

    .form-item {
      display: flex;
      gap: 20rpx;
      color: black;
      align-items: flex-end;

      .msg-input {
        flex: 1;

        textarea {
          width: 100%;
        }
      }

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