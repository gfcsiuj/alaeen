export interface Order {
  id: string;
  customerName: string;
  orderDetails: string;
  price: number;
  quantity: number;
  workers: { name: string; share: number; workType?: string }[];
  discount?: number;
  discountType?: 'fixed' | 'percentage';
  tax?: number;
  notes?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  date: string;
  createdAt: string;
  images?: string[];
  // نوع الخدمة
  serviceType?: 'promotion' | 'design' | 'photography' | 'printing' | 'other';
  // خدمة الترويج
  promotionAmountUSD?: number; // مبلغ الترويج بالدولار
  promotionAmount?: number; // مبلغ الترويج بالدينار العراقي (يتم حسابه تلقائياً)
  promotionCurrency?: 'iqd' | 'usd';
  promotionProfit?: number;
  promotionCommission?: number; // عمولة الترويج
  promotionAmountReceived?: 'full' | 'partial' | 'none'; // حالة وصول المبلغ
  promotionAmountReceivedPercentage?: number; // نسبة المبلغ الواصل في حالة الوصول الجزئي
  // خدمة التصميم
  designTypes?: string[];
  // خدمة التصوير
  photographyDetails?: string;
  photographyAmount?: number;
  photographerName?: string;
  photographerAmount?: number;
  // خدمة الطباعة
  printingDetails?: string;
  printingAmount?: number;
  printingEmployeeName?: string;
  printingEmployeeAmount?: number;
}

export interface Settings {
  theme: 'light' | 'dark';
  pinEnabled: boolean;
  pin?: string;
  defaultTax?: number;
  companyName?: string;
}

export interface AnalyticsData {
  totalRevenue: number;
  netProfit: number;
  workerShares: Record<string, number>;
  totalDeductions: number;
  totalDiscounts: number;
  totalTax: number;
}