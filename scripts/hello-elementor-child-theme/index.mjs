#!/usr/bin/env node

import { existsSync } from "node:fs";
import { resolve, basename } from "node:path";
import { parseArgs } from "node:util";
import {
  parseCssFiles,
  classifyTokens,
  pickSystemColors,
  buildTypographyKit,
  buildKitSettings,
  buildTokensCss,
} from "./parse-css-tokens.mjs";
import { writeChildTheme } from "./scaffold-theme.mjs";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    name: { type: "string", short: "n" },
    slug: { type: "string", short: "s" },
    out: { type: "string", short: "o" },
    css: { type: "string", multiple: true },
    description: { type: "string" },
    author: { type: "string" },
    help: { type: "boolean", short: "h" },
  },
});

function printHelp() {
  console.log(`
hello-elementor-child — scaffold Hello Elementor child theme + Elementor kit manifest from CSS tokens

Usage:
  npm run hello-elementor-child -- --name "Brand Child" --slug hello-elementor-brand --out ./dist/hello-elementor-brand --css ./tokens.css
  node scripts/hello-elementor-child-theme/index.mjs ./design/tokens.css ./design/components.css

Options:
  -n, --name          Theme Name (required unless inferable from slug)
  -s, --slug          Theme directory / text domain (default: hello-elementor-child)
  -o, --out           Output directory (default: ./<slug>)
  --css               CSS file path(s); also accepts positional CSS paths
  --description       style.css description
  --author            style.css author
  -h, --help          Show this help

Outputs:
  style.css, functions.php, assets/tokens.css, elementor/elementor-kit-manifest.json

No .css files in the EPA repo by default — pass your design token CSS file(s).

Example token file: scripts/hello-elementor-child-theme/example-tokens.css
`);
}

if (values.help) {
  printHelp();
  process.exit(0);
}

const cssPaths = [
  ...(values.css ?? []),
  ...positionals.filter((p) => p.endsWith(".css")),
].map((p) => resolve(p));

if (cssPaths.length === 0) {
  const example = resolve(
    import.meta.dirname,
    "example-tokens.css",
  );
  if (existsSync(example)) {
    console.warn(
      "No --css paths provided; using example-tokens.css for demonstration.",
    );
    cssPaths.push(example);
  } else {
    console.error(
      "Error: provide at least one CSS file via --css or as a positional argument.",
    );
    printHelp();
    process.exit(1);
  }
}

for (const filePath of cssPaths) {
  if (!existsSync(filePath)) {
    console.error(`Error: CSS file not found: ${filePath}`);
    process.exit(1);
  }
}

const themeSlug = values.slug ?? "hello-elementor-child";
const themeName =
  values.name ??
  themeSlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
const outDir = resolve(values.out ?? `./${themeSlug}`);

const tokens = parseCssFiles(cssPaths);
const classified = classifyTokens(tokens);
const { system_colors, custom_colors } = pickSystemColors(classified.colors);
const { system_typography, custom_typography } = buildTypographyKit(
  classified.typography,
  tokens,
);
const kit_settings = buildKitSettings(
  classified.buttons,
  classified.forms,
  tokens,
);

if (system_colors.length > 0) {
  const primary = system_colors.find((c) => c._id === "primary");
  if (primary && !kit_settings.body_color) {
    kit_settings.body_color = primary.color;
  }
  const accent = system_colors.find((c) => c._id === "accent");
  if (accent && !kit_settings.button_background_color) {
    kit_settings.button_background_color = accent.color;
  }
  const text = system_colors.find((c) => c._id === "text");
  if (text && !kit_settings.button_text_color) {
    kit_settings.button_text_color = text.color;
  }
}

const bodyTypo = system_typography.find((t) => t._id === "text");
if (bodyTypo) {
  if (!kit_settings.body_typography_typography) {
    kit_settings.body_typography_typography = "custom";
  }
  if (!kit_settings.body_typography_font_family && bodyTypo.typography_font_family) {
    kit_settings.body_typography_font_family = bodyTypo.typography_font_family;
  }
  if (!kit_settings.body_typography_font_size && bodyTypo.typography_font_size) {
    kit_settings.body_typography_font_size = bodyTypo.typography_font_size;
  }
  if (!kit_settings.body_typography_font_weight && bodyTypo.typography_font_weight) {
    kit_settings.body_typography_font_weight = bodyTypo.typography_font_weight;
  }
  if (!kit_settings.body_typography_line_height && bodyTypo.typography_line_height) {
    kit_settings.body_typography_line_height = bodyTypo.typography_line_height;
  }
}

const headingTypo = system_typography.find((t) => t._id === "primary");
if (headingTypo) {
  kit_settings.h1_typography_typography = "custom";
  kit_settings.h1_typography_font_family = headingTypo.typography_font_family;
  kit_settings.h1_typography_font_weight = "700";
  if (headingTypo.typography_font_size) {
    kit_settings.h1_typography_font_size = headingTypo.typography_font_size;
  }
  const primaryColor = system_colors.find((c) => c._id === "primary");
  if (primaryColor) {
    kit_settings.h1_color = primaryColor.color;
    kit_settings.h2_color = primaryColor.color;
  }
  kit_settings.h2_typography_typography = "custom";
  kit_settings.h2_typography_font_family = headingTypo.typography_font_family;
  kit_settings.h2_typography_font_weight = "600";
  if (headingTypo.typography_font_size) {
    const size = headingTypo.typography_font_size.size;
    kit_settings.h2_typography_font_size = {
      unit: headingTypo.typography_font_size.unit,
      size: Math.round(size * 0.79),
      sizes: [],
    };
  }
}

const buttonTypo = system_typography.find((t) => t._id === "accent");
if (buttonTypo) {
  kit_settings.button_typography_typography = "custom";
  kit_settings.button_typography_font_family = buttonTypo.typography_font_family;
  kit_settings.button_typography_font_weight = "700";
  if (buttonTypo.typography_font_size) {
    kit_settings.button_typography_font_size = buttonTypo.typography_font_size;
  }
}

const elementorManifest = {
  generated_at: new Date().toISOString(),
  source_css: cssPaths.map((p) => basename(p)),
  parent_theme: "hello-elementor",
  system_colors,
  custom_colors,
  system_typography,
  custom_typography,
  kit_settings,
  emcp_apply: {
    replace_system_colors: { tool: "emcp-tools-replace-system-colors", payload_key: "system_colors" },
    custom_colors: { tool: "emcp-tools-update-global-colors", payload_key: "colors", map_from: "custom_colors" },
    system_typography: {
      tool: "emcp-tools-replace-system-typography",
      payload_key: "typography",
      map_from: "system_typography",
    },
    custom_typography: {
      tool: "emcp-tools-update-global-typography",
      payload_key: "typography",
      map_from: "custom_typography",
    },
    kit_settings_note:
      "Merge kit_settings into the active Elementor kit via Site Settings or your deployment pipeline.",
  },
};

const tokensCss = buildTokensCss(classified.rawCssVars);

writeChildTheme(outDir, {
  themeName,
  themeSlug,
  description: values.description,
  author: values.author,
  tokensCss,
  elementorManifest,
});

console.log(`Child theme written to: ${outDir}`);
console.log(`  CSS sources: ${cssPaths.join(", ")}`);
console.log(`  System colors: ${system_colors.length}, custom: ${custom_colors.length}`);
console.log(`  Typography slots: ${system_typography.length}, custom: ${custom_typography.length}`);
console.log(`  Kit settings keys: ${Object.keys(kit_settings).length}`);
console.log(`See ${outDir}/elementor/APPLY.md to push globals to Elementor.`);
