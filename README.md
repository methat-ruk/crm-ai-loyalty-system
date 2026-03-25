# crm-ai-loyalty-system

โปรเจกต์ระบบ **CRM (Customer Relationship Management) และ Loyalty Management** ที่พัฒนาแบบ **Full-Stack** สำหรับจัดการข้อมูลลูกค้า ระบบคะแนนสะสม (Loyalty Points) และสิทธิประโยชน์สำหรับสมาชิก (Rewards)

ระบบมีการใช้ **AI (Artificial Intelligence)** เพื่อช่วยวิเคราะห์พฤติกรรมลูกค้า (Customer Behavior Analysis) และสร้างข้อมูลเชิงลึก (Customer Insights) เพื่อช่วยในการทำการตลาดและการออกแบบโปรโมชั่น

โปรเจกต์นี้พัฒนาเพื่อใช้เป็น **Portfolio** สำหรับแสดงทักษะด้าน

- Full-Stack Development
- REST API Development
- Database Design
- AI Integration
- System Design

---

# Mini CRM + Loyalty + AI Assistant

ระบบจำลอง **Customer Loyalty Platform** ที่ใช้ในธุรกิจ เช่น

- Retail
- E-commerce
- Restaurant
- Membership Programs

---

# Features (ฟีเจอร์ของระบบ)

## Authentication & Access Control

ระบบยืนยันตัวตนและกำหนดสิทธิ์ผู้ใช้งาน

- User Login / Logout
- Role-based Access Control (RBAC)
- Admin / Staff / Marketing Roles

---

## Customer Management (การจัดการข้อมูลลูกค้า)

- Create Customer (เพิ่มลูกค้า)
- Update Customer Profile (แก้ไขข้อมูลลูกค้า)
- Delete Customer
- Customer Profile Page
- Customer Activity Timeline

ข้อมูลลูกค้าตัวอย่าง

- Name
- Email
- Phone
- Membership Level
- Total Loyalty Points

---

## Loyalty System (ระบบคะแนนสะสม)

ระบบจัดการคะแนนสะสมของลูกค้า

- Earn Loyalty Points (รับคะแนนจากการซื้อสินค้า)
- Redeem Points (ใช้คะแนนแลกของรางวัล)
- Loyalty Points Balance (คะแนนคงเหลือ)
- Points Transaction History (ประวัติการใช้คะแนน)

ตัวอย่าง Transaction

| Date       | Action        | Points |
| ---------- | ------------- | ------ |
| 1 Jan 2026 | Purchase      | +50    |
| 5 Jan 2026 | Redeem Reward | -30    |

---

## Rewards Management (ระบบของรางวัล)

ระบบจัดการของรางวัลที่ลูกค้าสามารถใช้คะแนนแลกได้

- Create Rewards (สร้างของรางวัล)
- Rewards Catalog (รายการของรางวัล)
- Reward Redemption (การแลกของรางวัล)
- Reward Points Cost (จำนวนคะแนนที่ใช้แลก)
- Reward Expiration Date (วันหมดอายุของรางวัล)

ตัวอย่าง Rewards

| Reward              | Points Required |
| ------------------- | --------------- |
| 10% Discount Coupon | 100             |
| Free Drink          | 150             |
| VIP Gift Set        | 500             |

---

## Promotions & Campaigns (โปรโมชั่นและแคมเปญ)

ระบบจัดการโปรโมชั่นทางการตลาด

- Create Promotion Campaign
- Assign Promotions to Customer Segments
- Promotion Validity Period (ช่วงเวลาโปรโมชั่น)

ตัวอย่าง

- New Year Campaign 2026
- VIP Exclusive Discount

---

## Analytics Dashboard (แดชบอร์ดวิเคราะห์ข้อมูล)

Dashboard สำหรับดูข้อมูลเชิงสถิติของระบบ

ตัวอย่าง Metrics

- Total Customers
- Active Customers
- Total Loyalty Points Issued
- Top Customers
- Most Redeemed Rewards

---

## AI Features (ฟีเจอร์ AI)

ระบบใช้ AI เพื่อช่วยวิเคราะห์ข้อมูลลูกค้า

### AI Customer Segmentation

แบ่งกลุ่มลูกค้าอัตโนมัติ เช่น

- VIP Customers
- Regular Customers
- At-Risk Customers

---

### AI Promotion Recommendation

AI แนะนำโปรโมชั่นที่เหมาะสมกับลูกค้าแต่ละกลุ่ม

ตัวอย่าง

"ลูกค้ากลุ่ม VIP มีแนวโน้มซื้อซ้ำสูง แนะนำโปรโมชั่นส่วนลด 10%"

---

### AI Customer Insight Summary

AI สรุปข้อมูลพฤติกรรมลูกค้า เช่น

- Purchase frequency
- Customer lifetime value
- Loyalty engagement

---

# User Flow (ตัวอย่างการทำงานของระบบ)

1. Admin Login เข้าสู่ระบบ
2. เพิ่มข้อมูลลูกค้า (Create Customer)
3. ลูกค้าทำการซื้อสินค้าและได้รับ Loyalty Points
4. ระบบบันทึก Points Transaction
5. ลูกค้าใช้คะแนนแลก Rewards
6. AI วิเคราะห์พฤติกรรมลูกค้า
7. ระบบแนะนำโปรโมชั่น
8. ผู้ดูแลดูข้อมูลผ่าน Analytics Dashboard

---

# Tech Stack (เทคโนโลยีที่ใช้)

Frontend

- Next.js
- Tailwind CSS
- Axios

Backend

- Node.js
- NestJS

Database

- PostgreSQL

ORM

- Prisma

AI

- OpenAI API

---

# API Modules

ตัวอย่าง API ในระบบ

/api/auth
/api/customers
/api/loyalty
/api/rewards
/api/promotions
/api/analytics
/api/ai

---

# Database Core Entities

ตารางหลักของระบบ

- Users – system users (admin/staff)
- Customers – customer profiles
- LoyaltyAccounts – point balance per customer
- PointsTransactions – history of point changes
- Rewards – redeemable rewards
- RewardRedemptions – redemption records
- Promotions – marketing campaigns

---

# Future Improvements

- Email Notification System
- AI Predictive Analytics
- Customer Lifetime Value Prediction
- Marketing Campaign Automation
- Mobile App Integration

---

# Purpose of this Project

โปรเจกต์นี้สร้างขึ้นเพื่อ

- ฝึกการพัฒนา Full-Stack Application
- แสดงความสามารถด้าน System Design
- ทดลองใช้ AI กับระบบธุรกิจ
- ใช้เป็น Portfolio สำหรับสมัครงาน
