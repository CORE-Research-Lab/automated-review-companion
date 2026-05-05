import { BASE_URL } from '@/utils/common';
import { Tooltip } from '@mui/material';
import axios, { AxiosError } from 'axios';
import { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import Spinner from './Spinner';
import { handleError } from '@/common/handler';
import { Publication } from '@/types';

export interface CsvImportFieldProps {
  disabled: boolean;
  tooltip: string;
  addManualPapers: (dois: string[]) => void;
}

const CsvImportField: React.FC<CsvImportFieldProps> = (props) => {
  const { tooltip, disabled, addManualPapers } = props;

  const fileInputRef = useRef<HTMLInputElement>(null);
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
      });

      const { publications, failed_dois, total_processed, total_success } = response.data;
      
      // Convert publications to match frontend format including metadata
      const modifiedResults = publications.map((pub: Publication) => ({
        ...pub,
        searched_from: "CSV",
        search_string: 'CSV',
        formatted_search_string: 'Not Applicable'
      }));

      // Update papers directly with the processed publications
      await addManualPapers(modifiedResults.map((pub: Publication) => pub.paper_id.replace("DOI:https://doi.org/", "")));

      if (failed_dois?.length > 0) {
        toast.warning(`Failed to find ${failed_dois.length} papers: ${failed_dois.join(", ")}`);
      }
      
      toast.success(`Successfully added ${total_success} out of ${total_processed} papers`);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        handleError(error);
      }
      toast.error("Failed to process CSV file");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Tooltip title={tooltip} placement="right" style={{ cursor: disabled ? "not-allowed" : "pointer" }}>
      <span
        className="manual-import-wrapper"
      >
        <button
          type="button"
          className="manual-import-button input-group-text"
          onClick={() => !disabled && fileInputRef.current?.click()}
          disabled={disabled || isLoading}
        >
          {!isLoading ? "Import CSV" : <Spinner />}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          accept=".csv"
          style={{ display: "none" }}
          onChange={(e) => handleFileSelect(e)}
          disabled={disabled}
        />
      </span>
    </Tooltip>
  );
};

export default CsvImportField;
