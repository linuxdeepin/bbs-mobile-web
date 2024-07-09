<template>
  <view class="message-thread-page">
    <!-- 主题列表 -->
    <view v-if="!props.isLoading" class="message-list">
      <template v-for="item in props.data">
        <nut-cell-group @click="goThread(item.thread_id)">
          <!-- 用户头像,昵称，时间 -->
          <nut-cell class="user-info" desc-text-align="left">
            <template #icon>
              <nut-avatar size="40" shape="round">
                <img :src="item.send_user_avatar" />
              </nut-avatar>
            </template>
            <template #desc>
              <view class="info-desc">
                <view class="info">
                  <span class="nickname"> {{ item.send_user_nickname }}</span>
                  <span class="time">{{ item.created_at.replace("T", " ").slice(0, -1) }}</span>
                </view>
                <view class="del-btn">
                  <Del @click.stop="deleteMessage" />
                </view>
              </view>
            </template>
          </nut-cell>
          <!-- 回复和帖子标题 -->
          <nut-cell>
            <template #default>
              <view class="message-content">
                <view class="reply-info">
                  <span class="title">回复:&nbsp;</span>
                  <span class="content">{{ item.message_fmt }}</span>
                </view>
                <view class="thread-title">
                  {{ item.subject }}
                </view>
              </view>
            </template>
          </nut-cell>
        </nut-cell-group>
      </template>
    </view>
    <!-- 主题消息列表骨架屏 -->
    <view v-else class="skeleton-container" v-for=" in [1, 2, 3, 4, 5, 6, 7, 8, 9]">
      <nut-skeleton width="90vw" height="20px" title animated avatarSize="40px" row="2">
      </nut-skeleton>
    </view>
    <!-- 翻页 -->
    <nut-pagination class="pagination" v-if="!props.isLoading" v-model="pagination.page" mode="multi"
      :total-items="props.totalCount" :items-per-page="pagination.limit" @change="pageTurning" />
  </view>
</template>

<script lang="ts" setup>
import { Datum } from '@/api';
import Taro from '@tarojs/taro'
import { Del } from "@nutui/icons-vue-taro";

const emit = defineEmits<{
  pageTurning: [number],
}>()

const props = defineProps<{
  data: Datum[],
  isLoading: Boolean,
  totalCount: number,
  pagination: { page: number, limit: number }
}>()

const goThread = (id: number) => {
  Taro.navigateTo({
    url: `/pages/thread/thread?id=${id}`,
  })
}

const deleteMessage = () => {
  console.log('删除消息')
  // TODO: 删除消息
}

const pageTurning = (page: number): void => {
  console.log('翻页', page)
  emit('pageTurning', page)
}
</script>

<style lang="scss">
.message-thread-page {
  .message-list {
    .info-desc {
      margin-left: 10px;
      width: 100%;
      display: flex;
      justify-content: space-between;

      .nickname {
        color: #333;
      }
    }

    .message-content {
      display: block;
      width: 100%;
      font-size: 1.2rem;

      .reply-info {
        display: flex;

        .title {
          color: #999;
          white-space: nowrap;
        }

        .content {
          color: #333;
          /** 最多显示两行，超出显示省略号 **/
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
      }

      .thread-title {
        display: block;
        background-color: #f8f8f8;
        color: #333;
        border-radius: 4px;
        padding: 10px 10px;
        margin-top: 10px;
      }
    }

  }

  .skeleton-container {
    margin-top: 2rem;
    margin-left: 5vw;
  }

  .pagination {
    display: flex;
    justify-content: center;
    padding-bottom: 4rem;
  }
}
</style>