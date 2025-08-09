import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, DollarSign, Users, Filter, ArrowDownUp, Search, Trash2, AlertCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { deletePayment, Payment } from '../firebase/paymentService';

// Reusable Modal Component
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl animate-fade-in" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

export function PaymentHistory() {
  const { userRole, payments: appPayments, refreshPayments } = useApp();
  const [localPayments, setLocalPayments] = useState<Payment[]>(appPayments);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'worker' | 'partner'>('all');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<'all' | 'full' | 'partial' | 'none'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Modals state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [statusModal, setStatusModal] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  useEffect(() => {
    setLocalPayments(appPayments);
    setLoading(false);
  }, [appPayments]);
  
  const handleDeletePayment = async (paymentId: string) => {
    if (!paymentId) return;
    if (userRole === 'viewer') {
      setStatusModal({ isOpen: true, title: 'غير مصرح', message: 'ليس لديك صلاحية لحذف المدفوعات.', type: 'error' });
      setConfirmDeleteId(null);
      return;
    }

    setDeleting(paymentId);
    
    // Optimistic UI update
    const originalPayments = [...localPayments];
    setLocalPayments(prevPayments => prevPayments.filter(p => p.id !== paymentId));
    setConfirmDeleteId(null);

    try {
      await deletePayment(paymentId);
      // Data is now deleted from Firebase. Refresh context state in the background.
      await refreshPayments();
      setStatusModal({ isOpen: true, title: 'تم الحذف بنجاح', message: 'تم حذف المدفوعة بنجاح.', type: 'success' });
    } catch (err) {
      console.error('خطأ في حذف المدفوعة:', err);
      // Rollback UI on error
      setLocalPayments(originalPayments);
      setStatusModal({ isOpen: true, title: 'خطأ في الحذف', message: 'حدث خطأ أثناء حذف المدفوعة. يرجى المحاولة مرة أخرى.', type: 'error' });
    } finally {
      setDeleting(null);
    }
  };
  
  const filteredAndSortedPayments = useMemo(() => {
    return localPayments
      .filter(payment => {
        const searchLower = searchTerm.toLowerCase();
        const typeMatch = typeFilter === 'all' || payment.type === typeFilter;
        const paymentTypeMatch = paymentTypeFilter === 'all' || payment.paymentType === paymentTypeFilter;
        const searchMatch = !searchLower || payment.recipientName.toLowerCase().includes(searchLower);
        return typeMatch && paymentTypeMatch && searchMatch;
      })
      .sort((a, b) => {
        const valA = sortBy === 'date' ? new Date(a.date).getTime() : a.amount;
        const valB = sortBy === 'date' ? new Date(b.date).getTime() : b.amount;
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      });
  }, [localPayments, searchTerm, typeFilter, paymentTypeFilter, sortBy, sortDirection]);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const getPaymentTypeLabel = (type: 'full' | 'partial' | 'none') => ({ full: 'دفع كامل', partial: 'دفع جزئي', none: 'لم يتم الدفع' }[type] || '');
  const getPaymentTypeColor = (type: 'full' | 'partial' | 'none') => ({ full: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', partial: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', none: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' }[type] || '');
  
  return (
    <div className="p-4 pb-20 animate-fade-in">
      <Modal isOpen={confirmDeleteId !== null} onClose={() => setConfirmDeleteId(null)}>
        <div className="flex items-center text-red-500 mb-4">
          <AlertCircle className="h-8 w-8 mr-3" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">تأكيد الحذف</h3>
        </div>
        <p className="text-gray-700 dark:text-gray-300 mb-6">هل أنت متأكد من رغبتك في حذف هذه المدفوعة؟ لا يمكن التراجع عن هذا الإجراء.</p>
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            onClick={() => setConfirmDeleteId(null)}
            disabled={deleting !== null}
          >
            إلغاء
          </button>
          <button
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
            onClick={() => handleDeletePayment(confirmDeleteId!)}
            disabled={deleting !== null}
          >
            {deleting === confirmDeleteId ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                جاري الحذف...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                تأكيد الحذف
              </>
            )}
          </button>
        </div>
      </Modal>

      <Modal isOpen={statusModal.isOpen} onClose={() => setStatusModal({ ...statusModal, isOpen: false })}>
        <div className="text-center">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-white mb-4 ${statusModal.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
            {statusModal.type === 'success' ? <Trash2 className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{statusModal.title}</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{statusModal.message}</p>
          <button onClick={() => setStatusModal({ ...statusModal, isOpen: false })} className={`px-6 py-2 text-white rounded-lg transition-colors duration-200 font-bold ${statusModal.type === 'success' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}>حسناً</button>
        </div>
      </Modal>
      
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 animate-bounce-in">
            <img
              src="./images/logo.jpg"
              alt="العين"
              className="w-full h-full rounded-full object-cover logo-frame"
            />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-pink-600 bg-clip-text text-transparent mb-2">سجل المدفوعات</h1>
          <p className="text-gray-600 dark:text-gray-400">سجل مدفوعات العمال والشركاء</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-8 animate-slide-up">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-4">
            <div className="relative w-full md:w-1/3">
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full p-3 pr-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                placeholder="بحث باسم المستلم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <div className="flex items-center">
                <Filter className="w-5 h-5 text-primary-500 ml-2" />
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">فلترة:</span>
              </div>
              
              <select
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as 'all' | 'worker' | 'partner')}
              >
                <option value="all">جميع الأنواع</option>
                <option value="worker">العمال</option>
                <option value="partner">الشركاء</option>
              </select>
              
              <select
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                value={paymentTypeFilter}
                onChange={(e) => setPaymentTypeFilter(e.target.value as 'all' | 'full' | 'partial' | 'none')}
              >
                <option value="all">جميع حالات الدفع</option>
                <option value="full">دفع كامل</option>
                <option value="partial">دفع جزئي</option>
                <option value="none">لم يتم الدفع</option>
              </select>
              
              <button
                className="flex items-center gap-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                onClick={() => {
                  setSortBy(sortBy === 'date' ? 'amount' : 'date');
                }}
              >
                <span className="text-sm font-bold">
                  {sortBy === 'date' ? 'ترتيب: التاريخ' : 'ترتيب: المبلغ'}
                </span>
              </button>
              
              <button
                className="flex items-center gap-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
              >
                <ArrowDownUp className="w-4 h-4" />
                <span className="text-sm font-bold">
                  {sortDirection === 'desc' ? 'تنازلي' : 'تصاعدي'}
                </span>
              </button>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : filteredAndSortedPayments.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-8 text-center">
            <div className="w-20 h-20 mx-auto bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 mb-4">
              <DollarSign className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لا توجد مدفوعات</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || typeFilter !== 'all' || paymentTypeFilter !== 'all'
                ? 'لا توجد مدفوعات تطابق معايير البحث'
                : 'لم يتم تسجيل أي مدفوعات بعد'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredAndSortedPayments.map((payment) => (
              <div
                key={payment.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow relative"
              >
                {userRole !== 'viewer' && (
                  <button
                    className="absolute top-4 left-4 p-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => setConfirmDeleteId(payment.id || '')}
                    disabled={deleting === payment.id}
                    title="حذف المدفوعة"
                  >
                    {deleting === payment.id ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div>
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                )}
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${payment.type === 'worker' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'}`}>
                      {payment.type === 'worker' ? (
                        <Users className="w-6 h-6" />
                      ) : (
                        <Users className="w-6 h-6" />
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {payment.recipientName}
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${payment.type === 'worker' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'}`}>
                          {payment.type === 'worker' ? 'عامل' : 'شريك'}
                        </span>
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${getPaymentTypeColor(payment.paymentType)}`}>
                          {getPaymentTypeLabel(payment.paymentType)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {payment.amount.toLocaleString('ar-IQ')} د.ع
                    </div>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                      <Calendar className="w-4 h-4 ml-1" />
                      {formatDate(payment.date)}
                    </div>
                    {payment.creator && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        تم التسجيل بواسطة: {payment.creator}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}