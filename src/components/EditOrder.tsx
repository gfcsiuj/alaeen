import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Star, Plus, X, AlertCircle, Megaphone, Palette, Camera, Printer, DollarSign, Users, Wifi, WifiOff, Loader2, Calculator } from 'lucide-react';
import { Order } from '../types';
import { PasswordConfirm } from './PasswordConfirm';

interface EditOrderProps {
  order: Order;
  onClose: () => void;
}

export default function EditOrder({ order, onClose }: EditOrderProps) {
  const { updateOrder, isOnline, isSyncing } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  
  // Add a close button handler with confirmation
  const handleClose = () => {
    if (confirm('هل أنت متأكد من إغلاق نافذة التعديل؟ سيتم فقدان جميع التغييرات غير المحفوظة.')) {
      onClose();
    }
  };
  
  // Function to show help information
  const showHelp = () => {
    alert(
      'تعليمات استخدام نافذة التعديل:\n\n' +
      '1. قم بتعديل البيانات المطلوبة (اسم العميل، تفاصيل الطلب، السعر، إلخ)\n' +
      '2. تأكد من اختيار نوع الخدمة الصحيح (ترويج، تصميم، تصوير، طباعة)\n' +
      '3. يمكنك تعديل حالة الطلب وأولويته من القوائم المنسدلة\n' +
      '4. أضف أو عدل العاملين وحصصهم إذا لزم الأمر\n' +
      '5. انقر على زر "حفظ التعديلات" في أسفل النافذة\n\n' +
      'حل المشكلات:\n' +
      '- إذا لم يتم حفظ التعديلات، تأكد من فتح وحدة تحكم المتصفح (F12) لمعرفة الأخطاء\n' +
      '- قم بإعادة تحميل الصفحة وحاول مرة أخرى\n' +
      '- تأكد من أن جميع الحقول الإلزامية معبأة بشكل صحيح\n\n' +
      'ملاحظة: يتم حساب المبالغ النهائية تلقائياً عند تغيير السعر أو الخصم أو الضريبة.'
    );
  };
  
  // Function to show debug information in console
  const showDebugInfo = () => {
    console.group('معلومات تصحيح الأخطاء');
    console.log('معلومات الطلب الأصلي:', order);
    console.log('بيانات النموذج الحالية:', formData);
    console.log('المجاميع المحسوبة:', totals);
    console.log('نوع الخدمة:', formData.serviceType);
    console.log('معلومات التواريخ:');
    console.log('- التاريخ:', formData.date, typeof formData.date);
    console.log('- تاريخ الإنشاء:', formData.createdAt, typeof formData.createdAt);
    console.groupEnd();

  alert('تم عرض معلومات التصحيح في وحدة تحكم المتصفح (F12)');
  };
  
  // دالة لإعادة تعيين النموذج إلى القيم الأصلية للطلب
  const resetForm = () => {
    setFormData({
      id: order.id,
      customerName: order.customerName,
      orderDetails: order.orderDetails,
      price: order.price.toString(),
      quantity: order.quantity.toString(),
      workers: [...order.workers],
      discount: order.discount ? order.discount.toString() : '',
      discountType: order.discountType || 'fixed',
      tax: order.tax ? order.tax.toString() : '',
      notes: order.notes || '',
      priority: order.priority || 'medium',
      status: order.status || 'pending',
      serviceType: order.serviceType || 'other',
      date: order.date,
      createdAt: order.createdAt,
      // خدمة الترويج
      promotionAmountUSD: order.promotionAmountUSD ? order.promotionAmountUSD.toString() : '',
      promotionAmount: order.promotionAmount ? order.promotionAmount.toString() : '',
      promotionCurrency: order.promotionCurrency || 'usd',
      promotionProfit: order.promotionProfit ? order.promotionProfit.toString() : '',
      promotionCommission: order.promotionCommission ? order.promotionCommission.toString() : '',
      promotionAmountReceived: order.promotionAmountReceived || 'none',
      promotionAmountReceivedPercentage: order.promotionAmountReceivedPercentage ? order.promotionAmountReceivedPercentage.toString() : '',
      // خدمة التصميم
      designTypes: order.designTypes || [],
      // خدمة التصوير
      photographyDetails: order.photographyDetails || '',
      photographyAmount: order.photographyAmount ? order.photographyAmount.toString() : '',
      photographerName: order.photographerName || '',
      photographerAmount: order.photographerAmount ? order.photographerAmount.toString() : '',
      // خدمة الطباعة
      printingDetails: order.printingDetails || '',
      printingAmount: order.printingAmount ? order.printingAmount.toString() : '',
      printingEmployeeName: order.printingEmployeeName || '',
      printingEmployeeAmount: order.printingEmployeeAmount ? order.printingEmployeeAmount.toString() : '',
    });
  };

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
      const amountReceived = parseFloat(formData.amountReceived) || 0;
      const promotionAmount = parseFloat(formData.promotionAmount) || 0;
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
    const promotionCommission = parseFloat(formData.promotionCommission) || 0;

    let discountAmount = 0;
    if (formData.discountType === 'percentage') {
      discountAmount = (price * discount) / 100;
    } else {
      discountAmount = discount;
    }

    const afterDiscount = price - discountAmount;
    const taxAmount = (afterDiscount * tax) / 100;
    let finalAmount = afterDiscount + taxAmount;
    
    // إذا كان نوع الخدمة هو الترويج، نستخدم العمولة كمبلغ نهائي
    // لأن العمولة تحسب كربح بالدينار العراقي في الأرباح الصافية
    if (formData.serviceType === 'promotion') {
      // في حالة الترويج، المبلغ النهائي هو العمولة فقط
      finalAmount = promotionCommission;
    }
    
    const totalWorkerShares = formData.workers.reduce((sum, worker) => sum + (worker.share || 0), 0);
    
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
      };

      await updateOrder(updatedOrderData);
      
      alert('تم تحديث الطلب بنجاح وتمت مزامنته مع جميع المستخدمين');
      
      onClose(); // Close the modal on success
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
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative animate-slide-up">
        <div className="absolute top-4 left-4 flex gap-2 z-10">
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white dark:bg-gray-700 rounded-full p-2 shadow-md hover:shadow-lg transition-all duration-200"
            aria-label="إغلاق"
            title="إغلاق"
          >
            <X className="w-6 h-6" />
          </button>
          <button
            onClick={() => window.location.reload()}
            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 bg-white dark:bg-gray-700 rounded-full p-2 shadow-md hover:shadow-lg transition-all duration-200"
            aria-label="إعادة تحميل"
            title="إعادة تحميل الصفحة"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
              <path d="M8 16H3v5"/>
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  تعديل الطلب
                </h2>
                <button
                  type="button"
                  onClick={showHelp}
                  className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                  title="تعليمات التعديل"
                >
                  ?
                </button>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={showDebugInfo}
                className="flex-shrink-0 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg px-3 py-1 text-xs font-medium transition-colors"
                title="عرض معلومات التصحيح في وحدة تحكم المتصفح"
              >
                عرض التشخيص
              </button>
            </div>
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
                  {formData.serviceType === 'promotion' && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      (العمولة تحسب كربح بالدينار العراقي في الأرباح الصافية)
                    </p>
                  )}
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

            {/* حالة الاتصال والمزامنة */}
            <div className="flex items-center justify-center gap-4 mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                {isOnline ? (
                  <Wifi className="w-5 h-5 text-green-500 ml-2" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-500 ml-2" />
                )}
                <span className={`text-sm font-medium ${isOnline ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {isOnline ? 'متصل بالإنترنت' : 'غير متصل بالإنترنت'}
                </span>
              </div>
              
              {isSyncing && (
                <div className="flex items-center">
                  <Loader2 className="w-5 h-5 text-blue-500 ml-2 animate-spin" />
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">جاري المزامنة...</span>
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-8">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className={`w-1/3 ${isSubmitting ? 'bg-gray-300 dark:bg-gray-800 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'} text-gray-800 dark:text-gray-200 py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300`}
              >
                <div className="flex items-center justify-center">
                  <X className="w-5 h-5 ml-2" />
                  إلغاء
                </div>
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-2/3 ${isSubmitting ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-primary-500 to-pink-500 hover:from-primary-600 hover:to-pink-600'} text-white py-4 px-6 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}
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
            </div>
          </form>
        </div>
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