export interface DocumentData {
  patient_name: string;
  date: string;
  treatment_description?: string;
  treatments?: Array<{
    description: string;
    cost: number;
  }>;
  treatments_table?: string;
  total_amount: number;
  amount_in_words: string;
  amount_in_figures: string;
}

export async function generatePDF(type: string, data: DocumentData) {
  try {
    // Load the appropriate template based on document type
    const templatePath = `/${type}.html`;
    const res = await fetch(templatePath);
    let template = await res.text();

    // Create treatments HTML - ensure treatments exists and is an array
    const treatmentsHtml = Array.isArray(data.treatments) 
      ? data.treatments
        .map(
          (treatment) => `
          <tr>
            <td>${treatment.description}</td>
            <td class="text-right">${treatment.cost.toFixed(2)} €</td>
          </tr>
        `
        )
        .join('')
      : '';

    // Add treatments data
    data = {
      ...data,
      treatments_table: treatmentsHtml,
    };

    // Replace all placeholders in the template with actual data
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        template = template.replace(new RegExp(`{{${key}}}`, 'g'), value.toString());
      }
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
