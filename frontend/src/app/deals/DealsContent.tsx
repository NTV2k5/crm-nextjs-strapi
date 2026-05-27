'use client';

import { useState, useEffect } from 'react';
import { useDeals, Deal } from '@/hooks/useDeals';
import { useCustomers } from '@/hooks/useCustomers';
import { DealModal } from '@/components/DealModal';
import { CallModal } from '@/components/CallModal';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, ArrowLeft, GripVertical, FileText, Sun, Moon, Briefcase, Phone, Search, LayoutGrid, List } from 'lucide-react';
import { strapiFetch } from '@/lib/strapi';
import { toast } from 'sonner';
import Link from 'next/link';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { autoCreateContractFromDeal } from '@/lib/contracts';

const STAGES = [
  { id: 'survey', label: 'Khảo sát', color: 'bg-blue-500' },
  { id: 'quote', label: 'Báo giá', color: 'bg-purple-500' },
  { id: 'negotiation', label: 'Thương lượng', color: 'bg-amber-500' },
  { id: 'waiting_payment', label: 'Chờ thanh toán', color: 'bg-indigo-500' },
  { id: 'closed', label: 'Đã chốt (Win)', color: 'bg-emerald-500' },
  { id: 'lost', label: 'Huỷ (Lost)', color: 'bg-rose-500' },
];

export default function DealsContent() {
  const { deals, loading, refetch } = useDeals();
  const { customers } = useCustomers();
  const { user, userData } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  const filteredDeals = deals.filter(d => {
    const q = searchQuery.toLowerCase();
    const customerName = d.customer?.name || '';
    return d.title.toLowerCase().includes(q) || customerName.toLowerCase().includes(q);
  });
  
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callData, setCallData] = useState<{phoneNumber: string; customerName: string; dealId: string; customerId: string} | null>(null);

  const handleAddNew = () => {
    setEditingDeal(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (deal: Deal) => {
    setEditingDeal(deal);
    setIsModalOpen(true);
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const targetStage = destination.droppableId;
    const deal = deals.find(d => d.id === draggableId || d.documentId === draggableId);
    const dealId = deal?.documentId || draggableId;

    if (deal?.stage === 'closed' && userData?.role !== 'admin') {
      toast.error('Deal đã chốt không thể hoàn tác. Vui lòng liên hệ Admin.');
      return;
    }
    
    try {
      // Update deal stage in Strapi
      await strapiFetch(`/deals/${dealId}`, {
        method: 'PUT',
        body: JSON.stringify({ data: { stage: targetStage } }),
      });

      // Automation: Tự động cập nhật trạng thái Khách hàng
      if (deal?.customer) {
        let targetCustomerStatus = '';
        if (targetStage === 'closed') {
          targetCustomerStatus = 'former'; // Khách cũ
        } else if (['quote', 'negotiation', 'waiting_payment'].includes(targetStage)) {
          targetCustomerStatus = 'consulting'; // Đang tư vấn
        }
        
        if (targetCustomerStatus) {
          const customerDocId = deal.customer.documentId || deal.customer.id;
          await strapiFetch(`/customers/${customerDocId}`, {
            method: 'PUT',
            body: JSON.stringify({ data: { status: targetCustomerStatus } })
          }).catch(e => console.error('Failed to auto-update customer status:', e));
        }
      }

      const stageLabel = STAGES.find(s => s.id === targetStage)?.label;
      
      // Log audit trail
      await strapiFetch('/audit-logs', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            action: 'UPDATE_DEAL_STAGE',
            entityId: String(dealId),
            entityName: deal?.title,
            performedByEmail: user?.email || 'unknown',
            performedByUid: String(user?.id) || 'unknown',
            details: `Moved deal to stage: ${stageLabel}`
          }
        })
      }).catch(e => console.error('Audit log fail:', e));

      if (targetStage === 'closed') {
        toast.success(`Chúc mừng! Deal đã chốt thành công.`);
        if (deal && deal.stage !== 'closed') {
          try {
            const customerDocId = deal.customer?.documentId || String(deal.customer?.id) || '';
            const contractNumber = await autoCreateContractFromDeal({
              customerId: customerDocId,
              customerName: deal.customer?.name || '',
              dealTitle: deal.title,
              dealValue: deal.value,
              dealId: String(dealId),
              assignedTo: deal.assignedTo?.id ? String(deal.assignedTo.id) : '',
              userId: String(user?.id) || 'unknown',
              userEmail: user?.email || 'unknown',
            });
            toast.success(`Hệ thống đã tự động tạo bản nháp hợp đồng ${contractNumber}!`);
          } catch (contractError) {
            console.error('Error auto-creating contract:', contractError);
            toast.error('Lỗi khi tự động tạo bản nháp hợp đồng.');
          }
        }
      } else {
        toast.success(`Đã chuyển sang ${stageLabel}`);
      }

      refetch();
    } catch (error: any) {
      toast.error('Lỗi khi chuyển trạng thái: ' + error.message);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (loading || !mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-10 space-y-8 max-w-[1600px] mx-auto">
      <div className="mx-auto max-w-[1600px] space-y-8">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary font-bold text-sm tracking-widest uppercase">
                <span className="w-8 h-[2px] bg-primary"></span>
                Sales Pipeline
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Cơ hội & Doanh thu</h1>
              <p className="text-muted-foreground font-medium">Quản lý quy trình bán hàng và tối ưu hóa doanh số.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
             <div className="flex items-center bg-muted/50 p-1 rounded-xl border border-border w-full sm:w-auto">
               <Button 
                 variant={viewMode === 'kanban' ? 'default' : 'ghost'} 
                 size="sm" 
                 onClick={() => setViewMode('kanban')}
                 className="rounded-lg h-10 px-4 font-medium flex-1 sm:flex-none shadow-sm"
               >
                 <LayoutGrid className="h-4 w-4 mr-2" /> Board
               </Button>
               <Button 
                 variant={viewMode === 'table' ? 'default' : 'ghost'} 
                 size="sm" 
                 onClick={() => setViewMode('table')}
                 className="rounded-lg h-10 px-4 font-medium flex-1 sm:flex-none"
               >
                 <List className="h-4 w-4 mr-2" /> List
               </Button>
             </div>
             <Button onClick={handleAddNew} className="w-full sm:w-auto rounded-xl h-12 px-6 btn-gradient font-bold shadow-lg shadow-primary/20">
                <Plus className="mr-2 h-5 w-5" /> Tạo Deal mới
             </Button>
          </div>
        </header>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card/30 backdrop-blur-sm p-4 rounded-2xl border border-border">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm deal theo tiêu đề hoặc đối tác..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-background/50 border-border rounded-xl focus:ring-primary/20"
            />
          </div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Đang hiển thị: <span className="text-primary font-extrabold">{filteredDeals.length} / {deals.length} deals</span>
          </div>
        </div>

        {viewMode === 'kanban' ? (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-6 overflow-x-auto pb-8 h-[calc(100vh-340px)] snap-x scrollbar-thin scrollbar-thumb-border">
              {STAGES.map(stage => {
                const stageDeals = filteredDeals.filter(d => d.stage === stage.id);
                const totalValue = stageDeals.reduce((sum, d) => sum + d.value, 0);

                return (
                  <div key={stage.id} className="flex-shrink-0 w-80 flex flex-col bg-muted/30 rounded-3xl snap-start border border-border h-full overflow-hidden">
                    <div className="p-5 border-b border-border bg-card/50 backdrop-blur-sm flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", stage.color)} />
                        <h3 className="font-bold text-sm uppercase tracking-wider">{stage.label}</h3>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase">{stageDeals.length} Deals</div>
                        <div className="text-xs font-extrabold text-primary">{formatCurrency(totalValue)}</div>
                      </div>
                    </div>

                    <Droppable droppableId={stage.id}>
                      {(provided, snapshot) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={cn(
                            "flex-1 overflow-y-auto p-4 space-y-4 transition-colors",
                            snapshot.isDraggingOver ? 'bg-primary/5' : ''
                          )}
                        >
                          {stageDeals.map((deal, index) => {
                            const dealDocId = deal.documentId || deal.id;
                            return (
                              <Draggable key={dealDocId} draggableId={dealDocId} index={index}>
                                {(provided, snapshot) => (
                                  <Card
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() => handleEdit(deal)}
                                    className={cn(
                                      "cursor-pointer transition-all hover:scale-[1.02] border-border relative group overflow-hidden",
                                      snapshot.isDragging ? 'shadow-2xl ring-2 ring-primary border-primary/50 rotate-2' : 'enterprise-shadow bg-card hover:bg-card/80'
                                    )}
                                  >
                                    <CardContent className="p-4 space-y-3">
                                      <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2 min-w-0">
                                          <Briefcase className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                          <h4 className="text-sm font-bold text-foreground truncate">{deal.title}</h4>
                                        </div>
                                        <GripVertical className="h-4 w-4 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </div>
                                      
                                      <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight truncate">{deal.customer?.name || 'Cá nhân'}</p>
                                          {(() => {
                                            const customer = customers.find(c => c.documentId === deal.customer?.documentId || String(c.id) === String(deal.customer?.id));
                                            if (customer?.phone) {
                                              return (
                                                <Button 
                                                  variant="ghost" 
                                                  size="icon" 
                                                  className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-100 rounded-full"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setCallData({
                                                      phoneNumber: customer.phone!,
                                                      customerName: customer.name,
                                                      dealId: String(dealDocId),
                                                      customerId: customer.documentId || customer.id
                                                    });
                                                    setIsCallModalOpen(true);
                                                  }}
                                                >
                                                  <Phone className="h-3 w-3" />
                                                </Button>
                                              );
                                            }
                                            return null;
                                          })()}
                                        </div>
                                        <div className="flex items-center text-primary font-extrabold text-sm">
                                          {formatCurrency(deal.value)}
                                        </div>
                                      </div>

                                      <div className="flex items-center justify-between pt-3 border-t border-border/50">
                                        <div className="flex -space-x-2">
                                           <div className="w-6 h-6 rounded-full border-2 border-background bg-primary/10 flex items-center justify-center text-[10px] font-bold">
                                             {(deal.customer?.name || 'C').charAt(0)}
                                           </div>
                                        </div>
                                        {deal.contractUrl && (
                                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
                                            <FileText className="h-3 w-3" />
                                            <span className="text-[10px] font-bold uppercase">Hợp đồng</span>
                                          </div>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                          {stageDeals.length === 0 && !snapshot.isDraggingOver && (
                            <div className="h-24 border-2 border-dashed border-border/50 rounded-2xl flex items-center justify-center text-[10px] text-muted-foreground font-bold uppercase tracking-widest text-center px-4">
                              Kéo Deal vào đây
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        ) : (
          <div className="bg-card rounded-2xl border border-border overflow-hidden enterprise-shadow">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="py-4">Tên Deal</TableHead>
                    <TableHead className="py-4">Khách hàng</TableHead>
                    <TableHead className="py-4">Giá trị</TableHead>
                    <TableHead className="py-4">Trạng thái</TableHead>
                    <TableHead className="py-4 text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Không tìm thấy deal nào.</TableCell>
                    </TableRow>
                  ) : (
                    filteredDeals.map((deal) => {
                      const stageObj = STAGES.find(s => s.id === deal.stage);
                      return (
                        <TableRow key={deal.id || deal.documentId} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => handleEdit(deal)}>
                          <TableCell className="font-bold py-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <Briefcase className="h-4 w-4 text-primary" />
                              </div>
                              {deal.title}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-muted-foreground py-4">
                            {deal.customer?.name || 'Cá nhân'}
                          </TableCell>
                          <TableCell className="font-extrabold text-primary py-4">
                            {formatCurrency(deal.value)}
                          </TableCell>
                          <TableCell className="py-4">
                            <span className={cn("px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-sm inline-block", stageObj?.color || 'bg-gray-500')}>
                              {stageObj?.label || deal.stage}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 text-right">
                            <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                              {(() => {
                                const customer = customers.find(c => c.documentId === deal.customer?.documentId || String(c.id) === String(deal.customer?.id));
                                if (customer?.phone) {
                                  return (
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-8 rounded-lg text-green-600 border-green-200 hover:bg-green-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setCallData({
                                          phoneNumber: customer.phone!,
                                          customerName: customer.name,
                                          dealId: String(deal.documentId || deal.id),
                                          customerId: customer.documentId || customer.id
                                        });
                                        setIsCallModalOpen(true);
                                      }}
                                    >
                                      <Phone className="h-3.5 w-3.5 mr-2" /> Gọi điện
                                    </Button>
                                  );
                                }
                                return null;
                              })()}
                              {deal.contractUrl && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 border border-blue-500/20">
                                  <FileText className="h-3.5 w-3.5" />
                                  <span className="text-xs font-bold uppercase">Hợp đồng</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
      
      <DealModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        initialData={editingDeal}
        refetch={refetch}
      />
      
      {callData && (
        <CallModal 
          open={isCallModalOpen} 
          onOpenChange={setIsCallModalOpen} 
          phoneNumber={callData.phoneNumber}
          customerName={callData.customerName}
          dealId={callData.dealId}
          customerId={callData.customerId}
        />
      )}
    </div>
  );
}
