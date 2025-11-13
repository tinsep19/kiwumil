// src/dsl/diagram.ts
import { DiagramBuilder } from "./diagram_builder"
import type { DiagramInfo } from "../model/diagram_info"

/**
 * Diagram entry point
 * 
 * @example
 * // CorePlugin is loaded by default
 * Diagram("My Diagram")
 *   .build((el, rel, hint) => {
 *     const circle = el.circle("Circle")
 *     const rect = el.rectangle("Rect")
 *     hint.arrangeHorizontal(circle, rect)
 *   })
 *   .render("output.svg")
 * 
 * @example
 * // With additional plugins and theme
 * Diagram("UML Diagram")
 *   .use(UMLPlugin)
 *   .theme(BlueTheme)
 *   .build((el, rel, hint) => {
 *     const actor = el.actor("User")
 *     const usecase = el.usecase("Login")
 *     rel.associate(actor, usecase)
 *   })
 *   .render("output.svg")
 * 
 * @example
 * // With metadata
 * Diagram({
 *   title: "E-Commerce System",
 *   createdAt: "2025-11-13",
 *   author: "Architecture Team"
 * })
 *   .use(UMLPlugin)
 *   .theme(DarkTheme)
 *   .build((el, rel, hint) => {
 *     // ...
 *   })
 *   .render("output.svg")
 */
export function Diagram(titleOrInfo: string | DiagramInfo): DiagramBuilder {
  return new DiagramBuilder(titleOrInfo)
}

