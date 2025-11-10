// src/dsl/diagram.ts
import { DiagramBuilder } from "./diagram_builder"

/**
 * Diagram entry point
 * 
 * @example
 * // CorePlugin is loaded by default
 * Diagram.build("My Diagram", (el, rel, hint) => {
 *   const circle = el.circle("Circle")
 *   const rect = el.rectangle("Rect")
 *   hint.arrangeHorizontal(circle, rect)
 * }).render("output.svg")
 * 
 * @example
 * // With additional plugins and theme
 * Diagram
 *   .use(UMLPlugin)
 *   .theme(BlueTheme)
 *   .build("UML Diagram", (el, rel, hint) => {
 *     const actor = el.actor("User")
 *     const usecase = el.usecase("Login")
 *     rel.associate(actor, usecase)
 *   })
 *   .render("output.svg")
 */
export const Diagram = new DiagramBuilder()
