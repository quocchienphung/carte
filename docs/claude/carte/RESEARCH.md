# Carte: nghiên cứu nguồn và phương án thay nội dung

Khảo sát ngày 18/10/2026. Phạm vi sản phẩm: website giới thiệu **bảo mật thẻ tín
dụng**, có tương tác mô phỏng; không mặc định là một ngân hàng hay dịch vụ đã
kết nối mạng thanh toán. Tên thương hiệu hiển thị: **Carte**. Ngôn ngữ: **English**.

## 1. Những gì đã kiểm chứng

Đã mở danh mục và **107 URL chi tiết** bằng Chromium. Web text extractor không đọc
được đầy đủ site, nên việc khảo sát dựa vào DOM được render, tài liệu công khai,
preview và registry chính thức. Không chỉ xem hai trang danh mục.

| Nhóm | Đã mở | Có registry công khai theo trang tài liệu | Pro |
| --- | ---: | ---: | ---: |
| Illustrations | 24 | 17 | 7 |
| Components | 52 | 17 | 35 |
| Screens | 12 | 0 | 12 |
| Blocks | 11 | 2 | 9 |
| Motion | 8 | 4 | 4 |
| **Tổng** | **107** | **40** | **67** |

Nhãn/access có thể đổi. Claude phải kiểm tra lại trước khi lấy source. Nhãn public
ở đây nghĩa là trang tài liệu đưa registry công khai; không phải tuyên bố tự đặt
về giấy phép. Source Pro chưa được lấy trong đợt khảo sát này.

Đã kiểm tra preview của Layer Stack, Integration Beam, Enrichment Orbit,
Decision Inbox, Notification Stack, Segmented Control, Progress Tracker,
Approval Card, Agent Gallery và Settings & Billing.

Đã thử: chọn layer thứ ba trong Layer Stack; giải quyết quyết định đầu tiên của
Decision Inbox; đóng thông báo đầu tiên của Notification Stack. Đã thấy state
chọn layer đổi, và hai card sau thay đổi/fold/dismiss đúng mô tả.

Đã GET thành công 9 registry: Layer Stack, Integration Beam, Enrichment Orbit,
Segmented Control, OTP Input, Decision Inbox, Notification Stack, Progress Tracker,
Tool Call Card. Cả 9 manifest lúc kiểm tra không khai báo package dependency bổ
sung. Đây là kiểm tra metadata, chưa phải cài chúng vào ứng dụng.

## 2. Có thể thay bento được không?

**Có.** Phù hợp nhất là kết hợp illustration có chuyển động với component thể
hiện hành vi bảo mật. Không nên lấy một dashboard nguyên trang rồi thu nhỏ vào
ô bento, hoặc chỉ thay chữ trên 7 ảnh nền cũ.

Giữ 7 ID kỹ thuật hiện tại trong đợt đầu để không làm hỏng geometry/morph:
`credit`, `trust`, `customers`, `ai`, `easy`, `payment`, `invested`.
Chúng là ID nội bộ, không phải nội dung sản phẩm mới.

| Ô hiện tại | Vai trò Carte / nội dung tiếng Anh | Mẫu nên dùng | Cách thể hiện |
| --- | --- | --- | --- |
| `credit` — trái trên, 358×224 → 358×424 | **Freeze in a tap.** / “Switch card access on your terms.” | [Segmented Control](https://www.affectui.com/components/segmented-control), [Button](https://www.affectui.com/components/button) | Thẻ mẫu nhỏ + trạng thái Active/Frozen; thao tác đổi cả nhãn, icon và màu. Demo cục bộ. |
| `trust` — trái dưới, 358×544 → 358×344 | **Protection, in layers.** / “Explore five checkpoints around a payment.” | [Layer Stack](https://www.affectui.com/illustrations/layer-stack) | Stack isometric 5 lớp. Ở ô hẹp, chuyển danh sách sang dưới visual hoặc sang chế độ compact; không thu cả bản demo xuống đến mức chữ không đọc được. |
| `customers` — ô ngang lớn, 866×312 | **A safer route for every payment.** / “Follow a payment through the Carte demo.” | [Integration Beam](https://www.affectui.com/illustrations/integration-beam) | Carte ở giữa; các node là Card, Device, Merchant, Checks, Approval, Receipt. Bỏ logo Slack/Notion/Gmail; không biến chúng thành đối tác ngân hàng giả. |
| `ai` — ô ngang nhỏ, 358×168 → 458×168 | **Signals in focus.** | [Enrichment Orbit](https://www.affectui.com/illustrations/enrichment-orbit) | Vòng quét xoay quanh shield/Carte mark; node Device, Amount, Location. Dùng như minh họa, không tự tuyên bố có AI chống gian lận đã triển khai. |
| `easy` — ô ngang nhỏ, 484×168 → 384×168 | **Verify the moment.** | [Thinking Loader](https://www.affectui.com/components/thinking-loader), [OTP Input](https://www.affectui.com/components/otp-input) làm reference cho state | Trong ô chỉ hiển thị chip Checking → Verified và dấu check; input demo đầy đủ dành cho khu vực rộng hơn, không nhét 6 ô OTP + hướng dẫn vào chiều cao 168px. |
| `payment` — dưới giữa, 484×266 → 334×266 | **Review before you approve.** / “Does this payment look familiar?” | [Decision Inbox](https://www.affectui.com/components/decision-inbox) | Một giao dịch giả lập, merchant/amount/last-four rõ; hai đáp án Recognize / Freeze demo card. Có kết quả và Reset demo. |
| `invested` — dưới phải, 358×266 → 508×266 | **Alerts that matter.** / “Review unfamiliar activity in one place.” | [Notification Stack](https://www.affectui.com/components/notification-stack) | 2–3 thông báo giả lập; chỉ card trước focus được; dismiss mở card tiếp. Thay hoàn toàn số tiền invested và ảnh cây cũ. |

Các số đo ở bảng là canvas px từ `BENTO_A`/`BENTO_B`, không phải breakpoint CSS.
Claude phải kiểm tra cả hai hình học và các trạng thái trung gian khi morph.

Các dòng copy là nội dung đề xuất cho demo. Không giữ các con số `+390k`, `300
companies`, `$5.9m`, hoặc biến demo thành tuyên bố chứng nhận/compliance có thật.

## 3. Vì sao chọn các mẫu này?

- **Layer Stack:** visual 3:2; 5 mục có state chọn, auto-cycle, hover/focus pause,
  bàn phím ↑/↓. Thích hợp giải thích nhiều lớp; cần reflow riêng cho ô trái hẹp.
- **Integration Beam:** đo vị trí node thực bằng ResizeObserver; container dưới
  460px chuyển thành xếp dọc. Pulse có trình tự, không phải vẽ dây phát sáng tĩnh.
  Cần giữ nội dung trong khoảng trống 866×312 thay vì giữ padding của playground.
- **Enrichment Orbit:** hai vòng chuyển động ngược chiều, node giữ phương đứng;
  SVG hợp làm illustration nhỏ. Với reduced motion phải dừng vòng quay.
- **Decision Inbox:** tương tác hai lựa chọn và xác nhận/fold-away phù hợp review
  một khoản thanh toán. Bản free đủ làm phương án mặc định.
- **Notification Stack:** lớp card xếp sau, dismiss card trước để lộ card tiếp;
  phù hợp cảnh báo mà không cần một inbox dashboard lớn.
- **Segmented Control:** indicator trượt giữa lựa chọn và keyboard/touch handling
  đã được thiết kế. Phải đồng bộ state “Frozen” thật trong demo, không chỉ đổi màu.

Các hành vi trên được ghi từ tài liệu chính thức và preview tương ứng. Chưa đo
easing frame-by-frame; prompt crawl yêu cầu Claude đo lại khi triển khai.

## 4. Section sau bento: giữ điện thoại, đổi câu chuyện

Không cần thay toàn bộ điện thoại gập bằng một widget khác. Giá trị thị giác hiện
tại nằm ở chuỗi bento → màn hình trong → gập → màn hình ngoài → process column.
Hãy giữ phần đó, thay nội dung Apple Pay minh họa cũ bằng **Carte security demo**.

Heading: **“What happens before you approve.”**

Lede: **“Explore six checkpoints in an interactive payment demo.”**

| Bước | Title | Body tiếng Anh đề xuất | UI liên quan |
| --- | --- | --- | --- |
| 01 | Open your wallet | “Start with a demo wallet. Your real card details are not required.” | Existing lock/wallet scene |
| 02 | Select a card | “Choose the demo card you want to review.” | Existing polished card stack; [Cover Flow](https://www.affectui.com/illustrations/cover-flow) chỉ tham khảo gesture |
| 03 | Review the details | “Check the merchant, amount and card before you continue.” | [Tool Call Card](https://www.affectui.com/components/tool-call-card) làm reference disclosure |
| 04 | Check the signals | “Explore how an unfamiliar device or amount could change the next step.” | Decision Inbox; Approval Card nếu có source Pro hợp lệ |
| 05 | Confirm the demo | “Run a simulated identity check. No real verification code is needed.” | Thinking Loader; OTP Input chỉ trong sandbox ghi rõ mã demo |
| 06 | Get a clear result | “See the demo result and review the activity record.” | Notification Stack + Progress Tracker |

Một CTA riêng trong section này: **“Run security demo”**. Nó không phải hai nút
Buy Card/Discover đã xóa và không được đưa chúng quay lại hero.

Giữ đúng 6 bước ở lượt đầu: scroll-map có `PROCESS_COLUMN.cards = 6`, mốc kích
hoạt 48% chiều cao viewport, và canvas timeline có các khoảng state được đánh số.
Chỉ đổi JSX chữ mà không cập nhật screen/timeline sẽ tạo câu chuyện lệch nhau.

### Mẫu Pro đáng xem nhưng không phải phụ thuộc bắt buộc

- [Approval Card](https://www.affectui.com/components/approval-card): risk badge,
  approve/deny, pending/resolved; hợp bước 04. Fallback: Decision Inbox free.
- [Agent Gallery](https://www.affectui.com/blocks/agent-gallery): panel mở rộng
  thành product screen; hợp section phụ “Control / Verify / Review / Alerts”.
  Không thay phone section bằng carousel này trong lượt đầu.
- [Settings & Billing](https://www.affectui.com/screens/settings-billing): tham
  khảo bố cục security-control dashboard ở route riêng về sau, không bê phần
  billing/subscription vào landing page bảo mật.
- [Integration Settings](https://www.affectui.com/components/integration-settings):
  tham khảo panel thiết lập rule; không giả lập ngân hàng đã được kết nối thật.

## 5. Các lựa chọn khác và lý do không dùng làm mặc định

Danh sách đủ nằm trong SOURCE-CATALOG.json. Các quyết định đáng chú ý:

- Cover Flow hợp gallery chọn thẻ, nhưng không cần thêm một stack thứ ba vào hero.
- Side Folder/Glass Folder có thể thành kho activity/receipt; không sát 7 tính
  năng cốt lõi bằng các mẫu đã chọn. Glass Folder là Pro.
- Integration Grid/Logo Cluster cần thay logo bằng capability/security glyphs;
  không dùng logo ngân hàng như chứng cứ partnership.
- Model Wheel hợp danh sách chế độ bảo vệ, nhưng nội dung nhỏ/auto-rotate không
  tốt bằng Segmented Control cho điều khiển trạng thái nhị phân.
- Empty Calendar không giải thích bảo mật giao dịch; chỉ hợp một lịch hạn mức.
- Frost Cloud/Glow Cloud quá thiên về mascot; dễ làm loãng tín hiệu tin cậy.
- Maps chỉ dùng nếu thực sự làm country/location rule. Không thêm map chỉ vì đẹp.
- Voice Orb, Agent Team, AI Answer, Chat Composer, Delegate Board: dành cho sản
  phẩm AI/agent, không phải chức năng chính của Carte ở đợt này.
- Testimonial Wall, KPI Board, Metrics Dashboard: không thêm testimonial hoặc
  số liệu doanh thu/khách hàng không có cơ sở.

## 6. Những ràng buộc từ source hiện tại

### Đổi thương hiệu phải đủ các renderer

Không chỉ sửa `BRAND.name`. Cần kiểm tra `src/app/layout.tsx`,
`src/lib/roco-bank/content.ts`, `brand/Wordmark.tsx`, `hero/HeroCopy.tsx`,
`responsive/ResponsiveSite.tsx`, `bento/BentoGrid.tsx`, `fold/ProcessColumn.tsx`,
`src/lib/roco-bank/fold/screens.ts` và aria-label/canvas text.
Mobile heading đang hardcode nội dung; canvas cũng có chữ riêng.

Giữ folder `roco-bank`, tên CSS variable và các ID motion làm namespace kỹ thuật
trong lượt đầu; đổi hàng loạt đường dẫn không giúp đổi brand và dễ làm mất asset.
Giữ bank logo trên 4 ảnh thẻ làm artwork demo; chúng không phải wordmark Carte.

### Không lồng button trong anchor

`BentoTile.tsx` hiện có outer `<a>` bao toàn ô. Illustration/component mới có
button/tab/input bên trong. Phải đổi cấu trúc outer sang section/div phù hợp,
đặt link tách biệt nếu cần; không tạo anchor chứa button hoặc button chứa button.
Các event hover/focus morph phải hoạt động với focus-within, không reset khi Tab
giữa hai control trong cùng một ô.

### Không dùng lại art offset như một layout cho UI sống

Tile cũ dùng `TILE_ART` page-anchored, ảnh oversized, dim overlay và live text.
UI mới cần tọa độ local/container queries. Giữ ref của outer tile để morph; cập
nhật logic art/dim/text theo renderer thay vì để lớp dim cũ phủ đen UI mới.
Không resize toàn bộ panel bằng transform đến mức chữ/control không đọc được.

### DOM mới phải có renderer cho texture

`drawInnerScreen()` trong `fold/screens.ts` hiện tải 7 WebP cũ và vẽ text từ
`TILES`. Engine dùng `THREE.CanvasTexture`; import React component không tự làm
nó xuất hiện trên màn hình điện thoại.

Cần một scene model/state chung và adapter SVG/canvas hoặc snapshot texture có
chủ đích cho handoff. Ảnh chụp nguyên website không được trở thành UI thay thế.
Phải refresh texture sau thay đổi dữ liệu/demo state; không giữ ảnh prewarm cũ
rồi làm bento mới biến thành bento cũ khi gập. So sánh đúng mốc DOM/WebGL đang
blend, kể cả cuộn ngược.

### Giữ các sửa đổi người dùng đã yêu cầu

- Không phục hồi avatar/tên/số dư, Wallet/Register, Buy Card/Discover, chữ dọc
  Personal + Business ở hero/header. Các component cũ đã được xóa.
- Giữ 4 texture thẻ 1595×986 đã làm sắc nét; VietinBank VISA Signature màu vàng.
- Giữ hero card choreography, scroll/morph bento, device model/rig và morph menu.
- Không đưa lại video, raw ref hoặc hàng trăm screenshot vào Git. Chỉ giữ manifest,
  tóm tắt có ích và source/asset được website thực sự sử dụng.

## 7. Nguyên tắc dữ liệu của demo

Dùng merchant/amount/device giả lập và last-four minh họa. Không yêu cầu người xem
nhập PAN/CVV, thông tin đăng nhập ngân hàng hoặc OTP thật. Hiển thị nhãn nhỏ
**“Interactive demo · No real payment”** gần trải nghiệm mô phỏng.
Không viết “PCI certified”, “100% fraud prevention”, “bank-level encryption”,
“AI blocks fraud in real time” khi chưa có bằng chứng sản phẩm/backend.

Trong scope này, “clone” là lấy source component được cấp quyền truy cập hoặc
tái triển khai từ preview công khai, rồi thay dữ liệu/ngữ cảnh cho Carte. Những
phần chưa kiểm chứng phải được ghi rõ trong báo cáo thực thi của Claude.
