// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// ✅ ดึง fetch จาก node-fetch (ใช้ได้ทุกเวอร์ชัน Node 18+)
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;

// ==== AIGEN CONFIG ====
const AIGEN_API_URL = 'https://api.aigen.online/aiscript/general-ocr/v2';
const AIGEN_API_KEY = process.env.AIGEN_API_KEY;

if (!AIGEN_API_KEY) {
  console.warn('⚠️  WARNING: ยังไม่ได้ใส่ AIGEN_API_KEY ใน Environment Variables');
}

// ==== Middleware ====
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ✅ เพิ่มหน้าเช็คว่า backend ยังหายใจอยู่มั้ย
app.get('/', (req, res) => {
  res.send('✅ Armymim AIGEN backend OK');
});

// ==== API /ocr สำหรับหน้าเว็บเรียกใช้ ====
app.post('/ocr', async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res
        .status(400)
        .json({ message: 'ส่งรูปมาด้วยนะครับ (imageBase64)' });
    }

    // ยิงไปหา AIGEN
    const response = await fetch(AIGEN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AIGEN-KEY': AIGEN_API_KEY
      },
      body: JSON.stringify({ image: imageBase64 })
    });

    let apiData = {};
    try {
      apiData = await response.json();
    } catch (e) {
      apiData = {};
    }

    if (!response.ok) {
      console.error('❌ AIGEN Error:', response.status, apiData);
      return res.status(response.status).json({
        message: `AIGEN error: ${response.status}`,
        details: apiData
      });
    }

    // รวมข้อความจากทุกหน้า
    let combinedText = '';
    if (Array.isArray(apiData.data)) {
      combinedText = apiData.data
        .map((page) => page.text_page || '')
        .join('\n');
    }

    console.log('✅ อ่านบัตรสำเร็จ! ความยาวข้อความ:', combinedText.length);

    return res.json({
      text: combinedText,
      raw: apiData
    });
  } catch (err) {
    console.error('Server Error:', err);
    res
      .status(500)
      .json({ message: 'Server มีปัญหาครับ', error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server พร้อมทำงานแล้วที่ Port ${PORT}`);
});
