import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Star, Plus, X, AlertCircle, Megaphone, Palette, Users, Wifi, WifiOff, Loader2, Calculator } from 'lucide-react';
import { Order } from '../types';
import { PasswordConfirm } from './PasswordConfirm';

interface EditOrderProps {
  order: Order;
  onFinishEditing: () => void;
}

export default function EditOrder({ order, onFinishEditing }: EditOrderProps) {
  const { updateOrder, isOnline, isSyncing } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const [formData, setFormData] = useState({
    customerName: '',
    orderDetails: '',
    price: '',
    quantity: '1',
    workers: [{ name: '', share: 0, workType: '' }],
    discount: '',
    discountType: 'fixed' as 'fixed' | 'percentage',
    tax: '',
    notes: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'pending' as 'pending' | 'in-progress' | 'completed' | 'cancelled',
    serviceType: 'other' as 'promotion' | 'design' | 'photography' | 'printing' | 'other',
    // خدمة الترويج
    amountReceived: '', // المبلغ الواصل
    promotionAmountUSD: '', // مبلغ الترويج بالدولار
    promotionAmount: '', // مبلغ الترويج بالدينار العراقي (يتم حسابه تلقائياً)
    promotionCommission: '', // عمولة الترويج
    // خدمة التصميم
    designs: [{ type: '', quantity: 1 }],
    // خدمة التصوير
    photographyDetails: '',
    photographyAmount: '',
    photographerName: '',
    photographerAmount: '',
    // خدمة الطباعة
    printingDetails: '',
    printingAmount: '',
    printingEmployeeName: '',
    printingEmployeeAmount: '',
    // حالة السعر لخدمة "أخرى"
    priceStatus: 'full' as 'full' | 'partial' | 'none',
    amountPaid: '',
  });

  useEffect(() => {
    if (order) {
      setFormData({
        customerName: order.customerName || '',
        orderDetails: order.orderDetails || '',
        price: order.price ? String(order.price) : '',
        quantity: order.quantity ? String(order.quantity) : '1',
        workers: order.workers && order.workers.length > 0 ? order.workers : [{ name: '', share: 0, workType: '' }],
        discount: order.discount ? String(order.discount) : '',
        discountType: order.discountType || 'fixed',
        tax: order.tax ? String(order.tax) : '',
        notes: order.notes || '',
        priority: order.priority || 'medium',
        status: order.status || 'pending',
        serviceType: order.serviceType || 'other',
        amountReceived: order.amountReceived ? String(order.amountReceived) : '',
        promotionAmountUSD: order.promotionAmountUSD ? String(order.promotionAmountUSD) : '',
        promotionAmount: order.promotionAmount ? String(order.promotionAmount) : '',
        promotionCommission: order.promotionCommission ? String(order.promotionCommission) : '',
        designs: order.designs && order.designs.length > 0 ? order.designs : [{ type: '', quantity: 1 }],
        photographyDetails: order.photographyDetails || '',
        photographyAmount: order.photographyAmount ? String(order.photographyAmount) : '',
        photographerName: order.photographerName || '',
        photographerAmount: order.photographerAmount ? String(order.photographerAmount) : '',
        printingDetails: order.printingDetails || '',
        printingAmount: order.printingAmount ? String(order.printingAmount) : '',
        printingEmployeeName: order.printingEmployeeName || '',
        printingEmployeeAmount: order.printingEmployeeAmount ? String(order.printingEmployeeAmount) : '',
        priceStatus: order.priceStatus || 'full',
        amountPaid: order.amountPaid ? String(order.amountPaid) : '',
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
    setFormData(prev => ({
      ...prev,
      workers: prev.workers.map((worker, i) =>
        i === index ? { ...worker, [field]: value } : worker
      )
    }));
  };

  // Auto-calculate commission for promotion service
  useEffect(() => {
    if (formData.serviceType === 'promotion') {
      // Auto-fill worker share
      const promotionAmount = parseFloat(formData.promotionAmount) || 0;
      if (formData.workers.length > 0) {
        setFormData(prev => {
          const newWorkers = [...prev.workers];
          // Only update if it hasn't been manually changed
          if (newWorkers[0].share !== promotionAmount) {
            newWorkers[0] = { ...newWorkers[0], share: promotionAmount, workType: 'ترويج' };
            return { ...prev, workers: newWorkers };
          }
          return prev;
        });
      }

      const amountReceived = parseFloat(formData.amountReceived) || 0;
      const commission = amountReceived - promotionAmount;
      setFormData(prev => ({
        ...prev,
        promotionCommission: commission > 0 ? commission.toString() : '0'
      }));
    }
  }, [formData.amountReceived, formData.promotionAmount, formData.serviceType]);

  const designTypeOptions = [
    'بوست', 'فيديو', 'شعار', 'هويه بصريه', 'بروفايل شركات', 'واجهه موقع الكتروني',
    'تصميم علب', 'موشن كرافيك', 'تصميم تقويم', 'غلاف كتاب', 'تصميم مجله',
    'بروشر', 'رول اب', 'لوحه اعلانيه', 'ستاند موتمرات'
  ];

  const addDesign = () => {
    setFormData(prev => ({
      ...prev,
      designs: [...prev.designs, { type: '', quantity: 1 }]
    }));
  };

  const removeDesign = (index: number) => {
    setFormData(prev => ({
      ...prev,
      designs: prev.designs.filter((_, i) => i !== index)
    }));
  };

  const updateDesign = (index: number, field: 'type' | 'quantity', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      designs: prev.designs.map((design, i) =>
        i === index ? { ...design, [field]: value } : design
      )
    }));
  };

  const calculateTotals = () => {
    const price = parseFloat(formData.price) || 0;
    const discount = parseFloat(formData.discount) || 0;
    const tax = parseFloat(formData.tax) || 0;

    let discountAmount = 0;
    if (formData.discountType === 'percentage') {
      discountAmount = (price * discount) / 100;
    } else {
      discountAmount = discount;
    }

    const afterDiscount = price - discountAmount;
    const taxAmount = (afterDiscount * tax) / 100;
    let finalAmount = afterDiscount + taxAmount;

    const totalWorkerShares = formData.workers.reduce((sum, worker) => sum + (worker.share || 0), 0);

    if (formData.serviceType === 'promotion') {
      const amountReceived = parseFloat(formData.amountReceived) || 0;
      const adjustedCommission = amountReceived - totalWorkerShares;
      finalAmount = adjustedCommission;
    }
    
    return {
      originalPrice: price,
      discountAmount,
      afterDiscount,
      taxAmount,
      finalAmount,
      totalWorkerShares
    };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // التحقق من الاتصال بالإنترنت
    if (!isOnline) {
      alert('لا يمكن تعديل الطلب بدون اتصال بالإنترنت. يرجى التحقق من اتصالك والمحاولة مرة أخرى.');
      return;
    }
    
    // عرض نافذة التحقق من كلمة المرور
    setShowPasswordConfirm(true);
  };
  
  // دالة تنفيذ تعديل الطلب بعد التحقق من كلمة المرور
  const executeOrderUpdate = async () => {
    setIsSubmitting(true);
    
    try {
      const updatedOrderData: Order = {
        id: order.id, // Keep the original ID
        customerName: formData.customerName,
        orderDetails: formData.orderDetails,
        price: parseFloat(formData.price) || 0,
        quantity: 1, // Default value, as quantity is now per-design
        workers: formData.workers.filter(w => w.name.trim()),
        discount: parseFloat(formData.discount) || 0,
        discountType: formData.discountType,
        tax: parseFloat(formData.tax) || 0,
        notes: formData.notes,
        priority: formData.priority,
        status: formData.status,
        date: new Date().toISOString(), // Update the date to now
        createdAt: order.createdAt, // Keep the original creation date
        serviceType: formData.serviceType,
        // خدمة الترويج
        amountReceived: parseFloat(formData.amountReceived) || 0,
        promotionAmountUSD: parseFloat(formData.promotionAmountUSD) || 0,
        promotionAmount: parseFloat(formData.promotionAmount) || 0,
        promotionCommission: parseFloat(formData.promotionCommission) || 0,
        // خدمة التصميم
        designs: formData.designs.filter(d => d.type),
        // خدمة التصوير
        photographyDetails: formData.photographyDetails,
        photographyAmount: parseFloat(formData.photographyAmount) || 0,
        photographerName: formData.photographerName,
        photographerAmount: parseFloat(formData.photographerAmount) || 0,
        // خدمة الطباعة
        printingDetails: formData.printingDetails,
        printingAmount: parseFloat(formData.printingAmount) || 0,
        printingEmployeeName: formData.printingEmployeeName,
        printingEmployeeAmount: parseFloat(formData.printingEmployeeAmount) || 0,
        // New fields
        priceStatus: formData.priceStatus,
        amountPaid: parseFloat(formData.amountPaid) || 0,
      };

      await updateOrder(updatedOrderData);
      
      alert('تم تحديث الطلب بنجاح وتمت مزامنته مع جميع المستخدمين');
      
      onFinishEditing(); // Return to the list on success
    } catch (error: any) {
      console.error('خطأ في تحديث الطلب:', error);
      alert(`حدث خطأ أثناء تحديث الطلب: ${error.message || 'يرجى المحاولة مرة أخرى'}`);
    } finally {
      setIsSubmitting(false);
    }
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
    <div className="p-4 pb-20 animate-fade-in">
      {showPasswordConfirm && (
        <PasswordConfirm
          onConfirm={() => {
            setShowPasswordConfirm(false);
            executeOrderUpdate();
          }}
          onCancel={() => setShowPasswordConfirm(false)}
          actionType="edit"
        />
      )}
      <div className="max-w-2xl mx-auto animate-slide-up">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 animate-bounce-in">
            <img
              src="./images/logo.jpg"
              alt="العين"
              className="w-full h-full rounded-full object-cover logo-frame"
            />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-pink-600 bg-clip-text text-transparent mb-2">تعديل الطلب</h1>
          <p className="text-gray-600 dark:text-gray-400">قم بتحديث تفاصيل الطلب</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Type Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 animate-slide-up">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center ml-3">
                <Star className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              نوع الخدمة
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
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
                onClick={() => setFormData(prev => ({ ...prev, serviceType: 'other' }))}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-2 ${formData.serviceType === 'other' ? 'bg-primary-50 border-primary-500 shadow-md dark:bg-primary-900/30 dark:border-primary-500' : 'bg-white border-gray-200 hover:border-primary-300 dark:bg-gray-800 dark:border-gray-700'}`}
              >
                <Plus className={`w-8 h-8 ${formData.serviceType === 'other' ? 'text-primary-600' : 'text-gray-500'}`} />
                <span className={`font-medium ${formData.serviceType === 'other' ? 'text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>أخرى</span>
              </div>
            </div>
          </div>

          {/* Service Type Specific Fields */}
          {formData.serviceType === 'promotion' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 animate-slide-up">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center ml-3">
                  <Megaphone className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                معلومات الترويج
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    المبلغ الواصل (دينار عراقي) *
                  </label>
                  <input
                    type="number"
                    value={formData.amountReceived}
                    onChange={(e) => setFormData(prev => ({ ...prev, amountReceived: e.target.value }))}
                    className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300 hover:shadow-md"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    مبلغ الترويج بالدولار *
                  </label>
                  <input
                    type="number"
                    value={formData.promotionAmountUSD}
                    onChange={(e) => {
                      const usdAmount = e.target.value;
                      const iqdAmount = parseFloat(usdAmount) * 1380 || '';
                      setFormData(prev => ({
                        ...prev,
                        promotionAmountUSD: usdAmount,
                        promotionAmount: iqdAmount.toString()
                      }));
                    }}
                    className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300 hover:shadow-md"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    مبلغ الترويج بالدينار العراقي (تلقائي)
                  </label>
                  <input
                    type="text"
                    value={formData.promotionAmount ? parseFloat(formData.promotionAmount).toLocaleString('ar-IQ') : ''}
                    readOnly
                    className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-300"
                    placeholder="يتم الحساب تلقائياً"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    العمولة (تلقائي)
                  </label>
                  <input
                    type="text"
                    value={formData.promotionCommission ? parseFloat(formData.promotionCommission).toLocaleString('ar-IQ') : ''}
                    readOnly
                    className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-300"
                    placeholder="يتم الحساب تلقائياً"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Design service section removed as requested */}

          {/* Photography service section removed as requested */}

          {/* Printing service section removed as requested */}

          {/* Basic Order Info */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 animate-slide-up">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center ml-3">
                <Plus className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              {formData.serviceType === 'promotion' ? 'معلومات طلب الترويج' :
               formData.serviceType === 'design' ? 'معلومات طلب التصميم' :
               formData.serviceType === 'photography' ? 'معلومات طلب التصوير' :
               formData.serviceType === 'printing' ? 'معلومات طلب الطباعة' :
               'معلومات الطلب الأساسية'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
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

              {formData.serviceType !== 'promotion' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    السعر الأساسي (دينار عراقي) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300 hover:shadow-md"
                    required
                    placeholder="0"
                  />
                </div>
              )}

              {formData.serviceType === 'design' && (
                <div className="md:col-span-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">التصاميم المطلوبة</h3>
                  {formData.designs.map((design, index) => (
                    <div key={index} className="flex gap-4 items-end mb-4">
                      <div className="flex-1">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">نوع التصميم</label>
                        <select
                          value={design.type}
                          onChange={(e) => updateDesign(index, 'type', e.target.value)}
                          className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300 hover:shadow-md"
                        >
                          <option value="">اختر نوع التصميم</option>
                          {designTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                      <div className="w-24">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">العدد</label>
                        <input
                          type="number"
                          value={design.quantity}
                          onChange={(e) => updateDesign(index, 'quantity', parseInt(e.target.value) || 1)}
                          min="1"
                          className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300 hover:shadow-md"
                        />
                      </div>
                      {formData.designs.length > 1 && (
                        <button type="button" onClick={() => removeDesign(index)} className="p-2 text-red-500 hover:bg-red-100 rounded-full"><X className="w-5 h-5"/></button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addDesign} className="mt-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-lg flex items-center text-sm font-bold hover:bg-primary-200">
                    <Plus className="w-4 h-4 ml-1" /> إضافة تصميم آخر
                  </button>
                </div>
              )}

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

              {formData.serviceType === 'other' && (
                <div className="md:col-span-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">حالة السعر</h3>
                  <div className="flex flex-wrap gap-4">
                    {(['full', 'partial', 'none'] as const).map(status => (
                      <label key={status} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="priceStatus"
                          value={status}
                          checked={formData.priceStatus === status}
                          onChange={(e) => setFormData(prev => ({ ...prev, priceStatus: e.target.value as any, amountPaid: '' }))}
                          className="form-radio text-primary-600"
                        />
                        <span className="text-gray-700 dark:text-gray-300">
                          {status === 'full' ? 'واصل بالكامل' : status === 'partial' ? 'واصل جزئياً' : 'لم يصل'}
                        </span>
                      </label>
                    ))}
                  </div>

                  {formData.priceStatus === 'partial' && (
                    <div className="mt-4">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        المبلغ الواصل
                      </label>
                      <input
                        type="number"
                        value={formData.amountPaid}
                        onChange={(e) => setFormData(prev => ({ ...prev, amountPaid: e.target.value }))}
                        className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300 hover:shadow-md"
                        placeholder="أدخل المبلغ الواصل"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Discounts and Tax */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 animate-slide-up">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center ml-3">
                <Calculator className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              الخصومات والضرائب
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  الخصم
                </label>
                <input
                  type="number"
                  value={formData.discount}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount: e.target.value }))}
                  className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300 hover:shadow-md"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  نوع الخصم
                </label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData(prev => ({ ...prev, discountType: e.target.value as any }))}
                  className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300 hover:shadow-md"
                >
                  <option value="fixed">مبلغ ثابت</option>
                  <option value="percentage">نسبة مئوية</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  الضريبة (%)
                </label>
                <input
                  type="number"
                  value={formData.tax}
                  onChange={(e) => setFormData(prev => ({ ...prev, tax: e.target.value }))}
                  className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300 hover:shadow-md"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Calculation Summary */}
            {(formData.price || formData.discount || formData.tax) && (
              <div className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-pink-50 dark:from-primary-900/20 dark:to-pink-900/20 rounded-xl border border-primary-200 dark:border-primary-800">
                <h3 className="font-bold text-primary-800 dark:text-primary-200 mb-3">ملخص الحسابات</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">السعر الأساسي</p>
                    <p className="font-bold text-gray-900 dark:text-white">{totals.originalPrice.toLocaleString('ar-IQ')} د.ع</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">الخصم</p>
                    <p className="font-bold text-red-600">-{totals.discountAmount.toLocaleString('ar-IQ')} د.ع</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">الضريبة</p>
                    <p className="font-bold text-blue-600">+{totals.taxAmount.toLocaleString('ar-IQ')} د.ع</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">المبلغ النهائي</p>
                    <p className="font-bold text-primary-600 text-lg">{totals.finalAmount.toLocaleString('ar-IQ')} د.ع</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Workers Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center ml-3">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                العمال المشاركون
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
                  <div className="flex flex-wrap gap-3">
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
                    {formData.serviceType === 'design' ? (
                      <select
                        value={worker.workType}
                        onChange={(e) => updateWorker(index, 'workType', e.target.value)}
                        className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300 hover:shadow-md"
                      >
                        <option value="">اختر نوع العمل</option>
                        {designTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={worker.workType}
                        onChange={(e) => updateWorker(index, 'workType', e.target.value)}
                        placeholder="نوع العمل"
                        className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300 hover:shadow-md"
                      />
                    )}
                  </div>

                    {formData.serviceType === 'promotion' && (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">حالة الدفع للعامل</label>
                        <div className="flex flex-wrap gap-4">
                          {(['full', 'partial', 'none'] as const).map(status => (
                            <label key={status} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`workerPaymentStatus-${index}`}
                                value={status}
                                checked={worker.paymentStatus === status}
                                onChange={(e) => updateWorker(index, 'paymentStatus', e.target.value as 'full' | 'partial' | 'none')}
                                className="form-radio text-primary-600"
                              />
                              <span className="text-gray-700 dark:text-gray-300">
                                {status === 'full' ? 'مدفوع بالكامل' : status === 'partial' ? 'مدفوع جزئياً' : 'لم يدفع'}
                              </span>
                            </label>
                          ))}
                        </div>

                        {worker.paymentStatus === 'partial' && (
                          <div className="mt-4">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                              المبلغ المدفوع
                            </label>
                            <input
                              type="number"
                              value={worker.amountPaid || ''}
                              onChange={(e) => updateWorker(index, 'amountPaid', parseFloat(e.target.value) || 0)}
                              className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300 hover:shadow-md"
                              placeholder="أدخل المبلغ المدفوع"
                            />
                          </div>
                        )}
                      </div>
                    )}
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
                  {(formData.serviceType === 'promotion'
                    ? totals.finalAmount
                    : totals.finalAmount - totals.totalWorkerShares
                  ).toLocaleString('ar-IQ')} دينار عراقي
                </p>
                {formData.serviceType === 'promotion' && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    (العمولة تحسب كربح بالدينار العراقي في الأرباح الصافية)
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Additional Notes */}
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

          {/* حالة الاتصال والمزامنة */}
          <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {isOnline ? (
                  <Wifi className="w-5 h-5 text-green-500 ml-2" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-500 ml-2" />
                )}
                <span className="text-sm font-medium">
                  {isOnline ? 'متصل بالإنترنت' : 'غير متصل بالإنترنت'}
                </span>
              </div>
              <div className="flex items-center">
                {isSyncing && (
                  <>
                    <Loader2 className="w-4 h-4 text-blue-500 ml-2 animate-spin" />
                    <span className="text-sm text-blue-500">جاري المزامنة...</span>
                  </>
                )}
                {isOnline && !isSyncing && (
                  <span className="text-sm text-green-500">متزامن مع جميع المستخدمين</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-primary-500 to-pink-500 hover:from-primary-600 hover:to-pink-600 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-70 disabled:transform-none disabled:shadow-none"
              disabled={isSubmitting}
            >
              <div className="flex items-center justify-center">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Star className="w-5 h-5 ml-2" />
                    حفظ التعديلات
                  </>
                )}
              </div>
            </button>
            <button
              type="button"
              onClick={onFinishEditing}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={isSubmitting}
            >
              <div className="flex items-center justify-center">
                <X className="w-5 h-5 ml-2" />
                إلغاء
              </div>
            </button>
          </div>
        </form>
      </div>
      
      {/* نافذة التحقق من كلمة المرور */}
      {showPasswordConfirm && (
        <PasswordConfirm
          onConfirm={executeOrderUpdate}
          onCancel={() => setShowPasswordConfirm(false)}
          actionType="edit"
        />
      )}
    </div>
  );
}