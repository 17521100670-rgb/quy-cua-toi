// build.mjs: đổi tên brand: sửa brand.json rồi chạy `node build.mjs`.
// Tên brand chỉ nằm ở brand.json, không rải khắp file.
// Gốc repo là thư mục deploy: index.html + styles.css + app.js + tokens.css +
// base.css nằm ở gốc; src/ là bản nguồn để sửa.
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';

const brand = JSON.parse(readFileSync('brand.json', 'utf8'));
const tpl = readFileSync('src/index.template.html', 'utf8');

const out = tpl
  .replaceAll('{{BRAND_NAME}}', brand.name)
  .replaceAll('{{BRAND_SLUG}}', brand.slug)
  .replaceAll('{{BRAND_TAGLINE}}', brand.tagline)
  .replaceAll('{{SITE_URL}}', brand.site_url)
  .replaceAll('{{AUTHOR_BIO}}', brand.author_bio)
  .replaceAll('{{UPDATED}}', brand.updated);

writeFileSync('index.html', out);
for (const f of ['styles.css', 'app.js', 'tokens.css', 'base.css']) copyFileSync('src/' + f, f);
console.log(`Built index.html for "${brand.name}" (${brand.site_url})`);
