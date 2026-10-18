# MASTER PROMPT 09 — nghiệm thu bằng browser và production check

Đọc prompt 00, selection map và execution log. Hãy kiểm chứng sản phẩm đang chạy,
sửa các lỗi tìm thấy rồi mới báo hoàn tất. Không dựa vào việc code compile để kết
luận motion/interaction đã đúng.

## Ma trận cần chạy

- Desktop 1440×900 và 1920×1080.
- Mobile 390×844 và một viewport hẹp 320px.
- Tablet/breakpoint quanh 1024px; cả chiều cao viewport ngắn và dài.
- Reduced motion ở desktop/mobile.
- Replay mode hiện có, nếu route/query còn được hỗ trợ sau chỉnh sửa.

Chụp mỗi view ở cùng scroll/state khi so. Source Affect UI so với clone ở reference
lab để kiểm fidelity; final Carte so với selection map và các adaptation đã ghi.
Không gọi khác biệt có chủ đích là lỗi, cũng không lấy chúng để che thiếu behavior.

## Kiểm tra sản phẩm

1. **Brand/content:** Carte trong logo wordmark, metadata, heading, aria và canvas.
   UI English; không còn +390k/300 companies/$5.9m/AI bank cũ hoặc claim tự bịa.
2. **Hero regression:** đủ 4 card polished, VISA Signature vàng của VietinBank;
   choreography hiện có. Không avatar/name/balance, Wallet/Register header,
   Buy Card/Discover hoặc chữ dọc đã xóa, kể cả DOM ẩn/mobile/canvas header.
3. **Bento:** đủ 7 visual mới ở A/B và giữa morph; không crop title/control,
   không lớp dim che UI, không nested interactive elements/hydration warning.
4. **Functional demo:** freeze/reset, select layer, route focus/pause,
   verification result, recognize vs freeze outcome, alert dismiss/reset.
   Mỗi action giữ state phù hợp và không kích hoạt outer link ngoài ý muốn.
5. **Security story:** đủ 6 bước; scroll activation khớp screen; Run security
   demo và reset hoạt động; merchant/amount/card là fixture nhất quán.
6. **Phone seam:** chụp trước/giữa/sau DOM–WebGL blend, fold, after-shift và
   reverse scroll. Không nhảy sang bento cũ hoặc state warm-up. Resize không pop.
7. **Accessibility:** Tab/Shift-Tab/Enter/Space/arrow keys ở nơi hợp role; focus
   không bị giấu sau menu; screen-reader names/state/result hợp lý; reduced motion
   không còn autoplay không cần thiết; mobile dùng được bằng touch.
8. **Runtime:** console errors, failed requests, asset decode, horizontal overflow,
   timer/observer cleanup và hành vi khi model/WebGL lỗi. Không có blank section.

Các assertion tự động nên kiểm behavior thật, không chỉ class name/số dòng code.
Dùng browser test cho decision/state/reset/handoff quan trọng; không tạo hàng loạt
unit test chỉ mirror implementation. Giữ các test source-reference cũ không còn
phù hợp được phân biệt với acceptance mới, thay vì so screenshot mới với copy Roco cũ.

## Lệnh và bằng chứng

Chạy `npm run check` cho lint + typecheck + production build. Nếu fail, sửa trong
scope; nếu lỗi đã có từ trước, đưa bằng chứng baseline thay vì tự nhận do feature.
Kiểm tra route production nếu hành vi chỉ được nhìn ở dev trước đó.

Lưu `docs/implementation/carte/acceptance.md`: bảng PASS/FAIL/NOT RUN theo các nhóm
trên, command thật đã chạy, viewport/state, source URL liên quan, ảnh evidence và
giới hạn. Screenshot/video/trace ở ignored output hoặc ngoài repo.

## Tiêu chuẩn báo cáo cuối

Trả preview URL, nội dung đã thay, bảng Affect UI → component Carte, kiểm tra thực
tế, link ảnh desktop/mobile/handoff và những khác biệt còn lại. Nếu Pro source
không có nhưng đã dùng fallback, nói đúng mẫu fallback. Không ghi “pixel-perfect”,
“production security” hay “full crawl verified” vượt quá bằng chứng.
