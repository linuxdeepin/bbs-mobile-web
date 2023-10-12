<template>
    <view class="account-page">
        <view v-if="account.loaded">
            <view class="info" v-if="account.is_login">
                <nut-row>
                    <nut-col span="5" offset="1">
                        <nut-avatar size="large" shape="round">
                            <img :src="account.user_info.avatar" />
                        </nut-avatar>
                    </nut-col>
                    <nut-col span="18">
                        <view class="info-desc">
                            <span class="nickname"> {{ account.user_info.nickname }} </span>
                            <span class="desc">
                                {{ account.user_info.desc }}
                            </span>
                        </view>
                    </nut-col>
                </nut-row>
            </view>
            <view class="login" v-else>
                <nut-button type="primary" @tap="login()">登陆</nut-button>
            </view>
            <view class="dataset">
                <view class="item" span="6" offset="3">
                    <span class="number">{{ account.user_info.threads_cnt }}</span>
                    <span>帖子</span>
                </view>
                <view class="item" span="6">
                    <span class="number">{{ account.user_info.posts_cnt }}</span>
                    <span>回复</span>
                </view>
                <view class="item" span="6">
                    <span class="number">{{ account.user_info.favourite_cnt }}</span>
                    <span>收藏</span>
                </view>
            </view>
            <view>
                <nut-cell title="我的帖子" desc="暂不可用" is-link></nut-cell>
                <nut-cell title="我的回复" desc="暂不可用" is-link></nut-cell>
                <nut-cell title="我的收藏" desc="暂不可用" is-link></nut-cell>
                <nut-cell title="我的消息" desc="暂不可用" is-link></nut-cell>
            </view>
            <nut-tabbar v-model="tabActive" bottom @tab-switch="tabChange">
                <nut-tabbar-item tab-title="首页" name="index">
                    <template #icon>
                        <Home></Home>
                    </template>
                </nut-tabbar-item>
                <nut-tabbar-item tab-title="我的" name="account">
                    <template #icon>
                        <My2></My2>
                    </template>
                </nut-tabbar-item>
            </nut-tabbar>
        </view>
        <view v-else>
            <nut-skeleton width="60vw" height="20px" title avatar row="3">
            </nut-skeleton>

            <nut-skeleton class="menu-skeleton" width="90vw" height="40px" title animated row="5">
            </nut-skeleton>
        </view>
    </view>
</template>
<script lang="ts" setup>

import { useTabsStore, useAccountStore, } from '../../stores'
import { Home, My2 } from "@nutui/icons-vue-taro";

const tabs = useTabsStore()
const account = useAccountStore()

const { tabActive, tabChange } = tabs.usePageTabs('account')
const login = () => {
    account.login()
}
</script>

<style lang="scss">
.account-page {
    padding: 1rem;
    min-height: 90vh;
    background: linear-gradient(to bottom, #1890ff 10rem, whitesmoke 10rem);

    .info {
        margin-top: 1rem;
        margin-bottom: 3rem;
    }

    .login {
        margin-top: 2rem;
        margin-bottom: 2rem;
        text-align: center;
    }

    .info-desc {
        color: white;
        margin-left: 1rem;
        display: flex;
        flex-direction: column;

        .nickname {
            font-size: large;
        }

        .desc {
            font-size: small;
        }
    }

    .dataset {
        display: flex;
        width: 100%;
        background-color: white;
        justify-content: space-around;
        border-radius: 4px;

        .item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 30%;
            height: 4rem;
            font-size: small;
            color: gray;
            box-shadow: 0 2px 8px #0000000d;

            .number {
                color: black;
                font-size: large;
            }
        }
    }

    .menu-skeleton {
        margin-top: 10vh;
    }
}
</style>