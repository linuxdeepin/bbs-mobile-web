<template>
    <view>
        <nut-row v-if="thread.loaded && thread.item">
            <nut-col span="22" offset="1">
                <view>
                    <nut-cell-group>
                        <nut-cell class="thread" desc-text-align="left">
                            <template #desc>
                                <span class="module">【软件开发】</span>
                                <span class="title">
                                    {{ thread.item.subject }}
                                </span>
                            </template>
                            <template #icon>
                                <img v-if="thread.item.top" style="width:20px;height: 20px;" :src="TopIcon" />
                            </template>
                        </nut-cell>
                        <nut-cell class="info" desc-text-align="left">
                            <template #icon>
                                <nut-avatar size="large" shape="round">
                                    <img :src="thread.item.post.user.avatar" />
                                </nut-avatar>
                            </template>
                            <template #desc>
                                <view class="info-desc">
                                    <span class="nickname">
                                        {{ thread.item.post.user.nickname }}
                                    </span>
                                    <span>
                                        发帖时间： {{ thread.item.created_at.slice(0, 16) }}
                                    </span>
                                </view>

                            </template>
                        </nut-cell>
                    </nut-cell-group>
                </view>
            </nut-col>
            <nut-col span="22" offset="1">
                <view class="thread-message html-message taro_html vditor-reset" v-html="thread.item.post.message"></view>
            </nut-col>

            <nut-col span="22" offset="1">
                <nut-divider class="post-divider" content-position="left">回帖分割线</nut-divider>
            </nut-col>
            <template v-if="thread.postLoaded">
                <template v-if="thread.postCount > 0">
                    <nut-col v-for="post in thread.posts" span="22" offset="1">
                        <view>
                            <nut-cell-group class="post-main">
                                <nut-cell class="info" desc-text-align="left">
                                    <template #icon>
                                        <nut-avatar size="small" shape="round">
                                            <img :src="post.user.avatar" />
                                        </nut-avatar>
                                    </template>
                                    <template #desc>
                                        <view class="info-desc">
                                            <span class="nickname"> {{ post.user.nickname }}</span>
                                            <span>
                                                回复时间： {{ post.created_at.slice(0, 16) }}
                                            </span>
                                        </view>
                                    </template>
                                </nut-cell>
                                <nut-cell class="content" desc-text-align="left">
                                    <template #desc>
                                        <view class="post-message html-message taro_html vditor-reset"
                                            v-html="post.message">
                                        </view>
                                    </template>
                                </nut-cell>
                            </nut-cell-group>
                        </view>
                    </nut-col>

                    <nut-col v-if="thread.postCount > thread.postLimit" span="24">
                        <div class="pagination">
                            <nut-pagination v-model="thread.page" mode="simple" :total-items="thread.postCount"
                                :items-per-page="thread.postLimit" @change="thread.pageChange" />
                        </div>
                    </nut-col>
                </template>
                <template v-else>
                    <nut-col span="24">
                        <nut-empty description="暂无回复，快来抢沙发吧"></nut-empty>
                    </nut-col>
                </template>
            </template>
            <template v-else>
                <view class="skeleton-container" v-for=" in [1, 2, 3, 4, 5, 6, 7]">
                    <nut-skeleton width="70vw" height="20px" title animated avatar avatarSize="40px" row="2">
                    </nut-skeleton>
                </view>
            </template>
            <nut-col span="20" offset="2" v-if="false">
                <nut-divider />
                <view>
                    <nut-form>
                        <nut-form-item>
                            <nut-textarea v-model="value" limit-show max-length="1000" />
                        </nut-form-item>
                    </nut-form>
                </view>
            </nut-col>
        </nut-row>
        <view v-else>
            <view class="skeleton-container">
                <nut-skeleton width="70vw" height="20px" title animated avatar avatarSize="60px" row="10">
                </nut-skeleton>

                <view class="skeleton-container" v-for=" in [1, 2, 3, 4, 5, 6, 7]">
                    <nut-skeleton width="70vw" height="20px" title animated avatar avatarSize="40px" row="2">
                    </nut-skeleton>
                </view>
            </view>
        </view>
    </view>
</template>
<script lang="ts" setup>

import Taro from '@tarojs/taro'
import { watch, ref } from 'vue';

import TopIcon from '../../assets/top.svg'
import { useThreadStore } from '../../stores'
import { TaroEvent } from '@tarojs/components';


if (process.env.TARO_ENV === 'h5') {
    // 加载vditor样式
    require('vditor/dist/index.css')
} else {
    // 加载html5样式
    require('@tarojs/taro/html.css')
}
const thread = useThreadStore()

const imageUrls = [] as string[]

const option = (Taro as any).options

// 处理图片
option.html.transformElement = (el: HTMLElement) => {
    if (el.nodeName === 'image') {
        // 图片高度自动缩放
        el.setAttribute('mode', 'widthFix')
        const src = el.getAttribute("src")
        if (!src) {
            return
        }
        // 表情图片拼接服务器地址
        if (src.startsWith("assets")) {
            el.setAttribute('src', thread.server + "/" + src)
        } else {
            // 图片预览
            el.addEventListener("load", (event: TaroEvent<HTMLImageElement>) => {
                console.log(event)
                el.style.width = event.detail.width + "px"
                imageUrls.push(src)
            })
            el.addEventListener("tap", () => {
                console.log("preview image", imageUrls)
                Taro.previewImage({
                    current: src,
                    urls: imageUrls
                })
            })
        }
    }
    return el
}

const instance = Taro.getCurrentInstance()
const threadID = instance.router ? Number(instance.router.params['id'] || 0) : 0
thread.load(threadID);
watch(() => thread.page, () => {
    Taro.nextTick(() => {
        Taro.pageScrollTo({
            selector: ".post-divider",
            duration: 300,
            offsetTop: -20
        })
    })
})
Taro.nextTick(() => {
    Taro.pageScrollTo({
        scrollTop: 0,
    })
})
const value = ref("")

</script>
<style lang="scss">
.info-desc {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
}

.nickname {
    min-width: 70vw;
    max-width: 70vw;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    vertical-align: bottom;
}

.html-message {
    .emoji {
        width: 120rpx;
        height: 120rpx;
    }

    .h5-img {
        max-width: 100%;
    }
}


.content>view {
    max-width: 100%;
}

.pagination {
    display: flex;
    justify-content: center;
    padding-bottom: 10px;
}

.skeleton-container {
    margin-top: 20px;
    margin-left: 5vw;
    margin-bottom: 50px;
}
</style>