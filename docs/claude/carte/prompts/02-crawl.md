# MASTER PROMPT 02 — crawl đầy đủ và kiểm chứng nguồn Affect UI

Đọc prompt 00 và `RESEARCH.md`. Brand Carte/nội dung English đã được xác lập ở
bước 01; bảo toàn source hiện tại. Nhiệm vụ bước này là nghiên cứu đủ để clone
đúng behavior, không lập một moodboard dựa vào thumbnail.

## Nguồn bắt đầu

- https://www.affectui.com/illustrations
- https://www.affectui.com/components

Mở bằng browser có JavaScript. Site có thể không trả nội dung đủ cho text fetcher.
Nếu direct extraction thiếu dữ liệu, dùng DOM render/screenshot; đừng kết luận
trang trống hoặc tự đặt tên component. Đọc `SOURCE-CATALOG.json` như baseline,
nhưng crawl lại vì số lượng và access có thể đã thay đổi.

## Crawl toàn bộ danh mục

1. Lấy mọi URL detail canonical thuộc Illustrations/Components từ sidebar,
   category, filter và pagination; khử duplicate/tracking/query không tạo UI mới.
2. Mở từng detail, ghi đúng tên, URL, nhóm, public/Pro/login, registry được tài
   liệu công bố, dependency, khi dùng/không dùng, API cần thiết, viewport/state.
3. Mở các mục Screens/Blocks/Motion được link để đánh giá layout cho section kế
   tiếp. Baseline khảo sát có 24/52/12/11/8, tổng 107; đó là mốc kiểm tra coverage,
   không phải quota được phép bỏ qua mục mới.
4. Nếu một detail lỗi, retry có giới hạn; ghi HTTP/browser error và URL. Không
   đánh dấu “inspected” cho trang chưa mở được. Duyệt với nhịp vừa phải, không
   tạo crawler vô hạn, không đi theo account/checkout/external social links.

## Đi sâu vào shortlist

Ít nhất: Layer Stack, Integration Beam, Enrichment Orbit, Segmented Control,
Decision Inbox, Notification Stack, Thinking Loader, Progress Tracker,
Tool Call Card. OTP Input là reference verification; Approval Card, Agent
Gallery, Integration Settings và Settings & Billing là các option Pro.

Với từng mẫu sẽ dùng, xem desktop, container hẹp và dark mode. Thử idle/hover/
focus/click/touch-equivalent, active/error/success/reset nếu có. Phân biệt motion
do thời gian với motion do input/scroll. Đo geometry, tỷ lệ, typography, duration/
easing và hành vi reduced-motion; không suy ra toàn bộ từ một screenshot.

Capture source screenshot ghi rõ viewport/container/state. Loại docs sidebar,
Preview/Code tab, Reset và theme-toggle playground khỏi vùng cần clone, trừ khi
chúng là control thật của component. Không mang toàn trang docs vào website Carte.

## Lấy source đúng cách

Với mẫu public, dùng registry chính thức được ghi trên detail page. Chín registry
đã được kiểm tra trong `REGISTRY-CHECKS.json`; phải kiểm tra lại response/type/
files/dependencies trước khi cài. Không đoán endpoint cho mẫu bị khóa.

Nếu source Pro có trong quyền truy cập hiện tại của người dùng, có thể dùng nó.
Nếu không có, ghi “preview inspected; source unavailable”, rồi dùng fallback
public hoặc tái triển khai hành vi quan sát được. Không bypass access control,
không tự mua hoặc lấy production bundle để thay thế source component.

## Deliverable

`docs/implementation/carte/source-manifest.json` chứa cho mỗi entry:

```text
id, name, category, canonicalUrl, access, inspectedAt,
previewStatesInspected, sourceStatus, registryUrl, dependencies,
carteRole, fitReason, limitations, destinationFiles, evidencePaths
```

Kèm `selection-map.md`: chọn mẫu nào cho 7 ô và phone section, chọn vì sao,
fallback gì; phân biệt observed fact và adaptation đề xuất. Bằng chứng ảnh nặng
ở ignored output/ngoài repo, không commit cả kho screenshot/video.

Hoàn tất khi coverage được đếm thật, shortlist có evidence đủ build và mọi
đường dẫn source đều được kiểm chứng. Không cài/import cả 107 mẫu vào bundle.
