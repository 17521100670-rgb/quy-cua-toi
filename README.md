# Sổ Lệnh Quỹ

Ghi lệnh chứng chỉ quỹ trên trình duyệt, xem danh mục xuyên Fmarket, Topi và Anfin trong một chỗ. Dữ liệu chỉ ở trên máy bạn.

Trang live: https://17521100670-rgb.github.io/so-lenh-quy/

## Sổ làm được gì

1. Ghi lệnh mua và bán thủ công: quỹ, ngày, số tiền, NAV lúc giao dịch. Sổ tự tính số chứng chỉ quỹ.
2. Xem danh mục: phân bổ theo quỹ, tổng đã đầu tư so với giá trị hiện tại. NAV hiện tại nhập tay, cập nhật được từng quỹ.
3. Biểu đồ hiệu suất theo thời gian, vẽ bằng canvas thuần, không dùng dịch vụ ngoài.
4. Xuất báo cáo tháng ra file CSV, một nút bấm.

## Dữ liệu ở đâu

Chỉ trong localStorage của trình duyệt trên máy bạn. Không có tài khoản, không có máy chủ, không gửi dữ liệu đi đâu, không cookie theo dõi, không thống kê. Xóa dữ liệu trình duyệt là mất sổ, nên hãy xuất file CSV cuối mỗi tháng để giữ bản sao.

Lần đầu mở trang, sổ nạp sẵn dữ liệu mẫu (hai quỹ mẫu, bốn lệnh mẫu) để xem thử. Nút "Xóa dữ liệu mẫu" xóa sạch và bắt đầu sổ trống.

## Chạy ở máy mình

Mở `index.html` bằng trình duyệt, hoặc chạy máy chủ tĩnh trong thư mục này:

```sh
python3 -m http.server 8137
```

Rồi mở http://localhost:8137/

## Đổi tên brand

Tên brand chỉ nằm ở một chỗ: `brand.json`. Sửa `name`, `slug`, `tagline`, `site_url`, `author_bio`, `updated` rồi chạy:

```sh
node build.mjs
```

Lệnh này viết lại `index.html` và sao chép `styles.css`, `app.js`, `tokens.css`, `base.css` từ `src/` ra gốc. Không sửa tay file ở gốc, vì lần build sau sẽ ghi đè.

## Cấu trúc

- `index.html`: trang landing và sổ, nội dung render sẵn trong HTML tĩnh.
- `src/index.template.html`: bản nguồn của trang, chứa placeholder `{{BRAND_*}}`.
- `src/styles.css`, `src/tokens.css`, `src/base.css`: giao diện.
- `src/app.js`: logic sổ, phần tính toán thuần tách riêng để test bằng Node.
- `robots.txt`, `sitemap.xml`: cho công cụ tìm kiếm và AI.
- `brand.json`, `build.mjs`: cấu hình brand và lệnh build.

## Tuyên bố

Sổ Lệnh Quỹ không phải là tư vấn đầu tư. Sổ không khuyến nghị mua, bán hay nắm giữ quỹ nào, không xếp hạng quỹ và không hứa hẹn lợi nhuận. Mọi con số đều do bạn nhập và do sổ tính ra.

## Kiểm tra logic

```sh
node --check src/app.js
```
