# MASTER PROMPT 10 — sửa khi kết quả không đúng yêu cầu

Đọc prompt 00, RESEARCH, selection-map và diff hiện tại. Kết quả vừa rồi chưa đạt.
Hãy xác định lỗi cụ thể, sửa source và kiểm chứng, không chỉ xin lỗi hoặc viết kế
hoạch mới. Bảo toàn những phần đã đúng và công việc chưa commit của người dùng.

## Những lỗi cần tìm trước

- Chỉ thay heading trên 7 ảnh nền cũ, không clone illustration/component.
- Dùng generic icon/shield thay cho mẫu đã chỉ định mà không ghi lý do/fallback.
- Đưa nguyên AI/Slack/Grok/customer metrics của source vào Carte.
- Đã bỏ qua source detail, chỉ xem thumbnail rồi đoán animation.
- Import cả playground/sidebar/Preview–Code/theme controls của Affect UI.
- Clone một screenshot thay cho UI sống, hoặc button chỉ có hover mà không có action.
- Outer anchor bọc button, lớp overlay chặn click, focus-within làm morph nhảy.
- Mobile/reduced-motion vẫn hiện nội dung cũ hoặc không có security section.
- Phone inner screen còn 7 WebP cũ, text Roco hoặc state prewarm khác với DOM.
- Mỗi ô một theme/font, chữ quá bé, crop ở hình học B hoặc GPU/texture giật.
- Phục hồi avatar/balance, Wallet/Register, Buy Card/Discover, chữ dọc đã xóa.
- Ghi đã test/build/crawl hoặc lấy source Pro khi thực tế chưa làm được.

## Cách sửa

Lập tối đa 5 sai lệch quan trọng nhất với file + browser evidence. Chọn prompt
chuyên môn tương ứng 01–07, thực thi sửa ngay. Mẫu public đủ dùng thì triển khai
fallback đã chỉ định thay vì dừng toàn bộ việc vì Pro. Lặp so source/local đúng
viewport/state; với handoff bắt buộc xem cả cuộn ngược.

Chạy lại những kiểm tra bị ảnh hưởng và production check khi thay code. Cập nhật
execution log/acceptance theo kết quả thật. Kết thúc khi lỗi đã được sửa hoặc một
đầu vào bắt buộc thật sự thiếu đã được chỉ rõ cùng phần vẫn có thể hoàn tất.
