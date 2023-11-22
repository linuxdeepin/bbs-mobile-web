<template>
    <view class="navigation" :style="{ height: navigationHeight + 'px' }">
        <nut-searchbar :style="{
            width: searchWidth + 'px',
            height: searchHeight + 'px',
            marginTop: searchMarginTop + 'px',
        }" placeholder="搜点什么" :disabled="true" v-model="searchKeyword" @click="searchClick()"></nut-searchbar>
    </view>
    <view :style="{ marginTop: navigationHeight + 'px' }"></view>
</template>

<script lang="ts" setup>


import Taro from '@tarojs/taro'
import { ref } from 'vue';

const statusBarHeight = ref(0)
const navigationHeight = ref(0)
const searchMarginTop = ref(0)
const searchWidth = ref(0)
const searchHeight = ref(0)
Taro.getSystemInfo().then((result) => {
    statusBarHeight.value = result.statusBarHeight || 0
    const rect = Taro.getMenuButtonBoundingClientRect()
    searchMarginTop.value = rect.top
    searchWidth.value = rect.left
    searchHeight.value = rect.height
    navigationHeight.value = rect.top + rect.height + (rect.top - statusBarHeight.value) * 2
})

const searchKeyword = ref('')
const searchClick = () => {
    Taro.navigateTo({ url: "/pages/search/search" })
}
</script>


<style lang="scss">
.navigation {
    top: 0;
    position: fixed;
    width: 100vw;
    background-color: white;
    z-index: 999;
}
</style>