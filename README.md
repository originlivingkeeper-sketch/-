
# 照顧管家適性判斷系統

專業的人力管理工具，針對「照顧管家」進行適性判斷、任務分析與 AI 轉型建議。

## 部署至 Render 步驟：

1. **上傳至 GitHub**：將所有檔案推送到您的 GitHub 儲存庫。
2. **在 Render 建立 Static Site**：
   - 連結您的 GitHub 帳戶並選擇此專案。
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
3. **重要：設定環境變數**：
   - 在 Render 的 Dashboard 中，進入專案的 **Environment**。
   - 新增變數 **`VITE_API_KEY`** (必須包含 VITE_ 前綴)。
   - 數值填入您的 Google Gemini API Key。
4. **重新部署**：
   - 設定完環境變數後，請點選 **Manual Deploy** -> **Clear Build Cache & Deploy**。
   - Vite 需要在建置時抓取該金鑰，只設定變數而不重新建置是不會生效的。

## 模型說明
系統會依序嘗試以下模型：
1. gemini-flash-lite-latest (省量首選)
2. gemini-2.5-flash-preview-tts
3. gemini-flash-latest
4. gemini-3-flash-preview (高性能首選)
