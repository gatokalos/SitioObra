import React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PdfPreviewDocument = ({ file, numPages, pageWidth, onLoadSuccess, onLoadError }) => (
  <Document
    file={file}
    onLoadSuccess={onLoadSuccess}
    onLoadError={onLoadError}
    loading={<p className="text-sm text-slate-400 text-center py-8">Preparando paginas...</p>}
  >
    {numPages
      ? Array.from({ length: numPages }, (_, index) => (
          <div key={`pdf-page-${index + 1}`} className="mb-6 last:mb-0">
            <Page
              pageNumber={index + 1}
              width={pageWidth}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </div>
        ))
      : null}
  </Document>
);

export default PdfPreviewDocument;
