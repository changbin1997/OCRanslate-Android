<template>
  <div id="image-cropping" v-show="showImageCropping">
    <div class="tips">请圈出要识别的区域</div>
    <canvas ref="canvas" id="image-cropping-canvas" @touchstart="handleTouchStart" @touchmove.prevent="handleTouchMove" @touchend="handleTouchEnd"></canvas>
    <div class="btn-box">
      <t-button size="medium" theme="light" class="btn" @click="cancelCropping">取消</t-button>
      <t-button size="medium" theme="light" class="btn" @click="resetCanvas">重置</t-button>
      <t-button size="medium" theme="light" class="btn" @click="cropImage">确定</t-button>
    </div>
  </div>
</template>

<script setup>
import { ref, defineExpose, defineEmits } from 'vue';

const showImageCropping = ref(false);  // 显示图片裁剪组件
const canvas = ref(null);  // canvas
let ctx = null;
let isDrawing = false;  // 记录 canvas 按下

// 记录涂鸦边界坐标
let minX = Infinity;
let minY = Infinity;
let maxX = -Infinity;
let maxY = -Infinity;
let hasDrawn = false; // 记录是否发生过有效涂鸦

// 创建一个 img
const img = new Image();

// 把方法暴露出去
defineExpose({ loadImg });
// 注册一个完成和取消事件
const emit = defineEmits(['complete', 'cancel']);

/**
 * 更新涂鸦的边界坐标
 * @param x 当前 x 坐标
 * @param y 当前 y 坐标
 */
function updateBounds(x, y) {
  if (x < minX) minX = x;
  if (x > maxX) maxX = x;
  if (y < minY) minY = y;
  if (y > maxY) maxY = y;
  hasDrawn = true;
}

/**
 * 获取触摸点在 canvas 内部的真实坐标
 * @param ev TouchEvent
 * @returns {{x: number, y: number}}
 */
function getTouchCoords(ev) {
  // 获取 canvas 在视口中的位置和实际显示的 CSS 尺寸
  const rect = canvas.value.getBoundingClientRect();
  const touch = ev.touches[0];

  // 计算触摸点相对于 canvas 元素的 CSS 像素坐标
  const cssX = touch.clientX - rect.left;
  const cssY = touch.clientY - rect.top;

  // 计算缩放比例 (内部真实分辨率 / CSS 显示尺寸)
  const scaleX = canvas.value.width / rect.width;
  const scaleY = canvas.value.height / rect.height;

  // 转换为 canvas 内部的真实像素坐标
  return {
    x: cssX * scaleX,
    y: cssY * scaleY
  };
}

/**
 * 手指按下，开始涂鸦
 * @param ev
 */
function handleTouchStart(ev) {
  // 检测到多指触摸，直接返回不操作
  if (ev.touches.length > 1) return;

  isDrawing = true;

  // 获取换算后的真实坐标
  const { x, y } = getTouchCoords(ev);

  // 更新边界
  updateBounds(x, y);

  ctx.beginPath();
  ctx.moveTo(x, y);

  // 设置笔画粗细
  let lineWidth = 3;
  if (canvas.value.width > 300) {
    lineWidth = Number(Math.round(canvas.value.width / 100));
  }
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = '#FF0000';
}

/**
 * 手指移动涂鸦
 * @param ev
 */
function handleTouchMove(ev) {
  // 如果没有按下，或者检测到多指触摸，直接返回
  if (!isDrawing || ev.touches.length > 1) return;

  const { x, y } = getTouchCoords(ev);

  // 更新边界
  updateBounds(x, y);

  ctx.lineTo(x, y);
  ctx.stroke();
}

/**
 * 手指抬起，停止涂鸦
 */
function handleTouchEnd() {
  // 结束绘制状态并闭合路径
  isDrawing = false;
  ctx.closePath();
  // 裁剪
  cropImage();
}

/**
 * 在 canvas 显示图片
 * @param imgDataUrl 图片 DataUrl
 */
function loadImg(imgDataUrl) {
  showImageCropping.value = true;
  // 加载前先重置一下状态
  resetState();

  ctx = canvas.value.getContext('2d');
  img.src = imgDataUrl;

  // 图片加载完成
  img.onload = () => {
    // 获取 canvas 的宽度
    const displayWidth = canvas.value.getBoundingClientRect().width;
    // 计算高度
    const displayHeight = Math.round(displayWidth * img.naturalHeight / img.naturalWidth);
    // 设置 canvas 尺寸
    canvas.value.style.width = '96%';
    canvas.value.style.height = `${displayHeight}px`;
    // 内部像素尺寸设成照片真实尺寸
    canvas.value.width = img.naturalWidth;
    canvas.value.height = img.naturalHeight;
    // 读取照片
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
    ctx.drawImage(img, 0, 0, canvas.value.width, canvas.value.height);
  }
}

/**
 * 重置坐标和状态变量
 */
function resetState() {
  minX = Infinity;
  minY = Infinity;
  maxX = -Infinity;
  maxY = -Infinity;
  hasDrawn = false;
  isDrawing = false;
}

/**
 * 点击重置按钮：清除涂鸦，恢复画布初始状态
 */
function resetCanvas() {
  if (!ctx || !img.src) return;

  // 清除画布
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
  // 重新绘制干净的原图
  ctx.drawImage(img, 0, 0, canvas.value.width, canvas.value.height);

  // 重置记录的坐标
  resetState();
}

/**
 * 取消裁剪，隐藏组件
 */
function cancelCropping() {
  showImageCropping.value = false;
  resetState();
  emit('cancel');
}

/**
 * 点击确定按钮：根据记录的极值从原图裁剪出矩形并输出 Base64
 */
function cropImage() {
  if (!hasDrawn) {
    console.log('尚未进行任何涂鸦');
    return;
  }

  // 计算裁剪区域的宽高
  const cropWidth = maxX - minX;
  const cropHeight = maxY - minY;

  // 如果画的是水平或垂直的绝对直线（或仅是一个点击点），宽高会等于 0，则不裁剪
  if (cropWidth === 0 || cropHeight === 0) {
    console.log('画的是直线，取消裁剪');
    return;
  }

  // 创建隐藏的新 canvas 进行裁剪操作
  const hiddenCanvas = document.createElement('canvas');
  hiddenCanvas.width = cropWidth;
  hiddenCanvas.height = cropHeight;
  const hiddenCtx = hiddenCanvas.getContext('2d');

  // 直接从 img 对象截取（避开当前包含红线的 canvas），绘制到隐藏的 canvas 上
  hiddenCtx.drawImage(
      img,
      minX, minY, cropWidth, cropHeight, // 从源图片的 [minX, minY] 坐标开始，截取 [cropWidth, cropHeight] 的区域
      0, 0, cropWidth, cropHeight        // 绘制到隐藏 canvas 的 [0, 0] 坐标，尺寸保持一致
  );

  // 导出图片的 DataURL
  const dataUrl = hiddenCanvas.toDataURL('image/jpeg', 1.0);

  // 使用正则剔除 Base64 的前缀 (例如 'data:image/jpeg;base64,')
  const base64Str = dataUrl.replace(/^data:image\/\w+;base64,/, '');

  emit('complete', base64Str);
}
</script>

<style scoped>
#image-cropping {
  margin-top: 56px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.tips {
  text-align: center;
  padding: 16px;
}

/*图片裁剪的 canvas*/
#image-cropping-canvas {
  width: 96%;
  margin-bottom: 90px;
}

/*操作按钮区域*/
.btn-box {
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
  background: #FFFFFF;
  border: 1px solid #E7E7E7;
  justify-content: space-between;
  display: flex;
  position: fixed;
  bottom: 56px;
  left: 0;
}

/*裁剪后的图片*/
#new-img {
  max-width: 94%;
}
</style>