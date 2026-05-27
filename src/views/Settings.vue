<template>
  <div class="fade-in">
    <div style="padding:16px 16px 0;">
      <div style="font-size:24px;font-weight:800;margin-bottom:18px;">设置</div>
    </div>

    <div class="page-padding">
      <!-- 深色模式 -->
      <div class="section-label">通用</div>
      <div class="neu" style="padding:18px;border-radius:20px;margin-bottom:18px;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:10px;">
            <van-icon name="moon-o" size="22" color="var(--primary)" />
            <span style="font-size:15px;font-weight:600;">深色模式</span>
          </div>
          <van-switch v-model="darkMode" @change="toggleDark" size="24" />
        </div>
      </div>

      <!-- 数据管理 -->
      <div class="section-label">数据管理</div>
      <div class="neu" style="padding:18px;border-radius:20px;margin-bottom:18px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
          <span style="font-size:14px;color:var(--text-secondary);">供应商总数</span>
          <span style="font-size:22px;font-weight:800;color:var(--primary);">{{ suppliers.length }}</span>
        </div>

        <button class="neu-btn neu-btn-primary" style="width:100%;padding:14px;margin-bottom:10px;" @click="exportPlaintext">
          &#128228; 一键导出（明文密钥）
        </button>
        <div style="display:flex;gap:10px;">
          <button class="neu-btn" style="flex:1;padding:12px;" @click="exportData">&#128230; 导出脱敏</button>
          <button class="neu-btn" style="flex:1;padding:12px;" @click="importData">&#128229; 导入</button>
        </div>

        <div v-if="exportMsg" class="neu" style="padding:10px 14px;border-radius:10px;margin-top:12px;border-left:3px solid var(--success);">
          <span style="font-size:13px;color:var(--success);">{{ exportMsg }}</span>
        </div>

        <button class="neu-btn neu-btn-danger" style="width:100%;padding:12px;margin-top:14px;" @click="clearData">
          &#128465; 清除所有数据
        </button>
      </div>

      <!-- 关于 -->
      <div class="section-label">关于</div>
      <div class="neu" style="padding:24px;border-radius:20px;text-align:center;">
        <div style="font-size:48px;margin-bottom:10px;">&#129302;</div>
        <div style="font-size:18px;font-weight:800;">AI 供应商管理器</div>
        <div style="font-size:13px;color:var(--text-secondary);margin-top:4px;">v1.2.0 · Neumorphism</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:6px;">管理、测试、监控你的 AI 模型供应商</div>
      </div>
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

function toggleDark(val: boolean) { localStorage.setItem('darkMode', String(val)); window.dispatchEvent(new Event('storage')) }

function downloadJSON(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click()
}

function exportPlaintext() {
  const data = suppliers.value.map(s => ({ name: s.name, icon: s.icon, baseUrl: s.baseUrl, apiKey: s.apiKey, models: s.models, contextLength: s.contextLength }))
  downloadJSON(data, `ai-suppliers-${new Date().toISOString().slice(0,10)}.json`)
  exportMsg.value = `已导出 ${data.length} 个供应商`
  setTimeout(() => { exportMsg.value = '' }, 3000)
}

function exportData() {
  const data = suppliers.value.map(s => ({ ...s, apiKey: s.apiKey.length > 8 ? s.apiKey.slice(0, 4) + '····' + s.apiKey.slice(-4) : '····' }))
  downloadJSON(data, `ai-suppliers-masked-${new Date().toISOString().slice(0,10)}.json`)
  exportMsg.value = `已导出 ${data.length} 个供应商（脱敏）`
  setTimeout(() => { exportMsg.value = '' }, 3000)
}

function importData() {
  const input = document.createElement('input'); input.type = 'file'; input.accept = '.json'
  input.onchange = async (e: any) => {
    const file = e.target.files[0]; if (!file) return
    try {
      const data = JSON.parse(await file.text())
      if (Array.isArray(data)) {
        for (const s of data) { if (s.name && s.baseUrl) await fetch('/api/suppliers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) }) }
        showToast({ message: `导入 ${data.length} 个`, type: 'success' }); setTimeout(() => location.reload(), 1000)
      }
    } catch { showToast({ message: '无效文件', type: 'fail' }) }
  }
  input.click()
}

function clearData() { showDialog({ title: '清除数据', message: '确定清除所有数据？不可恢复。' }).then(() => { clearAll(); showToast('已清除') }) }
</script>
