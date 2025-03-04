export async function generatePDF(type: string, data: any) {
  try {
    // Load the appropriate template based on document type
    const templatePath = `/${type}.html`;
    const res = await fetch(templatePath);
    let template = await res.text();

    // Replace all placeholders in the template with actual data
    Object.entries(data).forEach(([key, value]) => {
      template = template.replace(new RegExp(`{{${key}}}`, 'g'), value as string);
    });

    // Create a temporary iframe to render the HTML
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    // Write the template to the iframe
    if (iframe.contentWindow) {
      iframe.contentWindow.document.open();
      iframe.contentWindow.document.write(template);
      iframe.contentWindow.document.close();

      // Wait for images to load
      await new Promise(resolve => setTimeout(resolve, 500));

      // Print the iframe
      iframe.contentWindow.print();
    }

    // Remove the iframe after printing
    document.body.removeChild(iframe);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
