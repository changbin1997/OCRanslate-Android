<template>
  <div id="camera-controls" v-if="showCameraControls">
    <t-button @click="stopCamera" aria-label="关闭相机" variant="outline" size="large" :icon="icon.CloseIcon" class="close-btn"></t-button>
    <button type="button" aria-label="拍照" @click="takePhoto" class="shutter-btn"></button>
    <t-button @click="changeFlashlight" aria-label="手电筒" :aria-pressed="flashlightActive" variant="outline" size="large" :icon="icon.FlashlightIcon" class="flash-btn"></t-button>
  </div>
</template>

<script setup>
import {CameraPreview} from '@capacitor-community/camera-preview';
import {defineExpose, h, ref, defineEmits} from 'vue';
import {Dialog} from '@capacitor/dialog';
import {CloseIcon, FlashlightIcon} from 'tdesign-icons-vue-next';

const icon = {
  CloseIcon: h(CloseIcon),
  FlashlightIcon: h(FlashlightIcon)
};

const flashlightActive = ref(false);  // 是否开启手电筒
const showCameraControls = ref(false);  // 显示相机控制区
const cameraActive = ref(false);  // 是否开启相机

// 注册一个已关闭相机的事件
const emit = defineEmits(['cameraStopped', 'takePhoto']);
// 把开启、关闭相机和相机状态暴露出去
defineExpose({startCamera, stopCamera, cameraActive});

/**
 * 开启或关闭手电筒
 * @returns {Promise<void>}
 */
async function changeFlashlight() {
  try {
    if (flashlightActive.value) {
      // 关闭手电筒
      await CameraPreview.setFlashMode({ flashMode: 'off' });
      flashlightActive.value = false;
    } else {
      // 开启手电筒（长亮）
      await CameraPreview.setFlashMode({ flashMode: 'torch' });
      flashlightActive.value = true;
    }
  } catch (error) {
    await Dialog.alert({
      title: '出错了',
      message: error.message,
      buttonTitle: '关闭'
    });
  }
}

/**
 * 拍照
 * @returns {Promise<string>}  // 返回照片base64
 */
async function takePhoto() {
  try {
    const result = await CameraPreview.captureSample({quality: 85});
    //const result = await CameraPreview.capture({quality: 85});

    emit('takePhoto', result.value);
    // 关闭相机
    await stopCamera();
  } catch (error) {
    await Dialog.alert({
      title: '出错了',
      message: error.message,
      buttonTitle: '关闭'
    });
  }
}

/**
 * 启动相机
 * @returns {Promise<void>}
 */
async function startCamera() {
  try {
    await CameraPreview.start({
      position: 'rear',
      toBack: true,
      disableAudio: true,
      enableZoom: true,
      y: 48,
      height: window.innerHeight - 224
    });
    // 相机状态设置为开启
    cameraActive.value = true;
    // 显示相机控制区
    showCameraControls.value = true;
    // 让页面背景透明
    document.body.classList.add('transparent-background');
    document.querySelector('html').classList.add('transparent-background');
  } catch (error) {
    await Dialog.alert({
      title: '出错了',
      message: error.message,
      buttonTitle: '关闭'
    });
  }
}

/**
 * 停止相机
 * @returns {Promise<void>}
 */
async function stopCamera() {
  try {
    // 如果开启了手电筒就先关闭手电筒
    if (flashlightActive.value) await changeFlashlight();
    await CameraPreview.stop();
    // 相机状态设置为关闭
    cameraActive.value = false;
    // 恢复页面背景
    document.body.classList.remove('transparent-background');
    document.querySelector('html').classList.remove('transparent-background');
    // 隐藏相机控制区
    showCameraControls.value = false;
    // 触发关闭相机事件
    emit('cameraStopped');
  } catch (error) {
    await Dialog.alert({
      title: '出错了',
      message: error.message,
      buttonTitle: '关闭'
    });
  }
}
</script>

<style scoped>
/*相机底部控制区域*/
#camera-controls {
  position: fixed;
  background: #FFFFFF;
  width: 100%;
  height: 120px;
  bottom: 56px;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: space-around;
}

/*快门按钮*/
#camera-controls .shutter-btn {
  width: 80px;
  height: 80px;
  border-radius: 40px;
  background: #FA800E;
  border: 2px solid #5B4032;
}
</style>