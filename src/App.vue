<template>
  <div class="app" :class="{ dark: isDark }">
    <nav class="bottom-nav">
      <router-link to="/" class="nav-item" active-class="active">
        <span class="nav-icon">🏠</span>
        <span class="nav-label">首页</span>
      </router-link>
      <router-link to="/add" class="nav-item" active-class="active">
        <span class="nav-icon">➕</span>
        <span class="nav-label">添加</span>
      </router-link>
      <router-link to="/settings" class="nav-item" active-class="active">
        <span class="nav-icon">⚙️</span>
        <span class="nav-label">设置</span>
      </router-link>
    </nav>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
const isDark = ref(false)
onMounted(() => {
  isDark.value = localStorage.getItem('darkMode') === 'true'
  window.addEventListener('storage', () => {
    isDark.value = localStorage.getItem('darkMode') === 'true'
  })
})
</script>
