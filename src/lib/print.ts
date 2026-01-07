export const printHtml = (html: string) => {
  try {
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) {
      console.error("Failed to open print window - popup may be blocked");
      return;
    }

    printWindow.document.write(html);
    printWindow.document.close();

    // Wait for content to load before printing
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
    
    // Fallback if onload doesn't fire
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  } catch (error) {
    console.error("Error printing:", error);
  }
};
