export const printHtml = (html: string) => {
  const printWindow = window.open("", "_blank", "width=400,height=600");
  if (!printWindow) return;

  printWindow.document.write(html);
  printWindow.document.close();

  printWindow.focus();
  printWindow.print();
};
