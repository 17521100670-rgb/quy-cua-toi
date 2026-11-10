# Quỹ Của Tôi

Ghi lệnh chứng chỉ quỹ trên trình duyệt, xem danh mục xuyên Fmarket, Topi và Anfin trong một chỗ. Dữ liệu chỉ ở trên máy bạn.

Trang live: https://17521100670-rgb.github.io/quy-cua-toi/

## Sổ làm được gì

1. Ghi lệnh mua và bán thủ công: quỹ, ngày, số tiền, NAV lúc giao dịch. Sổ tự tính số chứng chỉ quỹ.
2. Xem danh mục: phân bổ theo quỹ, tổng đã đầu tư so với giá trị hiện tại. NAV hiện tại nhập tay, cập nhật được từng quỹ. Quỹ nào quá 30 ngày chưa cập nhật NAV thì hiện cảnh báo nhẹ.
3. XIRR tự động: từng quỹ và toàn bộ danh mục, luôn hiển thị kèm kỳ hạn. Vô nghiệm thì hiện dấu gạch ngang, không bịa số.
4. Nhập hàng loạt CSV: dán nội dung CSV, tự gán cột thủ công, xem trước rồi mới nhập.
5. Sao lưu toàn bộ sổ: xuất file JSON, nhập lại là có lại toàn bộ sổ.
6. Gợi ý tên quỹ: gõ mã hoặc tên quỹ, ô gợi ý hiện 22 quỹ mở đã kiểm chứng, kèm tên cũ trước tháng 06/2026. Danh sách chỉ giúp gõ nhanh, không phải gợi ý mua.
7. Mục tiêu danh mục (tùy chọn): nhập mục tiêu, sổ hiện thanh tiến độ theo giá trị hiện tại.
8. Biểu đồ hiệu suất theo thời gian, vẽ bằng canvas thuần, không dùng dịch vụ ngoài.
9. Xuất báo cáo tháng ra file CSV, một nút bấm.

## Dữ liệu ở đâu

Chỉ trong localStorage của trình duyệt trên máy bạn. Không có tài khoản, không có máy chủ, không gửi dữ liệu đi đâu, không cookie theo dõi, không thống kê. Xóa dữ liệu trình duyệt là mất sổ nếu chưa xuất backup, nên hãy xuất backup JSON trong tab Sao lưu cuối mỗi tháng để giữ bản sao đầy đủ.

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

Tên hiện tại "Quỹ Của Tôi" được chốt ngày 10/11/2026, thay cho tên cũ "Sổ Lệnh Quỹ", vì tên cũ trùng với một app thật đã có.

## Cấu trúc

- `index.html`: trang landing và sổ, nội dung render sẵn trong HTML tĩnh.
- `src/index.template.html`: bản nguồn của trang, chứa placeholder `{{BRAND_*}}`.
- `src/styles.css`, `src/tokens.css`, `src/base.css`: giao diện.
- `src/app.js`: logic sổ, phần tính toán thuần tách riêng để test bằng Node.
- `robots.txt`, `sitemap.xml`: cho công cụ tìm kiếm và AI.
- `brand.json`, `build.mjs`: cấu hình brand và lệnh build.

Các tab trong sổ: Ghi lệnh, Danh mục, Hiệu suất, Báo cáo tháng, Nhập CSV, Sao lưu.

## Tuyên bố

Quỹ Của Tôi không phải là tư vấn đầu tư. Sổ không khuyến nghị mua, bán hay nắm giữ quỹ nào, không xếp hạng quỹ và không hứa hẹn lợi nhuận. Mọi con số đều do bạn nhập và do sổ tính ra.

## Kiểm tra logic

```sh
node --check src/app.js
node -e "const Q = require('./src/app.js'); console.log(Q.solveXirr([{date:'2026-01-01',amount:-10000000},{date:'2026-02-01',amount:-10000000},{date:'2026-03-01',amount:21000000}]));"
```

Kết quả kỳ vọng: khoảng 0,504, tức XIRR 50,40%/năm.
