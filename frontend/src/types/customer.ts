export interface Customer {
  id: string;
  documentId: string;
  name: string;
  email: string;
  phone: string;
  status: "lead" | "prospect" | "customer" | "churned";
  assignedTo?: string;
  createdAt: string;
}
