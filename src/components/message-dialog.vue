<template>
  <!--提示、询问和输入对话框，由 modules/MessageDialog.js 控制显示-->
  <t-dialog
    v-model:visible="dialogState.visible"
    :title="dialogState.title"
    :content="dialogState.content"
    :confirm-btn="dialogState.confirmBtn"
    :cancel-btn="dialogState.cancelBtn"
    :close-on-overlay-click="dialogState.closeOnOverlayClick"
    @confirm="dialogConfirm"
    @cancel="dialogCancel"
    @closed="dialogClosed"
  >
    <!--输入对话框的输入框-->
    <template #middle>
      <t-input
        v-if="dialogState.type === 'prompt'"
        v-model="dialogState.inputValue"
        class="dialog-input"
        :placeholder="dialogState.placeholder"
        autofocus
      />
    </template>
  </t-dialog>
</template>

<script setup>
import {dialogState, dialogConfirm, dialogCancel, dialogClosed} from './../modules/MessageDialog.js';
</script>

<style scoped>
/*输入对话框的输入框*/
.dialog-input {
  margin-top: 16px;
  --td-input-vertical-padding: 12px;
  --td-bg-color-container: var(--td-bg-color-page, #F3F3F3);
  border-radius: 6px;
}
</style>