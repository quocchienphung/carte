# MASTER PROMPT 07 — thống nhất Carte và hoàn thiện tương tác

Đọc prompt 00 và các kết quả 01–06. Các component đã có nguồn và đã ghép; bây giờ
hãy làm chúng thành một website Carte thống nhất, không phải collection demo.

## Visual system

Giữ font, dark bento surface, tỷ lệ card, rounded corners và spacing của app.
Chốt token dùng chung cho text, border, surface, accent, success, warning và error.
Không để mỗi component mang một font/reset/theme global khác nhau. Scope dark
variant trong feature/section, tránh thêm `.dark` lên toàn html chỉ để sửa một ô.

Tiết chế glow và reflection. Họa tiết kim loại trên 4 thẻ hero giữ nguyên; security
illustrations ưu tiên đường nét sạch, layer rõ, motion có lý do. Không thêm generic
shield 3D hoặc full-neon gradient để thay mẫu Affect UI chưa clone đúng.

Kiểm tra title/description theo từng kích thước tile; bỏ nowrap cũ khi cần.
Không cắt nội dung essential, giấu scrollbar để che overflow hoặc giảm font đến
mức khó đọc. Không dùng screenshot component thay cho component có tương tác.

## Chất lượng interaction

- Không có button/link giả hoặc href `#` vô nghĩa; mọi action có feedback/reset.
- Pointer và keyboard tạo state tương đương; focus ring rõ trên dark/light.
- Focus-within không làm morph reset giữa các control trong cùng tile.
- Notice đã dismiss không còn tab-focus; result update có aria-live phù hợp.
- Animation tôn trọng reduced-motion và không chạy vô hạn ngoài viewport.
- Một click không kích hoạt đồng thời outer tile link và inner action.
- Mobile input/control có kích thước thao tác hợp lý, không cần hover để hiểu nội dung.

## Hiệu năng

Xem request/bundle/long tasks ở một lần tải và một lần cuộn thực. Chỉ giữ component
được dùng; không import toàn library, homepage bundle hay hàng chục source đã crawl.
Scene loops dừng khi không thấy; không đẩy React state 60 lần/giây cho toàn page.
Reuse observer/clock theo nhu cầu. Device texture upload theo dirty state, không
regenerate mọi frame. Giữ dynamic loading và idle prewarm phù hợp phone scene.

Mọi hình/source runtime ở trong workspace, font có fallback; không hotlink asset
chưa được kiểm tra content type/CORS. Không thêm video/trace lớn vào Git.

## Hoàn tất khi

Hero, bento, phone và mobile có cùng brand/copy/demo state; các phần đã xóa không
quay lại; không có overflow, lỗi keyboard, loading treo hoặc texture cũ. Chạy kiểm
tra cần thiết cho thay đổi vừa sửa rồi chuyển prompt 09 để nghiệm thu toàn luồng.
