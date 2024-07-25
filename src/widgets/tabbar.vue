<template>
  <nut-tabbar v-model="tabs.active" bottom @tab-switch="tabSwitch">
    <nut-tabbar-item tab-title="首页" name="index">
      <template #icon>
        <Home></Home>
      </template>
    </nut-tabbar-item>
    <nut-tabbar-item tab-title="发帖" name="posting">
      <template #icon>
        <Edit></Edit>
      </template>
    </nut-tabbar-item>
    <nut-tabbar-item tab-title="消息" name="message" :value="tabs.messageCount">
      <template #icon>
        <Message></Message>
      </template>
    </nut-tabbar-item>
    <nut-tabbar-item tab-title="我的" name="account">
      <template #icon>
        <My2></My2>
      </template>
    </nut-tabbar-item>
  </nut-tabbar>
</template>

<script lang="ts" setup>
import { MessageCount } from '@/api';
import { useDidShow } from '@tarojs/taro'
import { useTabsStore, useAccountStore } from '@/stores'
import { Home, Message, My2, Edit } from "@nutui/icons-vue-taro"

const emit = defineEmits<{
  tabChange: [],
}>()
const account = useAccountStore()
const tabs = useTabsStore()

useDidShow(async () => {
  if (!account.is_login) return;
  const res = await MessageCount()
  const { at_msg_count, letter_msg_count, post_msg_count, sys_msg_count, thread_msg_count } = res.data.data
  tabs.messageCount = at_msg_count + letter_msg_count + post_msg_count + sys_msg_count + thread_msg_count
})

const tabSwitch = (item: Parameters<typeof tabs.change>[0]) => {
  if ((item.name === 'message' || item.name === 'posting') && !account.is_login) {
    account.gotoLogin();
    return;
  }

  emit('tabChange');
  tabs.change(item);
}
</script>