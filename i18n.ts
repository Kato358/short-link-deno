import type { Context } from "hono";

export type Locale = "zh" | "en";

interface Translations {
  [key: string]: { zh: string; en: string };
}

const translations: Translations = {
  site_title: { zh: "短链接", en: "Short Links" },
  login_title: { zh: "短链接管理", en: "Short Link Manager" },
  login_subtitle: {
    zh: "输入 API Key 以访问管理面板",
    en: "Enter your API Key to access the dashboard",
  },
  api_key_placeholder: { zh: "请输入 API Key", en: "Enter API Key" },
  sign_in: { zh: "登录", en: "Sign In" },
  sign_out: { zh: "退出", en: "Sign Out" },
  create_short_link: { zh: "创建短链接", en: "Create Short Link" },
  target_url: { zh: "目标网址", en: "Target URL" },
  custom_code: { zh: "自定义短码（可选）", en: "Custom Code (optional)" },
  create: { zh: "创建", en: "Create" },
  all_links: { zh: "所有链接", en: "All Links" },
  search_placeholder: {
    zh: "搜索短码或网址...",
    en: "Search by code or URL...",
  },
  search: { zh: "搜索", en: "Search" },
  clear: { zh: "清除", en: "Clear" },
  no_links: { zh: "暂无链接", en: "No links found" },
  code: { zh: "短码", en: "Code" },
  url: { zh: "网址", en: "URL" },
  clicks: { zh: "访问量", en: "Clicks" },
  expires: { zh: "过期时间", en: "Expires" },
  created: { zh: "创建时间", en: "Created" },
  copy: { zh: "复制", en: "Copy" },
  copied: { zh: "已复制", en: "Copied" },
  page_info: {
    zh: "第 {page} 页，共 {total} 页",
    en: "Page {page} of {total}",
  },
  previous: { zh: "上一页", en: "Previous" },
  next: { zh: "下一页", en: "Next" },
  link_details: { zh: "链接详情", en: "Link Details" },
  short_url: { zh: "短链接", en: "Short URL" },
  status: { zh: "状态", en: "Status" },
  active: { zh: "有效", en: "Active" },
  expired: { zh: "已过期", en: "Expired" },
  deleted: { zh: "已删除", en: "Deleted" },
  never: { zh: "永不过期", en: "Never" },
  custom_code_label: { zh: "自定义短码", en: "Custom Code" },
  yes: { zh: "是", en: "Yes" },
  no: { zh: "否", en: "No" },
  delete_link: { zh: "删除链接", en: "Delete Link" },
  delete_confirm: {
    zh: "确定要删除此链接吗？",
    en: "Are you sure you want to delete this link?",
  },
  back: { zh: "返回", en: "Back" },
  go_home: { zh: "返回首页", en: "Go Home" },
  not_found_title: { zh: "链接不存在", en: "Link Not Found" },
  not_found_desc: {
    zh: "该链接不存在或已过期",
    en: "This link does not exist or has expired",
  },
  invalid_api_key: { zh: "API Key 无效", en: "Invalid API Key" },
  server_error: { zh: "服务器配置错误", en: "Server configuration error" },
  invalid_url: { zh: "网址格式无效", en: "Invalid URL format" },
  invalid_code: {
    zh: "短码格式无效，请使用 2-32 个字母、数字、横线或下划线",
    en:
      "Invalid code format. Use 2-32 alphanumeric, dash or underscore characters.",
  },
  code_reserved: { zh: "该短码已保留", en: "Code is reserved" },
  code_exists: { zh: "该短码已存在", en: "Code already exists" },
  invalid_ttl: { zh: "有效期格式无效", en: "Invalid TTL format" },
  link_created: { zh: "已创建：{url}", en: "Created: {url}" },
  link_deleted: { zh: "链接已删除", en: "Link deleted" },
  lang_switch: { zh: "EN", en: "中" },
  ttl_label: { zh: "有效期", en: "TTL" },
  dark_mode: { zh: "深色模式", en: "Dark mode" },
  // Public page
  public_title: { zh: "短链接生成", en: "Short Link Generator" },
  public_subtitle: {
    zh: "输入长链接，快速生成短链接",
    en: "Enter a long URL to generate a short link",
  },
  url_placeholder: { zh: "请输入需要缩短的链接", en: "Enter a URL to shorten" },
  expiry_label: { zh: "有效期", en: "Expiry" },
  create_button: { zh: "生成短链接", en: "Create Short Link" },
  result_title: { zh: "短链接已生成", en: "Short Link Created" },
  management_entry: { zh: "管理入口", en: "Admin" },
  rate_limit_error: {
    zh: "请求过于频繁，请稍后再试",
    en: "Rate limit exceeded. Please try again later.",
  },
  // Expiry options
  expiry_1d: { zh: "1 天", en: "1 day" },
  expiry_7d: { zh: "7 天", en: "7 days" },
  expiry_14d: { zh: "14 天", en: "14 days" },
  expiry_30d: { zh: "1 个月", en: "1 month" },
  // Source labels
  source: { zh: "来源", en: "Source" },
  source_admin: { zh: "admin", en: "admin" },
  source_public: { zh: "公共", en: "public" },
  // Statistics
  total_links: { zh: "总链接数", en: "Total Links" },
  active_links: { zh: "活跃链接", en: "Active" },
  expired_links: { zh: "已过期", en: "Expired" },
  // Batch delete
  select: { zh: "选择", en: "Select" },
  batch_delete: { zh: "批量删除", en: "Batch Delete" },
  batch_delete_confirm: {
    zh: "确定要删除选中的链接吗？此操作不可恢复。",
    en: "Delete selected links? This cannot be undone.",
  },
  links_selected: { zh: "已选择 {count} 个链接", en: "{count} links selected" },
  no_selection: {
    zh: "请先选择要删除的链接",
    en: "Please select links to delete first",
  },
  public_cannot_permanent: {
    zh: "公共链接不支持永久有效期",
    en: "Public links cannot be permanent",
  },
  logged_in: { zh: "已登录", en: "Logged In" },
  go_dashboard: { zh: "进入后台", en: "Dashboard" },
  logout: { zh: "退出登录", en: "Logout" },
  custom_code_placeholder: {
    zh: "自定义短码（可选）",
    en: "Custom code (optional)",
  },
  permanent: { zh: "永久", en: "Permanent" },
  // Edit link
  edit_link: { zh: "编辑链接", en: "Edit Link" },
  save: { zh: "保存", en: "Save" },
  link_updated: { zh: "链接已更新", en: "Link updated" },
  update_ttl: { zh: "更新有效期", en: "Update TTL" },
  // Analytics
  click_trend: { zh: "点击趋势", en: "Click Trend" },
  top_links: { zh: "热门链接", en: "Top Links" },
  last_7_days: { zh: "近 7 天", en: "Last 7 days" },
  last_30_days: { zh: "近 30 天", en: "Last 30 days" },
  no_data: { zh: "暂无数据", en: "No data" },
  // Footer
  powered_by: { zh: "托管于", en: "Powered by" },
  // QR code
  qr_code: { zh: "二维码", en: "QR Code" },
  download_qr: { zh: "下载二维码", en: "Download QR" },
};

export function t(key: string, lang: Locale = "zh"): string {
  const entry = translations[key];
  if (!entry) return key;
  return entry[lang] ?? entry.zh;
}

export function getLang(c: Context): Locale {
  const cookies = c.req.header("Cookie") || "";
  const match = cookies.match(/(?:^|;\s*)lang=(zh|en)/);
  if (match && (match[1] === "zh" || match[1] === "en")) {
    return match[1] as Locale;
  }
  return "zh";
}
