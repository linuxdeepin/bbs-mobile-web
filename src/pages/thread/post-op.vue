<template>
  <nut-cell v-if="post.deleted_at === null" class="post-op">
    <view class="post-op-list">
      <view class="op-item" hover-class="btn-clicked" hover-stay-time="200" @click="likeBtnClicked">
        <img :src="post.is_up ? UpFillIcon : UpIcon" />
        <text class="content">{{ `点赞${post.like_cnt}` }}</text>
      </view>
      <view class="op-item" hover-class="btn-clicked" hover-stay-time="200" @click="replyBtnClicked">
        <img :src="CommentIcon" />
        <text class="content">回复</text>
      </view>
      <view v-if="account.is_login && account.user_info.id === post.post_user_id && post.deleted_at === null"
        class="op-item more" hover-class="btn-clicked" hover-stay-time="200" @click="authorPostAction.show = true">
        <img :src="MoreIcon" />
      </view>
      <view v-else class="op-item more" hover-class="btn-clicked" hover-stay-time="200"
        @click="userPostAction.show = true">
        <img :src="MoreIcon" />
      </view>
      <!-- 版主管理按钮 -->
      <view v-if="account.is_login && isModerator" hover-class="btn-clicked" hover-stay-time="200" class="op-item right"
        @click="checkPostIsWinnow">
        <img :src="ManagerIcon" />
        <text>管理</text>
      </view>
    </view>
    <nut-dialog content="是否确认删除该条帖子" v-model:visible="showDelPostDialog" @ok="authorDelPost" />
    <!-- 楼主管理评论弹窗 -->
    <nut-action-sheet v-model:visible="authorPostAction.show" :menu-items="authorPostAction.items"
      @choose="$event.callback()" cancel-txt="取消" />
    <!-- 普通用户管理评论弹窗 -->
    <nut-action-sheet v-model:visible="userPostAction.show" :menu-items="userPostAction.items"
      @choose="$event.callback()" cancel-txt="取消" />
    <!-- 版主管理评论弹窗 -->
    <nut-action-sheet v-model:visible="moderatorPostAction.show" :menu-items="moderatorPostAction.items"
      @choose="$event.callback()" cancel-txt="取消" />
    <!-- 版主删除评论 -->
    <nut-dialog v-model:visible="showModeratorDelPostDialog" title='删除' :before-close="moderatorDelDialogClosed">
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
    <!-- 版主精选评论对话框 -->
    <nut-dialog v-model:visible="showModeratorWinnowDialog" :title="postIsWinnow ? '取消精选' : '精选'"
      :before-close="moderatorWinnowDialogClosed">
      <template #default>
        <nut-form ref="winnowFormRef" class="moderator-del-form" :model-value="winnowForm">
          <nut-form-item prop="reason" label="说明" required :rules="[{ required: true, message: '请填写说明' }]">
            <nut-input v-model="winnowForm.reason" placeholder="请输入操作说明" auto-focusd />
          </nut-form-item>
          <nut-form-item prop="notify">
            <nut-checkbox v-model="winnowForm.notify">通知作者</nut-checkbox>
          </nut-form-item>
        </nut-form>
      </template>
    </nut-dialog>
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
            <nut-button size="small" type="primary" @click="reportPost">确定</nut-button>
          </view>
        </nut-form>
      </template>
    </nut-popup>
  </nut-cell>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import {
  PostListResponse,
  ThreadInfoData,
  WinnowThreadPostList,
  ThreadUP,
  DeleteThreadPost,
  DeleteThreadPostByModerator,
  WinnowThreadPostByModerator,
  ReportType,
  Report
} from '@/api';
import { useAccountStore, usePromptStore } from '@/stores';
import UpIcon from '@/assets/up.svg'
import UpFillIcon from '@/assets/up-fill.svg'
import MoreIcon from '@/assets/more.svg'
import CommentIcon from '@/assets/comment.svg'
import ManagerIcon from '@/assets/manager.svg'
import Taro from '@tarojs/taro';

const account = useAccountStore()
const prompt = usePromptStore()

const threadInfo = defineModel<ThreadInfoData>("threadInfo", { required: true })
const post = defineModel<PostListResponse["data"][0]>("post", { required: true })
const showLoginDialog = defineModel<boolean>("showLoginDialog", { required: true })
const threadClosed = defineModel<boolean>("threadClosed", { required: true })
const isReply = defineModel<boolean>("isReply", { required: true })
const replyId = defineModel<number>("replyId", { required: true })
const replyUserId = defineModel<number>("replyUserId", { required: true })
const replyNickName = defineModel<string>("replyNickName", { required: true })
const refreshScroll = defineModel<boolean>("refreshScroll", { required: true })
const postRefresh = defineModel<number>("postRefresh", { required: true })
const winnowPosts = defineModel<WinnowThreadPostList>("winnowPosts", { required: true })
const winnowPostsRefresh = defineModel<number>("winnowPostsRefresh", { required: true })

defineProps<{
  isModerator: boolean
}>()

// 版主操作
// 版主删除评论对话框
const showModeratorDelPostDialog = ref(false)
// 版主精选评论对话框
const showModeratorWinnowDialog = ref(false)
// 判断是否已经精选 已精选 返回true ,否则返回false
const postIsWinnow = ref(false)
const winnowFormRef = ref(null)
const winnowForm = ref({
  reason: "",
  notify: true
})

// 删除表单
const delFormRef = ref(null)
const delForm = ref({
  reason: "",
  notify: false
})
const checkPostIsWinnow = () => {
  postIsWinnow.value = winnowPosts.value.data.some(item => item.id === post.value.id)
  moderatorPostAction.value.items[0].name = postIsWinnow.value ? "取消精选" : "精选"
  moderatorPostAction.value.show = true
}

const moderatorPostAction = ref({
  show: false,
  items: [
    {
      name: "精选", callback: () => {
        winnowForm.value = {
          reason: "",
          notify: true
        }
        showModeratorWinnowDialog.value = true
      }
    },
    {
      name: "删除", callback: () => {
        delForm.value = {
          reason: "",
          notify: false
        }
        showModeratorDelPostDialog.value = true
      }
    }]
})

// 删除对话框关闭
const moderatorDelDialogClosed = async (action: string) => {
  if (!threadInfo.value)
    return
  if (action === "ok") {
    const result = await (delFormRef.value as any).validate()
    if (result.valid) {
      const { data } = await DeleteThreadPostByModerator({
        id: post.value.id,
        forum_id: threadInfo.value?.forum_id,
        o_user_id: post.value.post_user_id,
        note: delForm.value.reason,
        is_notify: delForm.value.notify ? 1 : 0
      })
      if (!data.code) {
        prompt.showToast("success", "删除成功")
        refreshScroll.value = false
        postRefresh.value++
        winnowPostsRefresh.value++
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

// 精选对话框关闭
const moderatorWinnowDialogClosed = async (action: string) => {
  if (!threadInfo.value)
    return
  if (action === "ok") {
    const result = await (winnowFormRef.value as any).validate()
    if (result.valid) {
      // 精选评论
      const { data } = await WinnowThreadPostByModerator({
        id: post.value.id,
        forum_id: threadInfo.value.forum_id,
        o_user_id: post.value.post_user_id,
        note: winnowForm.value.reason,
        is_notify: winnowForm.value.notify ? 1 : 0,

        top: postIsWinnow.value ? 0 : 1
      })
      if (!data.code) {
        if (postIsWinnow.value) {
          prompt.showToast("success", "取消精选成功")
        } else {
          prompt.showToast("success", "精选成功")
        }
        winnowPostsRefresh.value++
        Taro.pageScrollTo({
          selector: ".post-divider",
          offsetTop: -100
        })
      }
      return true
    }
    return false
  } else {
    winnowForm.value.reason = ""
    winnowForm.value.notify = false
    return true
  }
}

// 楼主管理评论
// 楼主删除评论确认弹窗
const showDelPostDialog = ref(false)
// 楼主管理评论操作
const authorPostAction = ref({
  show: false,
  items: [
    {
      name: "删除", callback: () => {
        showDelPostDialog.value = true
      }
    }
  ]
})

// 楼主删除评论
const authorDelPost = async () => {
  const { data } = await DeleteThreadPost(post.value.id)
  if (!data.code) {
    prompt.showToast("success", "删除成功")
    refreshScroll.value = false
    postRefresh.value++
  }
}

// 普通用户举报评论
const showReportDialog = ref(false)
const reportFormRef = ref([])
const reportForm = ref({
  type: 1,
  reason: ""
})
const reportType = ref()
const userPostAction = ref({
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
const reportPost = async () => {
  const result = await (reportFormRef.value as any).validate()
  if (result.valid) {
    const { data } = await Report({
      forum_id: threadInfo.value.forum_id,
      message: reportForm.value.reason,
      report_type: reportForm.value.type,
      post_id: post.value.id,
      thread_id: threadInfo.value.id
    })
    if (!data.code) {
      prompt.showToast('success', '举报成功')
      showReportDialog.value = false
    }
  }
}

const replyBtnClicked = () => {
  if (!account.is_login) {
    showLoginDialog.value = true
    return
  }
  if (threadClosed.value) {
    prompt.showToast("warn", "帖子已关闭")
    return
  }
  isReply.value = true
  replyId.value = post.value.id
  replyUserId.value = post.value.post_user_id
  replyNickName.value = post.value.user.nickname
}

// 点赞评论
const likeBtnClicked = async () => {
  if (!account.is_login) {
    showLoginDialog.value = true
    return
  }
  const { data } = await ThreadUP(post.value.id, "pid")
  if (!data.code) {
    post.value.is_up = !post.value.is_up
    post.value.like_cnt += post.value.is_up ? 1 : -1
  }
}
</script>

<style lang="scss">
.post-op {
  padding-top: 10rpx;
  padding-bottom: 10rpx;

  .post-op-list {
    display: flex;
    width: 100%;
    align-items: center;

    .btn-clicked {
      background-color: #f5f5f5;
    }

    .op-item {
      display: flex;
      align-items: center;
      padding: 10rpx;
      margin-right: 13rpx;
      border-radius: 12rpx;

      img {
        width: 30rpx;
        height: 30rpx;
      }

      text {
        font-size: 28rpx;
        color: #97a3b4;
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
}
</style>