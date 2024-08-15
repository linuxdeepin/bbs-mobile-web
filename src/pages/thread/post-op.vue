<template>
  <nut-cell v-if="post.deleted_at === null" class="post-op">
    <view class="post-op-list">
      <view class="op-item" hover-class="btn-clicked" hover-stay-time="200" @click="likeBtnClicked(post)">
        <img :src="post.is_up ? UpFillIcon : UpIcon" />
        <text class="content">{{ `点赞${post.like_cnt}` }}</text>
      </view>
      <view class="op-item" hover-class="btn-clicked" hover-stay-time="200"
        @click="replyBtnClicked(post.id, post.post_user_id, post.user.nickname)">
        <img :src="CommentIcon" />
        <text class="content">回复</text>
      </view>
      <view v-if="account.is_login && account.user_info.id === post.post_user_id && post.deleted_at === null"
        class="op-item" hover-class="btn-clicked" hover-stay-time="200"
        @click="showDelPostDialog = true; userDelPostId = post.id">
        <img :src="DeleteIcon" />
        <text class="content">删除</text>
      </view>
      <!-- 版主管理按钮 -->
      <view v-if="account.is_login && isModerator" hover-class="btn-clicked" hover-stay-time="200" class="op-item right"
        @click="checkPostIsWinnow(post.id, post.post_user_id)">
        <img :src="ManagerIcon" />
        <text>管理</text>
      </view>
    </view>
    <nut-dialog content="是否确认删除该条帖子" v-model:visible="showDelPostDialog" @ok="userDelPost" />
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
  WinnowThreadPostByModerator
} from '@/api';
import { useAccountStore, usePromptStore } from '@/stores';
import UpIcon from '@/assets/up.svg'
import UpFillIcon from '@/assets/up-fill.svg'
import DeleteIcon from '@/assets/delete.svg'
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

// 用户删除评论确认弹窗
const showDelPostDialog = ref(false)
const userDelPostId = ref(0)
// 用户删除评论
const userDelPost = async () => {
  if (userDelPostId.value) {
    const { data } = await DeleteThreadPost(userDelPostId.value)
    if (!data.code) {
      prompt.showToast("success", "删除成功")
      refreshScroll.value = false
      postRefresh.value++
    }
    userDelPostId.value = 0
  }
}

// 版主操作
// 要删除的评论的ID
const delPostId = ref(0)
// 要删除的评论的作者id
const delPostUserId = ref(0)
// 版主删除评论对话框
const showModeratorDelPostDialog = ref(false)
// 精选
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
const checkPostIsWinnow = (postId, postUserId) => {
  delPostId.value = postId
  delPostUserId.value = postUserId
  postIsWinnow.value = winnowPosts.value.data.some(item => item.id === postId)
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
        id: delPostId.value,
        forum_id: threadInfo.value?.forum_id,
        o_user_id: delPostUserId.value,
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
        id: delPostId.value,
        forum_id: threadInfo.value.forum_id,
        o_user_id: delPostUserId.value,
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
        delPostId.value = 0
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

const replyBtnClicked = (id: number, postUserId: number, nickName: string) => {
  if (!account.is_login) {
    showLoginDialog.value = true
    return
  }
  if (threadClosed.value) {
    prompt.showToast("warn", "帖子已关闭")
    return
  }
  isReply.value = true
  replyId.value = id
  replyUserId.value = postUserId
  replyNickName.value = nickName
}

// 点赞评论
const likeBtnClicked = async (post: PostListResponse["data"][0]) => {
  if (!account.is_login) {
    showLoginDialog.value = true
    return
  }
  const { data } = await ThreadUP(post.id, "pid")
  if (!data.code) {
    post.is_up = !post.is_up
    post.like_cnt += post.is_up ? 1 : -1
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
    }
  }
}
</style>