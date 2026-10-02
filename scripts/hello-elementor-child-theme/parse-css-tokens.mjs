/**
 * Parse CSS custom properties and related declarations from one or more CSS files.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const CUSTOM_PROP_RE =
  /--([a-zA-Z0-9_-]+)\s*:\s*([^;{}]+?)\s*;/g;

const HEX_COLOR_RE = /^#([0-9a-f]{3,8})$/i;
const RGB_RE =
  /^rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*[\d.]+)?\s*\)$/i;

/**
 * @param {string} raw
 * @returns {string}
 */
/**
 * @param {string} raw
 * @param {Record<string, string>} tokens
 * @param {number} depth
 * @returns {string}
 */
function resolveTokenValue(raw, tokens, depth = 0) {
  if (depth > 8) {
    return raw.trim();
  }
  const value = raw.trim().replace(/\s+/g, " ");
  const varRef = /^var\(\s*--([a-zA-Z0-9_-]+)(?:\s*,\s*([^)]+))?\s*\)$/i.exec(
    value,
  );
  if (!varRef) {
    return value;
  }
  const refKey = varRef[1];
  const fallback = varRef[2]?.trim();
  if (tokens[refKey]) {
    return resolveTokenValue(tokens[refKey], tokens, depth + 1);
  }
  if (fallback) {
    return resolveTokenValue(fallback, tokens, depth + 1);
  }
  return value;
}

/** Tokens that hold non-color design values (spacing, radii as keys, etc.) */
const NON_COLOR_TOKEN_KEYS = new Set([
  "r-sm",
  "r-md",
  "r-lg",
  "btn",
  "btn-lg",
  "gutter",
  "section",
  "h-display",
  "h1",
  "h2",
  "h3",
  "h4",
]);

/**
 * @param {string} raw
 * @param {Record<string, string>} tokens
 * @returns {boolean}
 */
function valueLooksLikeColor(raw, tokens) {
  const resolved = normalizeColor(resolveTokenValue(raw, tokens));
  return HEX_COLOR_RE.test(resolved) || RGB_RE.test(resolved);
}

function normalizeColor(raw) {
  const value = raw.trim().replace(/\s+/g, " ");
  if (HEX_COLOR_RE.test(value)) {
    const hex = value.toLowerCase();
    if (hex.length === 4) {
      const [, r, g, b] = hex;
      return `#${r}${r}${g}${g}${b}${b}`;
    }
    return hex.length === 9 ? hex.slice(0, 7) : hex;
  }
  if (RGB_RE.test(value)) {
    return value;
  }
  return value;
}

/**
 * @param {string} filePath
 * @returns {Record<string, string>}
 */
export function parseCssFile(filePath) {
  const absolute = resolve(filePath);
  const content = readFileSync(absolute, "utf8");
  const tokens = {};

  let match;
  const re = new RegExp(CUSTOM_PROP_RE.source, "g");
  while ((match = re.exec(content)) !== null) {
    const name = match[1].trim();
    const value = match[2].trim();
    if (name in tokens) {
      continue;
    }
    tokens[name] = value;
  }

  return tokens;
}

/**
 * @param {string[]} filePaths
 * @returns {Record<string, string>}
 */
export function parseCssFiles(filePaths) {
  const merged = {};
  for (const filePath of filePaths) {
    const fileTokens = parseCssFile(filePath);
    Object.assign(merged, fileTokens);
  }
  return merged;
}

/**
 * @param {string} key
 * @returns {string}
 */
function slugifyId(key) {
  return key
    .toLowerCase()
    .replace(/^color-|^colour-|^font-|^typography-/, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24);
}

/**
 * @param {Record<string, string>} tokens
 */
export function classifyTokens(tokens) {
  const colors = [];
  const typography = [];
  const buttons = {};
  const forms = {};
  const layout = {};
  const rawCssVars = { ...tokens };

  for (const [key, value] of Object.entries(tokens)) {
    const lowerKey = key.toLowerCase();

    if (lowerKey.includes("button")) {
      buttons[key] = value;
      continue;
    }

    if (
      lowerKey.includes("form") ||
      lowerKey.includes("input") ||
      (lowerKey.includes("field") && !lowerKey.includes("color")) ||
      (lowerKey.includes("label") && !lowerKey.includes("color"))
    ) {
      forms[key] = value;
      continue;
    }

    if (/^h-display$|^h[1-4]$/.test(lowerKey) && /\d/.test(value)) {
      typography.push({ key: `font-size-${lowerKey}`, value });
      continue;
    }

    if (
      lowerKey.includes("font-family") ||
      lowerKey.startsWith("font-") ||
      lowerKey.includes("font-size") ||
      lowerKey.includes("line-height") ||
      lowerKey.includes("font-weight") ||
      lowerKey.startsWith("e-global-typography")
    ) {
      typography.push({ key, value });
      continue;
    }

    const keyLooksLikeColor =
      lowerKey.includes("color") ||
      lowerKey.includes("colour") ||
      lowerKey.startsWith("e-global-color");

    const isPaletteColor =
      !NON_COLOR_TOKEN_KEYS.has(lowerKey) &&
      valueLooksLikeColor(value, tokens);

    if ((keyLooksLikeColor || isPaletteColor) && isPaletteColor) {
      colors.push({
        key,
        id: slugifyId(key),
        title: key.replace(/-/g, " "),
        color: normalizeColor(resolveTokenValue(value, tokens)),
      });
      continue;
    }

    if (
      lowerKey.includes("container") ||
      lowerKey.includes("radius") ||
      lowerKey.includes("spacing") ||
      lowerKey.includes("gap")
    ) {
      layout[key] = value;
    }
  }

  return { colors, typography, buttons, forms, layout, rawCssVars };
}

/**
 * @param {Array<{ key: string, id: string, title: string, color: string }>} colors
 */
export function pickSystemColors(colors) {
  const systemSlots = ["primary", "secondary", "text", "accent"];
  const system = [];
  const custom = [];

  const findByPattern = (patterns) =>
    colors.find((c) =>
      patterns.some((p) => p.test(c.key) || p.test(c.id) || p.test(c.title)),
    );

  const assignments = [
    {
      slot: "primary",
      patterns: [/primary/, /brand/, /navy/, /main/],
      defaultTitle: "Primary",
    },
    {
      slot: "secondary",
      patterns: [/secondary/, /sky/, /alt/],
      defaultTitle: "Secondary",
    },
    {
      slot: "text",
      patterns: [/text/, /body/, /foreground/, /\bfg\b/],
      defaultTitle: "Text",
    },
    {
      slot: "accent",
      patterns: [/accent/, /cta/, /highlight/, /yellow/],
      defaultTitle: "Accent",
    },
  ];

  const usedKeys = new Set();

  for (const { slot, patterns, defaultTitle } of assignments) {
    const match = findByPattern(patterns);
    if (match && !usedKeys.has(match.key)) {
      usedKeys.add(match.key);
      system.push({
        _id: slot,
        title: match.title || defaultTitle,
        color: match.color,
      });
    }
  }

  let colorIndex = 0;
  for (const slot of systemSlots) {
    if (!system.some((s) => s._id === slot) && colors[colorIndex]) {
      const c = colors[colorIndex];
      if (!usedKeys.has(c.key)) {
        usedKeys.add(c.key);
        system.push({
          _id: slot,
          title: c.title,
          color: c.color,
        });
      }
      colorIndex += 1;
    }
  }

  for (const c of colors) {
    if (!usedKeys.has(c.key)) {
      custom.push({
        _id: c.id || slugifyId(c.key),
        title: c.title,
        color: c.color,
      });
    }
  }

  return { system_colors: system, custom_colors: custom };
}

/**
 * @param {Array<{ key: string, value: string }>} typographyTokens
 * @param {Record<string, string>} allTokens
 */
export function buildTypographyKit(typographyTokens, allTokens) {
  const families = {};
  const sizes = {};
  const weights = {};
  const lineHeights = {};

  const ingest = (key, value) => {
    const lower = key.toLowerCase();
    if (
      /^font-[a-z0-9-]+$/.test(lower) &&
      !lower.includes("size") &&
      !lower.includes("weight") &&
      !lower.includes("line-height")
    ) {
      const family = value.replace(/['"]/g, "").split(",")[0].trim();
      const role = lower.replace(/^font-/, "");
      families[role] = family;
      if (role === "sans" || role === "body") {
        families.body = family;
        families.text = family;
      }
      return;
    }
    const base = lower
      .replace(/^typography-/, "")
      .replace(/^font-/, "")
      .replace(/-family$/, "")
      .replace(/-size$/, "")
      .replace(/-weight$/, "")
      .replace(/-line-height$/, "")
      .replace(/-height$/, "");

    if (lower.includes("family")) {
      families[base] = value.replace(/['"]/g, "").split(",")[0].trim();
    } else if (lower.includes("size")) {
      sizes[base] = value;
    } else if (lower.includes("weight")) {
      weights[base] = value;
    } else if (lower.includes("line-height") || lower.includes("height")) {
      lineHeights[base] = value;
    }
  };

  for (const { key, value } of typographyTokens) {
    ingest(key, value);
  }

  for (const [key, value] of Object.entries(allTokens)) {
    if (
      key.includes("font-family") ||
      key.includes("font-size") ||
      key.includes("font-weight") ||
      key.includes("line-height")
    ) {
      ingest(key, value);
    }
  }

  const parseSize = (raw) => {
    if (!raw) {
      return undefined;
    }
    const trimmed = raw.trim();
    const num = parseFloat(trimmed);
    if (Number.isNaN(num)) {
      return undefined;
    }
    const unit = trimmed.replace(String(num), "").trim() || "px";
    return { unit, size: num, sizes: [] };
  };

  const parseLineHeight = (raw) => {
    if (!raw) {
      return undefined;
    }
    const trimmed = raw.trim();
    const num = parseFloat(trimmed);
    if (Number.isNaN(num)) {
      return undefined;
    }
    const unit = trimmed.includes("px") ? "px" : "em";
    return { unit, size: num, sizes: [] };
  };

  const systemTypography = [
    {
      _id: "primary",
      title: "Headings",
      role: "heading",
      keys: ["heading", "headings", "h1", "display", "primary"],
    },
    {
      _id: "secondary",
      title: "Subheadings",
      role: "subheading",
      keys: ["subheading", "h2", "secondary"],
    },
    {
      _id: "text",
      title: "Body",
      role: "body",
      keys: ["body", "text", "paragraph"],
    },
    {
      _id: "accent",
      title: "UI / buttons",
      role: "ui",
      keys: ["button", "ui", "accent", "label"],
    },
  ];

  const pickBase = (keys) => {
    for (const k of keys) {
      if (families[k] || sizes[k] || weights[k]) {
        return k;
      }
    }
    return keys[0];
  };

  const typography = systemTypography.map((slot) => {
    const base = pickBase(slot.keys);
    const entry = {
      _id: slot._id,
      title: slot.title,
      typography_typography: "custom",
      typography_font_family: families[base] || families.body || "inherit",
      typography_font_weight: weights[base] || "400",
    };
    const fontSize = parseSize(sizes[base]);
    const lineHeight = parseLineHeight(lineHeights[base]);
    if (fontSize) {
      entry.typography_font_size = fontSize;
    }
    if (lineHeight) {
      entry.typography_line_height = lineHeight;
    }
    return entry;
  });

  const customTypography = Object.keys(families)
    .filter(
      (base) =>
        !systemTypography.some((s) => s.keys.includes(base)) &&
        base !== "body" &&
        base !== "text",
    )
    .map((base) => ({
      _id: slugifyId(base),
      title: base.replace(/-/g, " "),
      typography_typography: "custom",
      typography_font_family: families[base],
      typography_font_weight: weights[base] || "400",
      ...(parseSize(sizes[base])
        ? { typography_font_size: parseSize(sizes[base]) }
        : {}),
      ...(parseLineHeight(lineHeights[base])
        ? { typography_line_height: parseLineHeight(lineHeights[base]) }
        : {}),
    }));

  return { system_typography: typography, custom_typography: customTypography };
}

/**
 * @param {Record<string, string>} buttons
 * @param {Record<string, string>} forms
 * @param {Record<string, string>} allTokens
 */
export function buildKitSettings(buttons, forms, allTokens) {
  const get = (...names) => {
    for (const name of names) {
      if (buttons[name]) {
        return buttons[name];
      }
      if (forms[name]) {
        return forms[name];
      }
      if (allTokens[name]) {
        return allTokens[name];
      }
    }
    for (const [key, value] of Object.entries({ ...buttons, ...forms, ...allTokens })) {
      const lower = key.toLowerCase();
      for (const name of names) {
        if (lower.includes(name.toLowerCase())) {
          return value;
        }
      }
    }
    return undefined;
  };

  const parseRadius = (raw) => {
    const num = parseFloat(String(raw || "").trim());
    if (Number.isNaN(num)) {
      return undefined;
    }
    const s = String(num);
    return {
      unit: "px",
      top: s,
      right: s,
      bottom: s,
      left: s,
      isLinked: true,
    };
  };

  const settings = {};

  const buttonBg = get(
    "button-background",
    "button-bg",
    "color-accent",
    "accent",
    "yellow",
  );
  const buttonText = get("button-text", "button-color", "color-primary", "navy");
  const buttonHoverBg = get(
    "button-hover-background",
    "button-bg-hover",
    "yellow-hover",
  );
  const buttonHoverText = get("button-hover-text", "button-color-hover");
  const buttonRadius = get(
    "button-radius",
    "button-border-radius",
    "radius-button",
    "r-md",
  );

  if (buttonText) {
    settings.button_text_color = normalizeColor(buttonText);
  }
  if (buttonBg) {
    settings.button_background_color = normalizeColor(buttonBg);
  }
  if (buttonHoverText) {
    settings.button_hover_text_color = normalizeColor(buttonHoverText);
  }
  if (buttonHoverBg) {
    settings.button_background_hover_color = normalizeColor(buttonHoverBg);
  }
  const radius = parseRadius(buttonRadius);
  if (radius) {
    settings.button_border_radius = radius;
  }

  const formText = get("form-field-text", "input-text", "form-text", "navy");
  const formBg = get("form-field-background", "input-background", "white");
  const formBorder = get("form-field-border", "input-border", "border");
  const formLabel = get("form-label", "label-color", "muted", "control");
  const formRadius = get("form-field-radius", "input-radius", "r-md");

  if (formText) {
    settings.form_field_text_color = normalizeColor(formText);
  }
  if (formBg) {
    settings.form_field_background_color = normalizeColor(formBg);
  }
  if (formBorder) {
    settings.form_field_border_color = normalizeColor(formBorder);
  }
  if (formLabel) {
    settings.form_label_color = normalizeColor(formLabel);
  }
  const formRadiusParsed = parseRadius(formRadius);
  if (formRadiusParsed) {
    settings.form_field_border_radius = formRadiusParsed;
  }

  const containerWidth = get("container-width", "layout-container");
  if (containerWidth) {
    const num = parseFloat(containerWidth);
    if (!Number.isNaN(num)) {
      settings.container_width = { unit: "px", size: num, sizes: [] };
    }
  }

  const bodyColor = get("color-text", "text", "body-color", "navy");
  const bodyFont = get(
    "font-family-body",
    "font-body",
    "body-font-family",
    "font-sans",
    "sans",
  );
  const bodySize = get("font-size-body", "body-font-size");
  const bodyWeight = get("font-weight-body", "body-font-weight");
  const bodyLineHeight = get("line-height-body", "body-line-height");

  if (bodyColor) {
    settings.body_color = normalizeColor(resolveTokenValue(bodyColor, allTokens));
  }
  if (bodyFont || bodySize || bodyWeight) {
    settings.body_typography_typography = "custom";
    if (bodyFont) {
      settings.body_typography_font_family = bodyFont.replace(/['"]/g, "").split(",")[0].trim();
    }
    if (bodySize) {
      const num = parseFloat(bodySize);
      if (!Number.isNaN(num)) {
        settings.body_typography_font_size = {
          unit: bodySize.includes("rem") ? "rem" : "px",
          size: num,
          sizes: [],
        };
      }
    }
    if (bodyWeight) {
      settings.body_typography_font_weight = bodyWeight;
    }
    if (bodyLineHeight) {
      const num = parseFloat(bodyLineHeight);
      if (!Number.isNaN(num)) {
        settings.body_typography_line_height = {
          unit: bodyLineHeight.includes("px") ? "px" : "em",
          size: num,
          sizes: [],
        };
      }
    }
  }

  const headingSize = (tokenKey) => {
    const raw = allTokens[tokenKey];
    if (!raw) {
      return undefined;
    }
    const num = parseFloat(raw);
    if (Number.isNaN(num)) {
      return undefined;
    }
    return {
      unit: raw.includes("rem") ? "rem" : "px",
      size: num,
      sizes: [],
    };
  };

  const h1Size = headingSize("h1");
  if (h1Size) {
    settings.h1_typography_typography = "custom";
    settings.h1_typography_font_size = h1Size;
    if (bodyFont) {
      settings.h1_typography_font_family = bodyFont
        .replace(/['"]/g, "")
        .split(",")[0]
        .trim();
    }
    settings.h1_typography_font_weight = "700";
  }

  const h2Size = headingSize("h2");
  if (h2Size) {
    settings.h2_typography_typography = "custom";
    settings.h2_typography_font_size = h2Size;
    if (bodyFont) {
      settings.h2_typography_font_family = bodyFont
        .replace(/['"]/g, "")
        .split(",")[0]
        .trim();
    }
    settings.h2_typography_font_weight = "700";
  }

  return settings;
}

/**
 * @param {Record<string, string>} rawCssVars
 * @returns {string}
 */
export function buildTokensCss(rawCssVars) {
  const lines = Object.entries(rawCssVars).map(
    ([key, value]) => `  --${key}: ${value};`,
  );
  return `:root {\n${lines.join("\n")}\n}\n`;
}
