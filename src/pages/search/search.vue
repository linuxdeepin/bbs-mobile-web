<template>
    <nut-config-provider :theme="config.theme" class="search-page">
        <NavH5 title="搜索" />
        <!-- TODO autofocus 属性在h5环境会导致页面有卡顿的情况 -->
        <nut-searchbar v-model="keyword" autofocus @search="searchSubmit" @clear="showHistory = true">
            <template #leftin>
                <Search2 />
            </template>
            <template #rightout>
                <nut-button type="primary" @click="searchSubmit">搜索</nut-button>
            </template>
        </nut-searchbar>
        <view>
            <!-- 搜索历史 -->
            <view v-if="showHistory">
                <template v-if="searchStore.history.length">
                    <view class="history-title">
                        <view>搜索历史</view>
                        <nut-button size="mini" type="default" @click="searchStore.cleanHistory()">清空</nut-button>
                    </view>
                    <view class="history-list">
                        <nut-tag v-for="word in searchStore.history" type="primary"
                            @click="keyword = word; searchSubmit()">
                            {{ word }}
                        </nut-tag>
                    </view>
                </template>
            </view>
            <!-- 搜索结果 -->
            <view class="result-list" v-else-if="!loading">
                <template v-for="item in searchResult.data">
                    <nut-cell-group>
                        <!-- 帖子标题 -->
                        <nut-cell class="thread-title" desc-text-align="left" is-link @click="goThread(item.id)">
                            <template #title>
                                <view v-html="item.subject"></view>
                            </template>
                        </nut-cell>
                        <!-- 帖子信息 -->
                        <nut-cell class="thread-content" desc-text-align="left">
                            <template #desc>
                                <view v-html="item.content"></view>
                            </template>
                        </nut-cell>
                    </nut-cell-group>
                </template>
                <!-- 分页 -->
                <view class="pagination" v-if="keyword.length && searchResult.data.length">
                    <nut-pagination v-model="page" mode="multi" :total-items="searchResult.total"
                        :items-per-page="pageLimit" />
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
    </nut-config-provider>
</template>

<script lang="ts" setup>
import { SearchThread } from '@/api'
import Taro from '@tarojs/taro'
import { Search2 } from "@nutui/icons-vue-taro";
import { useSearchStore, useConfigStore } from '@/stores'
import { ref } from 'vue';
import { computedAsync } from '@vueuse/core';
import NavH5 from "@/widgets/navigation-h5.vue";

const searchStore = useSearchStore()
const config = useConfigStore()

// 显示搜索历史
const showHistory = ref(true)
// 搜索关键字
const keyword = ref("")
// 提交关键字后再进行搜索
const keywordSubmit = ref("")
// 当前页
const page = ref(1)
// 页大小
const pageLimit = ref(10)

const loading = ref(false)

const searchResult = computedAsync(() => {
    if (keywordSubmit.value === '') {
        return { data: [], total: 0 }
    }
    return SearchThread(keywordSubmit.value, page.value, pageLimit.value).then(resp => {
        return {
            data: resp.data,
            total: Number(resp.headers["x-total-count"] || 0)
        }
    })
}, undefined, { evaluating: loading })

// 新的关键字搜索
const searchSubmit = () => {
    page.value = 1
    showHistory.value = false
    keywordSubmit.value = keyword.value
    searchStore.addHistory(keyword.value)
}

// 跳转到帖子详情
const goThread = (id: number) => {
    Taro.navigateTo({
        url: `/pages/thread/thread?id=${id}`,
    })
}

</script>

<style lang="scss">
.search-page {
    .nut-searchbar {
        .nut-searchbar__search-input {
            color: var(--page-bg-color);
        }
    }

    .search-keyword {
        display: inline;
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