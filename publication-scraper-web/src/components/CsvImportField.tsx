import { BASE_URL } from '@/utils/common';
import { Tooltip } from '@mui/material';
import axios from 'axios';
import { useState } from 'react';
import { toast } from 'react-toastify';
import Spinner from './Spinner';

export interface CsvImportFieldProps {
  disabled: boolean;
  tooltip: string;
  addManualPapers: (dois: string[]) => void;
}

const CsvImportField: React.FC<CsvImportFieldProps> = (props) => {
  const { tooltip, disabled, addManualPapers } = props;

  const [isLoading, setIsLoading]= useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e?.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);  
    
    setIsLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/publication/extract-csv`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      await addManualPapers(response.data.dois);
    } catch (error) {
      toast.error("Failed to extract CSV file");
    } finally {
      setIsLoading(false);
    }
  }


  return (
    <Tooltip title={tooltip} placement="right" style={{ cursor: disabled ? "not-allowed" : "pointer" }}>
      <div
        className={`input-group-prepend ${disabled ? 'disabled text-muted' : ''}`}
        onClick={() => !disabled && document.getElementById("fileInput")?.click()}
        style={{ cursor: disabled ? "not-allowed" : "pointer" }}
      >
        <span className="input-group-text rounded-0 hover:bg-[#eee]" id="basic-addon1">
          {!isLoading ? "Import CSV" : <Spinner />}
        </span>
        <input
          type="file"
          id="fileInput"
          accept=".csv"
          style={{ display: "none" }}
          onChange={(e) => handleFileSelect(e)}
          disabled={disabled}
        />
      </div>
    </Tooltip>
  );
};

export default CsvImportField;
