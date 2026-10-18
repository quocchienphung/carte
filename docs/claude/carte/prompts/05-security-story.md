# MASTER PROMPT 05 — section điện thoại và câu chuyện bảo mật

Đọc prompt 00, RESEARCH và model security demo đã tạo. Thực thi section ngay sau
bento. Giữ chuyển động điện thoại gập và process-column hiện tại; đổi nội dung,
state và interaction thành trải nghiệm Carte có đầu/cuối rõ ràng.

## Narrative tiếng Anh

Eyebrow: **CARTE SECURITY DEMO**.
Heading: **What happens before you approve.**
Lede: **Explore six checkpoints in an interactive payment demo.**

Sáu bước theo RESEARCH:

1. **Open your wallet** — “Start with a demo wallet. Your real card details are not required.”
2. **Select a card** — “Choose the demo card you want to review.”
3. **Review the details** — “Check the merchant, amount and card before you continue.”
4. **Check the signals** — “Explore how an unfamiliar device or amount could change the next step.”
5. **Confirm the demo** — “Run a simulated identity check. No real verification code is needed.”
6. **Get a clear result** — “See the demo result and review the activity record.”

CTA trong section: **Run security demo**. Có thể thêm **Reset demo** và điều khiển
chọn fixture/risk scenario khi có chỗ, không đưa Buy Card/Discover trở lại hero.
Luôn có nhãn nhẹ **Interactive demo · No real payment** gần trải nghiệm.

## Các source thích hợp

- Decision Inbox mặc định, hoặc Approval Card Pro nếu source được truy cập:
  review merchant/amount và hai quyết định có kết quả khác nhau.
- Progress Tracker: tiến độ 6 checkpoint; thay nhãn sample onboarding.
- Tool Call Card: mở detail của signals/rule, không giữ arguments/result của AI tool.
- Notification Stack: kết quả và activity record.
- Thinking Loader: checking/verified demo. OTP Input chỉ là sandbox tùy chọn với
  mã demo công khai; không yêu cầu người dùng nhập mã ngân hàng thật.

Không nhét cả bốn widget cùng kích thước đầy đủ vào process column. Giữ numbered
steps là thông tin chính, một panel detail phù hợp với bước đang active.

## Đồng bộ engine và UI

Đọc `ProcessColumn.tsx`, `process.module.css`, `FoldScene.tsx`, `scroll-map.ts`,
`fold/screens.ts` và những helper viewport/engine hiện có. Đang có hardcoded
`PROCESS_COLUMN.cards = 6`, height từng step, active-line 48%, pay timing và
screen state theo chỉ số. Đừng chỉ đổi title rồi để canvas chạy câu chuyện cũ.

Giữ 6 bước trong lượt này; trích xuất step definitions/state mapping dùng chung.
Nếu thay độ cao step hoặc thêm panel detail, cập nhật phép tính scroll thật:
không dùng height 156px cũ để tính trạng thái khi DOM không còn cao 156px.

Màn hình ngoài phải phản ánh selected card, merchant, amount, review status,
verification state và result. Action giải quyết demo phải điều khiển timeline/
state machine rõ ràng, không bắt người dùng click nhiều lần hoặc chạy lại animation
vì pointer overlay chặn nút. Đổi accessible label “Pay with Face ID” nếu action
hiện chỉ chạy mô phỏng. Không gọi nó là xác thực Face ID thật nếu chưa tích hợp.

Cuộn ngược có behavior nhất quán: state/view chuyển lại đúng checkpoint; chọn rõ
demo state có giữ đến Reset hay reset khi rời scenario, không dùng hai quy tắc
trái nhau giữa process column và phone.

## Mobile và reduced motion

`ResponsiveSite.tsx` hiện chủ yếu có hero+bento; không mặc định đã có phone flow.
Thêm phiên bản section bảo mật dạng screen mock + ordered steps dùng cùng data/
state, để mobile/reduced-motion nhận đủ nội dung. Không bắt máy nhỏ tải WebGL chỉ
để đọc 6 bước. Nếu model lỗi, có fallback screen và nội dung; đừng để vùng trắng.

## Hoàn tất khi

Desktop có 6 bước và phone khớp nhau; mobile/reduced-motion xem được câu chuyện
tương đương; run/reset/decision có kết quả; scroll lên/xuống không làm nhảy hoặc
lệch cột. Giữ model/rig/material và toàn bộ sửa đổi asset hiện tại của người dùng.
