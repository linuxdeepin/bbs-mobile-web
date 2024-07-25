<template>
  <view class="posting-page">
    <view v-show="!loading">

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
          <nut-input class="title-input" v-model="postingTitle" show-word-limit :max-length="30"
            placeholder="请输入帖子标题，不超过30字" />
        </nut-cell>

        <!-- 主题内容 -->
        <nut-textarea v-model="postingContent" :autosize="{ maxHeight: 300, minHeight: 300 }" placeholder="请输入帖子内容"
          limit-show :max-length="5000" />

        <!-- 选择图片 -->
        <nut-cell>
          <nut-uploader ref="uploadImageRef" :auto-upload="false" v-model:file-list="imgFileList" :maximize="2097152"
            :maximum="9" :size-type="['compressed']" :media-type="['image']" @change="fileListChange"></nut-uploader>
        </nut-cell>

        <!-- 发布按钮 -->
        <view class="submit-btn">
          <nut-button :disabled="postingTitle === '' || postingContent === ''" type="primary" block
            @click="submitPosting">发布帖子</nut-button>
        </view>
      </nut-cell-group>

    </view>
    <!-- 骨架屏 -->
    <template v-if="loading">
      <view class="skeleton-container" v-for=" in [1, 2, 3]">
        <nut-skeleton width="90vw" height="40px" :title="false" animated row="1">
        </nut-skeleton>
      </view>
      <view class="skeleton-container">
        <nut-skeleton width="90vw" height="300px" :title="false" animated row="1">
        </nut-skeleton>
      </view>
      <view class="skeleton-container">
        <nut-skeleton width="100px" height="100px" :title="false" animated row="1">
        </nut-skeleton>
      </view>
      <view class="skeleton-container">
        <nut-skeleton width="90vw" height="40px" :title="false" animated row="1">
        </nut-skeleton>
      </view>
    </template>
    <!-- 选择版块弹窗 -->
    <nut-popup v-model:visible="showForumSelection" round position="bottom" :style="{ height: '50%' }">
      <nut-tabs v-model="activeForumTab" title-scroll style="height: 100%" direction="vertical"
        @change="console.log(activeForumTab)">
        <!-- 渲染全部版块 -->
        <nut-tab-pane title="全部" paneKey="全部">
          <!-- 外层遍历forumList -->
          <template v-for="forum in forumList" @click="selectedForum = forum.name">
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
      :style="{ height: '50%' }">
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
    <Tabbar></Tabbar>
  </view>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import Taro from '@tarojs/taro';
import { GetForum, GetTheme, ThemeResponse, PostingThread, apiServer } from '@/api'
import { computedAsync } from '@vueuse/core';
import { usePromptStore, useAccountStore } from '@/stores';
import Tabbar from '@/widgets/tabbar.vue';

const loading = ref(true)
setTimeout(() => {
  loading.value = false
}, 1000)
const prompt = usePromptStore()
const account = useAccountStore()
const postCaptcha = account.useSmartCaptcha()
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
const uploadImageRef = ref<any>(null)
const imgFileList = ref<FileItem[]>([])

// 新增文件事件
const fileListChange = (fileList: { fileList: FileItem[] }, _) => {
  console.log(fileList)
  // 将文件状态都修改为success
  fileList.fileList.forEach((file) => {
    file.status = 'success'
  })
  imgFileList.value = fileList.fileList
}

// 发布帖子
const submitPosting = async () => {
  if (!selectedForum.value.id) {
    prompt.showToast('warn', '请选择版块')
    return
  }
  if (!selectedThemeType.value.id) {
    prompt.showToast('warn', '请选择主题类型')
    return
  }

  // 人机验证
  postCaptcha.tryVerify(async (captchaId: string) => {
    let message = `<div data-editer_version="v2" data-vditor_version="3.9.4"><p>${postingContent.value}</p>`
    if (imgFileList.value.length) {
      // 使用Taro.uploadFile上传所有图片,并保存返回的url
      let imgUrls: string[] = []
      prompt.showToast("loading", "图片上传中...", 10000)
      for (let i = 0; i < imgFileList.value.length; i++) {
        const file = imgFileList.value[i]
        const uploadFileRes = await Taro.uploadFile({
          url: apiServer + '/api/v1/thread/file',
          filePath: file.url,
          name: 'image',
          header: {
            "Cookie": "bbs=" + JSON.parse(Taro.getStorageSync("PAGE_COOKIE"))["taro.com"]["/"]["bbs"]['value']
          },
          formData: {
            "image": file.url
          }
        })
        if (uploadFileRes.statusCode !== 200) {
          prompt.showToast("fail", "上传图片失败")
          return
        }
        imgUrls.push(JSON.parse(uploadFileRes.data).data[0])
      }
      prompt.hideToast()
      message += imgUrls.map(url => `<p><img src='${url}' style='max-width: 100%' /></p>`).join('')
    }
    // 闭合标签
    message += '</div>'

    try {
      const res = await PostingThread({
        captcha_id: captchaId,
        forum_id: selectedForum.value?.id,
        message: message,
        subject: postingTitle.value,
        type_id: selectedThemeType.value?.id,
        user_id: account.user_info.id,

      })
      console.log(res.data)
      prompt.showToast('success', '发布成功')
      const threadId = res.data.data.id
      // 跳转到帖子详情页
      Taro.navigateTo({
        url: `/pages/thread/thread?id=${threadId}&posting=1`
      })
    }
    catch (e) {
      console.log('PostingThread fail: ', e)
    }
  })
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
// 监听selectedForum的变化，获取主题类型
watch(() => selectedForum.value, async (value) => {
  if (!value) return;
  const res = await GetTheme({ forum_id: value.id })
  themeTypeList.value = res.data
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
  height: 100%;
  padding: 5rpx 10rpx;

  .title-input {
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

  .theme-popup {
    .nut-popup {
      padding: 10rpx;
    }
  }

  .nut-textarea {
    padding: 20rpx 30rpx;

    textarea {
      padding: 10rpx;
      background: #eee;
      border-radius: 12rpx;
    }

  }

  .submit-btn {
    margin: 20rpx 30rpx 0 30rpx;
  }

  .skeleton-container {
    margin-top: 1rem;
    margin-left: 5vw;
  }
}
</style>