<template>
  <view class="level-container">
    <nut-tag class="tag" v-if="userGroupName !== ''" color="#1979ff" plain>{{ userGroupName }}</nut-tag>
    <!-- tags -->
    <template v-for="tag in tags">
      <nut-tag class="tag" :color="tag.color" plain>{{ tag.text }}</nut-tag>
    </template>
  </view>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { GetUserTag, UserTags, GetUserInfo } from '@/api';

const props = defineProps<{
  userId: number,
}>()

const tags = ref<UserTags[]>([])
const userGroupName = ref("")

onMounted(async () => {
  const res = await GetUserTag(props.userId)
  // 只保留lang 为 zh_CN的tag
  tags.value = res.data.filter(tag => tag.lang === 'zh_CN')
  const userInfo = await GetUserInfo(props.userId)
  userGroupName.value = userInfo.data.group_name
})
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