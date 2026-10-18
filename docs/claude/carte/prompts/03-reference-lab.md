# MASTER PROMPT 03 — clone mẫu chuẩn trước khi ghép bento

Đọc prompt 00, RESEARCH và manifest của bước 02. Thực thi clone các mẫu đã chọn
thành component độc lập, rồi kiểm tra với source. Đây là bước tạo implementation
thật, không chỉ ghi lại link hoặc screenshot.

## Reference lab

Tạo trang dev reference lab phù hợp convention của repo, ví dụ
`/dev/carte-reference-lab`. Dùng cấu hình dev-only phù hợp Next.js phiên bản
đang cài; không đưa lab/control test vào product navigation hoặc production app.

Phân tách:

- Source tham khảo được dùng hợp lệ, có provenance, ví dụ
  `src/components/references/affectui/`.
- Adapter sản phẩm, ví dụ `src/components/sites/carte/security/`.
- Model chung, ví dụ `src/lib/carte/security-demo.ts`.

Theo convention thực tế nếu repo có cách tốt hơn. Không đổi các namespace motion
legacy để tạo cảm giác đã rebrand; không di chuyển source đang hoạt động hàng loạt.

Mỗi mẫu cần source URL, sourceStatus (`official-source` hoặc
`rebuilt-from-public-preview`), component export, dependency, props adapter,
state được hỗ trợ và khác biệt có chủ đích.

## Clone trung thực, rồi mới thích nghi cho Carte

1. Lấy source public chính thức hoặc implementation từ preview đã quan sát.
   Đọc code, không chạy một CLI rồi coi như đã kiểm chứng. Nếu dùng shadcn CLI,
   xem diff config/dependency và chỉ giữ thay đổi cần thiết; không tự nâng toàn bộ stack.
2. Render nguyên mẫu ở kích thước đủ lớn. So source/local cùng viewport/state;
   sửa sai ở hình học, layer, type, shadow, crop và timing trước.
3. Sau đó tạo adapter Carte thay tên/logo/data và hỗ trợ dark surface. Ghi rõ phần
   nào thay do product requirements, phần nào phải giữ giống source.
4. Dùng nguồn công khai khi đủ: không chờ Approval Card Pro trong khi Decision
   Inbox đã thực hiện được tương tác cần thiết.

## Các contract cần tạo

- `CardAccessDemo`: Active/Frozen, action + trạng thái/accessibility.
- `SecurityLayersScene`: 5 checkpoint, selectedIndex, onSelect, animation pause.
- `PaymentRouteScene`: node labels/icons, active/paused, viewport visibility.
- `RiskSignalsScene`: dữ liệu minh họa và clock pause/resume.
- `VerificationDemo`: idle/checking/verified/error, rõ là simulation.
- `PaymentDecisionDemo`: decision, pending/resolved, recognize/freeze/reset.
- `SecurityAlertsDemo`: notification list, dismiss/reset.

Tên có thể theo convention của app; dùng props typed rõ ràng, không `any`.
State cần chia sẻ với canvas ở bước 06; không nhét toàn bộ state trong private
component rồi tạo bản copy không liên quan cho màn hình điện thoại.

## Demo data

Tạo fixture cố định: `Northstar Coffee`, `$32.10`, card ending `4242`,
`New device`, `Review suggested`. Dữ liệu minh họa, không phải giao dịch thật.
Không yêu cầu PAN/CVV hoặc login/OTP thật. Verification chỉ mô phỏng hoặc dùng
mã demo cố định được ghi rõ khi thực sự có input trong sandbox.

## Hoàn tất khi

Mỗi mẫu có preview local, provenance, state idle/active/result và reset hoạt động.
Đã kiểm tra button/tab/input keyboard, dark variant, reduced motion và container
width nhỏ. Không có CSS global từ source làm đổi hero hoặc reset toàn app.
Sau đó mới tích hợp bằng prompt 04.
