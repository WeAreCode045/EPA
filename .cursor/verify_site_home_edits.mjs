import fs from "fs";

const local = fs.readFileSync(
  "/Users/maurice/EPA/projects/theoriemeesters/hello-elementor-theoriemeesters/assets/site-home.css",
  "utf8",
);
let css = "@/tmp/mcp_payload_site_home.json:content";
const files = [
  "/Users/maurice/EPA/.cursor/home_edit_0.json",
  ...Array.from({ length: 11 }, (_, i) =>
    `/Users/maurice/EPA/.cursor/emcp_edit_${i + 1}_args.json`,
  ),
];
for (const f of files) {
  const { old_string, new_string } = JSON.parse(fs.readFileSync(f, "utf8"));
  if (!css.includes(old_string)) {
    console.error("missing marker in", f, JSON.stringify(old_string));
    process.exit(1);
  }
  css = css.replace(old_string, new_string);
}
console.log("built", css.length, "local", local.length, "equal", css === local);
