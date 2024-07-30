<template>
  <view class="module-detail-page">
    <template v-if="!loading && forumInfo">
      <nut-cell-group>
        <nut-cell>
          <template #default>
            <view class="module-info">
              <view class="module-info-header">
                <img :src="forumInfo.data.icon" />
                <view class="module-info-data">
                  <view class="title">{{ forumInfo.data.name }}</view>
                  <view class="count">
                    <view class="today">当日:<text>{{ forumInfo.data.today_visit_cnt }}</text></view>
                    <view class="thread">主题:<text>{{ forumInfo.data.today_posts_cnt }}</text></view>
                  </view>
                </view>
                <view class="favorite-btn">
                  <nut-button class="btn" v-if="!forumIsFavorite" @click="favoriteForum" plain size="small"
                    type="primary">
                    <template #icon>
                      <StarN />
                    </template>
                    收藏
                  </nut-button>
                  <nut-button class="btn" v-else @click="favoriteForum" plain size="small" type="warning">
                    <template #icon>
                      <StarFillN />
                    </template>
                    已收藏
                  </nut-button>
                </view>
              </view>
              <view class="brief">{{ forumInfo.data.brief }}</view>
              <view class="moderator">
                版主:
                <nut-avatar-group max-count="20" size="20">
                  <nut-avatar size="20" v-for="user in forumInfo.data.user_list">
                    <img :src="user.avatar" />
                  </nut-avatar>
                </nut-avatar-group>
              </view>
            </view>
          </template>
        </nut-cell>
      </nut-cell-group>
      <view class="thread-list">
        <template v-for="item in forumInfo.data.thread">
          <nut-cell-group>
            <!-- 帖子标题 -->
            <nut-cell class="thread-title" desc-text-align="left" is-link @click="goThread(item)">
              <template #desc>
                <span class="module">【{{ item.type.name }}】</span>
                <span class="title">
                  {{ item.subject }}
                </span>
              </template>
              <template #icon>
                <img v-if="item.is_top_forum" style="width:20px;height: 20px;" :src="TopIcon" />
              </template>
            </nut-cell>
            <!-- 帖子信息 -->
            <nut-cell class="info" desc-text-align="left">
              <template #icon>
                <nut-avatar size="20" shape="round">
                  <img :src="item.user.avatar" />
                </nut-avatar>
              </template>
              <template #desc>
                <div class="info-desc">
                  <span class="nickname"> {{ item.user.nickname }}</span>
                  <span class="stat">
                    <span>
                      <Eye size="10"></Eye> {{ item.views_cnt }}
                    </span>
                    <span>
                      <Comment size="10"></Comment> {{ item.posts_cnt }}
                    </span>
                  </span>
                </div>
              </template>
            </nut-cell>
          </nut-cell-group>
        </template>

        <view class="pagination" v-if="forumInfo">
          <nut-pagination v-model="pagination.page" mode="multi" :total-items="forumInfo.total_count"
            :items-per-page="pagination.limit" />
        </view>
      </view>
    </template>
    <view v-else>
      <view class="skeleton-container">
        <nut-skeleton width="68vw" height="30px" :title="false" avatar animated avatar-shape="square" avatarSize="70px"
          row="2">
        </nut-skeleton>
      </view>
      <view class="skeleton-container">
        <nut-skeleton width="90vw" height="20px" :title="false" animated row="2">
        </nut-skeleton>
      </view>
      <view class="skeleton-container" v-for=" in [1, 2, 3, 4, 5, 6, 7]">
        <nut-skeleton width="90vw" height="20px" title animated avatarSize="40px" row="2">
        </nut-skeleton>
      </view>
    </view>
    <nut-dialog content="请先登录账号" v-model:visible="showLoginDialog" @ok="account.gotoLogin()" />
  </view>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue"
import Taro from '@tarojs/taro';
import { ForumById, ForumByIdResponse, ForumIsFavorite, ForumFavorite } from "@/api";
import { computedAsync } from "@vueuse/core";
import TopIcon from '@/assets/top.svg';
import { Comment, Eye, StarN, StarFillN } from "@nutui/icons-vue-taro";
import { useAccountStore } from "@/stores";

const account = useAccountStore()
const instance = Taro.getCurrentInstance()
const forumId = ref(0)
if (instance.router) {
  forumId.value = Number(instance.router.params["id"] || 0)
}
const showLoginDialog = ref(false)
const loading = ref(true)
const pagination = ref({ page: 1, limit: 20 })

const forumInfo = ref<ForumByIdResponse>()
computedAsync(async () => {
  const { data } = await ForumById({ id: forumId.value, order: "last_date", offset: pagination.value.page - 1, languages: "zh_CN" })
  forumInfo.value = data
}, undefined, { evaluating: loading })

const forumIsFavorite = computedAsync(async () => {
  if (!account.is_login) {
    return false
  }
  const { data } = await ForumIsFavorite(forumId.value)
  return data.data
})

const favoriteForum = async () => {
  if (!account.is_login) {
    showLoginDialog.value = true
  }
  const { data } = await ForumFavorite(forumId.value)
  if (data.code === 0) {
    forumIsFavorite.value = !forumIsFavorite.value
  }
}

// 跳转到帖子详情
const goThread = (item: ForumByIdResponse["data"]["thread"][0]) => {
  item.views_cnt++
  Taro.navigateTo({
    url: `/pages/thread/thread?id=${item.id}`,
  })
}

// 翻页后跳转到顶部
watch(loading, () => {
  Taro.pageScrollTo({
    scrollTop: 0,
    duration: 300
  })
})
</script>

<style lang="scss">
.module-detail-page {
  .module-info {
    width: 100%;

    .module-info-header {
      display: flex;

      img {
        width: 130rpx;
        height: 130rpx;
        border-radius: 12rpx;
      }

      .module-info-data {
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        margin-left: 20rpx;

        .title {
          font-size: 4.8vw;
          font-weight: 700;
        }

        .count {
          display: flex;

          .today,
          .thread {
            font-size: 3vw;
            margin-right: 10rpx;
            color: #99A5B5;

            text {
              color: #000;
            }
          }
        }
      }

      .favorite-btn {
        flex: 1;
        display: flex;
        justify-content: flex-end;
        align-items: center;

        .btn {
          width: 25vw;
        }
      }
    }

    .brief {
      margin: 20rpx 0;
      color: #99A5B5;
    }

    .moderator {
      display: flex;
      align-items: center;
    }
  }

  .thread-list {
    .thread-title {
      .h5-span {
        display: inline;
      }
    }

    .nickname {
      display: inline-block;
      min-width: 30vw;
      max-width: 30vw;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      vertical-align: bottom;
    }

    .info-desc {
      display: flex;
      justify-content: space-between;

      .stat {
        display: inline;

        span {
          display: inline;
          margin-left: 1rem;
        }
      }
    }
  }

  .pagination {
    display: flex;
    justify-content: center;
    padding-bottom: 20rpx;
  }

  .skeleton-container {
    margin-top: 1rem;
    margin-left: 5vw;
  }
}
</style>