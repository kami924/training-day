# 训练日

一款主打极简主义、零摩擦打卡的移动端健身记录 App。

## Structure

- `mobile/` - Expo + React Native + Expo Router app.
- `backend/` - FastAPI API with SQLAlchemy database models.

## Web Demo

```bash
cd mobile
npm install
npm run export:web
npm run preview:web
```

Vercel 部署建议：

- Framework Preset: `Other`
- Root Directory: `mobile`
- Build Command: `npm run export:web`
- Output Directory: `dist`
