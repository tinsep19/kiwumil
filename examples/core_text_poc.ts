import { TypeDiagram } from "../src/index"

TypeDiagram("Core Text PoC")
  .layout(({ el, rel, hint }) => {
    const singleLine = el.core.text({
      label: "Single line text symbol",
      textAnchor: "start"
    })

    const multiLine = el.core.text({
      label: [
        "Multiple line text symbol",
        "Second line centered",
        "Third line for spacing"
      ].join("\n"),
      textAnchor: "start",
      fontSize: 18,
      textColor: "#0066cc"
    })

    const paragraph = el.core.text({
      label: "Line with blank\n\nLine after blank",
      textAnchor: "start",
      fontFamily: "Courier New"
    })

    const longLine = el.core.text({
      label: "Very looooooooooooooooong text that should expand the width automatically",
      textAnchor: "start",
      textColor: "#aa0000"
    })

    hint.arrangeVertical(singleLine, multiLine, paragraph, longLine)
    hint.alignLeft(singleLine, multiLine, paragraph, longLine)
  })
  .render(import.meta)
