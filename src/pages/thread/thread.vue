<template>
    <view class="thread-page">
        <nut-row v-if="!infoLoading && threadInfo">
            <!-- 标题 -->
            <nut-col span="22" offset="1">
                <view>
                    <nut-cell-group>
                        <nut-cell class="thread" desc-text-align="left">
                            <template #desc>
                                <span class="module">【{{ threadInfo.type.name }}】</span>
                                <span class="title">
                                    {{ !banUser ? threadInfo.subject : '用户被禁言，该内容已隐藏' }}
                                </span>
                                <nut-tag class="resolved" v-if="threadResolved" plain color="green">已解决</nut-tag>
                            </template>
                            <template #icon>
                                <img v-if="threadInfo.top && !banUser" style="width:20px;height: 20px;"
                                    :src="TopIcon" />
                            </template>
                        </nut-cell>
                        <nut-cell class="info" desc-text-align="left">
                            <template #icon>
                                <nut-avatar size="large" shape="round"
                                    @click="Taro.navigateTo({ url: `/pages/user/user?id=${threadInfo.post.user.id}` })">
                                    <img :src="threadInfo.post.user.avatar" />
                                </nut-avatar>
                            </template>

                            <template #desc>
                                <div class="info-desc">
                                    <view class="info">
                                        <span class="nickname"> {{ threadInfo.post.user.nickname }} </span>
                                        <img class="level" :src="threadInfo.user.levels.level_icon" />
                                    </view>
                                    <Tags :user-id="threadInfo.user_id" />
                                    <span class="stat">
                                        发帖时间： {{ timeFormat(threadInfo.created_at) }}
                                    </span>
                                </div>
                            </template>
                        </nut-cell>
                    </nut-cell-group>
                </view>
            </nut-col>
            <!-- 主题 -->
            <nut-col span="22" offset="1">
                <view v-if="!banUser" class="thread-message html-message taro_html vditor-reset"
                    @click="htmlClick($event)" v-html="threadInfo.post.message"></view>
                <view v-else>用户被禁言，该内容已隐藏</view>
            </nut-col>
            <!-- 投票 -->
            <Vote v-if="threadInfo.is_poll" :thread-id="threadInfo.id"
                :is-poll-expired="threadInfo.poll_list.poll_expire" :is-multiple="threadInfo.poll_list.multiple"
                :max-choices="threadInfo.poll_list.maxchoices" :voter-number="threadInfo.poll_list.voters_number"
                :poll-option-ids="threadInfo.poll_list.polloptionids"
                :forum-polloption="threadInfo.poll_list.forum_polloption" @login="showLoginDialog = true"
                @voting="threadRefresh++" />
            <!-- 帖子操作栏 -->
            <ThreadOp v-model:thread-info="threadInfo" v-model:show-login-dialog="showLoginDialog"
                v-model:thread-refresh="threadRefresh" v-model:thread-resolved="threadResolved"
                v-model:thread-closed="threadClosed" :is-moderator="isModerator" />
            <!-- 分割线 -->
            <nut-col span="22" offset="1">
                <nut-divider class="post-divider" content-position="left">
                    回帖分割线
                </nut-divider>
            </nut-col>

            <!-- 精选列表 -->
            <template v-if="!winnowLoading && winnowPosts">
                <template v-if="winnowPosts.data.length">
                    <nut-col span="22" offset="1">精选回复</nut-col>
                    <nut-col v-for="(post, index) in winnowPosts.data" span="22" offset="1">
                        <nut-cell-group class="post-main">
                            <nut-cell class="info" desc-text-align="left">
                                <template #icon>
                                    <nut-avatar size="small" shape="round"
                                        @click="Taro.navigateTo({ url: `/pages/user/user?id=${post.user.id}` })">
                                        <img :src="post.user.avatar" />
                                    </nut-avatar>
                                </template>
                                <template #desc>
                                    <view class="post-desc">
                                        <view class="info-desc">
                                            <span class="nickname"> {{ post.user.nickname }}</span>
                                            <span>
                                                {{ (pagination.page - 1) * pagination.limit + index + 1 }}楼
                                                回复时间： {{ timeFormat(post.created_at) }}
                                            </span>
                                        </view>
                                    </view>
                                </template>
                            </nut-cell>
                            <nut-cell class="content" desc-text-align="left">
                                <template #desc>
                                    <view class="son-post" v-if="post.son_post?.id">
                                        <span class="nickname"> {{ post.son_post.user.nickname }}：</span>
                                        <template v-if="post.user.state === 0 || post.user.state === 1">
                                            <view v-if="post.son_post.deleted_at === null"
                                                class="post-message html-message taro_html vditor-reset"
                                                @click="htmlClick($event)" v-html="post.son_post.message">
                                            </view>
                                            <view v-else
                                                class="post-message html-message taro_html vditor-reset del-message">
                                                该评论已删除!
                                            </view>
                                        </template>

                                        <view v-else-if="post.user.state === 2"
                                            class="post-message html-message taro_html vditor-reset del-message">
                                            用户被禁言，该内容已隐藏
                                        </view>
                                    </view>
                                    <template v-if="post.user.state === 0 || post.user.state === 1">
                                        <view v-if="post.deleted_at === null"
                                            class="post-message html-message taro_html vditor-reset"
                                            @click="htmlClick($event)" v-html="post.message">
                                        </view>
                                        <view v-else
                                            class="post-message html-message taro_html vditor-reset del-message">
                                            该评论已删除!
                                        </view>
                                    </template>
                                    <template v-else-if="post.user.state === 2">
                                        <view class="post-message html-message taro_html vditor-reset del-message">
                                            用户被禁言，该内容已隐藏
                                        </view>
                                    </template>
                                </template>
                            </nut-cell>
                        </nut-cell-group>
                    </nut-col>
                </template>
            </template>

            <!-- 回帖列表 -->
            <template v-if="!postLoading && threadPosts">
                <template v-if="threadPosts.total_count > 0">
                    <nut-col span="22" offset="1">所有回复</nut-col>
                    <nut-col v-for="(post, index) in threadPosts.data" span="22" offset="1">
                        <view :class="'.post-id-' + post.id"></view>
                        <view>
                            <nut-cell-group class="post-main">
                                <nut-cell class="info" desc-text-align="left">
                                    <template #icon>
                                        <nut-avatar size="small" shape="round"
                                            @click="Taro.navigateTo({ url: `/pages/user/user?id=${post.user.id}` })">
                                            <img :src="post.user.avatar" />
                                        </nut-avatar>
                                    </template>
                                    <template #desc>
                                        <view class="post-desc">
                                            <view class="info-desc">
                                                <view class="info">
                                                    <span class="nickname"> {{ post.user.nickname }}</span>
                                                    <img class="level" :src="post.user.levels.level_icon" />
                                                    <Tags :user-id="post.user.id" />
                                                </view>
                                                <span>
                                                    {{ (pagination.page - 1) * pagination.limit + index + 1 }}楼
                                                    回复时间： {{ timeFormat(post.created_at) }}
                                                </span>
                                            </view>
                                        </view>
                                    </template>
                                </nut-cell>
                                <nut-cell class="content" desc-text-align="left">
                                    <template #desc>
                                        <view class="son-post" v-if="post.son_post?.id">
                                            <span class="nickname"> {{ post.son_post.user.nickname }}：</span>
                                            <template v-if="post.user.state === 0 || post.user.state === 1">
                                                <view v-if="post.son_post.deleted_at === null"
                                                    class="post-message html-message taro_html vditor-reset"
                                                    @click="htmlClick($event)" v-html="post.son_post.message">
                                                </view>
                                                <view v-else
                                                    class="post-message html-message taro_html vditor-reset del-message">
                                                    该评论已删除!
                                                </view>
                                            </template>

                                            <view v-else-if="post.user.state === 2"
                                                class="post-message html-message taro_html vditor-reset del-message">
                                                用户被禁言，该内容已隐藏
                                            </view>
                                        </view>
                                        <template v-if="post.user.state === 0 || post.user.state === 1">
                                            <view v-if="post.deleted_at === null"
                                                class="post-message html-message taro_html vditor-reset"
                                                @click="htmlClick($event)" v-html="post.message">
                                            </view>
                                            <view v-else
                                                class="post-message html-message taro_html vditor-reset del-message">
                                                该评论已删除!
                                            </view>
                                        </template>
                                        <template v-else-if="post.user.state === 2">
                                            <view class="post-message html-message taro_html vditor-reset del-message">
                                                用户被禁言，该内容已隐藏
                                            </view>
                                        </template>
                                    </template>
                                </nut-cell>
                                <nut-cell v-if="post.deleted_at === null" class="op">
                                    <view class="op-list">
                                        <view class="op-item" hover-class="btn-clicked" hover-stay-time="200"
                                            @click="likeBtnClicked(post)">
                                            <img :src="post.is_up ? UpFillIcon : UpIcon" />
                                            <text class="content">{{ `点赞${post.like_cnt}` }}</text>
                                        </view>
                                        <view class="op-item" hover-class="btn-clicked" hover-stay-time="200"
                                            @click="replyBtnClicked(post.id, post.post_user_id, post.user.nickname)">
                                            <img :src="CommentIcon" />
                                            <text class="content">回复</text>
                                        </view>
                                        <view
                                            v-if="account.is_login && account.user_info.id === post.post_user_id && post.deleted_at === null"
                                            class="op-item" hover-class="btn-clicked" hover-stay-time="200"
                                            @click="showDelPostDialog = true; userDelPostId = post.id">
                                            <img :src="DeleteIcon" />
                                            <text class="content">删除</text>
                                        </view>
                                        <!-- 版主管理按钮 -->
                                        <view v-if="account.is_login && isModerator" hover-class="btn-clicked"
                                            hover-stay-time="200" class="op-item right"
                                            @click="checkPostIsWinnow(post.id, post.post_user_id)">
                                            <img :src="ManagerIcon" />
                                            <text>管理</text>
                                        </view>
                                    </view>
                                </nut-cell>
                            </nut-cell-group>
                        </view>
                    </nut-col>
                    <!-- 只在最后一页显示 -->
                    <nut-col
                        v-if="interval && pagination.page === Math.ceil(threadPosts.total_count / pagination.limit) && !threadClosed">
                        <view class="refresh-tips">已开启自动刷新</view>
                    </nut-col>
                    <nut-col>
                        <div class="pagination">
                            <nut-pagination v-if="threadPosts.total_count > pagination.limit" span="24"
                                v-model="pagination.page" :total-items="threadPosts.total_count"
                                :items-per-page="pagination.limit" />
                        </div>
                    </nut-col>
                </template>
                <template v-else>
                    <nut-col span="24">
                        <nut-empty description="暂无回复，快来抢沙发吧"></nut-empty>
                    </nut-col>
                    <nut-col>
                        <view class="refresh-tips pagination">已开启自动刷新</view>
                    </nut-col>
                </template>
            </template>
            <template v-else>
                <view class="skeleton-container" v-for=" in [1, 2, 3, 4, 5, 6, 7]">
                    <nut-skeleton width="70vw" height="20px" title animated avatar avatarSize="40px" row="2">
                    </nut-skeleton>
                </view>
            </template>
            <!-- 自己回帖 -->
            <SendPost v-if="!threadClosed" v-model="isChooseImage" :info="threadInfo" :is-reply="isReply"
                :reply-id="replyId" :reply-user-id="replayUserId" :reply-nick-name="replyNickName"
                @login="showLoginDialog = true" @cancel-reply="cancelReply">
            </SendPost>
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
        <nut-dialog content="请先登录账号" v-model:visible="showLoginDialog" @ok="account.gotoLogin()" />
        <nut-dialog content="是否确认删除该条帖子" v-model:visible="showDelPostDialog" @ok="userDelPost" />

        <!-- 版主管理评论弹窗 -->
        <nut-action-sheet v-model:visible="moderatorPostAction.show" :menu-items="moderatorPostAction.items"
            @choose="$event.callback()" cancel-txt="取消" />

        <!-- 版主精选评论对话框 -->
        <nut-dialog v-model:visible="showModeratorWinnowDialog" :title="postIsWinnow ? '取消精选' : '精选'"
            :before-close="moderatorWinnowDialogClosed">
            <template #default>
                <nut-form ref="winnowFormRef" class="moderator-del-form" :model-value="winnowForm">
                    <nut-form-item prop="reason" label="说明" required :rules="[{ required: true, message: '请填写说明' }]">
                        <nut-input v-model="winnowForm.reason" placeholder="请输入操作说明" auto-focusd />
                    </nut-form-item>
                    <nut-form-item prop="notify">
                        <nut-checkbox v-model="winnowForm.notify">通知作者</nut-checkbox>
                    </nut-form-item>
                </nut-form>
            </template>
        </nut-dialog>
        <!-- 版主删除评论 -->
        <nut-dialog v-model:visible="showModeratorDelPostDialog" title='删除' :before-close="moderatorDelDialogClosed">
            <template #default>
                <nut-form ref="delFormRef" class="moderator-del-form" :model-value="delForm">
                    <nut-form-item prop="reason" label="说明" required :rules="[{ required: true, message: '请填写说明' }]">
                        <nut-input v-model="delForm.reason" placeholder="请填写操作说明" auto-focusd />
                    </nut-form-item>
                    <nut-form-item prop="notify">
                        <nut-checkbox v-model="delForm.notify">通知作者</nut-checkbox>
                    </nut-form-item>
                </nut-form>
            </template>
        </nut-dialog>
        <nut-toast :msg="prompt.toast.msg" v-model:visible="prompt.toast.visible" :type="prompt.toast.type"
            :duration="prompt.toast.duration" />
    </view>
</template>
<script lang="ts" setup>
import { watch, ref, watchEffect } from 'vue';
import Taro, { useShareAppMessage, useShareTimeline, useUnload, useDidShow, useDidHide } from '@tarojs/taro'
import TopIcon from '@/assets/top.svg'
import UpIcon from '@/assets/up.svg'
import UpFillIcon from '@/assets/up-fill.svg'
import DeleteIcon from '@/assets/delete.svg'
import CommentIcon from '@/assets/comment.svg'
import ManagerIcon from '@/assets/manager.svg'
import { useConfigStore, useAccountStore, usePromptStore } from '@/stores'
import { TaroEvent } from '@tarojs/components';
import { TaroElement } from '@tarojs/runtime';
import dayjs from 'dayjs'
import { Element } from '@tarojs/runtime/dist/dom-external/inner-html/parser';
import SendPost from './send-post.vue'
import Vote from './vote.vue'
import {
    apiServer,
    ThreadInfo,
    ThreadPostList,
    ThreadUP,
    ThreadInfoData,
    PostListResponse,
    DeleteThreadPost,
    DeleteThreadPostByModerator,
    ThreadUserList,
    GetUserInfo,
    WinnowThreadPostByModerator,
    WinnowThreadPostList
} from '@/api';
import { computedAsync } from "@vueuse/core";
import Tags from '@/widgets/tags.vue';
import ThreadOp from "./thread-op.vue"

if (process.env.TARO_ENV === 'h5') {
    // 加载vditor样式
    require('vditor/dist/index.css')
} else {
    // 加载html5样式
    require('@tarojs/taro/html.css')
}
const config = useConfigStore()
const account = useAccountStore()
const prompt = usePromptStore()

const imageUrls = [] as string[]

const option = (Taro as any).options

// 提示需要进行登陆
const showLoginDialog = ref(false)

// 处理html渲染，仅在小程序中生效
option.html.transformElement = (el: TaroElement, h5el: Element) => {
    el.setAttribute('data-tag', h5el.tagName)
    switch (el.nodeName) {
        case "text":
            if (h5el.tagName === "a") {
                // attributes 格式有些奇怪，像这样["href=\"https://xxxx"\"]，所以要进行预处理 
                h5el.attributes.forEach(attr => {
                    const arr = attr.split("=")
                    const key = arr[0]
                    const value = arr.slice(1).join("=").slice(1, -1)
                    el.setAttribute('data-' + key, value)
                })
            }
        case "image":
            // 图片高度自动缩放
            el.setAttribute('mode', 'widthFix')

            const src = el.getAttribute("src")
            if (!src) {
                break
            }
            // 表情图片拼接服务器地址
            if (src.startsWith("assets")) {
                el.setAttribute('src', apiServer + "/" + src)
                break
            }
            // 小程序图片不会自动显示宽度，在图片加载后设置图片显示真实宽度，超出屏幕的图片有样式中的 max-width 限制
            el.addEventListener("load", (event: TaroEvent<HTMLImageElement>) => {
                el.style.setProperty('width', event.detail.width + "px")
                imageUrls.push(src)
            }, null)
            // 图片点击预览
            el.addEventListener("tap", () => {
                console.log("preview image", imageUrls)
                isChooseImage.value = true
                Taro.previewImage({
                    current: src,
                    urls: imageUrls
                })
            }, null)
            break
    }
    return el
}
// 页面是否隐藏
const hidden = ref(false)
// 选择图片后不刷新页面
const isChooseImage = ref(false)
const instance = Taro.getCurrentInstance()
const threadID = ref(0)
const postId = ref(0)
const infoLoading = ref(true)
// 刷新帖子
const threadRefresh = ref(0)
const postRefresh = ref(0) // 便于手动触发更新
const postLoading = ref(true)
const pagination = ref({ page: 1, limit: 10 })
// 发帖的用户是否被禁言
const banUser = ref(false)
if (instance.router) {
    threadID.value = Number(instance.router.params['id'] || 0)
    postId.value = Number(instance.router.params['postId'] || 0)
    const offset = Number(instance.router.params['offset'] || 0)
    pagination.value.page = offset + 1
}

useUnload(() => {
    if (!instance.router)
        return
    clearInterval(interval.value)
    if (Number(instance.router.params['posting'] || 0)) {
        // 携带这个参数说明是从发帖页面跳转过来
        // 返回时需要多返回一步
        config.indexNeedRefresh = true
        Taro.navigateBack()
    }
})

useDidShow(() => {
    if (!isChooseImage) {
        // 登录成功后返回到帖子页面,刷新点赞和收藏状态
        threadRefresh.value++
        refreshScroll.value = false
        postRefresh.value++
    }
    isChooseImage.value = false
    hidden.value = false
})

useDidHide(() => {
    hidden.value = true
})

// 获取帖子数据
const threadInfo = ref<ThreadInfoData>()
// 帖子是否以解决
const threadResolved = ref(false)
// 帖子是否已关闭
const threadClosed = ref(false)
computedAsync(async () => {
    threadRefresh.value
    const { data } = await ThreadInfo(threadID.value)
    threadInfo.value = data.data
    const { data: userInfo } = await GetUserInfo(threadInfo.value.user_id)
    banUser.value = !userInfo.allow_speak
    for (let i = 0; i < threadInfo.value.attrs.length; i++) {
        if (threadInfo.value.attrs[i].name === "Resolved") {
            threadResolved.value = true
            break
        }
    }
    threadClosed.value = threadInfo.value.isclosed ? true : false
}, undefined, { evaluating: infoLoading })

// 当前登陆用户是否为当前帖子所属版块的版主
const isModerator = ref(false)
// 要删除的评论的ID
const delPostId = ref(0)
// 要删除的评论的作者id
const delPostUserId = ref(0)
// 版主删除评论对话框
const showModeratorDelPostDialog = ref(false)
const delFormRef = ref(null)
// 删除表单
const delForm = ref({
    reason: "",
    notify: false
})
const moderatorDelDialogClosed = async (action: string) => {
    if (!threadInfo.value)
        return
    if (action === "ok") {
        const result = await (delFormRef.value as any).validate()
        if (result.valid) {
            const { data } = await DeleteThreadPostByModerator({
                id: delPostId.value,
                forum_id: threadInfo.value?.forum_id,
                o_user_id: delPostUserId.value,
                note: delForm.value.reason,
                is_notify: delForm.value.notify ? 1 : 0
            })
            if (!data.code) {
                prompt.showToast("success", "删除成功")
                refreshScroll.value = false
                postRefresh.value++
                winnowPostsRefresh.value++
            }
            return true
        }
        return false
    } else {
        delForm.value.reason = ""
        delForm.value.notify = false
        return true
    }
}

// 版主管理评论
const showModeratorWinnowDialog = ref(false)
const winnowFormRef = ref(null)
const winnowForm = ref({
    reason: "",
    notify: true
})
const winnowLoading = ref(false)
const winnowPostsRefresh = ref(0)
// 判断是否已经精选 已精选 返回true ,否则返回false
const postIsWinnow = ref(false)
const checkPostIsWinnow = (postId, postUserId) => {
    delPostId.value = postId
    delPostUserId.value = postUserId
    postIsWinnow.value = winnowPosts.value.data.some(post => post.id === delPostId.value)
    console.log(postIsWinnow.value)
    moderatorPostAction.value.items[0].name = postIsWinnow.value ? "取消精选" : "精选"
    moderatorPostAction.value.show = true
}
const winnowPosts = computedAsync(() => {
    winnowPostsRefresh.value
    return WinnowThreadPostList(threadID.value).then(resp => { return resp.data })
}, undefined, { evaluating: winnowLoading })
const moderatorPostAction = ref({
    show: false,
    items: [
        {
            name: "精选", callback: () => {
                winnowForm.value = {
                    reason: "",
                    notify: true
                }
                showModeratorWinnowDialog.value = true
            }
        },
        {
            name: "删除", callback: () => {
                delForm.value = {
                    reason: "",
                    notify: false
                }
                showModeratorDelPostDialog.value = true
            }
        }]
})

const moderatorWinnowDialogClosed = async (action: string) => {
    if (!threadInfo.value)
        return
    if (action === "ok") {
        const result = await (winnowFormRef.value as any).validate()
        if (result.valid) {
            // 精选评论
            const { data } = await WinnowThreadPostByModerator({
                id: delPostId.value,
                forum_id: threadInfo.value.forum_id,
                o_user_id: delPostUserId.value,
                note: winnowForm.value.reason,
                is_notify: winnowForm.value.notify ? 1 : 0,

                top: postIsWinnow.value ? 0 : 1
            })
            if (!data.code) {
                if (postIsWinnow.value) {
                    prompt.showToast("success", "取消精选成功")
                } else {
                    prompt.showToast("success", "精选成功")
                }
                delPostId.value = 0
                winnowPostsRefresh.value++
                Taro.pageScrollTo({
                    selector: ".post-divider",
                    offsetTop: -100
                })
            }
            return true
        }
        return false
    } else {
        winnowForm.value.reason = ""
        winnowForm.value.notify = false
        return true
    }
}

// 判断当前用户是否为帖子所属版块的版主
computedAsync(async () => {
    if (!account.is_login || !threadInfo.value) {
        isModerator.value = false
        return
    }
    const { data } = await ThreadUserList(threadInfo.value.forum_id)
    isModerator.value = data.data.some(user => user.id === account.user_info.id)
})

// 当前是否是在回复别人的评论
const isReply = ref(false)
const replyId = ref(0)
const replayUserId = ref(0)
const replyNickName = ref("")

const replyBtnClicked = (id: number, postUserId: number, nickName: string) => {
    if (!account.is_login) {
        showLoginDialog.value = true
        return
    }
    if (threadClosed.value) {
        prompt.showToast("warn", "帖子已关闭")
        return
    }
    isReply.value = true
    replyId.value = id
    replayUserId.value = postUserId
    replyNickName.value = nickName
}
// 取消回复
const cancelReply = () => {
    isReply.value = false
    replyId.value = 0
    replayUserId.value = 0
    replyNickName.value = ""
}

// 获取回复数据
const threadPosts = ref<PostListResponse>()
// 刷新时是否滚动到回帖分割线
const refreshScroll = ref(true)
computedAsync(async () => {
    // 在回复时，需要手动刷新
    postRefresh.value
    const { data } = await ThreadPostList(threadID.value, {
        page: pagination.value.page,
        pageSize: pagination.value.limit,
    })
    threadPosts.value = data
}, undefined, { evaluating: postLoading })


// 点赞评论
const likeBtnClicked = async (post: PostListResponse["data"][0]) => {
    if (!account.is_login) {
        showLoginDialog.value = true
        return
    }
    const { data } = await ThreadUP(post.id, "pid")
    if (!data.code) {
        post.is_up = !post.is_up
        post.like_cnt += post.is_up ? 1 : -1
    }
}

// 翻页后滚动到回复分割线，如果是发帖后自动翻页则滚动到底部
const sendPostScroll = ref(false)
watch(threadPosts, (_, oldVal) => {
    if (oldVal == undefined) {
        // 如果路由参数中有postId，则滚动到指定位置
        if (postId.value) {
            Taro.nextTick(() => {
                Taro.createSelectorQuery().select(`.post-id-${postId.value}`).boundingClientRect().exec((res) => {
                    Taro.pageScrollTo({
                        scrollTop: res[0].top
                    })
                })
            })
        }
        return
    }

    Taro.nextTick(() => {
        if (intervalRefreshPost.value) {
            intervalRefreshPost.value = false
            return
        }
        if (sendPostScroll.value) {
            Taro.createSelectorQuery().select('.thread-page').boundingClientRect().exec((res) => {
                Taro.pageScrollTo({
                    scrollTop: res[0].height
                })
                sendPostScroll.value = false
            })
        } else if (refreshScroll.value) {
            Taro.pageScrollTo({
                selector: ".post-divider",
                offsetTop: -100
            })
        }
        refreshScroll.value = true
    })
})

// 渲染内容点击，在小程序中处理超链接
function htmlClick(event: MouseEvent) {
    const target = event.target as HTMLElement
    const dataset = target.dataset
    console.log("html click", { event, dataset })
    // 是html超链接被点击
    if (dataset["tag"] === "a") {
        const href = target.dataset["href"] || ''
        // 如果是点击的帖子链接，在小程序跳转，否则就复制链接
        if (href.includes("deepin.org")) {
            const result = href.match(/\/post\/(\d+)$/)
            if (result?.length == 2) {
                Taro.navigateTo({
                    url: `/pages/thread/thread?id=${result[1]}`,
                })
                return
            }
        }
        Taro.setClipboardData({ data: href })
    }
}
// 生成分享标题
function genShareTitle(title: string) {
    if (!config.weixinShare.state) {
        return title
    }
    const maxlen = config.weixinShare.state.title_max_length
    const suffix = config.weixinShare.state.title_suffix
    // 需要完整显示后缀，对标题做截断
    if (title.length + suffix.length - maxlen > 3) {
        title = title.slice(0, maxlen - suffix.length - 3) + "..." + suffix;
    } else {
        title = title.slice(0, maxlen - suffix.length) + suffix;
    }
    return title
}

// 设置分享标题
useShareTimeline(() => {
    if (!threadInfo.value || !config.weixinShare.state) {
        return {}
    }
    return {
        title: genShareTitle(threadInfo.value.subject),
        imageUrl: config.weixinShare.state.default_img
    }
})
useShareAppMessage(() => {
    if (!threadInfo.value || !config.weixinShare.state) {
        return {}
    }
    return {
        title: genShareTitle(threadInfo.value.subject),
    }
})

// 时间格式化
const timeFormat = (timeStr: string) => {
    return dayjs(timeStr).format("YYYY-MM-DD HH:mm")
}

// 在发帖后翻到最后一页
const sendPost = () => {
    // 清空回复状态
    cancelReply()
    if (!threadPosts.value)
        return
    let last = Math.ceil(threadPosts.value.total_count / pagination.value.limit)
    // 如果正好换页，跳转到新页
    if (threadPosts.value.total_count % pagination.value.limit === 0) {
        last++
    }
    sendPostScroll.value = true
    if (pagination.value.page !== last) {
        pagination.value.page = last
    } else {
        postRefresh.value++
    }
}

Taro.eventCenter.on("sendPost", sendPost)

// 用户删除评论确认弹窗
const showDelPostDialog = ref(false)
const userDelPostId = ref(0)
// 删除评论
const userDelPost = async () => {
    if (userDelPostId.value) {
        const { data } = await DeleteThreadPost(userDelPostId.value)
        if (!data.code) {
            prompt.showToast("success", "删除成功")
            refreshScroll.value = false
            postRefresh.value++
        }
        userDelPostId.value = 0
    }
}

// 定时刷新评论
// 如果当前位于评论的最后一页,每三秒刷新一次
const interval = ref<NodeJS.Timeout>()
const intervalRefreshPost = ref(false)
watchEffect(() => {
    if (!threadPosts.value)
        return
    if (pagination.value.page === Math.ceil(threadPosts.value.total_count / pagination.value.limit) || threadPosts.value.total_count === 0) {
        clearInterval(interval.value)
        const oldTotalCount = threadPosts.value.total_count
        interval.value = setInterval(async () => {
            if (hidden.value || threadClosed.value) return
            const { data } = await ThreadPostList(threadID.value, {
                page: pagination.value.page,
                pageSize: pagination.value.limit,
            })
            if (oldTotalCount !== data.total_count) {
                intervalRefreshPost.value = true
                threadPosts.value = data
            }
        }, 3000)
    } else {
        clearInterval(interval.value)
    }
})
</script>

<style lang="scss">
.thread-page {
    .post-desc {
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 100%;
    }

    .resolved {
        margin-left: 20rpx;
    }

    .info-desc {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 100%;

        .info {
            display: flex;
            align-items: center;

            .nickname {
                max-width: 60vw;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                vertical-align: bottom;
            }

            .level {
                width: 40rpx;
                height: 40rpx;
                margin-left: 10rpx;
                margin-right: 10rpx;
            }
        }
    }

    .html-message {
        user-select: text;

        img.emoji {
            width: 120rpx;
            height: 120rpx;
            max-width: unset;
        }

        img,
        .h5-img {
            max-width: 100%;
        }

        .h5-a {
            color: #1890ff;
        }

        .h5-code {
            white-space: pre-wrap;
        }
    }

    .del-message {
        color: #97a3b4;
    }

    .post-main {
        .op {
            padding-top: 10rpx;
            padding-bottom: 10rpx;

            .op-list {
                display: flex;
                width: 100%;
                align-items: center;

                .btn-clicked {
                    background-color: #f5f5f5;
                }

                .op-item {
                    display: flex;
                    align-items: center;
                    padding: 10rpx;
                    margin-right: 13rpx;
                    border-radius: 12rpx;

                    img {
                        width: 30rpx;
                        height: 30rpx;
                    }

                    text {
                        font-size: 28rpx;
                        color: #97a3b4;
                    }

                    &.right {
                        margin-left: auto;
                    }
                }
            }
        }
    }

    .content>view {
        max-width: 100%;
    }

    .refresh-tips {
        text-align: center;
        font-size: 20rpx;
        margin-bottom: 20rpx;
    }

    .pagination {
        display: flex;
        justify-content: center;
        padding-bottom: 180px;
    }

    .skeleton-container {
        margin-top: 20px;
        margin-left: 5vw;
        margin-bottom: 50px;
    }

    // 回贴引用
    .son-post {
        border-radius: var(--nut-cell-border-radius, 12rpx);
        background-color: #eee;
        padding: 12rpx;
    }

    .moderator-del-form {
        margin: 0;

        .nut-cell-group__wrap {
            box-shadow: none;
        }
    }

}
</style>