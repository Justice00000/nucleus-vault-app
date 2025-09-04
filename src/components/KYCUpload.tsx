import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle,
  Camera,
  CreditCard
} from 'lucide-react';

const DOCUMENT_TYPES = [
  {
    id: 'drivers_license',
    name: 'Driver\'s License',
    description: 'Upload a clear photo of your driver\'s license (front and back)',
    icon: CreditCard,
    required: true
  },
  {
    id: 'passport',
    name: 'Passport',
    description: 'Upload a clear photo of your passport (photo page)',
    icon: FileText,
    required: false
  },
  {
    id: 'utility_bill',
    name: 'Utility Bill',
    description: 'Recent utility bill (gas, electric, water) for address verification',
    icon: FileText,
    required: false
  },
  {
    id: 'bank_statement',
    name: 'Bank Statement',
    description: 'Recent bank statement for additional verification',
    icon: FileText,
    required: false
  }
];

export function KYCUpload() {
  const { user, profile } = useAuth();
  const [uploadingDocs, setUploadingDocs] = useState<Set<string>>(new Set());
  const [documents, setDocuments] = useState<any[]>([]);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleFileUpload = async (documentType: string, file: File) => {
    if (!user) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive"
      });
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPEG, PNG, WebP, or PDF file",
        variant: "destructive"
      });
      return;
    }

    setUploadingDocs(prev => new Set(prev).add(documentType));

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${documentType}_${Date.now()}.${fileExt}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Save document record to database
      const { error: dbError } = await supabase
        .from('kyc_documents')
        .insert([{
          user_id: user.id,
          document_type: documentType,
          file_path: fileName,
          file_name: file.name,
          status: 'pending'
        }]);

      if (dbError) throw dbError;

      toast({
        title: "Document Uploaded",
        description: "Your document has been uploaded successfully and is under review."
      });

      // Refresh documents list
      fetchDocuments();
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload document",
        variant: "destructive"
      });
    } finally {
      setUploadingDocs(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentType);
        return newSet;
      });
    }
  };

  const fetchDocuments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-warning" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "border";
    switch (status) {
      case 'approved':
        return `${baseClasses} bg-success/10 text-success border-success/20`;
      case 'pending':
        return `${baseClasses} bg-warning/10 text-warning border-warning/20`;
      case 'rejected':
        return `${baseClasses} bg-destructive/10 text-destructive border-destructive/20`;
      default:
        return `${baseClasses} bg-muted/10 text-muted-foreground border-muted/20`;
    }
  };

  const getDocumentStatus = (documentType: string) => {
    const doc = documents.find(d => d.document_type === documentType);
    return doc?.status || null;
  };

  const hasUploadedDocument = (documentType: string) => {
    return documents.some(d => d.document_type === documentType);
  };

  return (
    <div className="space-y-6">
      {/* KYC Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Identity Verification (KYC)</span>
            </CardTitle>
            <Badge 
              variant="outline" 
              className={getStatusBadge(profile?.kyc_status || 'pending')}
            >
              {getStatusIcon(profile?.kyc_status || 'pending')}
              <span className="ml-1 capitalize">{profile?.kyc_status || 'pending'}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              To comply with financial regulations, we need to verify your identity. 
              Please upload the following documents for review. All documents are 
              securely encrypted and stored.
            </p>

            {profile?.kyc_status === 'approved' && (
              <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <p className="text-sm font-medium text-success">
                    Identity Verified
                  </p>
                </div>
                <p className="text-sm text-success/80 mt-1">
                  Your identity has been successfully verified.
                </p>
              </div>
            )}

            {profile?.kyc_status === 'rejected' && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-5 h-5 text-destructive" />
                  <p className="text-sm font-medium text-destructive">
                    Verification Failed
                  </p>
                </div>
                <p className="text-sm text-destructive/80 mt-1">
                  Please re-upload your documents or contact support for assistance.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Document Upload Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {DOCUMENT_TYPES.map((docType) => {
          const Icon = docType.icon;
          const status = getDocumentStatus(docType.id);
          const hasUploaded = hasUploadedDocument(docType.id);
          const isUploading = uploadingDocs.has(docType.id);

          return (
            <Card key={docType.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2 text-base">
                    <Icon className="w-4 h-4" />
                    <span>{docType.name}</span>
                    {docType.required && (
                      <Badge variant="outline" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </CardTitle>
                  {status && (
                    <Badge variant="outline" className={getStatusBadge(status)}>
                      {getStatusIcon(status)}
                      <span className="ml-1 capitalize">{status}</span>
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {docType.description}
                </p>

                <div className="flex flex-col space-y-3">
                  <input
                    type="file"
                    ref={ref => fileInputRefs.current[docType.id] = ref}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(docType.id, file);
                      }
                    }}
                    accept="image/*,.pdf"
                    className="hidden"
                  />
                  
                  <Button
                    type="button"
                    variant={hasUploaded ? "outline" : "default"}
                    onClick={() => fileInputRefs.current[docType.id]?.click()}
                    disabled={isUploading}
                    className="w-full"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        {hasUploaded ? (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Replace Document
                          </>
                        ) : (
                          <>
                            <Camera className="w-4 h-4 mr-2" />
                            Upload Document
                          </>
                        )}
                      </>
                    )}
                  </Button>

                  {hasUploaded && (
                    <div className="text-xs text-muted-foreground text-center">
                      Document uploaded and under review
                    </div>
                  )}
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Supported formats: JPEG, PNG, WebP, PDF</p>
                  <p>• Maximum file size: 10MB</p>
                  <p>• Ensure document is clear and readable</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Help Text */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h4 className="font-medium">Document Guidelines</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="space-y-2">
                <h5 className="font-medium text-foreground">Photo Quality</h5>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Ensure good lighting</li>
                  <li>Avoid glare and shadows</li>
                  <li>Keep documents flat</li>
                  <li>Include all corners and edges</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h5 className="font-medium text-foreground">Document Requirements</h5>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Documents must be current and valid</li>
                  <li>All text must be clearly readable</li>
                  <li>No alterations or modifications</li>
                  <li>Government-issued IDs preferred</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}