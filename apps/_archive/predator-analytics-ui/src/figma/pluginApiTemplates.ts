/**
 * Шаблони скриптів для Figma Plugin API (use_figma).
 * Підставте ключі компонентів після importComponentSetByKeyAsync з вашої бібліотеки.
 * У викликах MCP передавайте skillNames: "figma-generate-design".
 */

import { SHELL_FRAME_NAME } from './shellScreenSpec';

/** Крок 3: створення wrapper — один виклик use_figma; поверніть wrapperId. */
export function buildWrapperScript(widthPx: number): string {
  return `
(async () => {
  let maxX = 0;
  for (const child of figma.currentPage.children) {
    maxX = Math.max(maxX, child.x + child.width);
  }
  const wrapper = figma.createAutoLayout();
  wrapper.layoutMode = "VERTICAL";
  wrapper.name = "${SHELL_FRAME_NAME}";
  wrapper.primaryAxisAlignItems = "MIN";
  wrapper.counterAxisAlignItems = "MIN";
  wrapper.resize(${widthPx}, 900);
  wrapper.layoutSizingHorizontal = "FIXED";
  wrapper.layoutSizingVertical = "HUG";
  wrapper.x = maxX + 200;
  wrapper.y = 0;
  wrapper.fills = [{ type: "SOLID", color: { r: 0.02, g: 0.025, b: 0.035 } }];
  figma.currentPage.appendChild(wrapper);
  return { wrapperId: wrapper.id };
})();`;
}

/**
 * Крок 4: приклад секції «шапка» — замініть BUTTON_SET_KEY та змінні на реальні з discover.
 * Додайте до wrapper після appendChild(section): section.layoutSizingHorizontal = "FILL".
 */
export function buildHeaderSectionStub(wrapperIdPlaceholder: string): string {
  return `
(async () => {
  const wrapper = await figma.getNodeByIdAsync("${wrapperIdPlaceholder}");
  if (!wrapper || wrapper.type !== "FRAME" && wrapper.type !== "COMPONENT") {
    throw new Error("wrapper не знайдено");
  }
  // const btn = await figma.importComponentSetByKeyAsync("BUTTON_SET_KEY");
  const section = figma.createAutoLayout();
  section.layoutMode = "VERTICAL";
  section.name = "Section_Header";
  section.paddingLeft = 24;
  section.paddingRight = 24;
  section.paddingTop = 16;
  section.paddingBottom = 16;
  section.itemSpacing = 12;
  section.fills = [{ type: "SOLID", color: { r: 0.024, g: 0.039, b: 0.071 } }];
  wrapper.appendChild(section);
  section.layoutSizingHorizontal = "FILL";
  return { sectionId: section.id };
})();`;
}

/** Крок 5: перевірка — викликати get_screenshot на wrapperId через MCP після збірки. */
export const SCREENSHOT_VALIDATION_HINT =
  'Зробіть знімок кожної секції окремо та всього wrapper — перевірте обрізання тексту та порожні image fills.';
