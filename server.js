// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ==== AIGEN CONFIG ====
const AIGEN_API_URL = 'https://api.aigen.online/aiscript/general-ocr/v2';
const AIGEN_API_KEY = process.env.AIGEN_API_KEY; // อย่าลืมไปตั้งค่าใน Render นะครับ

if (!AIGEN_API_KEY) {
  console.warn('⚠️  WARNING: ยังไม่ได้ใส่ AIGEN_API_KEY ใน Environment Variables');
}

// ==== จุดที่แก้: CORS (เปิดให้ทุกคนเข้าได้ แก้ปัญหา Failed to fetch) ====
app.use(cors()); 
// ไม่ต้องมีเงื่อนไขเยอะ เอาแบบนี้ผ่านชัวร์ครับ

app.use(express.json({ limit: '10mb' }));

// ==== API /ocr สำหรับหน้าเว็บเรียกใช้ ====
app.post('/ocr', async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ message: 'ส่งรูปมาด้วยนะครับ (imageBase64)' });
    }

    // ยิงไปหา AIGEN
    const response = await fetch(AIGEN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AIGEN-KEY': AIGEN_API_KEY, // กุญแจสำคัญ
      },
      body: JSON.stringify({ image: imageBase64 }),
    });

    let apiData = {};
    try {
      apiData = await response.json();
    } catch (e) {
      apiData = {};
    }

    if (!response.ok) {
      console.error('❌ AIGEN Error:', response.status);
      return res.status(response.status).json({
        message: `AIGEN error: ${response.status}`,
        details: apiData
      });
    }

    // รวมข้อความจากทุกหน้า
    let combinedText = '';
    if (Array.isArray(apiData.data)) {
      combinedText = apiData.data.map((page) => page.text_page || '').join('\n');
    }

    console.log('✅ อ่านบัตรสำเร็จ! ความยาวข้อความ:', combinedText.length);

    return res.json({
      text: combinedText,
      raw: apiData,
    });
  } catch (err) {
    console.error('Server Error:', err);
    res.status(500).json({ message: 'Server มีปัญหาครับ', error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server พร้อมทำงานแล้วที่ Port ${PORT}`);
});