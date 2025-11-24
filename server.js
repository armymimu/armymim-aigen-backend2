// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ==== AIGEN CONFIG ====
const AIGEN_API_URL = 'https://api.aigen.online/aiscript/general-ocr/v2';
const AIGEN_API_KEY = process.env.AIGEN_API_KEY; // ตั้งใน Render แล้วเรียบร้อย

if (!AIGEN_API_KEY) {
  console.warn('⚠️ WARNING: ยังไม่ได้ใส่ AIGEN_API_KEY ใน Environment Variables');
}

// ==== Middleware ====
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ✅ Route สำหรับเช็คว่า backend ยังหายใจอยู่
app.get('/', (req, res) => {
  res.send('✅ Armymim AIGEN backend is running');
});

// ✅ Route หลักสำหรับ OCR บัตรประชาชน
app.post('/ocr', async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    // 1) เช็คว่ามีรูปส่งมาจริงไหม
    if (!imageBase64) {
      return res.status(400).json({
        message: 'ต้องส่ง imageBase64 มาด้วยนะครับ',
      });
    }

    // 2) เช็คว่า server มี KEY จริงไหม
    if (!AIGEN_API_KEY) {
      return res.status(500).json({
        message: 'AIGEN_API_KEY ไม่ถูกตั้งค่าในเซิร์ฟเวอร์',
      });
    }

    // 3) ยิงไปหา AIGEN
    const response = await fetch(AIGEN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AIGEN-KEY': AIGEN_API_KEY,
      },
      // AIGEN ต้องการ field ชื่อ image
      body: JSON.stringify({ image: imageBase64 }),
    });

    let apiData = {};
    try {
      apiData = await response.json();
    } catch (e) {
      apiData = {};
    }

    // 4) ถ้า AIGEN ตอบ error (เช่น 400 รูปไม่ถูกต้อง / base64 พัง)
    if (!response.ok) {
      console.error('❌ AIGEN Error:', response.status, apiData);
      return res.status(response.status).json({
        message: `AIGEN error: ${response.status}`,
        details: apiData,
      });
    }

    // 5) รวม text จากทุกหน้า
    let combinedText = '';
    if (Array.isArray(apiData.data)) {
      combinedText = apiData.data
        .map((page) => page.text_page || '')
        .join('\n');
    }

    console.log('✅ อ่านบัตรสำเร็จ! ความยาวข้อความ:', combinedText.length);

    // 6) ส่งกลับให้ frontend ใช้ต่อ (ไป extract ชื่อ / วันเกิดฝั่ง React)
    return res.json({
      text: combinedText,
      raw: apiData,
    });
  } catch (err) {
    console.error('Server Error:', err);
    return res.status(500).json({
      message: 'Server มีปัญหาครับ',
      error: err.message,
    });
  }
});

// ==== Start Server ====
app.listen(PORT, () => {
  console.log(`Server พร้อมทำงานแล้วที่ Port ${PORT}`);
});
