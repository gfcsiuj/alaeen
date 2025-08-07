import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Star, Plus, X, AlertCircle, Megaphone, Palette, Camera, Printer } from 'lucide-react';
import { Order } from '../types';

interface EditOrderProps {
  order: Order;
  onClose: () => void;
}

export default function EditOrder({ order, onClose }: EditOrderProps) {
  const { updateOrder } = useApp();
  const [formData, setFormData] = useState({
    id: '',
    customerName: '',
    orderDetails: '',
    price: 0,
    quantity: 1,
    workers: [{ name: '', share: 0, workType: '' }],
    discount: 0,
    discountType: 'fixed' as 'fixed' | 'percentage',
    tax: 0,
    notes: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'pending' as 'pending' | 'in-progress' | 'completed' | 'cancelled',
    date: new Date(),
    createdAt: new Date(),
    serviceType: '' as 'promotion' | 'design' | 'photography' | 'printing' | 'other' | '',
    // خدمة الترويج
    promotionAmountUSD: 0, // مبلغ الترويج بالدولار
    promotionAmount: 0, // مبلغ الترويج بالدينار العراقي
    promotionCurrency: 'usd' as 'iqd' | 'usd',
    promotionProfit: 0,
    promotionCommission: 0, // عمولة الترويج
    promotionAmountReceived: 'none' as 'full' | 'partial' | 'none', // حالة وصول المبلغ
    promotionAmountReceivedPercentage: '', // نسبة المبلغ الواصل
    // خدمة التصميم
    designTypes: [] as string[],
    // خدمة التصوير
    photographyDetails: '',
    photographyAmount: 0,
    photographerName: '',
    photographerAmount: 0,
    // خدمة الطباعة
    printingDetails: '',
    printingAmount: 0,
    printingEmployeeName: '',
    printingEmployeeAmount: 0
  });

  const [totals, setTotals] = useState({
    originalPrice: 0,
    discountAmount: 0,
    afterDiscount: 0,
    taxAmount: 0,
    finalAmount: 0,
    totalWorkerShares: 0
  });

  useEffect(() => {
    // Initialize form data with order data
    if (order) {
      setFormData({
        ...order,
        // خدمة الترويج
        promotionAmountUSD: order.promotionAmountUSD || 0,
        promotionAmount: order.promotionAmount || 0,
        promotionCurrency: order.promotionCurrency || 'usd',
        promotionProfit: order.promotionCommission || 0, // العمولة تحسب كربح
        promotionCommission: order.promotionCommission || 0,
        promotionAmountReceived: order.promotionAmountReceived || 'none',
        promotionAmountReceivedPercentage: order.promotionAmountReceivedPercentage || '',
        // خدمة التصميم
        designTypes: order.designTypes || [],
        // خدمة التصوير
        photographyDetails: order.photographyDetails || '',
        photographyAmount: order.photographyAmount || 0,
        photographerName: order.photographerName || '',
        photographerAmount: order.photographerAmount || 0,
        // خدمة الطباعة
        printingDetails: order.printingDetails || '',
        printingAmount: order.printingAmount || 0,
        printingEmployeeName: order.printingEmployeeName || '',
        printingEmployeeAmount: order.printingEmployeeAmount || 0
      });
    }
  }, [order]);

  const addWorker = () => {
    setFormData(prev => ({
      ...prev,
      workers: [...prev.workers, { name: '', share: 0, workType: '' }]
    }));
  };

  const removeWorker = (index: number) => {
    setFormData(prev => ({
      ...prev,
      workers: prev.workers.filter((_, i) => i !== index)
    }));
  };

  const updateWorker = (index: number, field: 'name' | 'share' | 'workType', value: string | number) => {
    setFormData(prev => {
      const updatedWorkers = [...prev.workers];
      updatedWorkers[index] = {
        ...updatedWorkers[index],
        [field]: value
      };
      return { ...prev, workers: updatedWorkers };
    });
  };

  const calculateTotals = () => {
    const originalPrice = formData.price * formData.quantity;
    let discountAmount = 0;
    
    if (formData.discount) {
      discountAmount = formData.discountType === 'percentage' 
        ? (originalPrice * formData.discount / 100) 
        : formData.discount;
    }
    
    const afterDiscount = originalPrice - discountAmount;
    const taxAmount = formData.tax ? (afterDiscount * formData.tax / 100) : 0;
    const finalAmount = afterDiscount + taxAmount;
    const totalWorkerShares = formData.workers.reduce((total, worker) => total + worker.share, 0);
    
    return {
      originalPrice,
      discountAmount,
      afterDiscount,
      taxAmount,
      finalAmount,
      totalWorkerShares
    };
  };

  useEffect(() => {
    setTotals(calculateTotals());
  }, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedOrder: Order = {
      ...formData,
      // Preserve the original createdAt date
      createdAt: order.createdAt,
      // Update the date to reflect when it was modified
      date: new Date(),
      serviceType: formData.serviceType || undefined,
      // خدمة الترويج
      promotionAmountUSD: formData.serviceType === 'promotion' ? formData.promotionAmountUSD : undefined,
      promotionAmount: formData.serviceType === 'promotion' ? formData.promotionAmount : undefined,
      promotionAmountReceived: formData.serviceType === 'promotion' ? formData.promotionAmountReceived : undefined,
      promotionAmountReceivedPercentage: formData.serviceType === 'promotion' ? formData.promotionAmountReceivedPercentage : undefined,
      promotionProfit: formData.serviceType === 'promotion' ? formData.promotionCommission : undefined, // العمولة تحسب كربح
      promotionCurrency: formData.serviceType === 'promotion' ? formData.promotionCurrency : undefined,
      promotionCommission: formData.serviceType === 'promotion' ? formData.promotionCommission : undefined,
      // خدمة التصميم
      designTypes: formData.serviceType === 'design' ? formData.designTypes : undefined,
      // خدمة التصوير
      photographyDetails: formData.serviceType === 'photography' ? formData.photographyDetails : undefined,
      photographyAmount: formData.serviceType === 'photography' ? formData.photographyAmount : undefined,
      photographerName: formData.serviceType === 'photography' ? formData.photographerName : undefined,
      photographerAmount: formData.serviceType === 'photography' ? formData.photographerAmount : undefined,
      // خدمة الطباعة
      printingDetails: formData.serviceType === 'printing' ? formData.printingDetails : undefined,
      printingAmount: formData.serviceType === 'printing' ? formData.printingAmount : undefined,
      printingEmployeeName: formData.serviceType === 'printing' ? formData.printingEmployeeName : undefined,
      printingEmployeeAmount: formData.serviceType === 'printing' ? formData.printingEmployeeAmount : undefined
    };
    
    updateOrder(updatedOrder);
    onClose();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20';
      case 'medium':
        return 'border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20';
      case 'high':
        return 'border-red-300 dark:border-red-700 text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-900/20';
      default:
        return 'border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20';
      case 'in-progress':
        return 'border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20';
      case 'completed':
        return 'border-green-300 dark:border-green-700 text-green-800 dark:text-green-300 bg-green-50 dark:bg-green-900/20';
      case 'cancelled':
        return 'border-red-300 dark:border-red-700 text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-900/20';
      default:
        return 'border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white dark:bg-gray-700 rounded-full p-2 shadow-md hover:shadow-lg transition-all duration-200 z-10"
          aria-label="إغلاق"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              تعديل الطلب
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Service Type Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 animate-slide-up">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center ml-3">
                  <Star className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                نوع الخدمة
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div 
                  onClick={() => setFormData(prev => ({ ...prev, serviceType: 'promotion' }))}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-2 ${formData.serviceType === 'promotion' ? 'bg-primary-50 border-primary-500 shadow-md dark:bg-primary-900/30 dark:border-primary-500' : 'bg-white border-gray-200 hover:border-primary-300 dark:bg-gray-800 dark:border-gray-700'}`}
                >
                  <Megaphone className={`w-8 h-8 ${formData.serviceType === 'promotion' ? 'text-primary-600' : 'text-gray-500'}`} />
                  <span className={`font-medium ${formData.serviceType === 'promotion' ? 'text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>ترويج</span>
                </div>
                
                <div 
                  onClick={() => setFormData(prev => ({ ...prev, serviceType: 'design' }))}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-2 ${formData.serviceType === 'design' ? 'bg-primary-50 border-primary-500 shadow-md dark:bg-primary-900/30 dark:border-primary-500' : 'bg-white border-gray-200 hover:border-primary-300 dark:bg-gray-800 dark:border-gray-700'}`}
                >
                  <Palette className={`w-8 h-8 ${formData.serviceType === 'design' ? 'text-primary-600' : 'text-gray-500'}`} />
                  <span className={`font-medium ${formData.serviceType === 'design' ? 'text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>تصميم</span>
                </div>
                
                <div 
                  onClick={() => setFormData(prev => ({ ...prev, serviceType: 'photography' }))}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-2 ${formData.serviceType === 'photography' ? 'bg-primary-50 border-primary-500 shadow-md dark:bg-primary-900/30 dark:border-primary-500' : 'bg-white border-gray-200 hover:border-primary-300 dark:bg-gray-800 dark:border-gray-700'}`}
                >
                  <Camera className={`w-8 h-8 ${formData.serviceType === 'photography' ? 'text-primary-600' : 'text-gray-500'}`} />
                  <span className={`font-medium ${formData.serviceType === 'photography' ? 'text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>تصوير</span>
                </div>
                
                <div 
                  onClick={() => setFormData(prev => ({ ...prev, serviceType: 'printing' }))}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-2 ${formData.serviceType === 'printing' ? 'bg-primary-50 border-primary-500 shadow-md dark:bg-primary-900/30 dark:border-primary-500' : 'bg-white border-gray-200 hover:border-primary-300 dark:bg-gray-800 dark:border-gray-700'}`}
                >
                  <Printer className={`w-8 h-8 ${formData.serviceType === 'printing' ? 'text-primary-600' : 'text-gray-500'}`} />
                  <span className={`font-medium ${formData.serviceType === 'printing' ? 'text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>طباعة</span>
                </div>
                
                <div 
                  onClick={() => setFormData(prev => ({ ...prev, serviceType: 'other' }))}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-2 ${formData.serviceType === 'other' ? 'bg-primary-50 border-primary-500 shadow-md dark:bg-primary-900/30 dark:border-primary-500' : 'bg-white border-gray-200 hover:border-primary-300 dark:bg-gray-800 dark:border-gray-700'}`}
                >
                  <Star className={`w-8 h-8 ${formData.serviceType === 'other' ? 'text-primary-600' : 'text-gray-500'}`} />
                  <span className={`font-medium ${formData.serviceType === 'other' ? 'text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>أخرى</span>
                </div>
              </div>
            </div>

            {/* Service Type Specific Details */}
            {formData.serviceType === 'promotion' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 animate-slide-up">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center ml-3">
                    <Megaphone className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  معلومات الترويج
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      مبلغ الترويج (دولار أمريكي) *
                    </label>
                    <input
                      type="number"
                      value={formData.promotionAmountUSD}
                      onChange={(e) => {
                        const usdAmount = parseFloat(e.target.value) || 0;
                        const iqdAmount = usdAmount * 1380; // تحويل الدولار إلى دينار عراقي
                        setFormData(prev => ({
                          ...prev,
                          promotionAmountUSD: usdAmount,
                          promotionAmount: iqdAmount
                        }));
                      }}
                      className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300 hover:shadow-md"
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      مبلغ الترويج (دينار عراقي) - محسوب تلقائياً
                    </label>
                    <input
                      type="number"
                      value={formData.promotionAmount}
                      readOnly
                      className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white transition-all duration-300"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      حالة وصول المبلغ *
                    </label>
                    <div className="flex flex-col space-y-2">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="radio"
                          value="full"
                          checked={formData.promotionAmountReceived === 'full'}
                          onChange={(e) => setFormData(prev => ({ ...prev, promotionAmountReceived: e.target.value as 'full' | 'partial' | 'none', promotionAmountReceivedPercentage: '' }))}
                          className="form-radio text-primary-600 border-gray-300 focus:ring-primary-500 h-5 w-5"
                        />
                        <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">واصل بالكامل</span>
                      </label>
                      
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="radio"
                          value="partial"
                          checked={formData.promotionAmountReceived === 'partial'}
                          onChange={(e) => setFormData(prev => ({ ...prev, promotionAmountReceived: e.target.value as 'full' | 'partial' | 'none' }))}
                          className="form-radio text-primary-600 border-gray-300 focus:ring-primary-500 h-5 w-5"
                        />
                        <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">واصل جزئياً</span>
                      </label>
                      
                      {formData.promotionAmountReceived === 'partial' && (
                        <div className="mr-7 mt-2">
                          <input
                            type="number"
                            value={formData.promotionAmountReceivedPercentage}
                            onChange={(e) => setFormData(prev => ({ ...prev, promotionAmountReceivedPercentage: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300"
                            placeholder="نسبة المبلغ الواصل"
                          />
                        </div>
                      )}
                      
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="radio"
                          value="none"
                          checked={formData.promotionAmountReceived === 'none'}
                          onChange={(e) => setFormData(prev => ({ ...prev, promotionAmountReceived: e.target.value as 'full' | 'partial' | 'none', promotionAmountReceivedPercentage: '' }))}
                          className="form-radio text-primary-600 border-gray-300 focus:ring-primary-500 h-5 w-5"
                        />
                        <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">غير واصل</span>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      العمولة (تحسب كربح) *
                    </label>
                    <input
                      type="number"
                      value={formData.promotionCommission}
                      onChange={(e) => setFormData(prev => ({ ...prev, promotionCommission: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300 hover:shadow-md"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {formData.serviceType === 'design' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 animate-slide-up">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center ml-3">
                    <Palette className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  تفاصيل التصميم
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      أنواع التصميم
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {['لوجو', 'بوستر', 'بطاقة', 'بروشور', 'بانر', 'أخرى'].map(type => (
                        <div 
                          key={type}
                          onClick={() => {
                            setFormData(prev => {
                              const types = [...prev.designTypes];
                              if (types.includes(type)) {
                                return { ...prev, designTypes: types.filter(t => t !== type) };
                              } else {
                                return { ...prev, designTypes: [...types, type] };
                              }
                            });
                          }}
                          className={`px-4 py-2 rounded-xl border cursor-pointer transition-all duration-300 ${formData.designTypes.includes(type) ? 'bg-primary-50 border-primary-500 shadow-md dark:bg-primary-900/30 dark:border-primary-500 text-primary-700 dark:text-primary-400' : 'bg-white border-gray-200 hover:border-primary-300 dark:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}
                        >
                          {type}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {formData.serviceType === 'photography' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 animate-slide-up">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center ml-3">
                    <Camera className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  تفاصيل التصوير
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      تفاصيل التصوير
                    </label>
                    <textarea
                      value={formData.photographyDetails}
                      onChange={(e) => setFormData(prev => ({ ...prev, photographyDetails: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none transition-all duration-300 hover:shadow-md"
                      placeholder="تفاصيل عن نوع التصوير والمتطلبات..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      مبلغ المصور (دينار عراقي)
                    </label>
                    <input
                      type="number"
                      value={formData.photographerAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, photographerAmount: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300 hover:shadow-md"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {formData.serviceType === 'printing' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 animate-slide-up">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center ml-3">
                    <Printer className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  تفاصيل الطباعة
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      تفاصيل الطباعة
                    </label>
                    <textarea
                      value={formData.printingDetails}
                      onChange={(e) => setFormData(prev => ({ ...prev, printingDetails: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none transition-all duration-300 hover:shadow-md"
                      placeholder="تفاصيل عن نوع الطباعة والمواد المستخدمة..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      مبلغ الطباعة (دينار عراقي)
                    </label>
                    <input
                      type="number"
                      value={formData.printingAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, printingAmount: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300 hover:shadow-md"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Basic Order Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  اسم العميل *
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                  className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300 hover:shadow-md"
                  required
                  placeholder="أدخل اسم العميل"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  تفاصيل الطلب *
                </label>
                <textarea
                  value={formData.orderDetails}
                  onChange={(e) => setFormData(prev => ({ ...prev, orderDetails: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none transition-all duration-300 hover:shadow-md"
                  required
                  placeholder="وصف تفصيلي للطلب"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  السعر الأساسي (دينار عراقي) *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300 hover:shadow-md"
                  required
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  العدد *
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  min="1"
                  className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300 hover:shadow-md"
                  required
                  placeholder="1"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  الأولوية
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                  className={`w-full px-4 py-4 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 hover:shadow-md ${getPriorityColor(formData.priority)}`}
                >
                  <option value="low">منخفضة</option>
                  <option value="medium">متوسطة</option>
                  <option value="high">عالية</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  حالة الطلب
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className={`w-full px-4 py-4 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 hover:shadow-md ${getStatusColor(formData.status)}`}
                >
                  <option value="pending">في الانتظار</option>
                  <option value="in-progress">قيد التنفيذ</option>
                  <option value="completed">مكتمل</option>
                  <option value="cancelled">ملغي</option>
                </select>
              </div>
            </div>

            {/* Discount and Tax */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  الخصم
                </label>
                <input
                  type="number"
                  value={formData.discount}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300 hover:shadow-md"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  نوع الخصم
                </label>
                <div className="flex gap-4">
                  <div 
                    onClick={() => setFormData(prev => ({ ...prev, discountType: 'fixed' }))}
                    className={`flex-1 px-4 py-4 border rounded-xl cursor-pointer transition-all duration-300 flex items-center justify-center ${formData.discountType === 'fixed' ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/30 dark:border-primary-500 dark:text-primary-400' : 'bg-white border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'}`}
                  >
                    مبلغ ثابت
                  </div>
                  <div 
                    onClick={() => setFormData(prev => ({ ...prev, discountType: 'percentage' }))}
                    className={`flex-1 px-4 py-4 border rounded-xl cursor-pointer transition-all duration-300 flex items-center justify-center ${formData.discountType === 'percentage' ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/30 dark:border-primary-500 dark:text-primary-400' : 'bg-white border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'}`}
                  >
                    نسبة مئوية
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  الضريبة (%)
                </label>
                <input
                  type="number"
                  value={formData.tax}
                  onChange={(e) => setFormData(prev => ({ ...prev, tax: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300 hover:shadow-md"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Calculation Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center ml-3">
                  <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                ملخص الحساب
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">السعر الأصلي:</span>
                  <span className="font-bold text-gray-800 dark:text-white">{totals.originalPrice.toLocaleString('ar-IQ')} دينار عراقي</span>
                </div>
                
                {formData.discount > 0 && (
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">الخصم ({formData.discountType === 'percentage' ? `${formData.discount}%` : `${formData.discount.toLocaleString('ar-IQ')} د.ع`}):</span>
                    <span className="font-bold text-red-600 dark:text-red-400">- {totals.discountAmount.toLocaleString('ar-IQ')} دينار عراقي</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">بعد الخصم:</span>
                  <span className="font-bold text-gray-800 dark:text-white">{totals.afterDiscount.toLocaleString('ar-IQ')} دينار عراقي</span>
                </div>
                
                {formData.tax > 0 && (
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">الضريبة ({formData.tax}%):</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">+ {totals.taxAmount.toLocaleString('ar-IQ')} دينار عراقي</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">المبلغ النهائي:</span>
                  <span className="font-bold text-2xl text-primary-600 dark:text-primary-400">{totals.finalAmount.toLocaleString('ar-IQ')} دينار عراقي</span>
                </div>
              </div>
            </div>

            {/* Workers Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center ml-3">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  العاملون المشاركون
                </h2>
                <button
                  type="button"
                  onClick={addWorker}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl flex items-center text-sm font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                >
                  <Plus className="w-4 h-4 ml-1" />
                  إضافة عامل
                </button>
              </div>

              <div className="space-y-4">
                {formData.workers.map((worker, index) => (
                  <div key={index} className="space-y-3 animate-slide-up border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-4">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={worker.name}
                        onChange={(e) => updateWorker(index, 'name', e.target.value)}
                        placeholder={`اسم العامل ${index + 1}`}
                        className="flex-1 px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300 hover:shadow-md"
                      />
                      <input
                        type="number"
                        value={worker.share}
                        onChange={(e) => updateWorker(index, 'share', parseFloat(e.target.value) || 0)}
                        placeholder="الحصة"
                        className="w-32 px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300 hover:shadow-md"
                      />
                      {formData.workers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeWorker(index)}
                          className="px-4 py-4 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-300 transform hover:scale-110"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                        نوع العمل
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {['تصميم', 'تصوير', 'طباعة', 'ترويج', 'أخرى'].map(type => (
                          <div 
                            key={type}
                            onClick={() => updateWorker(index, 'workType', type)}
                            className={`px-4 py-2 rounded-xl border cursor-pointer transition-all duration-300 ${worker.workType === type ? 'bg-primary-50 border-primary-500 shadow-md dark:bg-primary-900/30 dark:border-primary-500 text-primary-700 dark:text-primary-400' : 'bg-white border-gray-200 hover:border-primary-300 dark:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}
                          >
                            {type}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-300 dark:border-blue-700 mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">إجمالي مبلغ العمال:</p>
                  <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {totals.totalWorkerShares.toLocaleString('ar-IQ')} دينار عراقي
                  </p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-300 dark:border-green-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">صافي الربح:</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {(totals.finalAmount - totals.totalWorkerShares).toLocaleString('ar-IQ')} دينار عراقي
                  </p>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center ml-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                ملاحظات إضافية
              </h2>
              
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
                className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none transition-all duration-300 hover:shadow-md"
                placeholder="أي ملاحظات أو تفاصيل إضافية..."
              />
            </div>

            <div className="flex gap-4 mt-8">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center justify-center">
                  <X className="w-5 h-5 ml-2" />
                  إلغاء
                </div>
              </button>
              
              <button
                type="submit"
                className="w-2/3 bg-gradient-to-r from-primary-500 to-pink-500 hover:from-primary-600 hover:to-pink-600 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="flex items-center justify-center">
                  <Star className="w-5 h-5 ml-2" />
                  حفظ التعديلات
                </div>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}