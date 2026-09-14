# นโยบายข้อมูลจำลอง

## ห้าม

- DB dump จาก production/staging
- ข้อมูลบุคคล/หน่วยงานจริง, `@pcd.go.th`, ทะเบียน/แชทจริง

## ต้อง

- `DemoDatabaseSeeder` บน DB demo เท่านั้น
- อีเมล `@example.mock`, องค์กรสมมติ
- รัน `npm run scrub` ก่อน push
