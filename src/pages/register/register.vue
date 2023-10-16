<template>
    <view class="register-page">
        <nut-skeleton width="60vw" height="20px" title avatar row="3">
        </nut-skeleton>
        <nut-skeleton class="menu-skeleton" width="90vw" height="40px" title animated row="5">
        </nut-skeleton>
        <nut-toast :msg="prompt.toast.msg" v-model:visible="prompt.toast.visible" :type="prompt.toast.type"
            :duration="prompt.toast.duration" />
        <nut-popup position="bottom" :close-on-click-overlay="false" :style="{ height: '30%' }"
            v-model:visible="showRegister">
            <view class="register">
                <nut-checkbox v-for="(item, index) in agreement.registerAgreementList" v-model="agreeList[index]">
                    我已阅读并同意
                    <span class="link" @tap="showAgree(item.id)">{{ item.name }}</span>
                </nut-checkbox>

                <!-- 网易易盾验证码，小程序插件引入 -->
                <ne-captcha :id="captcha.elementID" :captcha-id="captcha.captchaID" width="640rpx" @verify="captcha.verify">
                </ne-captcha>
                <button open-type="getPhoneNumber" :disabled="!agreeAll"
                    @getphonenumber="captcha.tryVerify(code => getPhoneNumber(code, $event))">
                    通过手机号注册
                </button>
            </view>
        </nut-popup>
        <nut-popup :style="{ height: '80vh', width: '90vw', padding: '10px' }" v-model:visible="showAgreement">
            <rich-text :nodes="agreementContent"></rich-text>
        </nut-popup>
    </view>
</template>
<script lang="ts" setup>

import Taro from '@tarojs/taro'
import { ref, computed } from 'vue';
import { useAccountStore, useAgreementStore, usePromptStore } from '../../stores'

const account = useAccountStore()
const agreement = useAgreementStore()
const prompt = usePromptStore()

// 注册验证码
const captcha = account.useForceCaptcha()

const showRegister = ref(true)
const showAgreement = ref(false)
const agreementContent = ref("")
// 需要同意的隐私协议
const agreeList = ref(Array(agreement.registerAgreementList.length).fill(false))
// 是否同意所有协议
const agreeAll = computed(() => agreeList.value.filter(v => v).length === agreeList.value.length)

// 获取手机号后注册账户
const getPhoneNumber = async (captchaCode: string, event: { detail: { code: string } }) => {
    if (event.detail.code) {
        try {
            prompt.showToast('loading', "注册中", 0)
            await account.register(captcha.captchaID, captchaCode, event.detail.code)
            Taro.navigateBack()
        } catch (err) {
            // 如果返回http code是403，提示手机号已存在
            if (err?.response.status === 403) {
                prompt.showToast('fail', "手机号已存在，请使用密码登陆", 2000)
                return
            }
            prompt.showToast('fail', "注册失败，请稍后再试", 2000)
        }
    }
}

// 需要加载后再显示消息，否则消息不会自动隐藏
Taro.nextTick(() => prompt.showToast('text', "请先注册账号", 2000))

const showAgree = (id: string) => {
    agreement.getAgreement(id, 'cn').then((resp) => {
        showAgreement.value = true
        agreementContent.value = resp.data.data.content
    })
}

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

        .link {
            display: inline;
            color: #1890ff;
        }
    }
}
</style>