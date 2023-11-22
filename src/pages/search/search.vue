<template>
    <nut-searchbar v-model="keyword" autofocus="true" @search="searchSubmit" @clear="showHistory = true">
        <template #leftin>
            <Search2 />
        </template>
        <template #rightout>
            <nut-button type="primary" @click="searchSubmit">搜索</nut-button>
        </template>
    </nut-searchbar>
    <view class="search-page">
        <!-- 搜索历史 -->
        <view v-if="showHistory">
            <template v-if="searchStore.history.length">
                <view class="history-title">
                    <view>搜索历史</view>
                    <nut-button size="mini" type="default" @click="searchStore.cleanHistory()">清空</nut-button>
                </view>
                <view class="history-list">
                    <nut-tag v-for="word in searchStore.history" type="primary" @click="keyword = word; searchSubmit()">
                        {{ word }}
                    </nut-tag>
                </view>
            </template>
        </view>
        <!-- 搜索结果 -->
        <view class="result-list" v-else-if="searchStore.loaded">
            <template v-for="item in searchStore.data">
                <nut-cell-group>
                    <!-- 帖子标题 -->
                    <nut-cell class="thread-title" desc-text-align="left" is-link @click="goThread(item)">
                        <template #desc>
                            <span class="title">
                                <view v-html="item.subject"></view>
                            </span>
                        </template>
                    </nut-cell>
                    <!-- 帖子信息 -->
                    <nut-cell class="thread-content" desc-text-align="left">
                        <template #desc>
                            <span class="content">
                                <view v-html="item.content"></view>
                            </span>
                        </template>
                    </nut-cell>
                </nut-cell-group>
            </template>
            <!-- 分页 -->
            <view class="pagination" v-if="keyword.length && searchStore.count">
                <nut-pagination v-model="page" mode="multi" :total-items="searchStore.count" :items-per-page="pageLimit"
                    @change="pageChange()" />
            </view>
            <!-- 搜索结果空白 -->
            <view v-else>
                <nut-empty description="没有搜索结果"></nut-empty>
            </view>
        </view>
        <!-- 加载骨架图 -->
        <view v-else class="skeleton-container" v-for=" in [1, 2, 3, 4, 5, 6, 7]">
            <nut-skeleton width="90vw" height="20px" title animated avatarSize="40px" row="2">
            </nut-skeleton>
        </view>
    </view>
</template>

<script lang="ts" setup>
import Taro, { useDidShow } from '@tarojs/taro'
import { Home, My2, Search2 } from "@nutui/icons-vue-taro";
import { useSearchStore } from '@/stores'
import { onMounted, ref } from 'vue';

// onMounted(() => {
//     console.log("mounted")
//     const page = Taro.getCurrentInstance().page;
//     if (page?.selectComponent) {
//         console.log("mounted")
//         const el = page.selectComponent(".h5-input")
//         console.log("select", el)
//     }
// })
let searchStore = useSearchStore()

searchStore.init()

const autofocus = ref(true)
// 显示搜索历史
const showHistory = ref(true)
// 搜索关键字
const keyword = ref("")
// 当前页
const page = ref(1)
// 页大小
const pageLimit = ref(10)

// 新的关键字搜索
const searchSubmit = () => {
    autofocus.value = false
    showHistory.value = false
    searchStore.addHistory(keyword.value)
    console.log("search", keyword.value, page.value, pageLimit.value)
    page.value = 1
    searchStore.getPageData(keyword.value, (page.value - 1) * pageLimit.value, pageLimit.value)
}
// 搜索结果翻页
const pageChange = () => {
    console.log("search", keyword.value, page.value, pageLimit.value)
    searchStore.getPageData(keyword.value, (page.value - 1) * pageLimit.value, pageLimit.value)
}

// 跳转到帖子详情
const goThread = (item: typeof searchStore.data[0]) => {
    Taro.navigateTo({
        url: `/pages/thread/thread?id=${item.id}`,
    })
}

</script>

<style lang="scss">
.search-page {
    .search-keyword {
        color: red;
    }

    .pagination {
        display: flex;
        justify-content: center;
        padding-bottom: 1rem;
    }

    .skeleton-container {
        margin-top: 1rem;
        margin-left: 5vw;
    }

    .history-title {
        display: flex;
        width: 90vw;
        margin: 1rem auto;
        justify-content: space-between;
    }

    .history-list {
        display: flex;
        flex-wrap: wrap;
        width: 90vw;
        margin: auto;
        gap: 1rem;
    }
}
</style>