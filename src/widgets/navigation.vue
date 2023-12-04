<template>
    <view v-if="showSearch" class="navigation" :style="{ height: navigationHeight + 'px' }">
        <nut-searchbar :style="{
            width: searchWidth + 'px',
            height: searchHeight + 'px',
            marginTop: searchMarginTop + 'px',
        }" placeholder="搜点什么" :readonly="true" v-model="searchKeyword" @click="searchClick()"></nut-searchbar>
    </view>
    <view :style="{ marginTop: navigationHeight + 'px' }"></view>
</template>

<script lang="ts" setup>


import Taro from '@tarojs/taro'
import { ref } from 'vue';

const statusBarHeight = ref(0)
const navigationHeight = ref(0)

const showSearch = ref(false)
const searchMarginTop = ref(0)
const searchWidth = ref(0)
const searchHeight = ref(0)

const searchKeyword = ref('')
const searchClick = () => {
    Taro.navigateTo({ url: "/pages/search/search" })
}

const props = defineProps({ showSearch: Boolean })

if (props.showSearch) {
    showSearch.value = true
    Taro.getSystemInfo().then((result) => {
        console.log("system info", result)
        if (process.env.TARO_ENV === 'weapp') {
            statusBarHeight.value = result.statusBarHeight || 0
            const rect = Taro.getMenuButtonBoundingClientRect()
            searchMarginTop.value = rect.top
            searchWidth.value = rect.left
            searchHeight.value = rect.height
            navigationHeight.value = rect.top + rect.height + (rect.top - statusBarHeight.value) * 2
        }
        // h5页面需要自己做导航栏
        if (process.env.TARO_ENV === 'h5') {
            navigationHeight.value = 45
            searchHeight.value = 45
            searchWidth.value = result.screenWidth
        }
    })
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