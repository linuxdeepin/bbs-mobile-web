<template>
  <view class="level-container">
    <nut-tag class="tag" v-if="groupName !== ''" color="#1979ff" plain>{{ groupName }}</nut-tag>
    <!-- tags -->
    <nut-tag v-for="tag in userTags" class="tag" :color="tag.color" plain>{{ tag.text }}</nut-tag>
  </view>
</template>

<script lang="ts" setup>
import { UserTags } from '@/api';

const { groupName = '', userTags = [] } = defineProps<{
  groupName: string,
  userTags: UserTags[],
}>()

</script>

<style lang="scss">
.level-container {
  display: flex;
  align-items: center;
  margin: 10rpx 0;

  .tag {
    margin-right: 10rpx;
  }
}
</style>