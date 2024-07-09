<template>
  <nut-tabbar v-model="tabs.active" bottom @tab-switch="tabSwitch">
    <nut-tabbar-item tab-title="首页" name="index">
      <template #icon>
        <Home></Home>
      </template>
    </nut-tabbar-item>
    <nut-tabbar-item tab-title="消息" name="message">
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
import { useTabsStore, useAccountStore } from '@/stores'
import { Home, Message, My2 } from "@nutui/icons-vue-taro"

const emit = defineEmits<{
  tabChange: [],
}>()
const account = useAccountStore()
const tabs = useTabsStore()

const tabSwitch = (item: Parameters<typeof tabs.change>[0]) => {
  if (item.name === 'message' && !account.is_login) {
    account.gotoLogin();
    return;
  }

  emit('tabChange');
  tabs.change(item);
}
</script>