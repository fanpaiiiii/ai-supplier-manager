<template>
  <div class="app" :class="{ dark: isDark }">
    <router-view />
    <van-tabbar v-model="active" route active-color="var(--primary)" inactive-color="var(--text-muted)" style="border-radius:20px 20px 0 0;">
      <van-tabbar-item to="/" icon="wap-home-o">首页</van-tabbar-item>
      <van-tabbar-item to="/add" icon="add-o">添加</van-tabbar-item>
      <van-tabbar-item to="/logs" icon="notes-o">日志</van-tabbar-item>
      <van-tabbar-item to="/settings" icon="setting-o">设置</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
const active = ref(0)
const isDark = ref(false)
onMounted(() => {
  isDark.value = localStorage.getItem('darkMode') === 'true'
  window.addEventListener('storage', () => { isDark.value = localStorage.getItem('darkMode') === 'true' })
})
</script>
