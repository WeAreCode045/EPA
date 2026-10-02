import fs from "fs";

const files = [
  ...Array.from({ length: 11 }, (_, i) =>
    `/Users/maurice/EPA/.cursor/emcp_edit_${i + 1}_args.json`,
  ),
];

for (const f of files) {
  const args = JSON.parse(fs.readFileSync(f, "utf8"));
  const marker = args.old_string.trim();
  process.stdout.write(
    JSON.stringify({ index: f, marker, newLen: args.new_string.length }) + "\n",
  );
}
