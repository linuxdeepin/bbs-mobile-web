<template>
  <view class="mypost-page">
    <nut-tabs v-model="currentTab" swipeable auto-height @change="tabChange">
      <template #titles>
        <view class="tab-list">
          <view v-for="item in tabList" :key="item.paneKey" class="tab-item" @click="switchTab(item.paneKey)"
            :class="{ active: currentTab === item.paneKey }"> {{ item.title }}{{
              init ? '' : `(${item.paneKey === 'mythread' ? myThreadData?.total_count : myPostData?.total_count} )`
            }}
          </view>
        </view>
      </template>
      <nut-tab-pane pane-key="mythread">
        <view v-if="!loading" class="mypost-list">
          <template v-if="myThreadData?.total_count">
            <nut-cell-group v-for="thread in myThreadData?.data">
              <nut-cell is-link @click="goToThread(thread)">
                <template #default>
                  <view class="mythread-item">
                    <!-- 标题 -->
                    <view class="title">{{ thread.subject }}</view>
                    <!-- 昵称和时间 -->
                    <view class="info">
                      <view class="nickname">{{ thread.user.nickname }}</view>
                      <view class="time">{{ formatTime(thread.created_at) }}</view>
                    </view>
                    <!-- 标签和浏览量及评论数量 -->
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
      <nut-tab-pane pane-key="mypost">
        <view v-if="!loading" class="mypost-list">
          <template v-if="myPostData?.total_count">
            <nut-cell-group v-for="post in myPostData?.data">
              <nut-cell is-link @click="goToPost(post)">
                <template #default>
                  <view class="mypost-item">
                    <!-- 昵称和时间 -->
                    <view class="info">
                      <view class="nickname">{{ post.user.nickname }}</view>
                      <view class="time">{{ formatTime(post.created_at) }}</view>
                    </view>
                    <!-- 回复内容 -->
                    <view class="content">{{ post.message_fmt }}</view>
                    <!-- 回复引用内容 -->
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
            <nut-empty description="暂无我的回复"></nut-empty>
          </view>
        </view>
        <view v-else class="skeleton-container" v-for=" in [1, 2, 3, 4, 5, 6, 7, 8, 9]">
          <nut-skeleton width="90vw" height="20px" title animated avatarSize="40px" row="2">
          </nut-skeleton>
        </view>
      </nut-tab-pane>
    </nut-tabs>
    <nut-pagination class="pagination"
      v-if="!loading && currentTab === 'mythread' ? myThreadData && myThreadData.total_count > pagination.limit : myPostData && myPostData?.total_count > pagination.limit"
      v-model="pagination.page" mode="multi"
      :total-items="currentTab === 'mythread' ? myThreadData?.total_count : myPostData?.total_count"
      :items-per-page="pagination.limit" @change="pageChange" />
  </view>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { getCurrentInstance, useDidShow } from '@tarojs/taro';
import { GetMyThread, MyThreadResonse, GetMyPost, MyPostResponse, PostOffset } from '@/api';
import { formatTime } from '@/utils/format';
import { Comment, Eye } from "@nutui/icons-vue-taro";
import Taro from '@tarojs/taro';

type Tab = 'mythread' | 'mypost'

const instance = getCurrentInstance();
const init = ref(true)
const loading = ref(true)
const currentTab = ref<Tab>('mythread')
const tabList = ref<Array<{ title: string, paneKey: Tab }>>([
  { title: '我的主题', paneKey: 'mythread' },
  { title: '我的回复', paneKey: 'mypost' },
])
const pagination = ref({ page: 1, limit: 10 })
if (instance.router) {
  currentTab.value = instance.router.params.tab as Tab || 'mythread'
}
// 页面数据
const myThreadData = ref<MyThreadResonse>()
const myPostData = ref<MyPostResponse>()
// 切换tab
const switchTab = (tab: Tab) => {
  currentTab.value = tab
  tabChange()
}
// 切换tab时获取对应数据
const tabChange = async () => {
  loading.value = true
  pagination.value.page = 1
  switch (currentTab.value) {
    case 'mythread':
      const myThreadRes = await GetMyThread({ offset: pagination.value.page - 1, limit: pagination.value.limit })
      myThreadData.value = myThreadRes.data
      break
    case 'mypost':
      const myPostRes = await GetMyPost({ offset: pagination.value.page - 1, limit: pagination.value.limit })
      myPostData.value = myPostRes.data
      break
  }
  console.log(myPostData.value)
  loading.value = false
}
// 页面加载时获取一次数据
(async () => {
  loading.value = true
  const myThreadRes = await GetMyThread({ offset: pagination.value.page - 1, limit: pagination.value.limit })
  myThreadData.value = myThreadRes.data
  const myPostRes = await GetMyPost({ offset: pagination.value.page - 1, limit: pagination.value.limit })
  myPostData.value = myPostRes.data
  loading.value = false
  init.value = false
})()

useDidShow(async () => {
  switch (currentTab.value) {
    case 'mythread':
      const myThreadRes = await GetMyThread({ offset: pagination.value.page - 1, limit: pagination.value.limit })
      myThreadData.value = myThreadRes.data
      break
    case 'mypost':
      const myPostRes = await GetMyPost({ offset: pagination.value.page - 1, limit: pagination.value.limit })
      myPostData.value = myPostRes.data
      break
  }
})
// 翻页
const pageChange = async (page: number) => {
  pagination.value.page = page
  loading.value = true
  switch (currentTab.value) {
    case 'mythread':
      const myThreadRes = await GetMyThread({ offset: pagination.value.page - 1, limit: pagination.value.limit })
      myThreadData.value = myThreadRes.data
      break
    case 'mypost':
      const myPostRes = await GetMyPost({ offset: pagination.value.page - 1, limit: pagination.value.limit })
      myPostData.value = myPostRes.data
      break
  }
  // 翻页后跳转到顶部
  Taro.pageScrollTo({
    scrollTop: 0,
    duration: 300
  })
  loading.value = false
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
</script>

<style lang="scss">
.mypost-page {
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
      font-size: 16Px;
    }

    .tab-item.active {
      color: red;
      border-bottom: 2px solid red;
    }
  }

  .mypost-list {
    .mythread-item {
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

    .mypost-item {
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
    padding: 5px;
  }

  .skeleton-container {
    margin-top: 1rem;
    margin-left: 5vw;
  }

  .pagination {
    display: flex;
    justify-content: center;
    padding-bottom: 4rem;
  }
}
</style>