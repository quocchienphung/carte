# MASTER PROMPT 04 — thay đủ 7 ô bento bằng Carte security UI

Đọc prompt 00, RESEARCH, source manifest và reference lab của bước 03. Thực thi
trên bento hiện tại. Giữ composition 7 ô và A↔B morph; thay nội dung/visual có
chủ đích. Không chỉ thay chữ trên ảnh nền đá, cây, điện thoại và ribbon cũ.

## Bảng triển khai bắt buộc

| ID legacy | Carte story | Source/adaptation |
| --- | --- | --- |
| credit | Freeze in a tap. | Segmented Control/Button + CardAccessDemo |
| trust | Protection, in layers. | Layer Stack → SecurityLayersScene |
| customers | A safer route for every payment. | Integration Beam → PaymentRouteScene |
| ai | Signals in focus. | Enrichment Orbit → RiskSignalsScene |
| easy | Verify the moment. | Thinking Loader + VerificationDemo compact |
| payment | Review before you approve. | Decision Inbox với 1 giao dịch demo |
| invested | Alerts that matter. | Notification Stack với cảnh báo demo |

Dùng copy và shape constraints từ RESEARCH. Không lấy title “Integration Beam”,
“Grok”, “Slack”, “AI agents” làm nội dung sản phẩm Carte. Label/icon phải biểu đạt
Card, Device, Merchant, Checks, Approval, Receipt hoặc state bảo mật tương ứng.

## Ghép vào source hiện tại

Kiểm tra `BentoTile.tsx`, `BentoGrid.tsx`, `BentoScene.tsx`,
`bento.module.css`, `geometry.ts`, `motion/bento.ts`, `motion/timeline.ts`,
`RocoBankExperience.tsx` và `ResponsiveSite.tsx` trước khi sửa.

Giữ các key `tile.<id>` đang điều khiển outer position/size/scale và hover morph.
Tạo renderer theo visual kind thay vì hardcode 7 path WebP cũ. Có thể thêm typed
schema về feature/visual/scene; không buộc toàn bộ data mới vào union TileText cũ
nếu nó không mô tả được nội dung mới.

Outer `<a>` của BentoTile phải được thay bằng phần tử không tương tác khi bên
trong có control. Link heading/“Learn more” tách riêng nếu thật sự có đích.
Không nested anchor/button; không dùng một lớp transparent link phủ lên toàn UI.
Giữ role=list/listitem/heading và accessible name có ý nghĩa.

Các lớp art/dim/text cũ dùng page-anchored coordinates. Chỉ áp dụng chúng cho
renderer ảnh legacy nếu còn dùng. Native UI mới cần local layout/container queries;
không bị lớp dim phủ đen hoặc text overlay pointer-events che mất control.
Ref/scene state đã bỏ phải được dọn hoặc thay đúng contract, không để code chết.

## Tương tác phải hoạt động

- Freeze đổi trạng thái thẻ demo và có thể reset.
- Layer chọn được bằng pointer/keyboard; auto-cycle chỉ là tùy chọn minh họa,
  không cướp lựa chọn sau khi người dùng đã tương tác.
- Payment route hover/focus làm rõ node, pause có feedback; label dễ hiểu.
- Verification có checking → result, không spinner vô hạn.
- Recognize / Freeze demo card tạo hai kết quả khác nhau; pending tránh double action.
- Alerts dismiss card trước và đưa focus hợp lý sang card tiếp/reset.

State liên quan cùng một demo phải chia sẻ qua model đã tạo ở lab. Không để UI
hiển thị “Frozen” trong một ô và “Active” trên phone khi đó là cùng thẻ.

## Kích thước và visual finish

Kiểm tra từng ô ở cả BENTO_A/BENTO_B và giữa morph. Chú ý trust từ cao 544 xuống
344px, credit từ 224 lên 424px, payment từ rộng 484 xuống 334px, easy từ rộng 484
xuống 384px. Không giảm cả widget bằng transform để vừa: giữ chữ/control đủ đọc,
reflow list, dùng compact state và bỏ thông tin phụ trước.

Giữ dark bento surface, type family, rounding và spacing của Carte; contrast rõ.
Mượn motion/material/layout của source, không mang nguyên theme playground hoặc
font UI khác nhau vào mỗi ô. Vàng kim của artwork thẻ vẫn là artwork thẻ; không
biến tất cả UI thành neon/gold nếu source không yêu cầu.

Dùng cùng các scene/adapters trên desktop và mobile thay vì viết thêm một phiên
bản mobile bỏ hết interaction. Mobile phải có reading order và touch target phù hợp.

## Hoàn tất khi

Đủ 7 ô với visual và copy mới, không metric/ảnh cũ; action và reset hoạt động;
không tràn ở A/B/morph/mobile; dark/reduced-motion đúng; không lỗi hydration hoặc
invalid nesting. Ghi những scene/state sẽ chuyển vào canvas cho bước 06.
