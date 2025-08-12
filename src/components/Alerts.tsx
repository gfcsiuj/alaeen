import React, { useState, useMemo } from 'react';
import { Order } from '../types';
import { AlertTriangle, Info, X } from 'lucide-react';

const Modal = ({ isOpen, onClose, children }: { isOpen: boolean, onClose: () => void, children: React.ReactNode }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
          <X size={24} />
        </button>
        {children}
      </div>
    </div>
  );
};

interface Alert {
  order: Order;
  message: string;
  type: 'order' | 'worker';
}

export function Alerts({ orders }: { orders: Order[] }) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const alerts = useMemo((): Alert[] => {
    const allAlerts: Alert[] = [];

    orders.forEach(order => {
      // Alert for 'other' service type with partial or no payment
      if (order.serviceType === 'other' && (order.priceStatus === 'partial' || order.priceStatus === 'none')) {
        const remainingAmount = order.price - (order.amountPaid || 0);
        allAlerts.push({
          order,
          message: `طلب خدمة "أخرى" للعميل ${order.customerName} لم يتم دفعه بالكامل. المبلغ المتبقي: ${remainingAmount.toLocaleString('ar-IQ')} د.ع`,
          type: 'order',
        });
      }

      // Alerts for 'promotion' service type with workers having partial or no payment
      if (order.serviceType === 'promotion' && order.workers) {
        order.workers.forEach(worker => {
          if (worker.paymentStatus === 'partial' || worker.paymentStatus === 'none') {
            const remainingAmount = worker.share - (worker.amountPaid || 0);
            if (remainingAmount > 0) {
              allAlerts.push({
                order,
                message: `العامل ${worker.name} في طلب الترويج للعميل ${order.customerName} لم يتم دفع مستحقاته بالكامل. المبلغ المتبقي: ${remainingAmount.toLocaleString('ar-IQ')} د.ع`,
                type: 'worker',
              });
            }
          }
        });
      }
    });

    return allAlerts;
  }, [orders]);

  if (alerts.length === 0) {
    return null;
  }

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-8 animate-slide-up">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
        <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center ml-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
        </div>
        التنبيهات الهامة
      </h2>
      <div className="space-y-4">
        {alerts.map((alert, index) => (
          <div key={index} className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-200 p-4 rounded-r-lg flex items-center justify-between">
            <p>{alert.message}</p>
            <button
              onClick={() => handleViewDetails(alert.order)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center text-sm font-bold transition-colors"
            >
              <Info className="w-4 h-4 ml-1" />
              عرض التفاصيل
            </button>
          </div>
        ))}
      </div>

      <Modal isOpen={!!selectedOrder} onClose={handleCloseModal}>
        {selectedOrder && (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">تفاصيل الطلب</h3>
            <div className="space-y-2 text-gray-700 dark:text-gray-300">
              <p><strong>العميل:</strong> {selectedOrder.customerName}</p>
              <p><strong>تفاصيل الطلب:</strong> {selectedOrder.orderDetails}</p>
              <p><strong>نوع الخدمة:</strong> {selectedOrder.serviceType}</p>
              <p><strong>السعر:</strong> {selectedOrder.price.toLocaleString('ar-IQ')} د.ع</p>
              <p><strong>التاريخ:</strong> {new Date(selectedOrder.date).toLocaleDateString('ar-IQ')}</p>
              {/* Add more details as needed */}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
