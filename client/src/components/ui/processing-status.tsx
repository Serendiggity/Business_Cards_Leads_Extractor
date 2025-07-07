import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, XCircle, Clock, Eye } from "lucide-react";

interface ProcessingStatusProps {
  businessCard: {
    id: number;
    filename: string;
    processingStatus: string;
    processingError?: string;
    ocrConfidence?: number;
    aiConfidence?: number;
    extractedData?: any;
    createdAt: string;
    updatedAt: string;
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
        return businessCard.processingError ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800';
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
    if (status === 'completed' && businessCard.processingError) {
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
        {getStatusIcon(businessCard.processingStatus)}
        <Badge variant="outline" className={getStatusColor(businessCard.processingStatus)}>
          {getStatusText(businessCard.processingStatus)}
        </Badge>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon(businessCard.processingStatus)}
          Processing Status: {businessCard.filename}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          <Badge variant="outline" className={getStatusColor(businessCard.processingStatus)}>
            {getStatusText(businessCard.processingStatus)}
          </Badge>
        </div>

        {/* Error Message */}
        {businessCard.processingError && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {businessCard.processingError}
            </AlertDescription>
          </Alert>
        )}

        {/* Confidence Scores */}
        {(businessCard.ocrConfidence !== undefined || businessCard.aiConfidence !== undefined) && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Processing Confidence</h4>
            
            {businessCard.ocrConfidence !== undefined && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">OCR Text Extraction</span>
                  <span className={`text-sm font-medium ${getConfidenceColor(businessCard.ocrConfidence)}`}>
                    {Math.round(businessCard.ocrConfidence * 100)}% ({getConfidenceLabel(businessCard.ocrConfidence)})
                  </span>
                </div>
                <Progress value={businessCard.ocrConfidence * 100} className="h-2" />
              </div>
            )}

            {businessCard.aiConfidence !== undefined && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">AI Data Extraction</span>
                  <span className={`text-sm font-medium ${getConfidenceColor(businessCard.aiConfidence)}`}>
                    {Math.round(businessCard.aiConfidence * 100)}% ({getConfidenceLabel(businessCard.aiConfidence)})
                  </span>
                </div>
                <Progress value={businessCard.aiConfidence * 100} className="h-2" />
              </div>
            )}
          </div>
        )}

        {/* Extracted Data Summary */}
        {businessCard.extractedData && (() => {
          const extractedData = typeof businessCard.extractedData === 'string' 
            ? JSON.parse(businessCard.extractedData) 
            : businessCard.extractedData;
          
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
          <div>Uploaded: {new Date(businessCard.createdAt).toLocaleString()}</div>
          <div>Last Updated: {new Date(businessCard.updatedAt).toLocaleString()}</div>
        </div>
      </CardContent>
    </Card>
  );
}