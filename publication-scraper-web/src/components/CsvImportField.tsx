import { Tooltip } from '@mui/material';
// import Papa from 'papaparse';
import { useState } from 'react';
import { toast } from 'react-toastify';

export interface CsvImportFieldProps {
  disabled: boolean;
  tooltip: string;
  setManualAddPapers: React.Dispatch<React.SetStateAction<string[]>>;
}

const CsvImportField: React.FC<CsvImportFieldProps> = (props) => {
  const { tooltip, disabled } = props;
  const [dragActive, setDragActive] = useState(false);
  
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "text/csv") {
        parseCsv(file);
      } else {
        toast.error("Invalid file type. Please upload a CSV file.");
      }
    }
  };

  const parseCsv = (file: File) => {
    console.log(file);
  };


  return (
    <Tooltip title={tooltip} placement="right" style={{ cursor: disabled ? "not-allowed" : "pointer" }}>
      <div
        className={
          `input-group-prepend ${dragActive ? 'drag-active' : ''}` +
          `${disabled ? 'disabled text-muted' : ''}` 
        }
        onDragEnter={(e) => handleDrag(e)}
        onDragLeave={(e) => handleDrag(e)}
        onDragOver={(e) => handleDrag(e)}
        onDrop={(e) => handleDrop(e)}
      >
        <span className="input-group-text rounded-0" id="basic-addon1">
          Import CSV
        </span>
        {dragActive && <div className="drag-overlay">Drop your file here</div>}
      </div>
    </Tooltip>
  );
};

export default CsvImportField;
