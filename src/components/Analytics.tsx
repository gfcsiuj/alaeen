import React, { useState, useMemo } from 'react';
import { TrendingUp, Users, DollarSign, Calendar, Filter, PieChart, BarChart3, Target } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export function Analytics() {
  const { orders } = useApp();
  const [timeFilter, setTimeFilter] = useState('all');
  const [customDays, setCustomDays] = useState('7');

  const analyticsData = useMemo(() => {
    let filteredOrders = orders;
    const now = new Date();

    if (timeFilter === 'today') {
      const today = now.toDateString();
      filteredOrders = orders.filter(order => new Date(order.date).toDateString() === today);
    } else if (timeFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredOrders = orders.filter(order => new Date(order.date) >= weekAgo);
    } else if (timeFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredOrders = orders.filter(order => new Date(order.date) >= monthAgo);
    } else if (timeFilter === 'custom') {
      const daysAgo = new Date(now.getTime() - parseInt(customDays) * 24 * 60 * 60 * 1000);
      filteredOrders = orders.filter(order => new Date(order.date) >= daysAgo);
    }

    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.price, 0);
    
    // حساب إجمالي أرباح العمولة من خدمة الترويج
    const totalPromotionProfit = filteredOrders.reduce((sum, order) => {
      // إذا كان نوع الخدمة هو الترويج وهناك عمولة، نضيفها إلى الأرباح
      if (order.serviceType === 'promotion' && order.promotionCommission) {
        return sum + (parseFloat(order.promotionCommission.toString()) || 0);
      }
      return sum;
    }, 0);
    const totalDiscounts = filteredOrders.reduce((sum, order) => {
      const discount = order.discount || 0;
      return sum + (order.discountType === 'percentage' ? (order.price * discount) / 100 : discount);
    }, 0);
    const totalTax = filteredOrders.reduce((sum, order) => {
      const afterDiscount = order.price - (order.discount || 0);
      return sum + ((afterDiscount * (order.tax || 0)) / 100);
    }, 0);
    
    // Worker shares calculation
    const workerShares: Record<string, number> = {};
    const totalWorkerShares = filteredOrders.reduce((sum, order) => {
      const orderTotal = order.workers.reduce((workerSum, worker) => workerSum + worker.share, 0);
      order.workers.forEach(worker => {
        if (worker.name.trim()) {
          workerShares[worker.name] = (workerShares[worker.name] || 0) + worker.share;
        }
      });
      return sum + orderTotal;
    }, 0);

    // إضافة أرباح العمولة إلى الأرباح الصافية
    const netProfit = totalRevenue - totalDiscounts + totalTax - totalWorkerShares + totalPromotionProfit;
    const totalOrders = filteredOrders.length;

    return {
      totalRevenue,
      totalDiscounts,
      totalTax,
      totalWorkerShares,
      totalPromotionProfit,
      netProfit,
      totalOrders,
      workerShares,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
    };
  }, [orders, timeFilter, customDays]);

  const getFilterLabel = () => {
    switch (timeFilter) {
      case 'today': return 'اليوم';
      case 'week': return 'الأسبوع الماضي';
      case 'month': return 'الشهر الماضي';
      case 'custom': return `آخر ${customDays} أيام`;
      default: return 'جميع الفترات';
    }
  };

  return (
    <div className="p-4 pb-20 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 animate-bounce-in">
            <img 
              src="https://scontent.fosm4-2.fna.fbcdn.net/v/t39.30808-6/494646003_122103077492854376_4740803221172287157_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=8gnYz32ttRoQ7kNvwHVFH6B&_nc_oc=Adlg9De_-JOZZATh6rHCiNM4TwI6Qe55Da8iTvwoUW7AfUO98piKDr3i-3yy39pfSQA&_nc_pt=1&_nc_zt=23&_nc_ht=scontent.fosm4-2.fna&_nc_gid=m02mrNFC3RUiJRkPKNka1A&oh=00_AfWT_QZAIBnHVdxqpRk_ZI0KGj4cNRb9LjGtpmCkFag2PQ&oe=6897D9BA"
              alt="العين"
              className="w-full h-full rounded-full object-cover logo-frame"
            />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-pink-600 bg-clip-text text-transparent mb-2">التحليلات والإحصائيات</h1>
          <p className="text-gray-600 dark:text-gray-400">تحليل شامل للأرباح والأداء المالي</p>
        </div>
        
        {/* Time Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-8 animate-slide-up">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center">
              <Filter className="w-5 h-5 text-primary-500 ml-2" />
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">فترة التحليل:</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'الكل' },
                { value: 'today', label: 'اليوم' },
                { value: 'week', label: 'أسبوع' },
                { value: 'month', label: 'شهر' },
                { value: 'custom', label: 'مخصص' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setTimeFilter(option.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 transform hover:scale-105 ${
                    timeFilter === option.value
                      ? 'bg-primary-500 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            
            {timeFilter === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  min="1"
                  className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center transition-all duration-300"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">أيام</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-gradient-to-br from-primary-500 to-pink-500 rounded-2xl p-6 text-white shadow-xl animate-slide-up transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-100 text-sm font-bold">إجمالي الإيرادات</p>
                <div className="text-3xl font-bold mt-2">
                  {analyticsData.totalRevenue.toLocaleString('ar-IQ')}
                </div>
                <p className="text-xs text-primary-100 mt-1">دينار عراقي</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <DollarSign className="w-7 h-7" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-6 text-white shadow-xl animate-slide-up transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-bold">الربح الصافي</p>
                <div className="text-3xl font-bold mt-2">
                  {analyticsData.netProfit.toLocaleString('ar-IQ')}
                </div>
                <p className="text-xs text-green-100 mt-1">
                  هامش ربح: {analyticsData.profitMargin.toFixed(1)}%
                </p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <Target className="w-7 h-7" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white shadow-xl animate-slide-up transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-bold">عدد الطلبات</p>
                <div className="text-3xl font-bold mt-2">{analyticsData.totalOrders}</div>
                <p className="text-xs text-blue-100 mt-1">{getFilterLabel()}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <BarChart3 className="w-7 h-7" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl p-6 text-white shadow-xl animate-slide-up transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-bold">أرباح العمولة</p>
                <div className="text-3xl font-bold mt-2">
                  {analyticsData.totalPromotionProfit.toLocaleString('ar-IQ')}
                </div>
                <p className="text-xs text-purple-100 mt-1">دينار عراقي</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <DollarSign className="w-7 h-7" />
              </div>
            </div>
          </div>

        </div>

        {/* Financial Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 animate-slide-up">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center ml-3">
                <PieChart className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              تفصيل الإيرادات
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <span className="font-bold text-green-800 dark:text-green-200">إجمالي الإيرادات</span>
                <span className="font-bold text-green-600 dark:text-green-400 text-lg">
                  +{analyticsData.totalRevenue.toLocaleString('ar-IQ')} د.ع
                </span>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <span className="font-bold text-red-800 dark:text-red-200">إجمالي الخصومات</span>
                <span className="font-bold text-red-600 dark:text-red-400 text-lg">
                  -{analyticsData.totalDiscounts.toLocaleString('ar-IQ')} د.ع
                </span>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <span className="font-bold text-blue-800 dark:text-blue-200">إجمالي الضرائب</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">
                  +{analyticsData.totalTax.toLocaleString('ar-IQ')} د.ع
                </span>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                <span className="font-bold text-orange-800 dark:text-orange-200">إجمالي مبلغ العمال</span>
                <span className="font-bold text-orange-600 dark:text-orange-400 text-lg">
                  -{analyticsData.totalWorkerShares.toLocaleString('ar-IQ')} د.ع
                </span>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                <span className="font-bold text-purple-800 dark:text-purple-200">أرباح العمولة (الترويج)</span>
                <span className="font-bold text-purple-600 dark:text-purple-400 text-lg">
                  +{analyticsData.totalPromotionProfit.toLocaleString('ar-IQ')} د.ع
                </span>
              </div>
              
              <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-primary-50 to-pink-50 dark:from-primary-900/20 dark:to-pink-900/20 rounded-xl border-2 border-primary-200 dark:border-primary-800">
                  <span className="font-bold text-primary-800 dark:text-primary-200 text-lg">الربح الصافي</span>
                  <span className="font-bold text-primary-600 dark:text-primary-400 text-2xl">
                    {analyticsData.netProfit.toLocaleString('ar-IQ')} د.ع
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Worker Performance */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 animate-slide-up">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center ml-3">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              العمال
            </h3>
            
            {Object.keys(analyticsData.workerShares).length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">لا توجد بيانات عمال للفترة المحددة</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(analyticsData.workerShares)
                  .sort(([,a], [,b]) => b - a)
                  .map(([worker, share], index) => {
                    const percentage = analyticsData.totalWorkerShares > 0 ? (share / analyticsData.totalWorkerShares) * 100 : 0;
                    const colors = [
                      'from-blue-500 to-cyan-500',
                      'from-green-500 to-emerald-500',
                      'from-purple-500 to-indigo-500',
                      'from-pink-500 to-rose-500',
                      'from-yellow-500 to-orange-500'
                    ];
                    const colorClass = colors[index % colors.length];
                    
                    return (
                      <div key={worker} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 transform hover:scale-105 transition-all duration-300">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <div className={`w-10 h-10 bg-gradient-to-r ${colorClass} rounded-full flex items-center justify-center ml-3 text-white font-bold`}>
                              {worker.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 dark:text-white">{worker}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {percentage.toFixed(1)}% من إجمالي المبلغ
                              </p>
                            </div>
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-lg text-gray-900 dark:text-white">
                              {share.toLocaleString('ar-IQ')} د.ع
                            </p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className={`bg-gradient-to-r ${colorClass} h-2 rounded-full transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="mt-2 flex justify-end">
                          <button 
                            className="px-3 py-1 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200 text-sm"
                            onClick={() => window.alert('سيتم تنفيذ هذه الميزة قريباً')}
                          >
                            تفاصيل العمل
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
          
          {/* Worker Rights */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 animate-slide-up mt-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center ml-3">
                <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              حقوق العمال
            </h3>
            
            {Object.keys(analyticsData.workerShares).length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">لا توجد بيانات عمال للفترة المحددة</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(analyticsData.workerShares)
                  .sort(([,a], [,b]) => b - a)
                  .map(([worker, share], index) => {
                    const colors = [
                      'from-purple-500 to-indigo-500',
                      'from-green-500 to-emerald-500',
                      'from-blue-500 to-cyan-500',
                      'from-pink-500 to-rose-500',
                      'from-yellow-500 to-orange-500'
                    ];
                    const colorClass = colors[index % colors.length];
                    
                    return (
                      <div key={worker} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 transform hover:scale-105 transition-all duration-300">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <div className={`w-10 h-10 bg-gradient-to-r ${colorClass} rounded-full flex items-center justify-center ml-3 text-white font-bold`}>
                              {worker.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 dark:text-white">{worker}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                المبلغ المستحق: {share.toLocaleString('ar-IQ')} د.ع
                              </p>
                            </div>
                          </div>
                          <div>
                            <button 
                              className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 text-sm"
                              onClick={() => {
                                const paymentStatus = window.prompt('حالة الدفع:\n1. تم الدفع كاملاً\n2. تم دفع 50%\n3. لم يتم الدفع بعد', '1');
                                if (paymentStatus === '1') {
                                  window.alert(`تم تسجيل دفع كامل المبلغ (${share.toLocaleString('ar-IQ')} د.ع) للعامل ${worker}`);
                                } else if (paymentStatus === '2') {
                                  window.alert(`تم تسجيل دفع 50% من المبلغ (${(share/2).toLocaleString('ar-IQ')} د.ع) للعامل ${worker}`);
                                } else if (paymentStatus === '3') {
                                  window.alert(`تم تسجيل عدم الدفع للعامل ${worker}`);
                                }
                              }}
                            >
                              تسجيل الدفع
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Additional Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 animate-slide-up">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center ml-3">
              <Calendar className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            إحصائيات إضافية
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                {Object.keys(analyticsData.workerShares).length}
              </div>
              <p className="text-sm font-bold text-indigo-800 dark:text-indigo-200">عدد العمال النشطين</p>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                {analyticsData.totalOrders > 0 ? (analyticsData.totalWorkerShares / analyticsData.totalOrders).toLocaleString('ar-IQ') : '0'}
              </div>
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">متوسط التكلفة لكل طلب</p>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-xl border border-rose-200 dark:border-rose-800">
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mb-2">
                {analyticsData.totalRevenue > 0 ? ((analyticsData.totalDiscounts / analyticsData.totalRevenue) * 100).toFixed(1) : '0'}%
              </div>
              <p className="text-sm font-bold text-rose-800 dark:text-rose-200">نسبة الخصومات</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}