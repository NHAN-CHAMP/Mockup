# Mockup — ระบบสาธิต (Sales Demo)

เว็บ HTML/CSS/JS สำหรับนำเสนอขาย — **repo แยกจาก pcdapp** (โฟลเดอร์นี้มี `.git` ของตัวเอง) โฮสต์บน GitHub Pages

## ข้อมูล

- **ข้อมูลทั้งหมดเป็นข้อมูลจำลอง** ไม่ใช่ข้อมูลจากระบบ production
- [demo-data/DATA_POLICY.md](demo-data/DATA_POLICY.md) | [LIMITATIONS.md](LIMITATIONS.md)

## สร้าง/อัปเดตจาก pcdapp

```bash
cd /var/www/pcdapp
php artisan migrate:fresh --force
php artisan db:seed --class=Database\\Seeders\\DemoDatabaseSeeder --force
php artisan demo:export-manifest

php artisan serve --host=127.0.0.1 --port=8765   # terminal แยก

cd Mockup
npm install
MOCKUP_BASE_URL=http://127.0.0.1:8765 \
MOCKUP_LOGIN_EMAIL=demo@example.mock \
MOCKUP_LOGIN_PASSWORD=demo-mockup-2026 \
npm run build
```

## Push GitHub (repo ใหม่)

```bash
cd /var/www/pcdapp/Mockup
git init
git add .
git commit -m "Initial mockup demo site"
git remote add origin git@github.com:<org>/<repo>.git
git push -u origin main
```

GitHub Pages: Settings → Pages → deploy from `main` / root
