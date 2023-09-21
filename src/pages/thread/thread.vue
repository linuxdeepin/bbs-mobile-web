<template>
    <nut-row v-if="thread.loaded && thread.item">
        <nut-col span="24">
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
                            <img style="width:20px;height: 20px;" :src="thread.item.post.user.avatar" />
                        </template>
                        <template #desc>
                            <span class="nickname"> {{ thread.item.post.user.nickname }}</span>
                            <span>
                                发帖时间： {{ thread.item.created_at.slice(0, 16) }}
                            </span>
                        </template>
                    </nut-cell>
                </nut-cell-group>
            </view>
        </nut-col>
        <nut-col span="22" offset="1">
            <view class="html-message taro_html" v-html="thread.item.post.message"></view>
        </nut-col>

        <template v-for="post in thread.posts">
            <nut-col span="20" offset="2">
                <view>
                    <nut-cell-group class="post-main">
                        <nut-cell class="info" desc-text-align="left">
                            <template #icon>
                                <img style="width:20px;height: 20px;" :src="post.user.avatar" />
                            </template>
                            <template #desc>
                                <span class="nickname"> {{ post.user.nickname }}</span>
                                <span>
                                    回复时间： {{ post.created_at.slice(0, 16) }}
                                </span>
                            </template>
                        </nut-cell>

                        <nut-cell class="content" desc-text-align="left">
                            <template #desc>
                                <view class="html-message taro_html" v-html="post.message"></view>
                            </template>
                        </nut-cell>
                    </nut-cell-group>
                </view>
            </nut-col>
        </template>

        <nut-col v-if="thread.postCount > thread.postLimit" span="20" offset="6">
            <nut-pagination v-model="thread.page" mode="simple" :total-items="thread.postCount"
                :items-per-page="thread.postLimit" @change="thread.pageChange" />
        </nut-col>

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
</template>
<script lang="ts">

import Taro from '@tarojs/taro'
import { defineComponent, ref } from 'vue';

import TopIcon from '../../assets/top.svg'

import { useThreadStore } from '../../stores'
import { watch } from 'vue';


export default defineComponent({
    setup() {
        // 加载html5样式
        if (process.env.TARO_ENV !== 'h5') {
            require('@tarojs/taro/html.css')
        }
        // 处理图片
        (Taro as any).options.html.transformElement = (el: HTMLElement) => {
            if (el.nodeName === 'image') {
                // 图片高度自动缩放
                el.setAttribute('mode', 'widthFix')

                const src = el.getAttribute("src")
                if (!src) {
                    return
                }
                // 表情图片
                if (src.startsWith("assets")) {
                    el.setAttribute('src', process.env.SERVER + "/" + src)
                } else {
                    el.addEventListener("tap", () => {
                        Taro.previewImage({
                            current: src,
                            urls: [src]
                        })
                    })
                }
            }
            return el
        }
        const instance = Taro.getCurrentInstance()
        const threadID = instance.router ? Number(instance.router.params['id'] || 0) : 0
        const thread = useThreadStore()
        thread.load(threadID)
        watch(() => thread.page, () => {
            Taro.pageScrollTo({
                selector: ".post-main",
                duration: 300
            })
        })
        const value = ref("")
        return { TopIcon, value, thread }
    }
})

</script>
<style lang="scss">
.thread span {
    display: inline;
}

.info span {
    display: inline-block;
}

.nickname {
    min-width: 30vw;
    max-width: 30vw;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    vertical-align: bottom;
}

.html-message .emoji {
    width: 120rpx;
    height: 120rpx;
}
</style>