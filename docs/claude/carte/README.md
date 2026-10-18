# Carte — bộ master prompt cho Claude

Mục tiêu: chuyển website Roco.bank hiện tại thành **Carte**, một website giới
thiệu trải nghiệm bảo mật thẻ tín dụng; dùng illustration/component thật từ
Affect UI để thay nội dung 7 ô bento và làm lại câu chuyện ở section điện thoại.

Prompt viết bằng tiếng Việt. **Toàn bộ nội dung hiển thị trên website dùng tiếng Anh.**

## Dùng ngay

Mở Claude tại thư mục gốc repository này và gửi:

```text
Đọc docs/claude/carte/RESEARCH.md và docs/claude/carte/prompts/00-controller.md.
Thực thi toàn bộ workflow trong 00-controller.md trên source hiện tại.
Giữ nguyên các thay đổi chưa commit của tôi. Nội dung website bằng tiếng Anh.
```

Hoặc gửi từng prompt dưới đây theo thứ tự. Mỗi prompt có phạm vi và điều kiện
hoàn tất riêng để Claude có thể tiếp tục trong phiên làm việc mới.

| Thứ tự | Prompt | Kết quả |
| --- | --- | --- |
| 00 | [Controller](prompts/00-controller.md) | Điều phối toàn bộ việc triển khai |
| 01 | [Rebrand và nội dung](prompts/01-rebrand.md) | Roco.bank → Carte; thông điệp bảo mật bằng tiếng Anh |
| 02 | [Crawl và kiểm chứng nguồn](prompts/02-crawl.md) | Kiểm tra toàn bộ danh mục; manifest nguồn và trạng thái truy cập |
| 03 | [Reference lab](prompts/03-reference-lab.md) | Clone độc lập các mẫu đã chọn, kiểm tra state/motion trước khi ghép |
| 04 | [Bento](prompts/04-bento.md) | Thay đủ 7 ô bằng UI/illustration có nội dung và tương tác mới |
| 05 | [Section điện thoại](prompts/05-security-story.md) | Câu chuyện 6 bước về bảo mật giao dịch |
| 06 | [DOM → canvas → 3D](prompts/06-handoff.md) | Điện thoại hiển thị đúng bento mới và state hiện tại |
| 07 | [Hoàn thiện](prompts/07-polish.md) | Thống nhất giao diện, responsive, truy cập bàn phím và hiệu năng |
| 08 | [Website tham khảo bổ sung](prompts/08-future-sources.md) | Dùng khi bạn gửi thêm URL component/layout khác |
| 09 | [Nghiệm thu](prompts/09-acceptance.md) | Kiểm tra hành vi, ảnh so sánh và production build |
| 10 | [Sửa khi Claude làm sai](prompts/10-recovery.md) | Đưa việc triển khai trở lại đúng yêu cầu |

Nếu dùng từng prompt: chạy **01 → 02 → 03 → 04 → 05 → 06 → 07 → 09**.
08 dành cho nguồn mới, 10 dành cho sửa sai; không phải hai section mới của website.

## Kết quả nghiên cứu

- [RESEARCH.md](RESEARCH.md): bảng thay thế từng ô, đề xuất section kế tiếp,
  các điểm kỹ thuật trong source và phạm vi đã kiểm chứng.
- [SOURCE-CATALOG.json](SOURCE-CATALOG.json): 107 URL đã mở, nhóm, nhãn Pro/public,
  registry công khai và đánh giá mức độ phù hợp cho Carte.
- [REGISTRY-CHECKS.json](REGISTRY-CHECKS.json): metadata 9 registry đã kiểm tra.

Ngày khảo sát: **18/10/2026**. Đã đọc 107 trang chi tiết: 24 illustrations,
52 components, 12 screens, 11 blocks, 8 motion. Đã mở preview của 10 mẫu tiêu biểu;
thử trực tiếp 3 tương tác. Không đồng nghĩa đã thử mọi state của cả 107 mẫu.

Bộ tài liệu này là đầu vào để Claude triển khai. Thay đổi source của website được
giao cho các prompt thực thi; lần soạn tài liệu không đổi ứng dụng đang chạy.
