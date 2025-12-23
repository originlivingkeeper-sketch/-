
# 照顧管家適性判斷系統

專業的人力管理工具，針對「照顧管家」進行適性判斷、任務分析與 AI 轉型建議。

## 部署至 Render 步驟：

1. **上傳至 GitHub**：將所有檔案推送到您的 GitHub 儲存庫。
2. **在 Render 建立 Static Site**：
   - 連結您的 GitHub 帳戶並選擇此專案。
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build` (請確保設定為 build 而非 dist)
3. **設定環境變數**：
   - 在 Render 的 Dashboard 中，進入該專案的 **Environment**。
   - 新增變數 `API_KEY`，數值填入您的 Google Gemini API Key。
4. **完成發布**：Render 將自動建置並提供專屬網址。

## 技術棧
- React 19
- Vite (輸出目錄設為 build)
- Google Gemini API (支援模型降級機制)
- Tailwind CSS
- Recharts
- Lucide React
