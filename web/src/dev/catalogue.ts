// Control list for the in-app tweak panel (dev only). Copied from the iterate-bar mod, plus a Sitness group.
export type Control = {
  id: string; label: string; type: 'range' | 'toggle' | 'select' | 'color' | 'button'
  var?: string; attr?: string; unit?: string; min?: number; max?: number; step?: number
  def?: number | string | boolean; options?: string[]; tip?: string
}
export type Group = { id: string; title: string; controls: Control[] }
export const CATALOGUE: Group[] = [
 {
  "id": "sitness",
  "title": "Sitness",
  "controls": [
   {
    "id": "ring-sw",
    "label": "Main ring stroke",
    "type": "range",
    "var": "--tw-ring-sw",
    "unit": "",
    "min": 3,
    "max": 10,
    "step": 0.25,
    "def": 7,
    "tip": "SVG units out of 100; the ring is 7 by default"
   },
   {
    "id": "ring-size",
    "label": "Main ring size",
    "type": "range",
    "var": "--tw-ring-size",
    "unit": "",
    "min": 0.6,
    "max": 1.3,
    "step": 0.02,
    "def": 1,
    "tip": "Multiplies the ring box"
   },
   {
    "id": "timer",
    "label": "Timer text size",
    "type": "range",
    "var": "--tw-timer",
    "unit": "",
    "min": 0.5,
    "max": 1.5,
    "step": 0.02,
    "def": 1
   },
   {
    "id": "sub",
    "label": "Subtitle size",
    "type": "range",
    "var": "--tw-sub",
    "unit": "",
    "min": 0.7,
    "max": 2,
    "step": 0.05,
    "def": 1
   },
   {
    "id": "ctr-size",
    "label": "Counter ring size",
    "type": "range",
    "var": "--tw-ctr-size",
    "unit": "px",
    "min": 32,
    "max": 72,
    "step": 1,
    "def": 56
   },
   {
    "id": "ctr-sw",
    "label": "Counter ring stroke",
    "type": "range",
    "var": "--tw-ctr-sw",
    "unit": "",
    "min": 4,
    "max": 20,
    "step": 0.5,
    "def": 10,
    "tip": "SVG units out of 100"
   },
   {
    "id": "ctr-icon",
    "label": "Counter icon size",
    "type": "range",
    "var": "--tw-ctr-icon",
    "unit": "px",
    "min": 12,
    "max": 48,
    "step": 1,
    "def": 22
   },
   {
    "id": "head-h",
    "label": "Header bar height",
    "type": "range",
    "var": "--tw-head-h",
    "unit": "px",
    "min": 40,
    "max": 72,
    "step": 1,
    "def": 56
   },
   {
    "id": "title",
    "label": "Header title size",
    "type": "range",
    "var": "--tw-title",
    "unit": "px",
    "min": 14,
    "max": 34,
    "step": 1,
    "def": 22
   },
   {
    "id": "icon-btn",
    "label": "Header icon size",
    "type": "range",
    "var": "--tw-icon-btn",
    "unit": "px",
    "min": 16,
    "max": 40,
    "step": 1,
    "def": 24
   },
   {
    "id": "act-gap",
    "label": "Button gap",
    "type": "range",
    "var": "--tw-act-gap",
    "unit": "px",
    "min": 0,
    "max": 32,
    "step": 1,
    "def": 12
   },
   {
    "id": "act-pad",
    "label": "Space under buttons",
    "type": "range",
    "var": "--tw-act-pad",
    "unit": "px",
    "min": 0,
    "max": 48,
    "step": 1,
    "def": 22
   }
  ]
 },
 {
  "id": "type",
  "title": "Typography",
  "controls": [
   {
    "id": "font",
    "label": "Font family",
    "type": "select",
    "var": "--tw-font",
    "def": "inherit",
    "options": [
     "inherit",
     "system-ui, sans-serif",
     "Georgia, serif",
     "ui-monospace, Menlo, monospace",
     "\"Trebuchet MS\", sans-serif",
     "\"Palatino Linotype\", serif",
     "Impact, sans-serif",
     "\"Comic Sans MS\", cursive"
    ]
   },
   {
    "id": "fscale",
    "label": "Font scale",
    "type": "range",
    "var": "--tw-fscale",
    "unit": "",
    "min": 0.7,
    "max": 1.6,
    "step": 0.01,
    "def": 1,
    "tip": "Multiplies every font size that uses calc(Npx * var(--tw-fscale))"
   },
   {
    "id": "fweight",
    "label": "Body weight",
    "type": "range",
    "var": "--tw-fweight",
    "unit": "",
    "min": 100,
    "max": 900,
    "step": 50,
    "def": 400
   },
   {
    "id": "hweight",
    "label": "Heading weight",
    "type": "range",
    "var": "--tw-hweight",
    "unit": "",
    "min": 100,
    "max": 900,
    "step": 50,
    "def": 500
   },
   {
    "id": "lh",
    "label": "Line height",
    "type": "range",
    "var": "--tw-lh",
    "unit": "",
    "min": 1,
    "max": 2.2,
    "step": 0.01,
    "def": 1.4
   },
   {
    "id": "ls",
    "label": "Letter spacing",
    "type": "range",
    "var": "--tw-ls",
    "unit": "em",
    "min": -0.1,
    "max": 0.4,
    "step": 0.005,
    "def": 0
   },
   {
    "id": "ws",
    "label": "Word spacing",
    "type": "range",
    "var": "--tw-ws",
    "unit": "em",
    "min": -0.2,
    "max": 1,
    "step": 0.01,
    "def": 0
   },
   {
    "id": "hratio",
    "label": "Heading scale ratio",
    "type": "range",
    "var": "--tw-hratio",
    "unit": "",
    "min": 1,
    "max": 2,
    "step": 0.01,
    "def": 1.25
   },
   {
    "id": "pgap",
    "label": "Paragraph spacing",
    "type": "range",
    "var": "--tw-pgap",
    "unit": "em",
    "min": 0,
    "max": 2.5,
    "step": 0.05,
    "def": 0.6
   },
   {
    "id": "tshadow",
    "label": "Text shadow blur",
    "type": "range",
    "var": "--tw-tshadow",
    "unit": "px",
    "min": 0,
    "max": 24,
    "step": 1,
    "def": 0
   },
   {
    "id": "transform",
    "label": "Text case",
    "type": "select",
    "var": "--tw-case",
    "def": "none",
    "options": [
     "none",
     "uppercase",
     "lowercase",
     "capitalize"
    ]
   },
   {
    "id": "style",
    "label": "Font style",
    "type": "select",
    "var": "--tw-fstyle",
    "def": "normal",
    "options": [
     "normal",
     "italic",
     "oblique 10deg"
    ]
   },
   {
    "id": "align",
    "label": "Text align",
    "type": "select",
    "var": "--tw-align",
    "def": "start",
    "options": [
     "start",
     "center",
     "end",
     "justify"
    ]
   },
   {
    "id": "tabular",
    "label": "Tabular numbers",
    "type": "toggle",
    "attr": "data-tw-tabular",
    "def": false
   },
   {
    "id": "smallcaps",
    "label": "Small caps",
    "type": "toggle",
    "attr": "data-tw-smallcaps",
    "def": false
   },
   {
    "id": "ligatures",
    "label": "Disable ligatures",
    "type": "toggle",
    "attr": "data-tw-ligatures",
    "def": false
   },
   {
    "id": "hyphens",
    "label": "Hyphenation",
    "type": "toggle",
    "attr": "data-tw-hyphens",
    "def": false
   },
   {
    "id": "balance",
    "label": "Balance headings",
    "type": "toggle",
    "attr": "data-tw-balance",
    "def": false
   },
   {
    "id": "smooth",
    "label": "Subpixel smoothing off",
    "type": "toggle",
    "attr": "data-tw-smooth",
    "def": false
   }
  ]
 },
 {
  "id": "color",
  "title": "Color",
  "controls": [
   {
    "id": "hue",
    "label": "Accent hue shift",
    "type": "range",
    "var": "--tw-hue",
    "unit": "deg",
    "min": -180,
    "max": 180,
    "step": 1,
    "def": 0
   },
   {
    "id": "sat",
    "label": "Saturation",
    "type": "range",
    "var": "--tw-sat",
    "unit": "",
    "min": 0,
    "max": 3,
    "step": 0.01,
    "def": 1
   },
   {
    "id": "bri",
    "label": "Brightness",
    "type": "range",
    "var": "--tw-bri",
    "unit": "",
    "min": 0.4,
    "max": 1.8,
    "step": 0.01,
    "def": 1
   },
   {
    "id": "con",
    "label": "Contrast",
    "type": "range",
    "var": "--tw-con",
    "unit": "",
    "min": 0.4,
    "max": 2,
    "step": 0.01,
    "def": 1
   },
   {
    "id": "gray",
    "label": "Grayscale",
    "type": "range",
    "var": "--tw-gray",
    "unit": "",
    "min": 0,
    "max": 1,
    "step": 0.01,
    "def": 0
   },
   {
    "id": "sepia",
    "label": "Sepia",
    "type": "range",
    "var": "--tw-sepia",
    "unit": "",
    "min": 0,
    "max": 1,
    "step": 0.01,
    "def": 0
   },
   {
    "id": "invert",
    "label": "Invert",
    "type": "range",
    "var": "--tw-invert",
    "unit": "",
    "min": 0,
    "max": 1,
    "step": 0.01,
    "def": 0
   },
   {
    "id": "alpha",
    "label": "Content opacity",
    "type": "range",
    "var": "--tw-alpha",
    "unit": "",
    "min": 0.1,
    "max": 1,
    "step": 0.01,
    "def": 1
   },
   {
    "id": "dim",
    "label": "Secondary text opacity",
    "type": "range",
    "var": "--tw-dim",
    "unit": "",
    "min": 0.2,
    "max": 1,
    "step": 0.01,
    "def": 0.7
   },
   {
    "id": "border-a",
    "label": "Border opacity",
    "type": "range",
    "var": "--tw-border-a",
    "unit": "",
    "min": 0,
    "max": 1,
    "step": 0.01,
    "def": 1
   },
   {
    "id": "tint",
    "label": "Tint strength",
    "type": "range",
    "var": "--tw-tint-a",
    "unit": "",
    "min": 0,
    "max": 0.6,
    "step": 0.01,
    "def": 0
   },
   {
    "id": "tintc",
    "label": "Tint colour",
    "type": "color",
    "var": "--tw-tint",
    "def": "#8e71e6"
   },
   {
    "id": "accent",
    "label": "Accent override",
    "type": "color",
    "var": "--tw-accent",
    "def": "#8e71e6"
   },
   {
    "id": "accent-on",
    "label": "Use accent override",
    "type": "toggle",
    "attr": "data-tw-accent-on",
    "def": false
   },
   {
    "id": "cb",
    "label": "Colour-blind preview",
    "type": "select",
    "var": "--tw-cb",
    "def": "none",
    "options": [
     "none",
     "protanopia",
     "deuteranopia",
     "tritanopia",
     "achromatopsia"
    ]
   },
   {
    "id": "hc",
    "label": "High contrast",
    "type": "toggle",
    "attr": "data-tw-hc",
    "def": false
   },
   {
    "id": "forcedark",
    "label": "Force dark",
    "type": "toggle",
    "attr": "data-tw-forcedark",
    "def": false
   },
   {
    "id": "forcelight",
    "label": "Force light",
    "type": "toggle",
    "attr": "data-tw-forcelight",
    "def": false
   }
  ]
 },
 {
  "id": "shape",
  "title": "Shape & borders",
  "controls": [
   {
    "id": "radius",
    "label": "Corner radius (all)",
    "type": "range",
    "var": "--tw-radius",
    "unit": "px",
    "min": 0,
    "max": 48,
    "step": 1,
    "def": 16
   },
   {
    "id": "r-btn",
    "label": "Button radius",
    "type": "range",
    "var": "--tw-r-btn",
    "unit": "px",
    "min": 0,
    "max": 48,
    "step": 1,
    "def": 16
   },
   {
    "id": "r-card",
    "label": "Card radius",
    "type": "range",
    "var": "--tw-r-card",
    "unit": "px",
    "min": 0,
    "max": 48,
    "step": 1,
    "def": 16
   },
   {
    "id": "r-input",
    "label": "Input radius",
    "type": "range",
    "var": "--tw-r-input",
    "unit": "px",
    "min": 0,
    "max": 48,
    "step": 1,
    "def": 16
   },
   {
    "id": "r-sheet",
    "label": "Sheet radius",
    "type": "range",
    "var": "--tw-r-sheet",
    "unit": "px",
    "min": 0,
    "max": 48,
    "step": 1,
    "def": 16
   },
   {
    "id": "r-chip",
    "label": "Chip radius",
    "type": "range",
    "var": "--tw-r-chip",
    "unit": "px",
    "min": 0,
    "max": 48,
    "step": 1,
    "def": 16
   },
   {
    "id": "bw",
    "label": "Border width",
    "type": "range",
    "var": "--tw-bw",
    "unit": "px",
    "min": 0,
    "max": 8,
    "step": 0.5,
    "def": 1
   },
   {
    "id": "bs",
    "label": "Border style",
    "type": "select",
    "var": "--tw-bs",
    "def": "solid",
    "options": [
     "solid",
     "dashed",
     "dotted",
     "double",
     "none"
    ]
   },
   {
    "id": "ow",
    "label": "Outline width",
    "type": "range",
    "var": "--tw-ow",
    "unit": "px",
    "min": 0,
    "max": 8,
    "step": 0.5,
    "def": 0
   },
   {
    "id": "oo",
    "label": "Outline offset",
    "type": "range",
    "var": "--tw-oo",
    "unit": "px",
    "min": -8,
    "max": 12,
    "step": 0.5,
    "def": 2
   },
   {
    "id": "pill",
    "label": "Force pill shapes",
    "type": "toggle",
    "attr": "data-tw-pill",
    "def": false
   },
   {
    "id": "square",
    "label": "Force square corners",
    "type": "toggle",
    "attr": "data-tw-square",
    "def": false
   }
  ]
 },
 {
  "id": "depth",
  "title": "Depth & shadows",
  "controls": [
   {
    "id": "sh-y",
    "label": "Shadow offset Y",
    "type": "range",
    "var": "--tw-sh-y",
    "unit": "px",
    "min": -20,
    "max": 40,
    "step": 1,
    "def": 4
   },
   {
    "id": "sh-x",
    "label": "Shadow offset X",
    "type": "range",
    "var": "--tw-sh-x",
    "unit": "px",
    "min": -30,
    "max": 30,
    "step": 1,
    "def": 0
   },
   {
    "id": "sh-b",
    "label": "Shadow blur",
    "type": "range",
    "var": "--tw-sh-b",
    "unit": "px",
    "min": 0,
    "max": 80,
    "step": 1,
    "def": 12
   },
   {
    "id": "sh-s",
    "label": "Shadow spread",
    "type": "range",
    "var": "--tw-sh-s",
    "unit": "px",
    "min": -20,
    "max": 30,
    "step": 1,
    "def": 0
   },
   {
    "id": "sh-a",
    "label": "Shadow opacity",
    "type": "range",
    "var": "--tw-sh-a",
    "unit": "",
    "min": 0,
    "max": 1,
    "step": 0.01,
    "def": 0.25
   },
   {
    "id": "sh-c",
    "label": "Shadow colour",
    "type": "color",
    "var": "--tw-sh-c",
    "def": "#000000"
   },
   {
    "id": "glow",
    "label": "Accent glow",
    "type": "range",
    "var": "--tw-glow",
    "unit": "px",
    "min": 0,
    "max": 60,
    "step": 1,
    "def": 0
   },
   {
    "id": "hilite",
    "label": "Inner top highlight",
    "type": "range",
    "var": "--tw-hilite",
    "unit": "",
    "min": 0,
    "max": 0.5,
    "step": 0.01,
    "def": 0
   },
   {
    "id": "blur",
    "label": "Backdrop blur (glass)",
    "type": "range",
    "var": "--tw-blur",
    "unit": "px",
    "min": 0,
    "max": 40,
    "step": 1,
    "def": 0
   },
   {
    "id": "glass-a",
    "label": "Glass tint opacity",
    "type": "range",
    "var": "--tw-glass-a",
    "unit": "",
    "min": 0,
    "max": 1,
    "step": 0.01,
    "def": 0.5
   },
   {
    "id": "grain",
    "label": "Film grain",
    "type": "range",
    "var": "--tw-grain",
    "unit": "",
    "min": 0,
    "max": 0.5,
    "step": 0.01,
    "def": 0
   },
   {
    "id": "vignette",
    "label": "Vignette",
    "type": "range",
    "var": "--tw-vignette",
    "unit": "",
    "min": 0,
    "max": 1,
    "step": 0.01,
    "def": 0
   },
   {
    "id": "scan",
    "label": "Scanlines",
    "type": "range",
    "var": "--tw-scan",
    "unit": "",
    "min": 0,
    "max": 0.4,
    "step": 0.01,
    "def": 0
   },
   {
    "id": "flat",
    "label": "Flat (no shadows)",
    "type": "toggle",
    "attr": "data-tw-flat",
    "def": false
   },
   {
    "id": "neu",
    "label": "Neumorphic",
    "type": "toggle",
    "attr": "data-tw-neu",
    "def": false
   }
  ]
 },
 {
  "id": "space",
  "title": "Spacing & layout",
  "controls": [
   {
    "id": "unit",
    "label": "Base spacing unit",
    "type": "range",
    "var": "--tw-unit",
    "unit": "px",
    "min": 2,
    "max": 12,
    "step": 0.5,
    "def": 4
   },
   {
    "id": "pad",
    "label": "Page padding",
    "type": "range",
    "var": "--tw-pad",
    "unit": "px",
    "min": 0,
    "max": 48,
    "step": 1,
    "def": 18
   },
   {
    "id": "gap",
    "label": "Gap between items",
    "type": "range",
    "var": "--tw-gap",
    "unit": "px",
    "min": 0,
    "max": 40,
    "step": 1,
    "def": 12
   },
   {
    "id": "card-pad",
    "label": "Card padding",
    "type": "range",
    "var": "--tw-card-pad",
    "unit": "px",
    "min": 0,
    "max": 40,
    "step": 1,
    "def": 16
   },
   {
    "id": "section",
    "label": "Section spacing",
    "type": "range",
    "var": "--tw-section",
    "unit": "px",
    "min": 0,
    "max": 80,
    "step": 1,
    "def": 24
   },
   {
    "id": "maxw",
    "label": "Max content width",
    "type": "range",
    "var": "--tw-maxw",
    "unit": "px",
    "min": 280,
    "max": 1400,
    "step": 10,
    "def": 560
   },
   {
    "id": "density",
    "label": "Density",
    "type": "range",
    "var": "--tw-density",
    "unit": "",
    "min": 0.6,
    "max": 1.5,
    "step": 0.01,
    "def": 1
   },
   {
    "id": "icon",
    "label": "Icon size",
    "type": "range",
    "var": "--tw-icon",
    "unit": "px",
    "min": 12,
    "max": 48,
    "step": 1,
    "def": 24
   },
   {
    "id": "icon-sw",
    "label": "Icon stroke",
    "type": "range",
    "var": "--tw-icon-sw",
    "unit": "",
    "min": 0.5,
    "max": 4,
    "step": 0.1,
    "def": 2
   },
   {
    "id": "tap",
    "label": "Min tap target",
    "type": "range",
    "var": "--tw-tap",
    "unit": "px",
    "min": 32,
    "max": 72,
    "step": 1,
    "def": 44
   },
   {
    "id": "rot",
    "label": "Page rotation",
    "type": "range",
    "var": "--tw-rot",
    "unit": "deg",
    "min": -5,
    "max": 5,
    "step": 0.1,
    "def": 0
   },
   {
    "id": "zoom",
    "label": "Zoom",
    "type": "range",
    "var": "--tw-zoom",
    "unit": "",
    "min": 0.6,
    "max": 1.6,
    "step": 0.01,
    "def": 1
   },
   {
    "id": "dir",
    "label": "Direction",
    "type": "select",
    "var": "--tw-dir",
    "def": "ltr",
    "options": [
     "ltr",
     "rtl"
    ]
   },
   {
    "id": "stretch",
    "label": "Stretch text +30% (pseudo-loc)",
    "type": "toggle",
    "attr": "data-tw-stretch",
    "def": false
   }
  ]
 },
 {
  "id": "motion",
  "title": "Motion",
  "controls": [
   {
    "id": "speed",
    "label": "Global speed (x)",
    "type": "range",
    "var": "--tw-speed",
    "unit": "",
    "min": 0.05,
    "max": 4,
    "step": 0.05,
    "def": 1,
    "tip": "Duration multiplier: calc(200ms * var(--tw-speed))"
   },
   {
    "id": "rate",
    "label": "Live playback rate",
    "type": "range",
    "var": "--tw-rate",
    "unit": "",
    "min": 0.05,
    "max": 3,
    "step": 0.05,
    "def": 1,
    "tip": "Slow-mo for every running animation"
   },
   {
    "id": "enter-dur",
    "label": "Enter duration",
    "type": "range",
    "var": "--tw-enter-dur",
    "unit": "ms",
    "min": 0,
    "max": 2000,
    "step": 10,
    "def": 350
   },
   {
    "id": "exit-dur",
    "label": "Exit duration",
    "type": "range",
    "var": "--tw-exit-dur",
    "unit": "ms",
    "min": 0,
    "max": 2000,
    "step": 10,
    "def": 200
   },
   {
    "id": "stagger",
    "label": "Stagger between items",
    "type": "range",
    "var": "--tw-stagger",
    "unit": "ms",
    "min": 0,
    "max": 300,
    "step": 5,
    "def": 40
   },
   {
    "id": "delay",
    "label": "Initial delay",
    "type": "range",
    "var": "--tw-delay",
    "unit": "ms",
    "min": 0,
    "max": 1500,
    "step": 10,
    "def": 0
   },
   {
    "id": "enter",
    "label": "Entrance style",
    "type": "select",
    "var": "--tw-enter",
    "def": "fade",
    "options": [
     "none",
     "fade",
     "slide-up",
     "slide-down",
     "slide-left",
     "slide-right",
     "scale",
     "pop",
     "blur",
     "flip",
     "drop",
     "rotate",
     "zoom-out"
    ]
   },
   {
    "id": "enter-dist",
    "label": "Entrance distance",
    "type": "range",
    "var": "--tw-enter-dist",
    "unit": "px",
    "min": 0,
    "max": 120,
    "step": 1,
    "def": 16
   },
   {
    "id": "enter-scale",
    "label": "Entrance scale from",
    "type": "range",
    "var": "--tw-enter-scale",
    "unit": "",
    "min": 0,
    "max": 1.5,
    "step": 0.01,
    "def": 0.92
   },
   {
    "id": "enter-rot",
    "label": "Entrance rotate from",
    "type": "range",
    "var": "--tw-enter-rot",
    "unit": "deg",
    "min": -90,
    "max": 90,
    "step": 1,
    "def": 0
   },
   {
    "id": "enter-blur",
    "label": "Entrance blur from",
    "type": "range",
    "var": "--tw-enter-blur",
    "unit": "px",
    "min": 0,
    "max": 30,
    "step": 1,
    "def": 8
   },
   {
    "id": "ease",
    "label": "Easing",
    "type": "select",
    "var": "--tw-ease",
    "def": "cubic-bezier(.2,.8,.2,1)",
    "options": [
     "ease",
     "linear",
     "ease-in",
     "ease-out",
     "ease-in-out",
     "cubic-bezier(.2,.8,.2,1)",
     "cubic-bezier(.34,1.56,.64,1)",
     "cubic-bezier(.68,-0.55,.27,1.55)",
     "cubic-bezier(.16,1,.3,1)",
     "cubic-bezier(.7,0,.3,1)",
     "steps(6,end)",
     "custom"
    ]
   },
   {
    "id": "bz1",
    "label": "Custom bezier x1",
    "type": "range",
    "var": "--tw-bz1",
    "unit": "",
    "min": 0,
    "max": 1,
    "step": 0.01,
    "def": 0.2
   },
   {
    "id": "bz2",
    "label": "Custom bezier y1",
    "type": "range",
    "var": "--tw-bz2",
    "unit": "",
    "min": -1,
    "max": 2,
    "step": 0.01,
    "def": 0.8
   },
   {
    "id": "bz3",
    "label": "Custom bezier x2",
    "type": "range",
    "var": "--tw-bz3",
    "unit": "",
    "min": 0,
    "max": 1,
    "step": 0.01,
    "def": 0.2
   },
   {
    "id": "bz4",
    "label": "Custom bezier y2",
    "type": "range",
    "var": "--tw-bz4",
    "unit": "",
    "min": -1,
    "max": 2,
    "step": 0.01,
    "def": 1
   },
   {
    "id": "hover-lift",
    "label": "Hover lift",
    "type": "range",
    "var": "--tw-hover-lift",
    "unit": "px",
    "min": 0,
    "max": 12,
    "step": 0.5,
    "def": 0
   },
   {
    "id": "hover-scale",
    "label": "Hover scale",
    "type": "range",
    "var": "--tw-hover-scale",
    "unit": "",
    "min": 0.9,
    "max": 1.15,
    "step": 0.005,
    "def": 1
   },
   {
    "id": "press",
    "label": "Press scale",
    "type": "range",
    "var": "--tw-press",
    "unit": "",
    "min": 0.8,
    "max": 1,
    "step": 0.005,
    "def": 0.97
   },
   {
    "id": "press-dur",
    "label": "Press duration",
    "type": "range",
    "var": "--tw-press-dur",
    "unit": "ms",
    "min": 0,
    "max": 400,
    "step": 5,
    "def": 90
   },
   {
    "id": "page-dur",
    "label": "Page transition",
    "type": "range",
    "var": "--tw-page-dur",
    "unit": "ms",
    "min": 0,
    "max": 1200,
    "step": 10,
    "def": 250
   },
   {
    "id": "count-dur",
    "label": "Number count-up",
    "type": "range",
    "var": "--tw-count-dur",
    "unit": "ms",
    "min": 0,
    "max": 3000,
    "step": 50,
    "def": 600
   },
   {
    "id": "pulse",
    "label": "Idle pulse amount",
    "type": "range",
    "var": "--tw-pulse",
    "unit": "",
    "min": 0,
    "max": 0.2,
    "step": 0.005,
    "def": 0
   },
   {
    "id": "pulse-dur",
    "label": "Idle pulse period",
    "type": "range",
    "var": "--tw-pulse-dur",
    "unit": "ms",
    "min": 300,
    "max": 6000,
    "step": 50,
    "def": 2000
   },
   {
    "id": "float",
    "label": "Idle float",
    "type": "range",
    "var": "--tw-float",
    "unit": "px",
    "min": 0,
    "max": 24,
    "step": 1,
    "def": 0
   },
   {
    "id": "shimmer",
    "label": "Skeleton shimmer",
    "type": "range",
    "var": "--tw-shimmer",
    "unit": "ms",
    "min": 200,
    "max": 4000,
    "step": 50,
    "def": 1400
   },
   {
    "id": "replay-auto",
    "label": "Replay entrances on change",
    "type": "toggle",
    "attr": "data-tw-replay-auto",
    "def": false
   },
   {
    "id": "no-motion",
    "label": "Reduce motion (simulate)",
    "type": "toggle",
    "attr": "data-tw-no-motion",
    "def": false
   },
   {
    "id": "pause",
    "label": "Pause all animations",
    "type": "toggle",
    "attr": "data-tw-pause",
    "def": false
   },
   {
    "id": "hover-off",
    "label": "Kill hover effects",
    "type": "toggle",
    "attr": "data-tw-hover-off",
    "def": false
   },
   {
    "id": "ripple",
    "label": "Press ripple",
    "type": "toggle",
    "attr": "data-tw-ripple",
    "def": false
   },
   {
    "id": "replay",
    "label": "Replay entrances now",
    "type": "button"
   }
  ]
 },
 {
  "id": "components",
  "title": "Components",
  "controls": [
   {
    "id": "btn-h",
    "label": "Button height",
    "type": "range",
    "var": "--tw-btn-h",
    "unit": "px",
    "min": 28,
    "max": 80,
    "step": 1,
    "def": 48
   },
   {
    "id": "btn-px",
    "label": "Button side padding",
    "type": "range",
    "var": "--tw-btn-px",
    "unit": "px",
    "min": 8,
    "max": 48,
    "step": 1,
    "def": 20
   },
   {
    "id": "btn-fw",
    "label": "Button weight",
    "type": "range",
    "var": "--tw-btn-fw",
    "unit": "",
    "min": 100,
    "max": 900,
    "step": 50,
    "def": 500
   },
   {
    "id": "input-h",
    "label": "Input height",
    "type": "range",
    "var": "--tw-input-h",
    "unit": "px",
    "min": 28,
    "max": 72,
    "step": 1,
    "def": 44
   },
   {
    "id": "switch-h",
    "label": "Switch height",
    "type": "range",
    "var": "--tw-switch-h",
    "unit": "px",
    "min": 16,
    "max": 48,
    "step": 1,
    "def": 31
   },
   {
    "id": "track",
    "label": "Slider / progress thickness",
    "type": "range",
    "var": "--tw-track",
    "unit": "px",
    "min": 2,
    "max": 24,
    "step": 1,
    "def": 6
   },
   {
    "id": "thumb",
    "label": "Slider thumb size",
    "type": "range",
    "var": "--tw-thumb",
    "unit": "px",
    "min": 12,
    "max": 44,
    "step": 1,
    "def": 24
   },
   {
    "id": "ring",
    "label": "Ring stroke",
    "type": "range",
    "var": "--tw-ring",
    "unit": "px",
    "min": 2,
    "max": 24,
    "step": 0.5,
    "def": 7
   },
   {
    "id": "chip-h",
    "label": "Chip height",
    "type": "range",
    "var": "--tw-chip-h",
    "unit": "px",
    "min": 20,
    "max": 56,
    "step": 1,
    "def": 34
   },
   {
    "id": "divider",
    "label": "List divider opacity",
    "type": "range",
    "var": "--tw-divider",
    "unit": "",
    "min": 0,
    "max": 1,
    "step": 0.05,
    "def": 1
   },
   {
    "id": "bar-h",
    "label": "Header bar height",
    "type": "range",
    "var": "--tw-bar-h",
    "unit": "px",
    "min": 40,
    "max": 72,
    "step": 1,
    "def": 56
   },
   {
    "id": "toast-dur",
    "label": "Toast duration",
    "type": "range",
    "var": "--tw-toast-dur",
    "unit": "ms",
    "min": 500,
    "max": 6000,
    "step": 100,
    "def": 2000
   },
   {
    "id": "focus",
    "label": "Focus ring",
    "type": "select",
    "var": "--tw-focus",
    "def": "thin",
    "options": [
     "none",
     "thin",
     "thick",
     "glow",
     "dashed"
    ]
   },
   {
    "id": "cursor",
    "label": "Cursor",
    "type": "select",
    "var": "--tw-cursor",
    "def": "auto",
    "options": [
     "auto",
     "pointer",
     "crosshair",
     "grab",
     "cell",
     "none"
    ]
   },
   {
    "id": "icons-only",
    "label": "Hide labels (icons only)",
    "type": "toggle",
    "attr": "data-tw-icons-only",
    "def": false
   },
   {
    "id": "labels-up",
    "label": "Uppercase labels",
    "type": "toggle",
    "attr": "data-tw-labels-up",
    "def": false
   },
   {
    "id": "scrollbars",
    "label": "Show scrollbars",
    "type": "toggle",
    "attr": "data-tw-scrollbars",
    "def": false
   }
  ]
 },
 {
  "id": "debug",
  "title": "Inspect & debug",
  "controls": [
   {
    "id": "outlines",
    "label": "Outline every box",
    "type": "toggle",
    "attr": "data-tw-outlines",
    "def": false
   },
   {
    "id": "taps",
    "label": "Highlight tap targets",
    "type": "toggle",
    "attr": "data-tw-taps",
    "def": false
   },
   {
    "id": "grid",
    "label": "Pixel grid (8px)",
    "type": "toggle",
    "attr": "data-tw-grid",
    "def": false
   },
   {
    "id": "baseline",
    "label": "Baseline grid (4px)",
    "type": "toggle",
    "attr": "data-tw-baseline",
    "def": false
   },
   {
    "id": "center",
    "label": "Centre lines",
    "type": "toggle",
    "attr": "data-tw-center",
    "def": false
   },
   {
    "id": "safe",
    "label": "Safe-area guides",
    "type": "toggle",
    "attr": "data-tw-safe",
    "def": false
   },
   {
    "id": "rtl-mirror",
    "label": "Mirror layout",
    "type": "toggle",
    "attr": "data-tw-rtl-mirror",
    "def": false
   },
   {
    "id": "slow-frames",
    "label": "Frame-rate meter",
    "type": "toggle",
    "attr": "data-tw-slow-frames",
    "def": false
   },
   {
    "id": "frame",
    "label": "Phone frame width",
    "type": "range",
    "var": "--tw-frame",
    "unit": "px",
    "min": 0,
    "max": 900,
    "step": 5,
    "def": 0,
    "tip": "0 = off. Constrains the app like a device."
   },
   {
    "id": "framer",
    "label": "Frame corner radius",
    "type": "range",
    "var": "--tw-framer",
    "unit": "px",
    "min": 0,
    "max": 60,
    "step": 1,
    "def": 36
   },
   {
    "id": "device",
    "label": "Device preset",
    "type": "select",
    "var": "--tw-device",
    "def": "none",
    "options": [
     "none",
     "320 small",
     "375 phone",
     "414 large",
     "768 tablet",
     "1024 desktop"
    ]
   }
  ]
 },
 {
  "id": "surprise",
  "title": "Surprise me",
  "controls": [
   {
    "id": "mood",
    "label": "Mood preset",
    "type": "select",
    "var": "--tw-mood",
    "def": "none",
    "options": [
     "none",
     "calm",
     "playful",
     "brutalist",
     "glass",
     "editorial",
     "terminal",
     "candy",
     "noir"
    ],
    "tip": "Applies a bundle of settings in one go"
   },
   {
    "id": "chaos",
    "label": "Chaos (randomise everything)",
    "type": "button"
   },
   {
    "id": "nudge",
    "label": "Nudge (small random drift)",
    "type": "button"
   },
   {
    "id": "golden",
    "label": "Golden-ratio spacing",
    "type": "button"
   },
   {
    "id": "night",
    "label": "Time-of-day tint",
    "type": "button"
   },
   {
    "id": "shuffle-font",
    "label": "Random font",
    "type": "button"
   },
   {
    "id": "shuffle-hue",
    "label": "Random accent hue",
    "type": "button"
   },
   {
    "id": "confetti",
    "label": "Celebrate on completion",
    "type": "toggle",
    "attr": "data-tw-confetti",
    "def": false
   },
   {
    "id": "gravity",
    "label": "Entrances drop with a bounce",
    "type": "toggle",
    "attr": "data-tw-gravity",
    "def": false
   },
   {
    "id": "wobble",
    "label": "Playful hover wobble",
    "type": "toggle",
    "attr": "data-tw-wobble",
    "def": false
   },
   {
    "id": "tilt",
    "label": "Cards tilt toward pointer",
    "type": "toggle",
    "attr": "data-tw-tilt",
    "def": false
   },
   {
    "id": "rainbow",
    "label": "Rainbow accent cycle",
    "type": "toggle",
    "attr": "data-tw-rainbow",
    "def": false
   },
   {
    "id": "sound",
    "label": "Click sounds",
    "type": "toggle",
    "attr": "data-tw-sound",
    "def": false
   }
  ]
 }
]
export const MOODS: Record<string, Record<string, number | string | boolean>> = {
 "calm": {
  "radius": 24,
  "sh-a": 0.12,
  "sh-b": 28,
  "enter-dur": 600,
  "ease": "cubic-bezier(.16,1,.3,1)",
  "sat": 0.85,
  "gap": 16
 },
 "playful": {
  "radius": 28,
  "enter": "pop",
  "enter-dur": 420,
  "ease": "cubic-bezier(.34,1.56,.64,1)",
  "sat": 1.3,
  "press": 0.92,
  "wobble": true
 },
 "brutalist": {
  "radius": 0,
  "bw": 3,
  "sh-b": 0,
  "sh-x": 6,
  "sh-y": 6,
  "sh-a": 1,
  "font": "ui-monospace, Menlo, monospace",
  "hweight": 900,
  "transform": "uppercase"
 },
 "glass": {
  "radius": 22,
  "blur": 18,
  "glass-a": 0.35,
  "hilite": 0.25,
  "sh-a": 0.2,
  "bw": 1
 },
 "editorial": {
  "font": "Georgia, serif",
  "lh": 1.6,
  "ls": 0.005,
  "hratio": 1.5,
  "hweight": 700,
  "radius": 4,
  "sh-a": 0.05
 },
 "terminal": {
  "font": "ui-monospace, Menlo, monospace",
  "radius": 0,
  "scan": 0.12,
  "glow": 14,
  "sat": 0.6,
  "hue": 90
 },
 "candy": {
  "radius": 40,
  "sat": 1.6,
  "bri": 1.1,
  "enter": "zoom-out",
  "enter-dur": 500,
  "glow": 8
 },
 "noir": {
  "gray": 1,
  "con": 1.25,
  "vignette": 0.5,
  "grain": 0.18,
  "radius": 6
 }
}
export const FONTS: string[] = ["inherit","system-ui, sans-serif","Georgia, serif","ui-monospace, Menlo, monospace","\"Trebuchet MS\", sans-serif","\"Palatino Linotype\", serif","Impact, sans-serif","\"Comic Sans MS\", cursive"]
