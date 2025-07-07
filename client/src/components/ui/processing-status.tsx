import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, XCircle, Clock, Eye } from "lucide-react";

interface ProcessingStatusProps {
  businessCard: {
    id: number;
    filename: string;
    processing_status: string;
    processing_error?: string;
    ocr_confidence?: number;
    ai_confidence?: number;
    extracted_data?: any;
    created_at: string;
    updated_at: string;
  };
  showDetails?: boolean;
}

export function ProcessingStatus({ businessCard, showDetails = false }: ProcessingStatusProps) {
  const getStatusIcon = (status: string) => {
    if (!status) return <Clock className="h-4 w-4 text-gray-500" />;
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch (status) {
      case 'completed':
        return businessCard.processing_error ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    if (!status) return 'Unknown';
    if (status === 'completed' && businessCard.processing_error) {
      return 'Completed with warnings';
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  if (!showDetails) {
    return (
      <div className="flex items-center gap-2">
        {getStatusIcon(businessCard.processing_status)}
        <Badge variant="outline" className={getStatusColor(businessCard.processing_status)}>
          {getStatusText(businessCard.processing_status)}
        </Badge>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon(businessCard.processing_status)}
          Processing Status: {businessCard.filename}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          <Badge variant="outline" className={getStatusColor(businessCard.processing_status)}>
            {getStatusText(businessCard.processing_status)}
          </Badge>
        </div>

        {/* Error Message */}
        {businessCard.processing_error && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {businessCard.processing_error}
            </AlertDescription>
          </Alert>
        )}

        {/* Confidence Scores */}
        {(businessCard.ocr_confidence !== undefined || businessCard.ai_confidence !== undefined) && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Processing Confidence</h4>
            
            {businessCard.ocr_confidence !== undefined && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">OCR Text Extraction</span>
                  <span className={`text-sm font-medium ${getConfidenceColor(businessCard.ocr_confidence)}`}>
                    {Math.round(businessCard.ocr_confidence * 100)}% ({getConfidenceLabel(businessCard.ocr_confidence)})
                  </span>
                </div>
                <Progress value={businessCard.ocr_confidence * 100} className="h-2" />
              </div>
            )}

            {businessCard.ai_confidence !== undefined && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">AI Data Extraction</span>
                  <span className={`text-sm font-medium ${getConfidenceColor(businessCard.ai_confidence)}`}>
                    {Math.round(businessCard.ai_confidence * 100)}% ({getConfidenceLabel(businessCard.ai_confidence)})
                  </span>
                </div>
                <Progress value={businessCard.ai_confidence * 100} className="h-2" />
              </div>
            )}
          </div>
        )}

        {/* Extracted Data Summary */}
        {businessCard.extracted_data && (() => {
          const extractedData = typeof businessCard.extracted_data === 'string' 
            ? JSON.parse(businessCard.extracted_data) 
            : businessCard.extracted_data;
          
          return (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Extracted Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span> {extractedData.name || 'Not found'}
                </div>
                <div>
                  <span className="text-gray-600">Company:</span> {extractedData.company || 'Not found'}
                </div>
                <div>
                  <span className="text-gray-600">Email:</span> {extractedData.email || 'Not found'}
                </div>
                <div>
                  <span className="text-gray-600">Phone:</span> {extractedData.phone || 'Not found'}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Timestamps */}
        <div className="text-xs text-gray-500 space-y-1">
          <div>Uploaded: {new Date(businessCard.created_at).toLocaleString()}</div>
          <div>Last Updated: {new Date(businessCard.updated_at).toLocaleString()}</div>
        </div>
      </CardContent>
    </Card>
  );
}