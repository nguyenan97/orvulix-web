# Web conversion implementation prompt

Tiếp tục phát triển Web/HTML conversion cho Orvulix trên repository
https://github.com/nguyenan97/orvulix-web.

Đọc AGENTS.md, các SKILL.md được yêu cầu và docs/WEB_CONVERSION_PLAN.md.
Scan code trước khi chọn task, không làm lại phần đã có. Phân biệt planned,
implemented trên branch và merged. Recheck upstream versions/advisories.

## Workflow

- Fetch, cập nhật develop bằng fast-forward và tạo feature branch từ develop.
- Nếu đang tiếp tục một PR, giữ đúng head branch; không tạo lại branch mất commits.
- Giữ mọi thay đổi không thuộc task, đặc biệt public/sitemap.xml untracked.
- Chỉ commit/push feature branch, chỉ tạo PR vào develop. Không tự merge,
  release vào main, deploy production hoặc thay Netlify settings.
- Sau merge được user yêu cầu, xác minh và cleanup branch theo skill.

## Scope và thiết kế

Làm một task rõ ràng theo thứ tự plan. HTML to Image local trước, HTML to PDF
sau; URL converters cần remote rendering service được thiết kế riêng.
Không hứa client SPA có thể chụp website bất kỳ hoặc dùng public CORS proxy.
Không thêm backend/paid API vào local MVP. Giữ React 18/Vite/TypeScript/MUI,
SPA, directory structure và upstream attribution.

Code core nằm trong src/features/web-conversion/, tool pages là adapters nhỏ.
Không bulk-format, không sửa locales/tool services không liên quan. UI giữ
MUI theme/light/dark, tool cards, responsive layout và keyboard accessibility.

Heavy conversion phải explicit Preview/Convert; input changes invalidate output,
cancel job cũ và bỏ late responses. Không auto-render mỗi keystroke. Typed
contracts/options/capabilities; không silent-ignore unsupported controls.

HTML không được execute scripts, navigate hoặc gửi external requests. Sanitize
và controlled frame/CSP/asset policy trước khi render. Không raw HTML vào parent
DOM. Test cả renderer clone. Không persist user HTML hoặc upload telemetry.

Bound input bytes, DOM depth/count, CSS/geometry, image decoding, canvas pixels
và output bytes. Cleanup frames, timers, listeners, canvas và blob URLs trên mọi
exit. DOM renderer không có hard worker deadline; cancellation cooperative và
resource caps phải được nói đúng. Không fallback sang unsafe rendering.

Local PDF raster phải có nhãn rõ text không searchable/selectable. Review jsPDF
advisories và targeted version upgrade trước khi mở rộng PDF usage. Remote jobs
phải có SSRF prevention cho redirects/subresources/DNS, isolation, quotas, real
backend cancellation và bounded downloads. Không expose Chrome/Gotenberg trực tiếp.

## Validation và delivery

- Unit tests: boundaries, sanitizer, options, filenames và job lifecycle.
- Real browser tests: paste/upload, preview, options, convert, download và decode
  actual PNG/JPEG/PDF; không chỉ mock API hoặc assert filename.
- Security cases: scripts/event handlers, external CSS/images/fonts/srcset,
  navigation, malformed/oversized inputs; verify no content network leakage.
- Test Chromium/Firefox/WebKit, mobile layout/dark/keyboard, edits/cancel/reset,
  unmount, recovery và stale output. Không tăng retries hoặc bỏ assertions.
- Chạy typecheck, relevant/full required tests, production/Pages builds; giữ
  metadata, canonical, sitemap/static route count, true404, Pages prefix/noindex.
- Chạy text-style check (không U+2014) và diff whitespace check.
- Cập nhật plan/backlog theo actual coverage; ghi limitations/sync hotspots.
- Commit scoped, push feature, PR vào develop, theo dõi CI đúng head.
- Báo cáo tiếng Việt: implementation, checks, limitations, link PR. Dừng chờ review.
