<template>
  <view class="user-page">
    <nut-row>
      <nut-col span="22" offset="1">
        <template v-if="!userInfoLoading">
          <view v-if="userInfo" class="user-info">
            <nut-cell-group>
              <nut-cell desc-text-align="left">
                <template #icon>
                  <nut-avatar size="large" shape="round">
                    <img :src="userInfo.avatar" />
                  </nut-avatar>
                </template>
                <template #desc>
                  <view class="header">
                    <view class="info">
                      <view class="nickname">{{ userInfo.nickname }}</view>
                      <img class="level" :src="userInfo.levels.level_icon" />
                    </view>
                    <Tags :user-id="userInfo.id" />
                    <view class="desc">{{ userInfo.desc || "这个人很懒，什么都没写" }}</view>
                  </view>

                </template>
              </nut-cell>
              <nut-cell>
                <template #default>
                  <view class="footer">
                    <view class="count">
                      <view class="item">
                        <view class="item-label">帖子:</view>
                        <view class="item-value">{{ userInfo.threads_cnt }}</view>
                      </view>
                      <nut-divider direction="vertical" />
                      <view class="item">
                        <view class="item-label">主题:</view>
                        <view class="item-value">{{ userInfo.posts_cnt }}</view>
                      </view>
                    </view>
                    <view class="action" v-if="!isMe">
                      <nut-button type="warning" class="speak" plain size="small" v-if="isModerator"
                        @click="prohibitStatement = ''; prohibitDialogVisible = true">{{ userInfo.allow_speak ? '禁言' :
                          '解除禁言' }}</nut-button>
                      <nut-button type="primary" plain size="small" @click="goToDialog">发私信</nut-button>
                    </view>
                  </view>
                </template>
              </nut-cell>
            </nut-cell-group>
          </view>
        </template>
        <template v-else>
          <view class="skeleton-container">
            <nut-skeleton width="66vw" height="35px" :title="false" animated avatar avatarSize="80px" row="2">
            </nut-skeleton>
          </view>
          <view class="skeleton-container">
            <nut-skeleton width="90vw" height="20px" :title="false" animated row="1">
            </nut-skeleton>
          </view>
        </template>
      </nut-col>
      <nut-col span="22" offset="1">
        <nut-tabs v-model="currentTab" swipeable auto-height @change="tabChange">
          <template #titles>
            <view v-if="!userInfoLoading" class="tab-list">
              <view v-for="item in tabList" :key="item.paneKey" class="tab-item" @click="switchTab(item.paneKey)"
                :class="{ active: currentTab === item.paneKey }"> {{ item.title }}
              </view>
            </view>
          </template>
          <nut-tab-pane pane-key="thread">
            <view v-if="!loading" class="post-list">
              <template v-if="userThread?.total_count">
                <nut-cell-group v-for="thread in userThread?.data">
                  <nut-cell is-link @click="goToThread(thread)">
                    <template #default>
                      <view class="thread-item">
                        <view class="title">{{ thread.subject }}</view>
                        <view class="info">
                          <view class="nickname">{{ thread.user.nickname }}</view>
                          <view class="time">{{ formatTime(thread.created_at) }}</view>
                        </view>
                        <view class="some">
                          <nut-tag plain color="#FA2400"> {{ thread.forum.name }} </nut-tag>
                          <view class="stat">
                            <view>
                              <Eye size="10"></Eye>&nbsp;{{ thread.views_cnt }}
                            </view>
                            <view>
                              <Comment size="10"></Comment>&nbsp;{{ thread.posts_cnt }}
                            </view>
                          </view>
                        </view>
                      </view>
                    </template>
                    <template #link>
                      <view></view>
                    </template>
                  </nut-cell>
                </nut-cell-group>
              </template>
              <view v-else>
                <nut-empty description="暂无主题帖"></nut-empty>
              </view>
            </view>
            <view v-else class="skeleton-container" v-for=" in [1, 2, 3, 4, 5, 6, 7, 8, 9]">
              <nut-skeleton width="90vw" height="20px" title animated avatarSize="40px" row="2">
              </nut-skeleton>
            </view>
          </nut-tab-pane>
          <nut-tab-pane pane-key="post">
            <view v-if="!loading" class="post-list">
              <template v-if="userPost?.total_count">
                <nut-cell-group v-for="post in userPost?.data">
                  <nut-cell is-link @click="goToPost(post)">
                    <template #default>
                      <view class="post-item">
                        <view class="info">
                          <view class="nickname">{{ post.user.nickname }}</view>
                          <view class="time">{{ formatTime(post.created_at) }}</view>
                        </view>
                        <view class="content">{{ post.message_fmt }}</view>
                        <view class="quote">{{ post.thread.subject }}</view>
                      </view>
                    </template>
                    <template #link>
                      <view></view>
                    </template>
                  </nut-cell>
                </nut-cell-group>
              </template>
              <view v-else>
                <nut-empty description="暂无回复"></nut-empty>
              </view>
            </view>
            <view v-else class="skeleton-container" v-for=" in [1, 2, 3, 4, 5, 6, 7, 8, 9]">
              <nut-skeleton width="90vw" height="20px" title animated avatarSize="40px" row="2">
              </nut-skeleton>
            </view>
          </nut-tab-pane>
        </nut-tabs>
        <nut-pagination class="pagination"
          v-if="!loading && (currentTab === 'thread' ? userThread?.total_count : userPost?.total_count)"
          v-model="pagination.page" mode="multi"
          :total-items="currentTab === 'thread' ? userThread?.total_count : userPost?.total_count"
          :items-per-page="pagination.limit" />
      </nut-col>
    </nut-row>
    <nut-dialog title="操作说明" v-model:visible="prohibitDialogVisible" @cancel="prohibitStatement = ''"
      :before-close="prohibitUser">
      <template #default>
        <nut-input v-model="prohibitStatement" placeholder="请填写操作说明" />
      </template>
    </nut-dialog>
    <nut-toast :msg="prompt.toast.msg" v-model:visible="prompt.toast.visible" :type="prompt.toast.type"
      :duration="prompt.toast.duration" />
  </view>
</template>

<script lang="ts" setup>
import Taro from "@tarojs/taro"
import { ref, watch } from "vue"
import {
  GetUserInfo,
  UserInfoResponse,
  GetUserThread,
  GetUserPost,
  MyThreadResonse,
  MyPostResponse,
  PostOffset,
  GetProhibitUser
} from "@/api"
import { computedAsync } from "@vueuse/core";
import { formatTime } from '@/utils/format';
import { Comment, Eye } from "@nutui/icons-vue-taro";
import { useAccountStore, usePromptStore } from "@/stores";
import Tags from "@/widgets/tags.vue";

const instance = Taro.getCurrentInstance()
const account = useAccountStore()
const prompt = usePromptStore()
const userId = ref(0)
if (instance.router) {
  userId.value = Number(instance.router.params["id"] || 0)
}
type Tab = 'thread' | 'post'
const userInfoLoading = ref(true)
const loading = ref(true)
const userInfo = ref<UserInfoResponse>()
const userThread = ref<MyThreadResonse>()
const userPost = ref<MyPostResponse>()
const currentTab = ref<Tab>('thread')
const refresh = ref(0)
const prohibitDialogVisible = ref(false)
const prohibitStatement = ref("")
const tabList = ref<Array<{ title: string, paneKey: Tab }>>([
  { title: '发表主题', paneKey: 'thread' },
  { title: '发表回复', paneKey: 'post' },
])
const isMe = ref(false)
const isModerator = ref(false)
isMe.value = account.user_info.id === userId.value ? true : false
isModerator.value = [10000, 10001].includes(account.user_info.group_id)

// 切换tab
const switchTab = (tab: Tab) => {
  currentTab.value = tab
  pagination.value.page = 1
}
const pagination = ref({ page: 1, limit: 10 })
computedAsync(async () => {
  refresh.value
  const { data } = await GetUserInfo(userId.value)
  userInfo.value = data
}, undefined, { evaluating: userInfoLoading })

computedAsync(async () => {
  currentTab.value
  refresh.value
  if (currentTab.value === 'thread') {
    const { data: threadData } = await GetUserThread(userId.value, pagination.value.limit, pagination.value.page - 1)
    userThread.value = threadData
    console.log(userThread.value)
  } else {
    const { data: postData } = await GetUserPost(userId.value, pagination.value.limit, pagination.value.page - 1)
    userPost.value = postData
    console.log(userPost.value)
  }
}, undefined, { evaluating: loading })

// 禁言和取消禁言
const prohibitUser = async (action: string) => {
  if (!userInfo.value)
    return
  if (action === "ok") {
    if (prohibitStatement.value.trim().length === 0) {
      prompt.showToast("warn", "请填写操作说明", 500)
      return false
    }
    const params = {
      action: userInfo.value.allow_speak ? 2 : 1, // 1 正常, 2 禁言
      begin_at: formatTime(new Date().toDateString(), "YYYY-MM-DD"),
      hide_thread: true,
      reason: "禁言",
      user_id: userInfo.value.id
    }
    await GetProhibitUser(params)
    userInfo.value.allow_speak = !userInfo.value.allow_speak
    return true
  } else {
    return true
  }
}

watch(loading, () => {
  Taro.pageScrollTo({
    scrollTop: 0,
    duration: 300
  })
})

const tabChange = (opt: { title: string, paneKey: Tab, disable: boolean }) => {
  switchTab(opt.paneKey)
}

// 跳转到帖子详情
const goToThread = (thread: MyThreadResonse["data"][0]) => {
  // 帖子浏览量+1
  thread.views_cnt++
  Taro.navigateTo({
    url: `/pages/thread/thread?id=${thread.id}`
  })
}
// 跳转到回复详情
const goToPost = async (post: MyPostResponse["data"][0]) => {
  const { data } = await PostOffset({ id: post.id, thread_id: post.thread_id, page_size: 10 })
  Taro.navigateTo({
    url: `/pages/thread/thread?id=${post.thread_id}&postId=${post.id}&offset=${data.offset}`,
  })
}

// 跳转到私信页面
const goToDialog = () => {
  if (!account.is_login) {
    account.gotoLogin()
  }
  Taro.navigateTo({ url: `/pages/dialog/dialog?uid=${userId}` })
}

</script>

<style lang="scss">
.user-page {
  .user-info {

    .header {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      padding: 10rpx 0;
      margin-left: 10rpx;

      .info {
        display: flex;
        align-items: center;

        .nickname {
          font-size: 5vw;
          font-weight: bold;
        }

        .level {
          width: 40rpx;
          height: 40rpx;
          margin-left: 10rpx;
        }
      }

      .desc {
        font-size: 4vw;
        color: #999;
      }
    }

    .footer {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .count {
        display: flex;
        align-items: center;

        .item {
          display: flex;
          align-items: center;
          margin-right: 10px;

          .item-label {
            font-size: 4vw;
            color: #999;
          }

          .item-value {
            font-size: 4vw;
            font-weight: bold;
          }
        }
      }

      .action {
        .nut-button {
          margin-left: 10px;
        }

        .speak {
          width: 150px;
        }
      }
    }
  }

  .tab-list {
    display: flex;
    justify-content: space-around;
    width: 100%;
    padding: 10px 5px;
    background-color: #fff;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);

    .tab-item {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 10px 10px 20px 10px;
      color: black;
      cursor: pointer;
    }

    .tab-item.active {
      color: red;
      border-bottom: 2px solid red;
    }
  }

  .post-list {
    .thread-item {
      width: 100%;

      .title {
        margin: 10rpx 0;
        font-weight: 700;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        -o-text-overflow: ellipsis;
      }

      .info {
        display: flex;
        align-items: center;

        .time {
          margin-left: 10rpx;
          color: #97a3b4;
        }
      }

      .some {
        margin-top: 20rpx;
        display: flex;
        justify-content: space-between;
        align-items: center;

        .stat {
          display: inline;
          color: #97a3b4;

          view {
            margin-left: 5rpx;
            margin-right: 10rpx;
            display: inline;
          }
        }
      }
    }

    .post-item {
      width: 100%;

      .info {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .nickname {
          color: #494949;
        }

        .time {
          color: #97a3b4;
        }
      }

      .content {
        margin: 12rpx 0;
        color: #000;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        -o-text-overflow: ellipsis;
      }

      .quote {
        margin: 10rpx 0;
        color: #333;
        background-color: #f8f8f8;
        border-radius: var(--nut-cell-border-radius, 12rpx);
        padding: 12rpx;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        -o-text-overflow: ellipsis;
      }
    }
  }

  .nut-tab-pane {
    padding: 0;
  }

  .skeleton-container {
    margin-top: 1rem;
  }

  .pagination {
    display: flex;
    justify-content: center;
    padding-bottom: 4rem;
  }
}
</style>