import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Papa from 'papaparse';
import { useAuth } from '@/contexts/AuthContext';
import { logAudit } from '@/lib/audit';
import { strapiFetch, unwrap } from '@/lib/strapi';

interface ImportCsvModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refetch?: () => void;
}

export function ImportCsvModal({ open, onOpenChange, refetch }: ImportCsvModalProps) {
  const { userData } = useAuth();
  const [importing, setImporting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setPreview(results.data.slice(0, 5)); // Preview first 5 rows
        },
      });
    }
  };

  const handleImport = async () => {
    if (!file || !userData) return;

    setImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const data = results.data as any[];
          let count = 0;
          let skipped = 0;

          for (const row of data) {
            const email = row.email?.trim();
            const phone = (row.phone || row['SĐT'] || '').trim();
            if (!row.name || !email) continue;

            // Simple Duplicate Check in Strapi
            const checkRes = await strapiFetch(`/customers?filters[email][$eq]=${encodeURIComponent(email)}`);
            const existingList = unwrap<any[]>(checkRes);
            if (existingList && existingList.length > 0) {
              skipped++;
              continue;
            }

            // Create Customer in Strapi
            await strapiFetch('/customers', {
              method: 'POST',
              body: JSON.stringify({
                data: {
                  name: row.name,
                  email: email,
                  phone: phone,
                  company: row.company || row['Công ty'] || '',
                  status: row.status || 'lead',
                  source: row.source || 'other',
                  assignedTo: Number(userData.id),
                }
              })
            });
            count++;
          }

          if (count > 0) {
            await logAudit({
              action: 'CREATE_CUSTOMER',
              entityId: 'batch_import',
              entityName: `Import từ file: ${file.name}`,
              performedByEmail: userData.email || 'Unknown',
              performedByUid: userData.id,
              details: `Import thành công ${count} khách hàng từ CSV. Bỏ qua ${skipped} khách hàng trùng.`
            });

            // Send notification
            await fetch('/api/notify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: Number(userData.id),
                title: 'Import thành công!',
                body: `Đã nhập xong ${count} khách hàng mới vào hệ thống.`,
              })
            }).catch(e => console.error(e));
          }

          toast.success(`Đã nhập ${count} khách hàng! (Bỏ qua ${skipped} trùng)`);
          if (refetch) refetch();
          onOpenChange(false);
          setFile(null);
          setPreview([]);
        } catch (error: any) {
          toast.error('Lỗi khi nhập dữ liệu: ' + error.message);
        } finally {
          setImporting(false);
        }
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border rounded-3xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Upload className="h-5 w-5" /> Nhập dữ liệu từ CSV
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:bg-muted/30 transition-all relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="space-y-2">
              <div className="bg-muted h-12 w-12 rounded-full flex items-center justify-center mx-auto">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-sm font-medium">
                {file ? file.name : 'Nhấn để chọn file hoặc kéo thả'}
              </div>
              <p className="text-xs text-muted-foreground">Hỗ trợ file .csv (UTF-8)</p>
            </div>
          </div>

          {preview.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Xem trước 5 dòng đầu:
              </h4>
              <div className="bg-muted/30 rounded-lg p-3 text-[11px] font-mono overflow-x-auto border border-border">
                <table className="w-full">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border">
                      <th className="text-left pb-1 pr-4">Name</th>
                      <th className="text-left pb-1 pr-4">Email</th>
                      <th className="text-left pb-1">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        <td className="py-1.5 pr-4">{row.name}</td>
                        <td className="py-1.5 pr-4">{row.email}</td>
                        <td className="py-1.5">{row.status || 'lead'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
            <div className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
              <p className="font-semibold mb-0.5">Lưu ý định dạng:</p>
              File cần có các cột tiêu đề: <code className="bg-amber-500/10 px-1 rounded">name</code>, <code className="bg-amber-500/10 px-1 rounded">email</code>, <code className="bg-amber-500/10 px-1 rounded">phone</code>, <code className="bg-amber-500/10 px-1 rounded">company</code>.
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Hủy
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || importing}
              className="rounded-xl min-w-[120px] btn-gradient font-bold shadow-lg"
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang xử lý...
                </>
              ) : (
                'Bắt đầu nhập'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
