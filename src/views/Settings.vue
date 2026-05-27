<template>
  <div class="fade-in">
    <van-nav-bar title="设置" :border="false" style="background:transparent;" />

    <div class="page-padding">
      <!-- 通用 -->
      <van-cell-group inset style="border-radius:12px;overflow:hidden;margin-bottom:14px;">
        <van-cell title="🌙 深色模式">
          <template #right-icon>
            <van-switch v-model="darkMode" @change="toggleDark" size="22" />
          </template>
        </van-cell>
      </van-cell-group>

      <!-- 数据管理 -->
      <van-cell-group inset style="border-radius:12px;overflow:hidden;margin-bottom:14px;">
        <van-cell title="供应商总数" :value="suppliers.length" />
        <van-cell>
          <van-button type="primary" block round size="small" @click="exportPlaintext" style="margin-bottom:8px;">📤 一键导出（明文密钥）</van-button>
          <div style="display:flex;gap:8px;">
            <van-button plain type="primary" block round size="small" @click="exportData">📦 导出脱敏</van-button>
            <van-button plain type="primary" block round size="small" @click="importData">📥 导入</van-button>
          </div>
        </van-cell>
        <van-cell v-if="exportMsg">
          <van-notice-bar :text="exportMsg" color="#2D8B4E" background="#E8F5E9" left-icon="success" />
        </van-cell>
        <van-cell>
          <van-button type="danger" block round size="small" @click="clearData">🗑️ 清除所有数据</van-button>
        </van-cell>
      </van-cell-group>

      <!-- 关于 -->
      <van-cell-group inset style="border-radius:12px;overflow:hidden;">
        <van-cell>
          <div style="text-align:center;padding:10px 0;">
            <div style="font-size:40px;margin-bottom:8px;">🤖</div>
            <div style="font-size:17px;font-weight:700;">AI 供应商管理器</div>
            <div style="font-size:13px;color:var(--text-secondary);margin-top:4px;">v1.1.0 PWA</div>
            <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">管理、测试、监控你的 AI 模型供应商</div>
          </div>
        </van-cell>
      </van-cell-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useStore } from '../store'
import { showDialog, showToast } from 'vant'

const { suppliers, clearAll } = useStore()
const darkMode = ref(false)
const exportMsg = ref('')

onMounted(() => { darkMode.value = localStorage.getItem('darkMode') === 'true' })

function toggleDark(val: boolean) {
  localStorage.setItem('darkMode', String(val))
  window.dispatchEvent(new Event('storage'))
}

function exportPlaintext() {
  const data = suppliers.value.map(s => ({
    name: s.name, icon: s.icon, baseUrl: s.baseUrl, apiKey: s.apiKey,
    models: s.models, contextLength: s.contextLength, status: s.status, latency: s.latency,
  }))
  downloadJSON(data, `ai-suppliers-${new Date().toISOString().slice(0,10)}.json`)
  exportMsg.value = `已导出 ${data.length} 个供应商（明文密钥）`
  setTimeout(() => { exportMsg.value = '' }, 3000)
}

function exportData() {
  const data = suppliers.value.map(s => ({
    ...s, apiKey: s.apiKey.length > 8 ? s.apiKey.slice(0, 4) + '****' + s.apiKey.slice(-4) : '****',
  }))
  downloadJSON(data, `ai-suppliers-masked-${new Date().toISOString().slice(0,10)}.json`)
  exportMsg.value = `已导出 ${data.length} 个供应商（密钥已脱敏）`
  setTimeout(() => { exportMsg.value = '' }, 3000)
}

function downloadJSON(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
}

function importData() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async (e: any) => {
    const file = e.target.files[0]
    if (!file) return
    const text = await file.text()
    try {
      const data = JSON.parse(text)
      if (Array.isArray(data)) {
        for (const s of data) {
          if (s.name && s.baseUrl) {
            await fetch('/api/suppliers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) })
          }
        }
        showToast({ message: `导入 ${data.length} 个供应商`, type: 'success' })
        setTimeout(() => location.reload(), 1000)
      }
    } catch { showToast({ message: '无效的JSON文件', type: 'fail' }) }
  }
  input.click()
}

function clearData() {
  showDialog({ title: '清除数据', message: '确定清除所有供应商数据？不可恢复。', theme: 'round-button' }).then(() => { clearAll(); showToast('已清除') })
}
</script>
