/**
 * 对话框控制模块
 * 配合 components/message-dialog.vue 使用，统一管理提示、询问和输入三种对话框
 */
import {reactive} from 'vue';

// 对话框的默认配置
const dialogDefaults = {
  type: 'alert',              // 对话框类型，alert 提示、confirm 询问、prompt 输入
  title: '',                  // 标题
  content: '',                // 内容
  confirmBtn: '确定',          // 确认按钮，可传字符串或 Button 组件属性
  cancelBtn: '取消',           // 取消按钮，值为 null 时不显示
  inputValue: '',             // 输入框内容
  placeholder: '',            // 输入框占位提示
  closeOnOverlayClick: false  // 点击遮罩层是否关闭对话框
};

// 对话框组件绑定的状态
export const dialogState = reactive({...dialogDefaults, visible: false});

// 等待显示的对话框队列
const dialogQueue = [];
// 正在显示的对话框 {options, resolve}
let currentDialog = null;
// 用户是否点击了确认按钮
let confirmed = false;

/**
 * 把对话框加入队列，等待用户操作完成
 * @param options 对话框配置
 * @returns {Promise<*>} 用户操作完成后返回结果
 */
function open(options) {
  return new Promise(resolve => {
    dialogQueue.push({options, resolve});
    showNextDialog();
  });
}

/**
 * 显示队列中的下一个对话框
 * @returns {boolean}
 */
function showNextDialog() {
  // 已有对话框正在显示或队列为空就不处理
  if (currentDialog !== null || dialogQueue.length < 1) return false;
  currentDialog = dialogQueue.shift();
  confirmed = false;
  // 先重置为默认配置
  Object.assign(dialogState, dialogDefaults);
  // 填入本次的配置，没有传入的选项保持默认值
  Object.entries(currentDialog.options).forEach(option => {
    if (option[1] !== undefined) dialogState[option[0]] = option[1];
  });
  dialogState.visible = true;
}

/**
 * 关闭当前对话框，把结果返回给调用者，并显示队列中的下一个对话框
 * @returns {boolean}
 */
export function dialogClosed() {
  if (currentDialog === null) return false;
  const {options, resolve} = currentDialog;
  if (options.type === 'confirm') {
    // 询问对话框返回用户是否点击了确认
    resolve(confirmed);
  } else if (options.type === 'prompt') {
    // 输入对话框返回用户是否点击了确认和输入的内容
    resolve({confirmed: confirmed, value: String(dialogState.inputValue)});
  } else {
    // 提示对话框不需要返回结果
    resolve();
  }
  currentDialog = null;
  confirmed = false;
  // 重置状态，避免下一个对话框出现上一个对话框的内容
  Object.assign(dialogState, dialogDefaults);
  showNextDialog();
}

/**
 * 用户点击了确认按钮
 */
export function dialogConfirm() {
  confirmed = true;
}

/**
 * 用户点击了取消按钮
 */
export function dialogCancel() {
  confirmed = false;
}

/**
 * 提示对话框，只有确认按钮
 * @param options {{title?: string, content?: string, confirmBtn?: string | object}}
 * @returns {Promise<void>}
 */
export function alert(options = {}) {
  return open({...options, type: 'alert', cancelBtn: null});
}

/**
 * 询问对话框，用户点击确认返回 true，其他情况返回 false
 * @param options {{title?: string, content?: string, confirmBtn?: string | object, cancelBtn?: string | object | null}}
 * @returns {Promise<boolean>}
 */
export function confirm(options = {}) {
  return open({...options, type: 'confirm'});
}

/**
 * 输入对话框，返回用户是否点击了确认和输入的内容
 * @param options {{title?: string, content?: string, inputValue?: string, placeholder?: string}}
 * @returns {Promise<{confirmed: boolean, value: string}>}
 */
export function prompt(options = {}) {
  return open({...options, type: 'prompt'});
}

export default {alert, confirm, prompt};