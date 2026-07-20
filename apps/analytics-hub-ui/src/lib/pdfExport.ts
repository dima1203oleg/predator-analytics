import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Експортує результати зібраного досьє у PDF формат (Intelligence Report).
 */
export const exportDossierToPDF = (dossierData: any) => {
  // Створюємо новий документ формату A4
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;

  // 1. ЗАГОЛОВОК ДОКУМЕНТА (Штамп СЕКРЕТНО)
  doc.setFillColor(220, 38, 38); // Червоний колір для грифу
  doc.rect(0, 0, pageWidth, 15, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("PREDATOR ANALYTICS - DEEP INTELLIGENCE REPORT", pageWidth / 2, 10, { align: "center" });

  doc.setTextColor(0, 0, 0);

  // 2. ІНФОРМАЦІЯ ПРО СУБ'ЄКТА
  doc.setFontSize(22);
  doc.text("АНАЛІТИЧНЕ ДОСЬЄ", margin, 35);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  const yStart = 45;
  doc.text(`ID Запиту: ${dossierData.dossier_id || 'N/A'}`, margin, yStart);
  doc.text(`Тип суб'єкта: ${dossierData.entity_type?.toUpperCase() || 'UNKNOWN'}`, margin, yStart + 8);
  doc.text(`Ідентифікатор: ${dossierData.identifier || 'N/A'}`, margin, yStart + 16);
  doc.text(`Дата генерації: ${new Date().toLocaleString('uk-UA')}`, margin, yStart + 24);

  // 3. ОЦІНКА РИЗИКІВ (RISK ASSESSMENT)
  const riskAssessment = dossierData.risk_assessment || {};
  const riskLevel = riskAssessment.risk_level || 'UNKNOWN';
  
  let riskColor: [number, number, number] = [100, 116, 139]; // Default Slate
  if (riskLevel === 'CRITICAL') riskColor = [220, 38, 38];
  else if (riskLevel === 'HIGH') riskColor = [234, 88, 12];
  else if (riskLevel === 'ELEVATED') riskColor = [234, 179, 8];
  else if (riskLevel === 'LOW') riskColor = [16, 185, 129];

  doc.setFillColor(...riskColor);
  doc.rect(margin, yStart + 35, 80, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(`РІВЕНЬ РИЗИКУ: ${riskLevel}`, margin + 5, yStart + 45);
  doc.setFontSize(10);
  doc.text(`Score: ${riskAssessment.composite_score || 0} / 100`, margin + 5, yStart + 53);

  doc.setTextColor(0, 0, 0);

  // Фактори ризику
  if (riskAssessment.risk_factors && riskAssessment.risk_factors.length > 0) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("КЛЮЧОВІ ФАКТОРИ РИЗИКУ:", margin, yStart + 75);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    let factorY = yStart + 85;
    riskAssessment.risk_factors.forEach((factor: string, idx: number) => {
      // Розбиття довгого тексту
      const splitText = doc.splitTextToSize(`- ${factor}`, pageWidth - margin * 2);
      doc.text(splitText, margin, factorY);
      factorY += (splitText.length * 6);
    });
  }

  // 4. ТАБЛИЦЯ ДЕТАЛІЗАЦІЇ РИЗИКІВ (BREAKDOWN)
  if (riskAssessment.risk_breakdown && Object.keys(riskAssessment.risk_breakdown).length > 0) {
    const tableData = Object.entries(riskAssessment.risk_breakdown).map(([category, score]) => [
      category.toUpperCase(),
      `${score} балів`
    ]);

    autoTable(doc, {
      startY: 150,
      head: [['Категорія Ризику', 'Бали']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] },
      styles: { font: 'helvetica', fontSize: 10 }
    });
  }

  // 5. ДЖЕРЕЛА ТА ЗНАЙДЕНІ ЗАПИСИ
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : 150;
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("СТАТИСТИКА ЗБОРУ ДАНИХ:", margin, finalY + 15);
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Загалом записів: ${dossierData.total_records_found || 0}`, margin, finalY + 25);
  doc.text(`Опитано збирачів: ${dossierData.collectors_used || 0}`, margin, finalY + 32);
  doc.text(`Успішних збирачів: ${dossierData.collectors_succeeded || 0}`, margin, finalY + 39);

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Створено системою Predator Analytics. Тільки для службового використання. Сторінка ${i} з ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  // Збереження
  const filename = `Dossier_${dossierData.identifier || 'Report'}_${new Date().getTime()}.pdf`;
  doc.save(filename);
};
