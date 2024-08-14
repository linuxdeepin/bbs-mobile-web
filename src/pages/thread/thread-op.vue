<template>
  <nut-col span="22" offset="1">
    <view class="thread-op">
      <view class="thread-op-item" hover-class="btn-clicked" hover-stay-time="200" @click="upThread">
        <img :src="threadInfo.is_up ? UpFillIcon : UpIcon" />
        <text>{{ `点赞${threadInfo.like_cnt}` }}</text>

      </view>
      <view class="thread-op-item" hover-class="btn-clicked" hover-stay-time="200" @click="favoriteThread">
        <img :src="threadInfo.is_favorite ? FavoriteFillIcon : FavoriteIcon" />
        <text>{{ `收藏${threadInfo.favourite_cnt}` }}</text>
      </view>
      <!-- 用户更多操作 -->
      <view v-if="account.is_login && account.user_info.id === threadInfo.user_id" hover-class="btn-clicked"
        hover-stay-time="200" class="thread-op-item more" @click="checkThreadState">
        <img :src="MoreIcon" />
      </view>
      <!-- 版主管理按钮 -->
      <view v-if="account.is_login && isModerator" hover-class="btn-clicked" hover-stay-time="200"
        class="thread-op-item right" @click="checkModeratorState">
        <img :src="ManagerIcon" />
        <text>管理</text>
      </view>
    </view>
    <nut-dialog content="是否确认删除该条帖子" v-model:visible="showDelThreadDialog" @ok="deleteThread" />
    <!-- 用户管理帖子弹窗 -->
    <nut-action-sheet v-model:visible="userAction.show" :menu-items="(userAction.items as any)"
      @choose="$event.callback()" cancel-txt="取消" />
    <!-- 版主管理帖子弹窗 -->
    <nut-action-sheet v-model:visible="moderatorAction.show" :menu-items="(moderatorAction.items as any)"
      @choose="$event.callback()" cancel-txt="取消" />
    <!-- 版主删除帖子对话框 -->
    <nut-dialog v-model:visible="showModeratorDelDialog" title='删除' :before-close="moderatorDelDialogClosed">
      <template #default>
        <nut-form ref="delFormRef" class="moderator-del-form" :model-value="delForm">
          <nut-form-item prop="reason" label="说明" required :rules="[{ required: true, message: '请填写说明' }]">
            <nut-input v-model="delForm.reason" placeholder="请填写操作说明" auto-focusd />
          </nut-form-item>
          <nut-form-item prop="notify">
            <nut-checkbox v-model="delForm.notify">通知作者</nut-checkbox>
          </nut-form-item>
        </nut-form>
      </template>
    </nut-dialog>
    <!-- 版主关闭帖子对话框 -->
    <nut-dialog v-model:visible="showModeratorClosedDialog" :title="threadClosed ? '打开帖子' : '关闭帖子'"
      :before-close="moderatorClosedDialogClosed">
      <template #default>
        <nut-form ref="closeFormRef" class="moderator-del-form" :model-value="closeForm">
          <nut-form-item prop="reason" label="说明" required :rules="[{ required: true, message: '请填写说明' }]">
            <nut-input v-model="closeForm.reason" placeholder="请填写操作说明" auto-focusd />
          </nut-form-item>
          <nut-form-item prop="notify">
            <nut-checkbox v-model="closeForm.notify">通知作者</nut-checkbox>
          </nut-form-item>
        </nut-form>
      </template>
    </nut-dialog>
    <nut-dialog v-model:visible="showModeratorMoveDialog" title='移动帖子' :before-close="moderatorMoveDialogClosed">
      <template #default>
        <nut-cell title="版块" :desc="selectedForum?.name || '请选择'" is-link @click="showForumSelection = true"></nut-cell>
        <nut-cell title="主题" :desc="selectedThemeType?.name || '请选择'" is-link @click="themeTypeCellClicked">
        </nut-cell>
      </template>
    </nut-dialog>
    <!-- 选择版块弹窗 -->
    <nut-popup v-model:visible="showForumSelection" round position="bottom" :style="{ height: '50%' }"
      safe-area-inset-bottom>
      <nut-tabs v-model="activeForumTab" title-scroll style="height: 100%" direction="vertical"
        @change="console.log(activeForumTab)">
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
  </nut-col>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue"
import { useAccountStore, usePromptStore, useConfigStore } from '@/stores';
import UpIcon from '@/assets/up.svg'
import UpFillIcon from '@/assets/up-fill.svg'
import FavoriteIcon from '@/assets/favorite.svg'
import FavoriteFillIcon from '@/assets/favorite-fill.svg'
import ManagerIcon from '@/assets/manager.svg'
import MoreIcon from '@/assets/more.svg'
import {
  ThreadInfoData,
  ThreadUP,
  ThreadFavorite,
  DeleteThread,
  ModeratorDeleteThread,
  ThemeResponse,
  ModeratorMoveThread,
  GetForum,
  GetTheme,
  ThreadResolved,
  ThreadUnResolved,
  ThreadClosed
} from '@/api';
import Taro from "@tarojs/taro";
import { computedAsync } from "@vueuse/core";

const threadInfo = defineModel<ThreadInfoData>("threadInfo", { required: true })
const showLoginDialog = defineModel<boolean>("showLoginDialog", { required: true })
const threadRefresh = defineModel<number>("threadRefresh", { required: true })
const threadResolved = defineModel<boolean>("threadResolved", { required: true })
const threadClosed = defineModel<boolean>("threadClosed", { required: true })

defineProps<{
  isModerator: boolean
}>()

const account = useAccountStore()
const prompt = usePromptStore()
const config = useConfigStore()

const showDelThreadDialog = ref(false)

// 调起用户菜单前检查帖子是否已解决
const checkThreadState = () => {
  if (threadResolved.value) {
    userAction.value.items[0].name = "未解决"
  } else {
    userAction.value.items[0].name = "解决"
  }
  userAction.value.show = true
}

// 用户操作
const userAction = ref({
  show: false,
  items: [
    {
      name: "解决", callback: async () => {
        if (threadResolved.value) {
          const { data } = await ThreadUnResolved(threadInfo.value.id)
          if (!data.code) {
            threadResolved.value = false
            threadRefresh.value++
          } else {
            prompt.showToast('warn', '操作失败')
          }
        } else {
          const { data } = await ThreadResolved(threadInfo.value.id)
          if (!data.code) {
            threadResolved.value = true
            threadRefresh.value++
          } else {
            prompt.showToast('warn', '操作失败')
          }
        }
      }
    },
    {
      name: "删除", callback: () => {
        showDelThreadDialog.value = true
      }
    }
  ]
})

// 版主操作
const showModeratorMoveDialog = ref(false)
const showModeratorDelDialog = ref(false)
const showModeratorClosedDialog = ref(false)
// 删除表单
const delFormRef = ref(null)
const delForm = ref({
  reason: "",
  notify: false
})
// 关闭帖子表单
const closeFormRef = ref(null)
const closeForm = ref({
  reason: "",
  notify: true
})

const checkModeratorState = () => {
  if (threadResolved.value) {
    moderatorAction.value.items[0].name = "未解决"
  } else {
    moderatorAction.value.items[0].name = "解决"
  }
  if (threadClosed.value) {
    moderatorAction.value.items[2].name = "打开"
  } else {
    moderatorAction.value.items[2].name = "关闭"
  }
  moderatorAction.value.show = true
}

const moderatorAction = ref({
  show: false,
  items: [
    {
      name: "解决",
      callback: async () => {
        if (threadResolved.value) {
          const { data } = await ThreadUnResolved(threadInfo.value.id)
          if (!data.code) {
            threadResolved.value = false
            threadRefresh.value++
          } else {
            prompt.showToast('warn', '操作失败')
          }
        } else {
          const { data } = await ThreadResolved(threadInfo.value.id)
          if (!data.code) {
            threadResolved.value = true
            threadRefresh.value++
          } else {
            prompt.showToast('warn', '操作失败')
          }
        }
      }
    },
    {
      name: "移动", callback: () => {
        showModeratorMoveDialog.value = true
      }
    },
    {
      name: "关闭", callback: async () => {
        closeForm.value = {
          reason: "",
          notify: true
        }
        showModeratorClosedDialog.value = true
      }
    },
    {
      name: "删除", callback: () => {
        showModeratorDelDialog.value = true
      }
    }
  ]
})

const moderatorDelDialogClosed = async (action: string) => {
  if (action === "ok") {
    const result = await (delFormRef.value as any).validate()
    if (result.valid) {
      const { data } = await ModeratorDeleteThread({
        id: threadInfo.value.id,
        forum_id: threadInfo.value?.forum_id,
        o_user_id: threadInfo.value?.user_id,
        note: delForm.value.reason,
        is_notify: delForm.value.notify ? 1 : 0
      })
      if (!data.code) {
        prompt.showToast("success", "删除成功")
        config.indexNeedRefresh = true
        Taro.navigateBack()
      }
      return true
    }
    return false
  } else {
    delForm.value.reason = ""
    delForm.value.notify = false
    return true
  }
}

// 确认关闭帖子
const moderatorClosedDialogClosed = async (action: string) => {
  if (action === "ok") {
    const result = await (closeFormRef.value as any).validate()
    if (result.valid) {
      const { data } = await ThreadClosed({
        is_closed: threadClosed.value ? 0 : 1,
        is_notify: closeForm.value.notify ? 1 : 0,
        note: closeForm.value.reason,
        o_user_id: threadInfo.value.user_id,
        thread_id: threadInfo.value.id
      })
      if (!data.code) {
        prompt.showToast('success', threadClosed.value ? '已开启' : '已关闭')
        threadClosed.value = !threadClosed.value
      }
      return true
    }
    return false
  } else {
    closeForm.value.reason = ""
    closeForm.value.notify = true
    return true
  }
}

// 版主移动帖子对话框
const activeForumTab = ref('全部')
const showForumSelection = ref(false)
const showThemeTypeSelection = ref(false)
const themeTypeList = ref<ThemeResponse[]>()
const selectedForum = ref({
  id: 0,
  name: ""
})
const selectedThemeType = ref({
  id: 0,
  name: ""
})

const moderatorMoveDialogClosed = async (action: string) => {
  if (action === "ok") {
    if (!selectedForum.value.id) {
      prompt.showToast('warn', '请选择版块')
      return false
    }
    if (!selectedThemeType.value.id) {
      prompt.showToast('warn', '请选择主题类型')
      return false
    }
    try {
      await ModeratorMoveThread(threadInfo.value.id, selectedForum.value.id, selectedThemeType.value.id)
    } catch (e) {
      prompt.showToast('warn', '移动失败')
      return false
    } finally {
      selectedForum.value = { id: 0, name: '' }
      selectedThemeType.value = { id: 0, name: '' }
      prompt.showToast('success', '移动成功')
      threadRefresh.value++
      return true
    }
  }
  return true
}


const forumList = computedAsync(async () => {
  const { data } = await GetForum()
  return data
})

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
  if (!value.id) return;
  const res = await GetTheme({ forum_id: value.id })
  themeTypeList.value = res.data
})

// 删除帖子
const deleteThread = async () => {
  const { data } = await DeleteThread(threadInfo.value.id)
  if (!data.code) {
    prompt.showToast("success", "删除成功")
    config.indexNeedRefresh = true
    Taro.navigateBack()
  }
}

// 点赞和取消点赞帖子
const upThread = async () => {
  if (!account.is_login) {
    showLoginDialog.value = true
    return
  }
  if (!threadInfo.value)
    return
  const { data } = await ThreadUP(threadInfo.value.id, "tid")
  if (!data.code) {
    threadInfo.value.is_up = !threadInfo.value.is_up
    threadInfo.value.like_cnt += threadInfo.value.is_up ? 1 : -1
  }
}

// 收藏和取消收藏帖子
const favoriteThread = async () => {
  if (!account.is_login) {
    showLoginDialog.value = true
    return
  }
  if (!threadInfo.value)
    return
  const { data } = await ThreadFavorite(threadInfo.value.id)
  if (!data.code) {
    threadInfo.value.is_favorite = !threadInfo.value.is_favorite
    threadInfo.value.favourite_cnt += threadInfo.value.is_favorite ? 1 : -1
  }
}
</script>

<style lang="scss">
.thread-op {
  display: flex;
  padding: 20rpx 0;
  align-items: center;

  .btn-clicked {
    background-color: #f5f5f5;
  }

  .thread-op-item {
    display: flex;
    align-items: center;
    color: #97a3b4;
    margin-right: 13rpx;
    padding: 10rpx;
    border-radius: 12rpx;

    img {
      width: 30rpx;
      height: 30rpx;
    }

    text {
      font-size: 28rpx;
      white-space: nowrap;
    }

    &.right {
      margin-left: auto;
    }

    &.more {
      img {
        width: 45rpx;
        height: 45rpx;
      }
    }
  }
}

.moderator-del-form {
  margin: 0;

  .nut-cell-group__wrap {
    box-shadow: none;
  }
}


.theme-popup {
  .nut-popup {
    padding: 20rpx;
  }
}
</style>