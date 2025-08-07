import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Search, Filter, Calendar, User, Package, DollarSign, Users, Edit3, Trash2, Eye } from 'lucide-react';
import EditOrder from './EditOrder';
import { Order } from '../types';

export default function OrderList() {
  const { orders, deleteOrder } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  
  // Function to reload the page
  const handleReload = () => {
    console.log('Reloading page...');
    window.location.reload();
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.orderDetails.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'في الانتظار';
      case 'in-progress': return 'قيد التنفيذ';
      case 'completed': return 'مكتمل';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'عالية';
      case 'medium': return 'متوسطة';
      case 'low': return 'منخفضة';
      default: return priority;
    }
  };

  const calculateFinalPrice = (order: Order) => {
    let finalPrice = order.price * order.quantity;
    
    if (order.discount) {
      if (order.discountType === 'percentage') {
        finalPrice -= (finalPrice * order.discount) / 100;
      } else {
        finalPrice -= order.discount;
      }
    }
    
    if (order.tax) {
      finalPrice += (finalPrice * order.tax) / 100;
    }
    
    return finalPrice;
  };

  const calculateWorkersTotal = (workers: { name: string; share: number }[]) => {
    return workers.reduce((total, worker) => total + worker.share, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-primary bg-white dark:bg-gray-800 flex items-center justify-center shadow-lg">
            <img 
              src="/logo.png"
              alt="العين" 
              className="w-8 h-8 rounded-full object-cover"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">الطلبات السابقة</h1>
        </div>
        <button 
          onClick={handleReload}
          className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
          title="إعادة تحميل الصفحة لحل مشاكل التعديل"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
          <span className="text-sm">تحديث</span>
        </button>
      </div>

      {/* Alert Message */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="mr-3">
            <p className="text-sm text-yellow-700">
              <strong>ملاحظة:</strong> إذا واجهت مشكلة في تعديل الطلبات، يرجى اتباع الخطوات التالية:
            </p>
            <ol className="mt-1 text-sm text-yellow-700 list-decimal list-inside">
              <li>انقر على زر "تحديث" في الأعلى لإعادة تحميل الصفحة</li>
              <li>افتح وحدة تحكم المتصفح (F12) لمراقبة الأخطاء</li>
              <li>حاول تعديل الطلب مرة أخرى</li>
            </ol>
          </div>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="البحث في الطلبات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                تصفية حسب الحالة
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">جميع الحالات</option>
                <option value="pending">في الانتظار</option>
                <option value="in-progress">قيد التنفيذ</option>
                <option value="completed">مكتمل</option>
                <option value="cancelled">ملغي</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                تصفية حسب الأولوية
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">جميع الأولويات</option>
                <option value="high">عالية</option>
                <option value="medium">متوسطة</option>
                <option value="low">منخفضة</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center border border-gray-200 dark:border-gray-700">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
              لا توجد طلبات
            </h3>
            <p className="text-gray-500 dark:text-gray-500">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
                ? 'لم يتم العثور على طلبات تطابق معايير البحث'
                : 'لم تقم بإضافة أي طلبات بعد'
              }
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="p-4">
                {/* Simplified Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getPriorityColor(order.priority)}`}></div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                      {order.customerName}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">عرض</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Edit button clicked, order:', order);
                      console.log('Order ID:', order.id);
                      console.log('Order data type check:', typeof order);
                      // Create a deep copy of the order to avoid reference issues
                      const orderCopy = JSON.parse(JSON.stringify(order));
                      console.log('Order copy created:', orderCopy);
                      setOrderToEdit(orderCopy);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span className="text-sm">تعديل</span>
                  </button>
                  <button
                    onClick={() => deleteOrder(order.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm">حذف</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  تفاصيل الطلب
                </h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    اسم العميل
                  </label>
                  <p className="text-gray-800 dark:text-white font-medium">
                    {selectedOrder.customerName}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    تفاصيل الطلب
                  </label>
                  <p className="text-gray-800 dark:text-white">
                    {selectedOrder.orderDetails}
                  </p>
                </div>

                {selectedOrder.serviceType && (
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      نوع الخدمة: <span className="font-bold">{selectedOrder.serviceType}</span>
                    </label>
                    
                    {selectedOrder.serviceType === 'promotion' && (
                      <div className="mt-2 space-y-2">
                        <div className="space-y-1">
                          {selectedOrder.promotionAmountUSD > 0 && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              مبلغ الترويج بالدولار: <span className="font-medium">{selectedOrder.promotionAmountUSD.toLocaleString()} $</span>
                            </p>
                          )}
                          {selectedOrder.promotionAmount > 0 && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              مبلغ الترويج بالدينار: <span className="font-medium">{selectedOrder.promotionAmount.toLocaleString()} د.ع</span>
                            </p>
                          )}
                          {selectedOrder.promotionCommission > 0 && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              العمولة: <span className="font-medium">{selectedOrder.promotionCommission.toLocaleString()} د.ع</span>
                            </p>
                          )}
                        </div>
                        
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            حالة وصول المبلغ: {' '}
                            <span className="font-medium">
                              {selectedOrder.promotionAmountReceived === 'full' && 'واصل بالكامل'}
                              {selectedOrder.promotionAmountReceived === 'partial' && `واصل جزئياً (${selectedOrder.promotionAmountReceivedPercentage}%)`}
                              {selectedOrder.promotionAmountReceived === 'none' && 'غير واصل'}
                              {!selectedOrder.promotionAmountReceived && 'غير محدد'}
                            </span>
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {selectedOrder.serviceType === 'design' && selectedOrder.designTypes && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          أنواع التصميم: <span className="font-medium">{Array.isArray(selectedOrder.designTypes) ? selectedOrder.designTypes.join(', ') : selectedOrder.designTypes}</span>
                        </p>
                      </div>
                    )}
                    
                    {selectedOrder.serviceType === 'photography' && (
                      <div className="mt-2 space-y-1">
                        {selectedOrder.photographyDetails && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            تفاصيل التصوير: <span className="font-medium">{selectedOrder.photographyDetails}</span>
                          </p>
                        )}
                        {selectedOrder.photographerAmount > 0 && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            مبلغ المصور: <span className="font-medium">{selectedOrder.photographerAmount.toLocaleString()} د.ع</span>
                          </p>
                        )}
                      </div>
                    )}
                    
                    {selectedOrder.serviceType === 'printing' && (
                      <div className="mt-2 space-y-1">
                        {selectedOrder.printingDetails && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            تفاصيل الطباعة: <span className="font-medium">{selectedOrder.printingDetails}</span>
                          </p>
                        )}
                        {selectedOrder.printingAmount > 0 && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            مبلغ الطباعة: <span className="font-medium">{selectedOrder.printingAmount.toLocaleString()} د.ع</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      السعر
                    </label>
                    <p className="text-gray-800 dark:text-white font-medium">
                      {selectedOrder.price.toLocaleString()} د.ع
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      العدد
                    </label>
                    <p className="text-gray-800 dark:text-white font-medium">
                      {selectedOrder.quantity}
                    </p>
                  </div>
                </div>

                {selectedOrder.discount && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      الخصم
                    </label>
                    <p className="text-red-600 font-medium">
                      {selectedOrder.discount}{selectedOrder.discountType === 'percentage' ? '%' : ' د.ع'}
                    </p>
                  </div>
                )}

                {selectedOrder.tax && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      الضريبة
                    </label>
                    <p className="text-blue-600 font-medium">
                      {selectedOrder.tax}%
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    المجموع النهائي
                  </label>
                  <p className="text-primary font-bold text-lg">
                    {calculateFinalPrice(selectedOrder).toLocaleString()} د.ع
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    صافي الربح
                  </label>
                  <p className="text-green-600 font-bold text-lg">
                    {(calculateFinalPrice(selectedOrder) - calculateWorkersTotal(selectedOrder.workers)).toLocaleString()} د.ع
                  </p>
                </div>

                {selectedOrder.workers.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      العاملون وحصصهم
                    </label>
                    <div className="space-y-2">
                      {selectedOrder.workers.map((worker, index) => (
                        <div key={index} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-800 dark:text-white">
                              {worker.name}
                            </span>
                            {worker.workType && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                نوع العمل: {worker.workType}
                              </span>
                            )}
                          </div>
                          <span className="text-primary font-bold">
                            {worker.share.toLocaleString()} د.ع
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                        <span className="font-medium text-red-800 dark:text-red-200">
                          إجمالي مبلغ العمال
                        </span>
                        <span className="text-red-600 font-bold">
                          {calculateWorkersTotal(selectedOrder.workers).toLocaleString()} د.ع
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedOrder.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ملاحظات
                    </label>
                    <p className="text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      {selectedOrder.notes}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    تاريخ الإنشاء
                  </label>
                  <p className="text-gray-800 dark:text-white">
                    {new Date(selectedOrder.createdAt).toLocaleString('ar-IQ')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {orderToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <EditOrder 
              order={orderToEdit} 
              onClose={() => {
                console.log('Closing edit modal');
                setOrderToEdit(null);
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}