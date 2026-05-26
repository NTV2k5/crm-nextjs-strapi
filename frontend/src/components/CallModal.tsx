'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Phone, PhoneOff, Mic, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { strapiFetch } from '@/lib/strapi';

interface CallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phoneNumber: string;
  customerName: string;
  dealId?: string;
  customerId?: string; // This corresponds to customer documentId in Next.js
}

export function CallModal({ open, onOpenChange, phoneNumber, customerName, dealId, customerId }: CallModalProps) {
  const { userData } = useAuth();
  const [callState, setCallState] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [duration, setDuration] = useState(0);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset state when opened
  useEffect(() => {
    if (open) {
      setCallState('connecting');
      setDuration(0);
      setNote('');
      
      // Simulate connection delay
      const timer = setTimeout(() => {
        setCallState('connected');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callState === 'connected') {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleEndCall = () => {
    setCallState('ended');
  };

  const handleSaveNote = async () => {
    if (!userData) return;
    setSaving(true);
    try {
      // Log as a customer note so it automatically shows in interaction history
      const formattedContent = `[📞 Cuộc gọi - ${formatDuration(duration)}] ${note || 'Không có ghi chú.'}`;
      
      await strapiFetch('/notes', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            content: formattedContent,
            customer: customerId || null,
            createdBy: Number(userData.id)
          }
        })
      });

      toast.success('Đã lưu lịch sử cuộc gọi.');
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Lỗi khi lưu: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={callState === 'connected' ? () => {} : onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border rounded-3xl shadow-xl">
        {callState !== 'ended' ? (
          <div className="flex flex-col items-center justify-center p-6 space-y-6">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center ${callState === 'connecting' ? 'bg-primary/20 animate-pulse' : 'bg-emerald-500/10'}`}>
              <Phone className={`w-10 h-10 ${callState === 'connecting' ? 'text-primary' : 'text-emerald-500'}`} />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold">{customerName}</h3>
              <p className="text-muted-foreground font-mono">{phoneNumber}</p>
              
              <div className="h-6 mt-2 flex items-center justify-center">
                {callState === 'connecting' ? (
                  <span className="text-sm font-medium animate-pulse text-muted-foreground">Đang kết nối...</span>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-500 font-bold">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    {formatDuration(duration)}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-center gap-4 pt-4">
              <Button variant="outline" size="icon" className="w-12 h-12 rounded-full">
                <Mic className="w-5 h-5" />
              </Button>
              <Button 
                variant="destructive" 
                size="icon" 
                className="w-12 h-12 rounded-full hover:bg-red-600"
                onClick={handleEndCall}
              >
                <PhoneOff className="w-5 h-5" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Ghi chú cuộc gọi</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 p-3 rounded-lg flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Thời lượng:</span>
                <span className="font-bold">{formatDuration(duration)}</span>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nội dung trao đổi</label>
                <Textarea 
                  placeholder="Khách hàng quan tâm đến..." 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Bỏ qua</Button>
              <Button onClick={handleSaveNote} disabled={saving} className="btn-gradient font-bold shadow-lg">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lưu ghi chú
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
