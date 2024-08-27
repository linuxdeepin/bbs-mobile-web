<template>
  <nut-col span="22" offset="1">
    <view class="thread-op">
      <view class="thread-op-item" hover-class="btn-clicked" hover-stay-time="200" @click="upThread">
        <img :src="threadInfo.is_up ? UpFillIcon : UpIcon" />
        <view>{{ `点赞${threadInfo.like_cnt}` }}</view>

      </view>
      <view class="thread-op-item" hover-class="btn-clicked" hover-stay-time="200" @click="favoriteThread">
        <img :src="threadInfo.is_favorite ? FavoriteFillIcon : FavoriteIcon" />
        <view>{{ `收藏${threadInfo.favourite_cnt}` }}</view>
      </view>
      <!-- 楼主更多操作 -->
      <view v-if="account.is_login && account.user_info.id === threadInfo.user_id" hover-class="btn-clicked"
        hover-stay-time="200" class="thread-op-item more" @click="checkThreadState">
        <img :src="MoreIcon" />
      </view>
      <!-- 普通用户操作 -->
      <view v-else hover-class="btn-clicked" hover-stay-time="200" class="thread-op-item more"
        @click="userAction.show = true">
        <img :src="MoreIcon" />
      </view>
      <!-- 版主管理按钮 -->
      <view v-if="account.is_login && isModerator" hover-class="btn-clicked" hover-stay-time="200"
        class="thread-op-item right" @click="checkModeratorState">
        <img :src="ManagerIcon" />
        <view>管理</view>
      </view>
    </view>
    <nut-dialog content="是否确认删除该条帖子" v-model:visible="showDelThreadDialog" @ok="deleteThread" />
    <!-- 楼主管理帖子弹窗 -->
    <nut-action-sheet v-model:visible="authorAction.show" :menu-items="(authorAction.items as any)"
      @choose="$event.callback()" cancel-txt="取消" />
    <!-- 普通用户管理帖子弹窗 -->
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
    <!-- 解决对话框 -->
    <nut-dialog v-model:visible="showResolvedDialog" title="提示" :content="threadResolved ? '标记帖子为未解决状态' : '标记帖子为已解决状态'"
      @ok="resolved"></nut-dialog>
    <!-- 举报对话框 -->
    <nut-popup v-model:visible="showReportDialog" pop-class="report-dailog" :catch-move="true" round style="width: 90%;"
      safe-area-inset-bottom closeable>
      <template #default>
        <nut-form ref="reportFormRef" label-position="top" class="moderator-del-form" :model-value="reportForm">
          <nut-form-item prop="type" label="您为什么要举报此信息" required :rules="[{ required: true, message: '请选择举报类型' }]">
            <nut-radio-group v-model="reportForm.type">
              <nut-grid :center="false" :border="false" :column-num="2">
                <nut-grid-item v-for="(type, index) in reportType">
                  <template #default>
                    <nut-radio :label="index + 1">{{ type
                      }}</nut-radio>
                  </template>
                </nut-grid-item>
              </nut-grid>
            </nut-radio-group>
          </nut-form-item>
          <nut-form-item v-if="reportForm.type === 10" prop="reason" required
            :rules="[{ required: true, message: '请输入举报理由' }]">
            <nut-input v-model='reportForm.reason' placeholder="举报理由"></nut-input>
          </nut-form-item>
          <view class="op">
            <nut-button size="small" @click="showReportDialog = false">取消</nut-button>
            <nut-button size="small" type="primary" @click="report">确定</nut-button>
          </view>
        </nut-form>
      </template>
    </nut-popup>
    <nut-dialog v-model:visible="showModeratorMoveDialog" title='移动帖子' :before-close="moderatorMoveDialogClosed">
      <template #default>
        <nut-cell title="版块" :desc="selectedForum?.name || '请选择'" is-link @click="showForumSelection = true"></nut-cell>
        <nut-cell title="主题" :desc="selectedThemeType?.name || '请选择'" is-link @click="themeTypeCellClicked">
        </nut-cell>
      </template>
    </nut-dialog>
    <!-- 选择版块弹窗 -->
    <nut-popup v-model:visible="showForumSelection" round position="bottom" :style="{ height: '50%' }"
      safe-area-inset-bottom pop-class="forum-popup">
      <nut-tabs v-model="activeForumTab" title-scroll style="height: 100%" direction="vertical"
        @change="console.log(activeForumTab)">
        <!-- 按分类渲染版块 -->
        <template v-for="(forum, index) in forumList" :key="index">
          <nut-tab-pane :title="forum.name" :paneKey="index">
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
  ThreadClosed,
  ReportType,
  Report
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
const showReportDialog = ref(false)
const showResolvedDialog = ref(false)

// 调起楼主菜单前检查帖子是否已解决
const checkThreadState = () => {
  if (threadResolved.value) {
    authorAction.value.items[0].name = "未解决"
  } else {
    authorAction.value.items[0].name = "解决"
  }
  authorAction.value.show = true
}

// 楼主操作
const authorAction = ref({
  show: false,
  items: [
    {
      name: "解决", callback: () => {
        showResolvedDialog.value = true
      }
    },
    {
      name: "删除", callback: () => {
        showDelThreadDialog.value = true
      }
    }
  ]
})

// 楼主标记帖子为已解决
const resolved = async () => {
  const action = threadResolved.value ? ThreadUnResolved : ThreadResolved;
  const { data } = await action(threadInfo.value.id);
  if (!data.code) {
    threadResolved.value = !threadResolved.value;
    threadRefresh.value++;
  } else {
    prompt.showToast('warn', '操作失败');
  }
}

// 楼主删除帖子
const deleteThread = async () => {
  const { data } = await DeleteThread(threadInfo.value.id)
  if (!data.code) {
    prompt.showToast("success", "删除成功")
    config.indexNeedRefresh = true
    Taro.navigateBack()
  }
}

// 举报表单
const reportFormRef = ref([])
const reportForm = ref({
  type: 1,
  reason: ""
})
const reportType = ref()
// 普通用户操作
const userAction = ref({
  show: false,
  items: [
    {
      name: "举报", callback: async () => {
        if (!account.is_login) {
          showLoginDialog.value = true
          return
        }
        const { data } = await ReportType()
        reportType.value = Object.values(data.data)
        reportForm.value = {
          type: 1,
          reason: ""
        }
        showReportDialog.value = true
      }
    }
  ]
})

// 发起举报
const report = async () => {
  const result = await (reportFormRef.value as any).validate()
  if (result.valid) {
    const { data } = await Report({
      forum_id: threadInfo.value.forum_id,
      message: reportForm.value.reason,
      report_type: reportForm.value.type,
      post_id: threadInfo.value.post.id,
      thread_id: threadInfo.value.id
    })
    if (!data.code) {
      prompt.showToast('success', '举报成功')
      showReportDialog.value = false
    }
  }
}

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
        showResolvedDialog.value = true
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
const activeForumTab = ref(0)
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
    background-color: var(--btn-clicked-bg-color);
  }

  .thread-op-item {
    display: flex;
    align-items: center;
    color: #97a3b4;
    margin-right: 6Px;
    padding: 5Px;
    border-radius: 6Px;

    img {
      width: 16Px;
      height: 16Px;
    }

    view {
      font-size: 16Px;
      white-space: nowrap;
      height: 16Px;
      line-height: 1;
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
    padding: 20rpx;
  }

  .cell-group-title {
    color: var(--text-color);
  }
}

.report-dailog {
  .nut-grid-item__content {
    padding-bottom: 5rpx;
  }

  .op {
    display: flex;
    justify-content: space-between;
    margin: 20rpx 40rpx;

    .nut-button {
      width: 40%;
    }
  }
}
</style>