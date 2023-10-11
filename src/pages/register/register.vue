<template>
    <view class="register-page">
        <nut-skeleton width="60vw" height="20px" title avatar row="3">
        </nut-skeleton>
        <nut-skeleton class="menu-skeleton" width="90vw" height="40px" title animated row="5">
        </nut-skeleton>
        <nut-toast :msg="toast.msg" v-model:visible="toast.visible" :type="toast.type" />
        <nut-popup position="bottom" :close-on-click-overlay="false" :style="{ height: '30%' }" v-model:visible="show">
            <view class="register">
                <nut-checkbox v-model="agreeList[0]" label="agree-1">我已阅读并同意《深度帐号使用协议》</nut-checkbox>
                <nut-checkbox v-model="agreeList[1]" label="agree-2">我已阅读并同意《隐私政策》</nut-checkbox>

                <!-- 网易易盾验证码，小程序插件引入 -->
                <ne-captcha :id="captcha.elementID" :captcha-id="captcha.captchaID" width="640rpx" @verify="captcha.verify">
                </ne-captcha>
                <button open-type="getPhoneNumber" :disabled="!agreeAll"
                    @getphonenumber="captcha.tryVerify(code => getPhoneNumber(code, $event))">
                    通过手机号注册
                </button>
            </view>
        </nut-popup>
    </view>
</template>
<script lang="ts" setup>

import Taro from '@tarojs/taro'
import { ref, computed } from 'vue';
import { useAccountStore, } from '../../stores'

const account = useAccountStore()

// 注册验证码
const captcha = account.useForceCaptcha()

const show = ref(true)
// 需要同意的隐私协议
const agreeList = ref([false, false])
// 是否同意所有协议
const agreeAll = computed(() => agreeList.value.filter(v => v).length === agreeList.value.length)

// 获取手机号后注册账户
const getPhoneNumber = async (captchaCode: string, event: { detail: { code: string } }) => {
    if (event.detail.code) {
        await account.register(captcha.captchaID, captchaCode, event.detail.code)
        Taro.navigateBack()
    }
}

const toast = ref({ visible: true, type: 'warn', msg: "请先注册账号" })

</script>

<style lang="scss">
.register-page {
    padding: 1rem;
    min-height: 90vh;
    background: linear-gradient(to bottom, #1890ff 10rem, whitesmoke 10rem);

    .menu-skeleton {
        margin-top: 10vh;
    }

    .register {
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-evenly;
        margin-left: 10vw;
        width: 80vw;

        button {
            width: 100%;
        }

        button[disabled] {
            color: grey;
        }
    }
}
</style>