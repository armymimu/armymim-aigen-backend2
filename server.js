// server.js (ฉบับอ่านบัตร ID Card โดยเฉพาะ)
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ==== จุดเปลี่ยนสำคัญ: ใช้ URL สำหรับบัตรประชาชนโดยเฉพาะ ====
const AIGEN_API_URL = 'https://api.aigen.online/aiscript/thailand-id-card/v2'; 
const AIGEN_API_KEY = process.env.AIGEN_API_KEY; 

if (!AIGEN_API_KEY) {
  console.warn('⚠️  WARNING: ยังไม่ได้ใส่ AIGEN_API_KEY');
}

app.use(cors()); 
app.use(express.json({ limit: '10mb' }));

app.post('/ocr', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ message: 'ส่งรูปมาด้วยนะครับ' });

    const response = await fetch(AIGEN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AIGEN-KEY': AIGEN_API_KEY,
      },
      body: JSON.stringify({ image: imageBase64 }),
    });

    let apiData = {};
    try {
      apiData = await response.json();
    } catch (e) { apiData = {}; }

    if (!response.ok) {
      console.error('❌ AIGEN Error:', response.status);
      return res.status(response.status).json({ message: `AIGEN error: ${response.status}` });
    }

    // ==== จุดเปลี่ยน 2: ดึงค่าที่ถูกต้องจากช่องของมันโดยตรง ====
    // AIGEN ID Card จะส่งค่ากลับมาในตัวแปรชื่อ result
    const result = apiData.result || {};

    console.log('✅ อ่านบัตรสำเร็จ! ได้ชื่อ:', result.title_name_surname_th);

    return res.json({
      // ส่งค่าแบบเจาะจงไปให้หน้าเว็บเลย ไม่ต้องไปเดาเองแล้ว
      mode: 'id_card',
      name: result.title_name_surname_th || '',
      dob: result.dob_th || '',
      id_number: result.id_number || '',
      address: result.address_full || '',
      raw: apiData, // ส่งตัวเต็มไปเผื่ออยากดูเล่น
    });

  } catch (err) {
    console.error('Server Error:', err);
    res.status(500).json({ message: 'Server มีปัญหาครับ', error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server พร้อมทำงานแล้วที่ Port ${PORT}`);
});
