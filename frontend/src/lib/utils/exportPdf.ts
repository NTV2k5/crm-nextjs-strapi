// PDF export utility using jsPDF + html2canvas
export async function exportToPDF(elementId: string, filename: string) {
  const el = document.getElementById(elementId);
  if (!el) return;
  // Dynamic import to avoid SSR issues
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);
  const canvas = await html2canvas(el, { scale: 2 } as any);
  const pdf = new jsPDF("p", "mm", "a4");
  pdf.addImage(canvas.toDataURL("image/png"), "PNG", 10, 10, 190, 0);
  pdf.save(filename + ".pdf");
}
