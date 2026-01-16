import html2canvas from "html2canvas"
import jsPDF from "jspdf"

/**
 * Export a DOM element to PDF
 * @param {HTMLElement} element - The DOM element to export
 * @param {string} filename - The filename for the PDF (without extension)
 * @param {Object} options - Additional options
 */
export async function exportElementToPDF(element, filename = "document", options = {}) {
  const {
    scale = 2,
    margin = 10,
    orientation = "portrait",
    format = "a4"
  } = options

  if (!element) {
    throw new Error("No element provided for PDF export")
  }

  try {
    // Capture the element as canvas
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    })

    // Calculate dimensions
    const imgData = canvas.toDataURL("image/png")
    const pdf = new jsPDF({
      orientation,
      unit: "mm",
      format
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const contentWidth = pageWidth - (margin * 2)

    // Calculate image dimensions maintaining aspect ratio
    const imgWidth = contentWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    // Add image to PDF (handle multi-page if needed)
    let heightLeft = imgHeight
    let position = margin
    let page = 1

    pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight)
    heightLeft -= (pageHeight - margin * 2)

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin
      pdf.addPage()
      page++
      pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight)
      heightLeft -= (pageHeight - margin * 2)
    }

    // Download the PDF
    pdf.save(`${filename}.pdf`)

    return true
  } catch (error) {
    console.error("Error generating PDF:", error)
    throw error
  }
}

/**
 * Export release note to PDF
 * @param {Object} releaseNote - The release note data
 * @param {Object} template - The template data
 * @param {Object} product - The product data
 * @param {HTMLElement} previewElement - The preview element to capture
 */
export async function exportReleaseNoteToPDF(releaseNote, template, product, previewElement) {
  const filename = `${product?.name || "release"}-v${releaseNote.version}-${template?.key || "notes"}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

  return exportElementToPDF(previewElement, filename, {
    scale: 2,
    margin: 10,
    orientation: "portrait",
    format: "a4"
  })
}
