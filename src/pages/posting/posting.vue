<template>
  <nut-config-provider :theme="config.theme" class="posting-page">
    <!-- 网易易盾验证码，小程序插件引入 -->
    <ne-captcha :id="postCaptcha.elementID" :captcha-id="postCaptcha.captchaID" width="640rpx"
      @verify="postCaptcha.verify">
    </ne-captcha>
    <nut-cell-group>
      <!-- 选择版块 -->
      <nut-cell :title="selectedForum?.name || '选择版块'" is-link @click="showForumSelection = true"></nut-cell>
      <!-- 主题类型 -->
      <nut-cell :title="selectedThemeType?.name || '主题类型'" is-link @click="themeTypeCellClicked">
      </nut-cell>
    </nut-cell-group>
    <nut-cell-group>
      <!-- 主题标题 -->
      <nut-cell>
        <nut-input v-model="postingTitle" :disabled="submitting" :border="false" :max-length="30" placeholder="请输入帖子标题，2~30字" />
      </nut-cell>

      <!-- 主题内容 -->
      <MarkdownEditor v-model="postingContent" :disabled="submitting" :max-length="THREAD_MAX_LENGTH"
        :min-height="180" placeholder="请输入帖子内容，支持 Markdown" />

      <!-- 选择图片 -->
      <nut-cell>
        <nut-uploader :disabled="submitting" :auto-upload="false" v-model:file-list="imgFileList" :maximize="MAX_IMAGE_SIZE"
          :maximum="9" :size-type="['compressed']" :media-type="['image']" @change="fileListChange"></nut-uploader>
      </nut-cell>

      <!-- 发布按钮 -->
      <view class="submit-btn">
        <nut-button type="primary" block :loading="submitting" :disabled="submitting || cooldownSeconds > 0"
          @click="submitPosting">{{ cooldownSeconds ? `${cooldownSeconds}秒后发布` : '发布帖子' }}</nut-button>
      </view>
    </nut-cell-group>
    <!-- 选择版块弹窗 -->
    <nut-popup v-model:visible="showForumSelection" round position="bottom" :style="{ height: '50%' }"
      safe-area-inset-bottom pop-class="forum-popup">
      <nut-tabs v-model="activeForumTab" title-scroll style="height: 100%" direction="vertical">
        <!-- 渲染全部版块 -->
        <nut-tab-pane title="全部" paneKey="全部">
          <!-- 外层遍历forumList -->
          <template v-for="forum in forumList">
            <nut-cell-group>
              <template #title>
                <view class="cell-group-title">{{ forum.name }}</view>
              </template>
              <!-- 内层遍历forum[] -->
              <template v-for="subForum in forum.forum">
                <nut-cell :title="subForum.name" center is-link @click="forumClicked(subForum.id, subForum.name)">
                  <template #icon>
                    <nut-avatar shape="square"><img :src="subForum.icon" /></nut-avatar>
                  </template>
                  <!-- 取消右侧箭头 -->
                  <template #link>
                    <view></view>
                  </template>
                </nut-cell>
              </template>
            </nut-cell-group>
          </template>
        </nut-tab-pane>
        <!-- 按分类渲染版块 -->
        <template v-for="forum in forumList" :key="forum.name">
          <nut-tab-pane :title="forum.name" :paneKey="forum.name">
            <nut-cell-group>
              <template #title>
                <view class="cell-group-title">{{ forum.name }}</view>
              </template>
              <!-- 内层遍历forum[] -->
              <template v-for="subForum in forum.forum">
                <nut-cell :title="subForum.name" center is-link @click="forumClicked(subForum.id, subForum.name)">
                  <template #icon>
                    <nut-avatar shape="square"><img :src="subForum.icon" /></nut-avatar>
                  </template>
                  <!-- 取消右侧箭头 -->
                  <template #link>
                    <view></view>
                  </template>
                </nut-cell>
              </template>
            </nut-cell-group>
          </nut-tab-pane>
        </template>
      </nut-tabs>
    </nut-popup>
    <nut-popup v-model:visible="showThemeTypeSelection" round position="bottom" class="theme-popup"
      :style="{ height: '50%' }" safe-area-inset-bottom>
      <nut-cell-group>
        <template #title>
          <view class="cell-group-title">请选择主题类型</view>
        </template>
        <!-- 内层遍历forum[] -->
        <template v-for="theme in themeTypeList">
          <nut-cell :title="theme.name" center is-link @click="themeTypeClicked(theme.id, theme.name)">
            <!-- 取消右侧箭头 -->
            <template #link>
              <view></view>
            </template>
          </nut-cell>
        </template>
      </nut-cell-group>
    </nut-popup>
    <nut-toast :msg="prompt.toast.msg" v-model:visible="prompt.toast.visible" :type="prompt.toast.type"
      :duration="prompt.toast.duration" />
  </nut-config-provider>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import Taro, { useLoad } from '@tarojs/taro';
import { GetForum, GetTheme, ThemeResponse, PostingThread } from '@/api'
import { computedAsync, useTimestamp, until } from '@vueuse/core';
import { usePromptStore, useAccountStore, useConfigStore } from '@/stores';
import { setMessageCount } from '@/utils/message';
import MarkdownEditor from '@/widgets/markdown-editor.vue';
import { createMessage } from '@/utils/markdown';
import { uploadImage, MAX_IMAGE_SIZE } from '@/utils/upload';
import { submissionGuard, submissionFingerprint, THREAD_MAX_LENGTH } from '@/utils/submission';
import { requestErrorMessage } from '@/utils/errors';

const prompt = usePromptStore()
const account = useAccountStore()
const config = useConfigStore()
const postCaptcha = account.useSmartCaptcha()

useLoad(async () => {
  await until(() => account.loaded).toBe(true)
  // 如果用户未登录，跳转到登录页
  if (!account.is_login) {
    account.gotoLogin()
    return
  }
  setMessageCount()
})

// 选择版块
const selectedForum = ref({ id: 0, name: '' })
const showForumSelection = ref(false)
const activeForumTab = ref('全部')
const forumList = computedAsync(async () => {
  const res = await GetForum()
  return res.data
})
// 选择主题类型
const selectedThemeType = ref({ id: 0, name: '' })
const showThemeTypeSelection = ref(false)
const themeTypeList = ref<ThemeResponse[]>()
// 主题
const postingTitle = ref('')
// 内容
const postingContent = ref('')
const imgFileList = ref<FileItem[]>([])
const submitting = ref(false)
const clock = useTimestamp({ interval: 1000 })
const cooldownSeconds = computed(() => submissionGuard.remainingSeconds(account.user_info.id, clock.value))

// 新增文件事件
const fileListChange = (fileList: { fileList: FileItem[] }, _) => {
  // 将文件状态都修改为success
  fileList.fileList.forEach((file) => {
    file.status = 'success'
  })
  imgFileList.value = fileList.fileList
}

// Validate before the captcha, then recheck the guard when the actual request starts.
const submitPosting = async () => {
  if (submitting.value) return
  if (!account.is_login) { account.gotoLogin(); return }
  const draft = {
    forumId: selectedForum.value.id,
    typeId: selectedThemeType.value.id,
    title: postingTitle.value.trim(),
    text: postingContent.value,
    images: imgFileList.value.map(file => file.url),
    userId: account.user_info.id,
  }
  const fingerprint = submissionFingerprint(`thread:${draft.forumId}:${draft.typeId}:${draft.title}`, draft.text, draft.images)
  try {
    if (!draft.forumId) throw new Error('请选择版块')
    if (!draft.typeId) throw new Error('请选择主题类型')
    const length = Array.from(draft.title).length
    if (length < 2 || length > 30) throw new Error('标题为2～30字')
    if (!draft.text.trim() && !draft.images.length) throw new Error('内容不能为空')
    if (Array.from(draft.text).length > THREAD_MAX_LENGTH) throw new Error(`内容不能超过${THREAD_MAX_LENGTH}字`)
    if (draft.images.length > 9) throw new Error('最多添加9张图片')
    submissionGuard.check(draft.userId, fingerprint)
    await postCaptcha.tryVerify(async (captchaCode: string) => {
      if (submitting.value) return
      let finish: ((success: boolean) => void) | undefined
      try {
        if (!account.is_login || account.user_info.id !== draft.userId) throw new Error('请重新登录后发布')
        finish = submissionGuard.begin(draft.userId, fingerprint)
        submitting.value = true
        prompt.showToast('loading', draft.images.length ? '图片上传中…' : '发布中…', 0)
        const urls: string[] = []
        for (const file of draft.images) urls.push(await uploadImage(file))
        const { data } = await PostingThread({
          captcha_id: captchaCode,
          forum_id: draft.forumId,
          message: createMessage(draft.text, urls),
          subject: draft.title,
          type_id: draft.typeId,
          user_id: draft.userId,
        })
        if (data.code !== 0) throw new Error(data.code === 4000 ? '您已经被禁言' : data.msg || '发布失败')
        finish(true)
        if (postingTitle.value.trim() === draft.title) postingTitle.value = ''
        if (postingContent.value === draft.text) postingContent.value = ''
        imgFileList.value = imgFileList.value.filter(file => !draft.images.includes(file.url))
        config.indexNeedRefresh = true
        prompt.showToast('success', '发布成功')
        await Taro.navigateTo({ url: `/pages/thread/thread?id=${data.data.id}&posting=1` }).catch(() => {
          prompt.showToast('text', '帖子已发布，请在“我的主题”中查看')
        })
      } catch (error) {
        prompt.showToast('fail', requestErrorMessage(error, '发布失败，请稍后再试'))
      } finally {
        finish?.(false)
        submitting.value = false
          }
        })
  } catch (error) {
    prompt.showToast('warn', error instanceof Error ? error.message : '验证失败，请重试')
        }
}

const forumClicked = (id: number, name: string) => {
  selectedForum.value = { id, name }
  showForumSelection.value = false
  selectedThemeType.value = { id: 0, name: '' }
}
// 点击主题类型
const themeTypeCellClicked = () => {
  if (!selectedForum.value.id) {
    prompt.showToast('warn', '请先选择版块')
    return
  }
  showThemeTypeSelection.value = true
}
// 选择主题类型
const themeTypeClicked = (id: number, name: string) => {
  selectedThemeType.value = { id, name }
  showThemeTypeSelection.value = false
}
// Ignore an older forum's theme response after switching forums.
watch(() => selectedForum.value.id, async (id, _, onCleanup) => {
  let cancelled = false
  onCleanup(() => { cancelled = true })
  themeTypeList.value = []
  if (!id) return
  try {
    const { data } = await GetTheme({ forum_id: id })
    if (!cancelled) themeTypeList.value = data
  } catch {
    if (!cancelled) prompt.showToast('fail', '主题类型加载失败，请重新选择版块')
  }
})

interface FileItem {
  status: string;
  uid: string;
  name: string;
  url: string;
  formData: any;
  percentage: number;
}
</script>

<style lang="scss">
.posting-page {
  padding: 5rpx 10rpx 0 10rpx;

  .nut-input {
    padding: 20rpx 0;
  }

  .nut-tab-pane {
    padding: 10rpx;
    padding-top: 20rpx;
  }

  .cell-group-title {
    margin: 10rpx 0;
    padding: 0 10rpx;
    font-weight: 700;
  }

  .forum-popup {

    .nut-tabs__titles,
    .nut-tabs__titles-item {
      background: var(--nut-tab-title-bg-color);
      color: var(--text-color)
    }

    .nut-tabs__titles-item.active {
      background: var(--nut-tab-title-active-bg-color) !important;
      color: var(--text-color) !important;
    }

    .cell-group-title {
      color: var(--text-color);
    }
  }

  .theme-popup {
    .nut-popup {
      padding: 10rpx;
    }

    .cell-group-title {
      color: var(--text-color);
    }
  }

  .nut-input {
    background: transparent;
  }

  .nut-textarea {
    padding: 10Px 16Px;
    height: 300Px;

    .nut-textarea__textarea {
      padding: 10Px;
      background: var(--textarea-bg-color);
      border-radius: 12rpx;
      height: 100%;
    }

    .nut-textarea__limit {
      right: 18Px;
    }

  }

  .nut-uploader {

    .nut-uploader__upload,
    .nut-uploader__preview {
      border-radius: 12rpx;
      background: var(--uploader-bg-color);
    }

    .nut-button--default {
      background: none;
    }
  }

  .submit-btn {
    margin: 20rpx 30rpx 20rpx 30rpx;
  }

  .skeleton-container {
    margin-top: 1rem;
    margin-left: 5vw;
  }
}
</style>