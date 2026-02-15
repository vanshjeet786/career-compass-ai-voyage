
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface ReportData {
  userName: string;
  scores: Record<string, number>;
  insights: string;
  topStrengths: string[];
}

export const generatePDFReport = async (elementId: string, data: ReportData) => {
  const element = document.getElementById(elementId);
  if (!element) throw new Error("Report element not found");

  try {
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: "a4",
    });

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`Career_Compass_Report_${data.userName.replace(/\s+/g, "_")}.pdf`);
  } catch (error) {
    console.error("PDF Generation Error", error);
    throw error;
  }
};
