        // Verify that the created TestSymbolCharacs includes item and v
        expectType<import("../dist/core").LayoutBounds>(node.item) // item should be of type LayoutBounds
        expectType<import("../src/core/layout_variable").Variable>(node.v) // v should be of type Variable
