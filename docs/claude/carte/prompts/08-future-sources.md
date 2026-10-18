# MASTER PROMPT 08 — crawl website UI/layout khác tôi cung cấp

Dùng prompt này khi tôi gửi thêm URL sau Affect UI. Đọc prompt 00, RESEARCH và
implementation hiện tại. Giữ định hướng Carte credit-card security, English UI,
7 bento roles và security narrative đã chốt.

## Input

```text
SOURCE_URLS = [dán các URL thực tế tôi vừa cung cấp]
TARGET_AREA = bento | security-story | new-section | separate-route
FEATURE_GOAL = chức năng/nội dung tôi muốn đạt được
```

Lấy URL từ tin nhắn thật; không tự coi placeholder là một nguồn đã crawl.
Nếu chỉ được cho trang danh mục, hãy khám phá mọi category/detail/pagination công
khai trong phạm vi thư viện đó trước khi chọn. Nếu được cho landing page, scan đủ
section từ trên xuống, nav, menu, tab, hover, sticky và motion/media được tải muộn.

## Quy trình bắt buộc

1. Lập URL inventory canonical và source-to-local ownership map. Khử hash/query
   trùng khi chỉ là state; vẫn lưu state cần dựng. Không đi theo account, checkout,
   analytics, lịch vô hạn hoặc những origin không liên quan tới thư viện được gửi.
2. Dùng browser render + HTTP/asset extraction khi thích hợp. Đọc giá trị declared/
   computed, vary width/height/state. Quan sát scroll thực để không bỏ sticky hoặc
   motion gắn wheel/touch; chụp initial/active/settled và reverse khi có.
3. Phân loại toàn catalog: nên dùng ngay / có thể dùng sau / không hợp Carte.
   Mỗi item có URL, access, visual role, interaction, source status, reason và evidence.
4. Chọn mẫu theo **ý nghĩa tính năng + vừa kích thước + rõ tương tác + khả năng
   tích hợp**. Đẹp nhưng không giải thích bảo mật thẻ thì không tự thêm vào website.
5. Clone mẫu được chọn trong reference lab trước; so source/local cùng trạng thái.
   Dùng source chính thức truy cập được; nếu chỉ có preview, rebuild và ghi rõ.
   Không tự mua gói, bypass login/paywall hoặc giả vờ đã có source Pro.
6. Tạo adapter Carte thay ngữ cảnh/data/icon/copy, giữ hành vi đặc trưng. Ghi từng
   thay đổi có chủ đích. Không ghép mỗi ô một aesthetic/typography khác nhau.
7. Tích hợp theo area, bảo toàn geometry/motion đang ổn định. Với bento/phone,
   bắt buộc chạy lại sync DOM → canvas của prompt 06.
8. Kiểm tra responsive, reduced motion, keyboard, errors/assets, behavior và build.

## Giới hạn nội dung và kiến trúc

Không phục hồi hero controls/social proof đã xóa. Không thay 4 ảnh thẻ polished
hoặc model/rig đang chạy nếu mẫu nguồn mới không đòi hỏi điều đó. Không biến app
thành bản sao nguyên website tham khảo có nội dung AI/CRM/billing không liên quan.

Nếu mẫu mới tốt hơn mẫu đang chọn, thay selection-map bằng phương án có lý do và
thực thi thay thế gọn gàng. Không giữ hai component chết, hai theme global hoặc hai
nguồn state song song. Chỉ vendor asset/source thực sự cần; “crawl hết” là coverage
nghiên cứu đầy đủ, không phải đưa toàn kho UI vào production bundle.

## Deliverable

Nguồn → component/layout → vị trí Carte → behavior giữ lại → data/copy đã đổi →
access/fallback → file đích → kiểm chứng. Với section mới, mô tả cả vào/ra section,
anchor và mobile reading order. Tiếp tục thực thi đến kết quả chạy được; không
chỉ trả danh sách link hoặc khen mẫu đẹp.
