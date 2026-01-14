export interface NewCustomerData {
  customer_name: string;
  customer_group: string;
  territory: string;
  owner_name: string;
  whatsapp_no: string;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  customer_type: 'Company' | 'Individual' | 'Partnership' | '';
  sales_person: string;
}