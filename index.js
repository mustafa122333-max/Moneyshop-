import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';

// --- CONSTANTS ---
const WHATSAPP_NUMBER = "905346297086";
const BUSINESS_NAME = "moneyshop price";
const INITIAL_RATES = [
  { code: 'USD', name: 'دولار أمريكي', flagCode: 'us', buy: 3620.00, sell: 3640.00 },
  { code: 'TRY', name: 'ليرة تركية', flagCode: 'tr', buy: 83.00, sell: 85.00 },
  { code: 'SAR', name: 'ريال سعودي', flagCode: 'sa', buy: 965.00, sell: 975.00 },
  { code: 'AED', name: 'درهم إماراتي', flagCode: 'ae', buy: 985.00, sell: 995.00 },
  { code: 'EGP', name: 'جنيه مصري', flagCode: 'eg', buy: 75.00, sell: 77.00 },
  { code: 'QAR', name: 'ريال قطري', flagCode: 'qa', buy: 990.00, sell: 1000.00 },
  { code: 'EUR', name: 'يورو', flagCode: 'eu', buy: 3850.00, sell: 3900.00 },
  { code: 'LYD', name: 'دينار ليبي', flagCode: 'ly', buy: 700.00, sell: 710.00 },
];
const SDG_RATE = { code: 'SDG', name: 'جنيه سوداني', flagCode: 'sd', buy: 1, sell: 1 };
const mockOrders = [
  { id: 'MS-1024', customerName: 'أحمد علي', amount: 500, fromCurrency: 'USD', toCurrency: 'SDG', status: 'completed', date: '2024-07-20' },
  { id: 'MS-1025', customerName: 'فاطمة محمد', amount: 250, fromCurrency: 'SAR', toCurrency: 'SDG', status: 'completed', date: '2024-07-21' },
  { id: 'MS-1026', customerName: 'خالد حسن', amount: 1200, fromCurrency: 'AED', toCurrency: 'SDG', status: 'processing', date: new Date().toISOString().split('T')[0] },
  { id: 'MS-1027', customerName: 'سارة عبدالله', amount: 150, fromCurrency: 'TRY', toCurrency: 'SDG', status: 'pending', date: new Date().toISOString().split('T')[0] },
  { id: 'MS-1028', customerName: 'يوسف إبراهيم', amount: 800, fromCurrency: 'USD', toCurrency: 'SDG', status: 'pending', date: new Date().toISOString().split('T')[0] },
];

// --- HELPER COMPONENTS ---

const Ticker = ({ rates, prevRates }) => {
    const UpArrow = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4 inline-block ml-1", viewBox: "0 0 20 20", fill: "currentColor" }, React.createElement('path', { fillRule: "evenodd", d: "M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z", clipRule: "evenodd" }));
    const DownArrow = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4 inline-block ml-1", viewBox: "0 0 20 20", fill: "currentColor" }, React.createElement('path', { fillRule: "evenodd", d: "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z", clipRule: "evenodd" }));

    const tickerContent = rates.map(rate => {
        const prevRate = (prevRates || []).find(p => p.code === rate.code) || rate;
        const buyChange = rate.buy > prevRate.buy ? 'up' : (rate.buy < prevRate.buy ? 'down' : 'same');
        const buyColorClass = buyChange === 'up' ? 'text-green-400' : buyChange === 'down' ? 'text-red-400' : 'text-gray-400';

        const animationKey = `${rate.code}-${rate.buy}`;

        return React.createElement('div', { key: animationKey, className: "ticker-item text-sm" },
            React.createElement('span', { className: `font-bold text-gray-200 mr-2` }, `${rate.code}/SDG`),
            React.createElement('span', { className: `font-numbers flex items-center ${buyColorClass} ${buyChange !== 'same' ? 'animate-flash' : ''}` }, 
                rate.buy.toFixed(2),
                buyChange === 'up' ? React.createElement(UpArrow) : buyChange === 'down' ? React.createElement(DownArrow) : null
            )
        );
    });

    return React.createElement('div', { className: "ticker-wrap" }, React.createElement('div', { className: "ticker" }, tickerContent, tickerContent));
};

const OrderSummaryModal = ({ isOpen, onClose, order, convertedAmount, onConfirm }) => {
    const [isCopied, setIsCopied] = useState(false);
    if (!isOpen || !order) return null;

    const handleConfirm = () => {
        const message = `مرحباً ${BUSINESS_NAME}،
أرغب في تنفيذ طلب التحويل التالي:

*تفاصيل العملية:*
- المبلغ المُرسل: *${order.amount.toLocaleString()} ${order.fromCurrency}*
- المبلغ المُستلم (تقريباً): *${convertedAmount.toLocaleString()} ${order.toCurrency}*
- كود التتبع: *${order.id}*

يرجى تأكيد الطلب وتزويدي بالخطوات التالية. شكراً.`.trim();

        const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
        window.open(whatsappLink, '_blank', 'noopener,noreferrer');
        onConfirm(order);
        onClose();
    };
    
    const handleCopyCode = () => {
        if (!order?.id) return;
        navigator.clipboard.writeText(order.id).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    const CopyIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" }));
    const CheckIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5 text-emerald-600", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 3 }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 13l4 4L19 7" }));
    const WhatsAppIcon = () => React.createElement('svg', { className: "w-5 h-5", fill: "currentColor", viewBox: "0 0 24 24" }, React.createElement('path', { d: "M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.487 5.235 3.487 8.413 0 6.557-5.338 11.892-11.894 11.892-1.99 0-3.902-.539-5.587-1.528l-6.191 1.645v-.001zM7.59 17.556c.227.357.656.556 1.054.619.41.064.819.096 1.24.096 4.83 0 8.758-3.928 8.758-8.758 0-4.829-3.928-8.758-8.758-8.758-4.829 0-8.758 3.929-8.758 8.758.001 1.95.633 3.822 1.745 5.333l.25.374-1.143 4.156 4.25-1.119.355.233z" }));

    return React.createElement('div', { className: "fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 fade-in", onClick: onClose },
        React.createElement('div', { className: "bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl", onClick: e => e.stopPropagation() },
            React.createElement('h2', { className: "text-2xl font-[900] text-gray-800 dark:text-gray-100 text-center" }, "مراجعة تفاصيل الحوالة"),
            React.createElement('p', { className: "text-center text-gray-500 dark:text-gray-400 mt-1 mb-6" }, "يرجى التأكد من صحة البيانات قبل الإرسال."),
            React.createElement('div', { className: "space-y-3 text-sm p-4 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-gray-200 dark:border-slate-700" },
                React.createElement('div', { className: "flex justify-between items-center" }, React.createElement('span', { className: "text-gray-500 dark:text-gray-400" }, "أنت ترسل:"), React.createElement('span', { className: "font-bold font-numbers text-gray-800 dark:text-gray-100 text-base" }, `${order.amount.toLocaleString()} ${order.fromCurrency}`)),
                React.createElement('div', { className: "flex justify-between items-center" }, React.createElement('span', { className: "text-gray-500 dark:text-gray-400" }, "سيستلمون:"), React.createElement('span', { className: "font-bold font-numbers text-emerald-600 dark:text-emerald-500 text-base" }, `${convertedAmount.toLocaleString()} ${order.toCurrency}`)),
                React.createElement('div', { className: "border-t border-gray-200 dark:border-slate-700 my-3" }),
                React.createElement('div', { className: "flex justify-between items-center" }, React.createElement('span', { className: "text-gray-500 dark:text-gray-400" }, "رسوم التحويل:"), React.createElement('span', { className: "font-bold text-emerald-600" }, "0 (عرض خاص!)")),
                React.createElement('div', { className: "flex justify-between items-center" }, React.createElement('span', { className: "text-gray-500 dark:text-gray-400" }, "الوقت المتوقع للوصول:"), React.createElement('span', { className: "font-bold text-gray-800 dark:text-gray-100" }, "5 - 15 دقيقة")),
                 React.createElement('div', { className: "flex justify-between items-center" }, 
                    React.createElement('span', { className: "text-gray-500 dark:text-gray-400" }, "كود التتبع:"),
                    React.createElement('div', { className: "flex items-center gap-2 p-1 pr-3 bg-gray-200 dark:bg-slate-700 rounded-full" },
                        React.createElement('span', { className: "font-bold font-numbers text-gray-800 dark:text-gray-200" }, order.id),
                        React.createElement('button', { 
                            onClick: handleCopyCode,
                            title: "نسخ الكود",
                            className: "p-1 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
                        },
                            isCopied ? React.createElement(CheckIcon) : React.createElement(CopyIcon)
                        )
                    )
                )
            ),
            React.createElement('div', { className: "mt-6 grid grid-cols-2 gap-3" },
                React.createElement('button', { type: "button", onClick: onClose, className: `w-full px-4 py-3 bg-gray-200 text-gray-800 dark:bg-slate-700 dark:text-gray-200 font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600` }, 'إلغاء'),
                React.createElement('button', { onClick: handleConfirm, className: "w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600" }, React.createElement(WhatsAppIcon), 'تأكيد وإرسال')
            )
        )
    );
};

const CurrencyConverter = ({ rates, onAddOrder }) => {
    const allRates = useMemo(() => [SDG_RATE, ...rates], [rates]);
    const [amount, setAmount] = useState(100);
    const [fromCurrency, setFromCurrency] = useState('USD');
    const [toCurrency, setToCurrency] = useState('SDG');
    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
    const [finalOrder, setFinalOrder] = useState(null);
    const fromRate = allRates.find(r => r.code === fromCurrency) ?? SDG_RATE;
    const toRate = allRates.find(r => r.code === toCurrency) ?? SDG_RATE;
    const [countdown, setCountdown] = useState(300); // 5 minutes
    const [isPriceLocked, setIsPriceLocked] = useState(false);

    const convertedAmount = useMemo(() => {
        if (!amount || isNaN(amount)) return 0;
        let sdgValue = fromCurrency === 'SDG' ? parseFloat(amount) : parseFloat(amount) * fromRate.buy;
        let finalAmount = toCurrency === 'SDG' ? sdgValue : sdgValue / toRate.sell;
        return parseFloat(finalAmount.toFixed(2));
    }, [amount, fromCurrency, toCurrency, rates]);
    
    useEffect(() => {
        let timer;
        if (isPriceLocked) {
            timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setIsPriceLocked(false);
                        return 300;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isPriceLocked]);

    const handleAmountChange = (e) => {
        const value = e.target.value;
        setAmount(value === '' ? '' : Math.max(0, parseFloat(value)));
        setIsPriceLocked(true);
        setCountdown(300);
    };
    
    const handleSwapCurrencies = () => { setFromCurrency(toCurrency); setToCurrency(fromCurrency); };

    const handleStartTransfer = () => {
        if (!amount || amount <= 0) return;
        const newOrder = { 
            id: `MS-${Date.now().toString().slice(-4)}`, 
            customerName: 'عميل جديد', 
            amount: parseFloat(amount), 
            fromCurrency, 
            toCurrency, 
            status: 'pending', 
            date: new Date().toISOString().split('T')[0] 
        };
        setFinalOrder(newOrder);
        setIsSummaryModalOpen(true);
    };

    const handleConfirmTransfer = (confirmedOrder) => {
        onAddOrder(confirmedOrder);
    };

    const SwapIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M7 16V4m0 12l-4-4m4 4l4-4m6 8v-12m0 12l-4-4m4 4l4-4" }));
    const options = allRates.map(rate => React.createElement('option', { className: "bg-gray-800 text-white font-bold", key: rate.code, value: rate.code }, `${rate.code} - ${rate.name}`));
    const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

    return React.createElement(React.Fragment, null,
        React.createElement('div', { className: "p-6 md:p-8 glass-card card" },
            React.createElement('div', { className: "flex flex-col md:flex-row items-center gap-4 relative" },
                React.createElement('div', {className:"w-full"},
                    React.createElement('label', { className: "block text-sm font-bold text-gray-600 dark:text-gray-300 mb-2" }, "أنت ترسل"),
                    React.createElement('div', { className: "flex items-center bg-white/70 dark:bg-slate-800/50 rounded-lg border-2 border-transparent focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-200" },
                        React.createElement('input', { type: "number", value: amount, onChange: handleAmountChange, className: "w-full p-4 text-2xl font-bold font-numbers text-gray-900 dark:text-white bg-transparent focus:outline-none", placeholder: "0.00" }),
                        React.createElement('select', { value: fromCurrency, onChange: e => setFromCurrency(e.target.value), className: "bg-transparent text-gray-800 dark:text-gray-200 font-bold p-4 focus:outline-none cursor-pointer" }, options)
                    )
                ),
                React.createElement('button', { onClick: handleSwapCurrencies, className: "p-2 text-gray-600 dark:text-gray-300 rounded-full hover:bg-white/80 dark:hover:bg-slate-700/50 transition absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-8 md:mt-4 bg-white/50 dark:bg-slate-900/50 border-4 border-white/0" }, React.createElement(SwapIcon)),
                React.createElement('div', {className:"w-full"},
                    React.createElement('label', { className: "block text-sm font-bold text-gray-600 dark:text-gray-300 mb-2" }, "هم يستلمون"),
                    React.createElement('div', { className: "flex items-center bg-white/70 dark:bg-slate-800/50 rounded-lg border-2 border-transparent" },
                        React.createElement('input', { type: "text", value: convertedAmount.toLocaleString(), readOnly: true, className: "w-full p-4 text-2xl font-extrabold font-numbers text-gray-900 dark:text-white bg-transparent focus:outline-none" }),
                        React.createElement('select', { value: toCurrency, onChange: e => setToCurrency(e.target.value), className: "bg-transparent text-gray-800 dark:text-gray-200 font-bold p-4 focus:outline-none cursor-pointer" }, options)
                    )
                )
            ),
             React.createElement('p', {className: "text-center text-sm text-gray-600 dark:text-gray-400 mt-6 font-semibold"}, `رسوم الخدمة: `, React.createElement('span', {className: 'font-numbers font-bold text-emerald-600'}, '0 (عرض خاص!)')),
            isPriceLocked && amount > 0 && React.createElement('p', {className: 'text-center text-sm font-bold text-gray-700 dark:text-gray-300 mt-2 fade-in'}, `السعر مضمون لمدة: ${formatTime(countdown)}`),
            React.createElement('button', { onClick: handleStartTransfer, className: `mt-4 w-full text-center bg-emerald-500 text-white font-bold py-4 rounded-lg text-lg transition-transform transform hover:scale-105 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed`, disabled: !amount || amount <= 0 }, "جمّد السعر وحوّل الآن")
        ),
        React.createElement(OrderSummaryModal, { 
            isOpen: isSummaryModalOpen, 
            onClose: () => setIsSummaryModalOpen(false), 
            order: finalOrder, 
            convertedAmount: convertedAmount,
            onConfirm: handleConfirmTransfer
        })
    );
};

const ExchangeBoard = ({ rates }) => {
    return React.createElement('div', { className: "card overflow-hidden !bg-white dark:!bg-slate-800" },
        React.createElement('div', { className: "overflow-x-auto" },
            React.createElement('table', { className: "min-w-full text-sm text-right" },
                React.createElement('thead', { className: "bg-gray-50 dark:bg-slate-900/50" },
                    React.createElement('tr', null,
                        React.createElement('th', { scope:"col", className: "py-3 px-6 text-xs font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase" }, "العملة"),
                        React.createElement('th', { scope:"col", className: "py-3 px-6 text-xs font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase text-center" }, "نشتري (مقابل SDG)"),
                        React.createElement('th', { scope:"col", className: "py-3 px-6 text-xs font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase text-center" }, "نبيع (مقابل SDG)")
                    )
                ),
                React.createElement('tbody', {className:"divide-y divide-gray-200 dark:divide-slate-700"},
                    rates.map((rate) => {
                        return React.createElement('tr', { key: rate.code, className: "odd:bg-white even:bg-gray-50/60 dark:odd:bg-slate-800 dark:even:bg-slate-800/50 hover:bg-emerald-50 dark:hover:bg-slate-700/50 transition-colors duration-150" },
                             React.createElement('td', { className: "py-4 px-6" },
                                React.createElement('div', { className: "flex items-center gap-4" },
                                    React.createElement('span', { className: `flag-icon flag-icon-${rate.flagCode} !w-8 !h-8` }),
                                    React.createElement('div', null,
                                        React.createElement('p', { className: "font-bold text-base text-gray-800 dark:text-gray-100" }, rate.name),
                                        React.createElement('p', { className: "font-numbers text-sm text-gray-500 dark:text-gray-400 font-bold" }, rate.code)
                                    )
                                )
                             ),
                            React.createElement('td', { className: "py-4 px-6 text-center font-numbers font-extrabold text-green-700 dark:text-green-500 text-lg" }, rate.buy.toFixed(2)),
                            React.createElement('td', { className: "py-4 px-6 text-center font-numbers font-extrabold text-red-700 dark:text-red-500 text-lg" }, rate.sell.toFixed(2))
                        );
                    })
                )
            )
        )
    );
};

const TrackTransfer = ({ orders }) => {
    const [trackingCode, setTrackingCode] = useState('');
    const [foundOrder, setFoundOrder] = useState(null);
    const [error, setError] = useState('');
    
    const handleTrack = () => {
        setError('');
        setFoundOrder(null);
        if (!trackingCode.trim()) {
            setError('الرجاء إدخال كود التتبع.');
            return;
        }
        const order = orders.find(o => o.id.toLowerCase() === trackingCode.toLowerCase().trim());
        if (order) {
            setFoundOrder(order);
        } else {
            setError('لم يتم العثور على طلب بهذا الكود. يرجى التأكد من الرمز والمحاولة مرة أخرى.');
        }
    };

    const StatusBadge = ({ status }) => {
        const statusStyles = {
            pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
            processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
            completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
        };
        const statusText = {
            pending: 'قيد الانتظار',
            processing: 'قيد التنفيذ',
            completed: 'مكتمل',
        };
        return React.createElement('span', { className: `px-3 py-1 text-sm font-bold rounded-full ${statusStyles[status]}`}, statusText[status]);
    };

    return React.createElement('div', { className: "max-w-2xl mx-auto card p-8 shadow-2xl" },
        React.createElement('div', { className: "flex flex-col sm:flex-row gap-3" },
            React.createElement('input', { type: "text", value: trackingCode, onChange: (e) => setTrackingCode(e.target.value), className: "w-full p-4 text-center font-bold font-numbers text-white bg-gray-800 dark:bg-slate-700 rounded-lg border-2 border-transparent focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 placeholder-gray-400 transition-colors", placeholder: "أدخل كود التتبع هنا (e.g., MS-1024)" }),
            React.createElement('button', { onClick: handleTrack, className: "px-8 py-4 rounded-lg font-bold bg-gray-700 dark:bg-slate-600 text-white hover:bg-gray-600 dark:hover:bg-slate-500 transition-colors" }, "تتبع")
        ),
        error && React.createElement('p', { className: "mt-4 text-center text-red-500 font-bold" }, error),
        foundOrder && React.createElement('div', { className: "mt-6 p-4 bg-gray-50 dark:bg-slate-900/50 rounded-lg fade-in" },
            React.createElement('div', { className: "flex justify-between items-center" },
                React.createElement('p', null, React.createElement('span', { className: "text-gray-500 dark:text-gray-400" }, "الحالة:")),
                React.createElement(StatusBadge, { status: foundOrder.status })
            ),
            React.createElement('div', { className: "mt-2 flex justify-between items-center" },
                React.createElement('p', null, React.createElement('span', { className: "text-gray-500 dark:text-gray-400" }, "المبلغ: ")),
                React.createElement('p', { className: "font-bold font-numbers text-gray-800 dark:text-gray-200" }, `${foundOrder.amount.toLocaleString()} ${foundOrder.fromCurrency}`)
            )
        )
    );
};

const TransferRoutes = () => {
    const routes = useMemo(() => [
        { from: 'USD', name: 'دولار أمريكي', flag: 'us', position: { top: '0%', left: '50%', transform: 'translate(-50%, -50%)' } },
        { from: 'TRY', name: 'ليرة تركية', flag: 'tr', position: { top: '25%', left: '95%', transform: 'translate(-50%, -50%)' } },
        { from: 'SAR', name: 'ريال سعودي', flag: 'sa', position: { top: '75%', left: '95%', transform: 'translate(-50%, -50%)' } },
        { from: 'AED', name: 'درهم إماراتي', flag: 'ae', position: { top: '100%', left: '50%', transform: 'translate(-50%, -50%)' } },
        { from: 'EGP', name: 'جنيه مصري', flag: 'eg', position: { top: '75%', left: '5%', transform: 'translate(-50%, -50%)' } },
        { from: 'EUR', name: 'يورو', flag: 'eu', position: { top: '25%', left: '5%', transform: 'translate(-50%, -50%)' } },
    ], []);

    const Line = ({ index }) => {
        const rotations = [0, 45, 135, 180, 225, 315];
        const style = {
            transform: `rotate(${rotations[index]}deg)`,
            height: '2px',
            width: '40%',
            top: '50%',
            left: '50%',
            position: 'absolute',
            transformOrigin: '0% 50%',
            backgroundImage: 'linear-gradient(to right, transparent 50%, #94a3b8 50%)',
            backgroundSize: '16px 2px',
            animation: 'dash-flow 2s linear infinite'
        };
        return React.createElement('div', { style: style, className: 'opacity-50' });
    };

    return React.createElement('section', { id: "transfer-routes", className: "py-20" },
        React.createElement('div', { className: "max-w-7xl mx-auto px-4" },
            React.createElement('div', { className: "text-center mb-16" },
                React.createElement('h2', { className: "text-3xl font-[900] text-gray-900 dark:text-white" }, "مسارات التحويل الأكثر شيوعاً"),
                React.createElement('p', { className: "mt-3 text-md text-gray-600 dark:text-gray-400" }, "أرسل الأموال بسهولة عبر مساراتنا الموثوقة.")
            ),
            React.createElement('div', { className: "max-w-lg mx-auto aspect-square relative" },
                routes.map((route, index) => React.createElement(Line, { key: route.from, index })),
                React.createElement('div', { className: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center w-32 h-32 md:w-40 md:h-40 bg-white dark:bg-slate-800 rounded-full shadow-2xl z-10 border-4 border-emerald-500" },
                    React.createElement('span', { className: 'flag-icon flag-icon-sd !w-12 !h-12 md:!w-16 md:!h-16' }),
                    React.createElement('p', { className: "mt-2 font-bold text-gray-800 dark:text-gray-100 text-sm md:text-base" }, "جنيه سوداني")
                ),
                routes.map(route => React.createElement('a', {
                    key: `node-${route.from}`,
                    href: "#hero",
                    style: route.position,
                    className: "absolute z-10 flex flex-col items-center justify-center w-24 h-24 md:w-28 md:h-28 bg-white dark:bg-slate-800 rounded-full shadow-lg hover:shadow-2xl hover:scale-110 transition-transform duration-300 ease-in-out"
                },
                    React.createElement('span', { className: `flag-icon flag-icon-${route.flag} !w-10 !h-10 md:!w-12 md:!h-12` }),
                    React.createElement('p', { className: "mt-2 font-bold text-gray-800 dark:text-gray-200 text-xs md:text-sm text-center" }, route.name)
                ))
            )
        )
    );
};

const HowItWorks = ({ id }) => {
    const Step = ({ icon, title, description, index }) => React.createElement('div', { className: "bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 ease-in-out text-center" },
        React.createElement('div', { className: "w-20 h-20 mx-auto relative mb-6" },
            React.createElement('div', { className: "flex items-center justify-center w-full h-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full" },
                 React.cloneElement(icon, { className: "h-10 w-10" })
            ),
            React.createElement('div', { className: "absolute -top-1 -right-1 flex items-center justify-center w-9 h-9 bg-gray-800 dark:bg-slate-700 text-white font-bold font-numbers rounded-full border-4 border-white dark:border-slate-800" }, index + 1)
        ),
        React.createElement('h3', { className: "text-xl font-bold text-gray-900 dark:text-white mb-2" }, title),
        React.createElement('p', { className: "text-gray-600 dark:text-gray-400 leading-relaxed text-sm" }, description)
    );

    const LightningIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-8 w-8", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor"}, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13 10V3L4 14h7v7l9-11h-7z" }));
    const TrackIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-8 w-8", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor"}, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" }), React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 11a3 3 0 11-6 0 3 3 0 016 0z" }));
    const PercentIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-8 w-8", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor"}, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"}));

    const features = [
        { icon: React.createElement(LightningIcon), title: "وصول فوري للأموال", description: "تصل حوالتك للمستلم في دقائق معدودة." },
        { icon: React.createElement(TrackIcon), title: "نظام تتبع حديث وشفاف", description: "تابع حالة حوالتك خطوة بخطوة من الإرسال حتى الاستلام." },
        { icon: React.createElement(PercentIcon), title: "أفضل سعر في السوق الآن", description: "نراقب الأسعار لنقدم لك أفضل صفقة ممكنة." }
    ];
    return React.createElement('section', { id: id, className: "py-28 bg-gray-50 dark:bg-slate-900" },
        React.createElement('div', { className: "max-w-7xl mx-auto px-4" },
            React.createElement('div', { className: "text-center mb-16" },
                React.createElement('h2', { className: "text-3xl font-[900] text-gray-900 dark:text-white" }, `لماذا ${BUSINESS_NAME}؟`),
                React.createElement('p', { className: "mt-3 text-md text-gray-600 dark:text-gray-400" }, "لأننا نجمع بين السرعة، الأمان، وأفضل الأسعار.")
            ),
            React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-3 gap-8" },
                features.map((feature, index) => React.createElement(Step, { key: feature.title, ...feature, index }))
            )
        )
    );
};

const WhatsAppButton = () => {
    const message = `مرحباً ${BUSINESS_NAME}، أرغب في الاستفسار عن خدمة الصرافة.`;
    const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    return React.createElement('a', { 
        href: whatsappLink, 
        target: "_blank", 
        rel: "noopener noreferrer", 
        title: "تواصل معنا عبر واتساب",
        className: "fixed bottom-6 left-6 z-50 bg-emerald-500 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40 animate-fab-pulse transition-transform duration-200 ease-in-out hover:scale-110" 
    },
        React.createElement('svg', { className: "w-9 h-9", fill: "currentColor", viewBox: "0 0 24 24" }, React.createElement('path', { d: "M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.487 5.235 3.487 8.413 0 6.557-5.338 11.892-11.894 11.892-1.99 0-3.902-.539-5.587-1.528l-6.191 1.645v-.001zM7.59 17.556c.227.357.656.556 1.054.619.41.064.819.096 1.24.096 4.83 0 8.758-3.928 8.758-8.758 0-4.829-3.928-8.758-8.758-8.758-4.829 0-8.758 3.929-8.758 8.758.001 1.95.633 3.822 1.745 5.333l.25.374-1.143 4.156 4.25-1.119.355.233z" }))
    );
};

// --- ADMIN COMPONENTS ---
const AdminLoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (password === 'admin123') {
            onLoginSuccess();
        } else {
            setError('كلمة المرور غير صحيحة.');
        }
    };

    return React.createElement('div', { className: "fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 fade-in", onClick: onClose },
        React.createElement('div', { className: "bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm p-8 shadow-2xl", onClick: e => e.stopPropagation() },
            React.createElement('h2', { className: "text-2xl font-bold text-center text-gray-800 dark:text-gray-100 mb-6" }, "دخول المسؤول"),
            React.createElement('form', { onSubmit: handleSubmit },
                React.createElement('div', { className: "mb-4" },
                    React.createElement('label', { className: "block text-gray-600 dark:text-gray-300 mb-2" }, "كلمة المرور"),
                    React.createElement('input', { type: "password", value: password, onChange: e => setPassword(e.target.value), className: "w-full p-3 font-numbers bg-gray-100 dark:bg-slate-700 rounded-lg border-2 border-gray-200 dark:border-slate-600 focus:border-emerald-500 text-gray-800 dark:text-gray-200" })
                ),
                error && React.createElement('p', { className: "text-red-500 text-center mb-4" }, error),
                React.createElement('button', { type: "submit", className: "w-full bg-gray-800 dark:bg-slate-700 text-white font-bold py-3 rounded-lg hover:bg-gray-900 dark:hover:bg-slate-600" }, "دخول")
            )
        )
    );
};

const AdminLayout = ({ rates, orders, setOrders, setRates, onLogout, isDynamicPricing, setIsDynamicPricing }) => {
    const [adminView, setAdminView] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const handleSaveChangesFn = useRef(null);

    const handleSave = () => {
        if (handleSaveChangesFn.current) {
            handleSaveChangesFn.current();
            setShowSaveSuccess(true);
            setTimeout(() => setShowSaveSuccess(false), 3000);
        }
    };
    
    // SVG Icons
    const DashboardIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor"}, React.createElement('path', { strokeLinecap:"round", strokeLinejoin:"round", strokeWidth:2, d:"M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"}));
    const OrdersIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor"}, React.createElement('path', { strokeLinecap:"round", strokeLinejoin:"round", strokeWidth:2, d:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"}));
    const RatesIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor"}, React.createElement('path', { strokeLinecap:"round", strokeLinejoin:"round", strokeWidth:2, d:"M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8v1m0 10v1m0-13a9 9 0 110 18 9 9 0 010-18z"}));
    const LogoutIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor"}, React.createElement('path', { strokeLinecap:"round", strokeLinejoin:"round", strokeWidth:2, d:"M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"}));
    const MenuIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor"}, React.createElement('path', { strokeLinecap:"round", strokeLinejoin:"round", strokeWidth:2, d:"M4 6h16M4 12h16M4 18h16"}));
    const ExchangeIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6 text-emerald-500", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: "2" },
      React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8v1m0 10v1m0-13a9 9 0 110 18 9 9 0 010-18z' })
    );

    const StatusBadge = ({ status }) => {
        const statusStyles = {
            pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
            processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
            completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
        };
        const statusText = {
            pending: 'قيد الانتظار',
            processing: 'قيد التنفيذ',
            completed: 'مكتمل',
        };
        return React.createElement('span', { className: `px-3 py-1 text-xs font-bold rounded-full ${statusStyles[status]}`}, statusText[status]);
    };

    const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children }) => {
        if (!isOpen) return null;
        return React.createElement('div', { className: "fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 fade-in", onClick: onClose },
            React.createElement('div', { className: "bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-8 shadow-2xl", onClick: e => e.stopPropagation() },
                React.createElement('h3', { className: "text-xl font-bold text-gray-800 dark:text-gray-100" }, title),
                React.createElement('div', { className: "mt-2 text-sm text-gray-600 dark:text-gray-400" }, children),
                React.createElement('div', { className: "mt-6 flex justify-end gap-3" },
                    React.createElement('button', { onClick: onClose, className: "px-5 py-2 rounded-lg font-bold bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-200" }, "إلغاء"),
                    React.createElement('button', { onClick: onConfirm, className: "px-5 py-2 rounded-lg font-bold bg-emerald-500 text-white hover:bg-emerald-600" }, "تأكيد")
                )
            )
        );
    };

    const AdminDashboard = ({ orders, rates }) => {
        const metrics = useMemo(() => {
            const totalTransfers = orders.length;
            const pendingTransfers = orders.filter(o => o.status === 'pending').length;
            const today = new Date().toISOString().split('T')[0];
            const todaysOrders = orders.filter(o => o.date === today);
            const dailyVolume = todaysOrders.reduce((total, order) => {
                if (order.fromCurrency === 'SDG') return total + order.amount;
                const rate = rates.find(r => r.code === order.fromCurrency);
                return rate ? total + (order.amount * rate.buy) : total;
            }, 0);
            return { totalTransfers, pendingTransfers, dailyVolume };
        }, [orders, rates]);

        const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

        const StatCard = ({ title, value, icon, format, colorClass }) => (
            React.createElement('div', { className: `relative overflow-hidden rounded-2xl p-6 shadow-lg text-white transition-transform hover:-translate-y-1 ${colorClass}` },
                React.createElement('div', { className: "absolute -right-6 -bottom-6 opacity-20" },
                    React.cloneElement(icon, { className: "w-28 h-28" })
                ),
                React.createElement('div', { className: "mb-4" },
                     React.cloneElement(icon, { className: "w-8 h-8" })
                ),
                React.createElement('p', { className: "text-sm font-bold uppercase tracking-wider" }, title),
                React.createElement('p', { className: "mt-1 text-4xl font-black font-numbers" }, format ? format(value) : value)
            )
        );


        return React.createElement('div', null,
            React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8" },
                React.createElement(StatCard, { 
                    title: "إجمالي التحويلات", 
                    value: metrics.totalTransfers, 
                    icon: React.createElement(OrdersIcon), 
                    colorClass: 'bg-gradient-to-br from-emerald-500 to-green-600' 
                }),
                React.createElement(StatCard, { 
                    title: "الحجم اليومي (SDG)", 
                    value: metrics.dailyVolume, 
                    icon: React.createElement(RatesIcon), 
                    format: v => v.toLocaleString(undefined, { minimumFractionDigits: 0 }),
                    colorClass: 'bg-gradient-to-br from-blue-500 to-indigo-600'
                }),
                React.createElement(StatCard, { 
                    title: "طلبات قيد الانتظار", 
                    value: metrics.pendingTransfers, 
                    icon: React.createElement(DashboardIcon),
                    colorClass: 'bg-gradient-to-br from-amber-500 to-orange-600'
                })
            ),
            React.createElement('div', { className: "bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg" },
                React.createElement('h2', { className: "text-xl font-bold text-gray-800 dark:text-gray-100 p-6" }, "أحدث النشاطات"),
                React.createElement('div', { className: "overflow-x-auto" },
                    React.createElement('table', { className: "min-w-full text-sm text-right" },
                        React.createElement('thead', { className: "bg-gray-100 dark:bg-slate-900/50" },
                            React.createElement('tr', null, ['كود الطلب', 'المبلغ', 'التاريخ', 'الحالة'].map(h => React.createElement('th', { key: h, scope: "col", className: "py-3 px-6 text-xs font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase" }, h)))
                        ),
                        React.createElement('tbody', { className: "divide-y divide-gray-200 dark:divide-slate-700" },
                            recentOrders.map(order => React.createElement('tr', { key: order.id },
                                React.createElement('td', { className: "py-4 px-6 font-numbers text-emerald-600 whitespace-nowrap" }, order.id),
                                React.createElement('td', { className: "py-4 px-6 font-numbers font-bold text-gray-800 dark:text-gray-200 whitespace-nowrap" }, `${order.amount.toLocaleString()} ${order.fromCurrency}`),
                                React.createElement('td', { className: "py-4 px-6 font-numbers text-gray-600 dark:text-gray-400 whitespace-nowrap" }, order.date),
                                React.createElement('td', { className: "py-4 px-6" }, React.createElement(StatusBadge, { status: order.status }))
                            ))
                        )
                    )
                )
            )
        );
    };

    const AdminOrders = ({ orders, setOrders }) => {
        const [orderToConfirm, setOrderToConfirm] = useState(null);
        const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
        const [successNotification, setSuccessNotification] = useState('');

        const handleStatusChange = (orderId, newStatus) => {
            const order = orders.find(o => o.id === orderId);
            if (newStatus === 'completed' && order.status !== 'completed') {
                setOrderToConfirm(order);
                setIsConfirmModalOpen(true);
            } else {
                setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            }
        };

        const handleConfirmCompletion = () => {
            if (!orderToConfirm) return;
            setOrders(orders.map(o => o.id === orderToConfirm.id ? { ...o, status: 'completed' } : o));
            setSuccessNotification(`تم تحديث حالة الطلب ${orderToConfirm.id} إلى "مكتمل".`);
            setTimeout(() => setSuccessNotification(''), 3000);
            setIsConfirmModalOpen(false);
            setOrderToConfirm(null);
        };
        
        return React.createElement(React.Fragment, null,
            successNotification && React.createElement('div', { className: "bg-green-100 text-green-700 p-3 rounded-lg mb-6 text-center font-bold" }, successNotification),
            React.createElement('div', { className: "bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg" },
                React.createElement('div', { className: "overflow-x-auto" },
                    React.createElement('table', { className: "min-w-full text-sm text-right text-gray-800 dark:text-gray-200" },
                        React.createElement('thead', { className: "bg-gray-100 dark:bg-slate-900/50" },
                            React.createElement('tr', null, ['كود الطلب', 'العميل', 'المبلغ', 'التاريخ', 'الحالة'].map(h => React.createElement('th', { key: h, scope: "col", className: "py-3 px-6 text-xs font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase" }, h)))
                        ),
                        React.createElement('tbody', { className: "divide-y divide-gray-200 dark:divide-slate-700" },
                            orders.map(order => React.createElement('tr', { key: order.id, className: "hover:bg-gray-50 dark:hover:bg-slate-700/50" },
                                React.createElement('td', { className: "py-4 px-6 font-numbers text-emerald-600 font-semibold whitespace-nowrap" }, order.id),
                                React.createElement('td', { className: "py-4 px-6 whitespace-nowrap" }, order.customerName),
                                React.createElement('td', { className: "py-4 px-6 font-numbers font-bold whitespace-nowrap" }, `${order.amount.toLocaleString()} ${order.fromCurrency}`),
                                React.createElement('td', { className: "py-4 px-6 font-numbers text-gray-600 dark:text-gray-400 whitespace-nowrap" }, order.date),
                                React.createElement('td', { className: "py-4 px-6" },
                                    React.createElement('select', { value: order.status, onChange: (e) => handleStatusChange(order.id, e.target.value), className: "w-full bg-gray-100 dark:bg-slate-700 border-gray-300 text-gray-800 dark:text-gray-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" },
                                        ['pending', 'processing', 'completed'].map(s => React.createElement('option', { key: s, value: s }, { pending: 'قيد الانتظار', processing: 'قيد التنفيذ', completed: 'مكتمل' }[s]))
                                    )
                                )
                            ))
                        )
                    )
                )
            ),
            React.createElement(ConfirmationModal, {
                isOpen: isConfirmModalOpen,
                onClose: () => setIsConfirmModalOpen(false),
                onConfirm: handleConfirmCompletion,
                title: "تأكيد إكمال الطلب"
            },
                React.createElement('p', null, "هل أنت متأكد من أنك تريد تمييز الطلب رقم ", React.createElement('strong', null, orderToConfirm?.id), " كمكتمل؟ لا يمكن التراجع عن هذا الإجراء.")
            )
        );
    };

    const AdminRates = ({ rates, setRates, onSaveChanges, isDynamicPricing, setIsDynamicPricing }) => {
        const [editableRates, setEditableRates] = useState(() =>
            rates.map(r => ({...r, buy: String(r.buy), sell: String(r.sell)}))
        );
    
        useEffect(() => {
             setEditableRates(rates.map(r => ({...r, buy: String(r.buy), sell: String(r.sell)})))
        }, [rates]);

        useEffect(() => {
            onSaveChanges.current = () => {
                const sanitizedRates = editableRates.map(rate => ({
                    ...rate,
                    buy: parseFloat(rate.buy) || 0,
                    sell: parseFloat(rate.sell) || 0,
                }));
                setRates(sanitizedRates);
            };
        }, [editableRates, setRates, onSaveChanges]);
    
        const handleRateChange = (code, field, value) => {
            if (value === "" || /^\d*\.?\d*$/.test(value)) {
                setEditableRates(currentRates =>
                    currentRates.map(rate =>
                        rate.code === code ? { ...rate, [field]: value } : rate
                    )
                );
            }
        };
    
        const handleBlur = (code, field, value) => {
            const parsedValue = parseFloat(value);
            const finalValue = isNaN(parsedValue) ? "0" : String(parsedValue);
            setEditableRates(currentRates =>
                currentRates.map(rate =>
                    rate.code === code ? { ...rate, [field]: finalValue } : rate
                )
            );
        };
        
        const PricingToggle = ({ isDynamic, onChange }) => (
            React.createElement('div', { className: "flex items-center gap-4" },
                React.createElement('span', { className: `font-bold transition-colors ${!isDynamic ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}` }, "تعديل يدوي"),
                React.createElement('label', { htmlFor: "pricing-toggle", className: "relative inline-flex items-center cursor-pointer" },
                    React.createElement('input', { type: "checkbox", checked: isDynamic, onChange: onChange, id: "pricing-toggle", className: "sr-only peer" }),
                    React.createElement('div', { className: "w-14 h-7 bg-gray-200 dark:bg-slate-700 rounded-full peer peer-focus:ring-4 peer-focus:ring-emerald-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600" })
                ),
                React.createElement('span', { className: `font-bold transition-colors ${isDynamic ? 'text-emerald-600 dark:text-emerald-500' : 'text-gray-400 dark:text-gray-500'}` }, "تحديث تلقائي")
            )
        );

        return React.createElement('div', null,
            React.createElement('div', { className: "bg-white dark:bg-slate-800 rounded-2xl p-6 mb-6 shadow-lg flex flex-col md:flex-row justify-between items-center gap-4" },
                React.createElement('div', null,
                    React.createElement('h3', { className: "text-lg font-bold text-gray-800 dark:text-gray-100" }, "وضع التسعير"),
                    React.createElement('p', { className: "text-sm text-gray-500 dark:text-gray-400" }, "اختر بين التحديث التلقائي للأسعار أو التعديل اليدوي وتثبيت السعر.")
                ),
                React.createElement(PricingToggle, { isDynamic: isDynamicPricing, onChange: () => setIsDynamicPricing(!isDynamicPricing) })
            ),
            React.createElement('div', { className: "bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg" },
                React.createElement('div', { className: "overflow-x-auto" },
                    React.createElement('table', { className: "min-w-full text-sm text-right" },
                        React.createElement('thead', { className: "bg-gray-50 dark:bg-slate-900/50" },
                            React.createElement('tr', null,
                                React.createElement('th', { scope: "col", className: "py-3 px-6 text-xs font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase" }, 'العملة'),
                                React.createElement('th', { scope: "col", className: "py-3 px-6 text-xs font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase text-center" }, 'نشتري (مقابل SDG)'),
                                React.createElement('th', { scope: "col", className: "py-3 px-6 text-xs font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase text-center" }, 'نبيع (مقابل SDG)')
                            )
                        ),
                        React.createElement('tbody', { className: "divide-y divide-gray-200 dark:divide-slate-700" },
                            editableRates.map(rate => React.createElement('tr', { key: rate.code, className: "hover:bg-gray-50/50 dark:hover:bg-slate-700/50" },
                                React.createElement('td', { className: "py-4 px-6" },
                                    React.createElement('div', { className: "flex items-center gap-4" },
                                        React.createElement('span', { className: `flag-icon flag-icon-${rate.flagCode} !w-8 !h-8` }),
                                        React.createElement('div', null,
                                            React.createElement('p', { className: "font-bold text-base text-gray-800 dark:text-gray-200" }, rate.name),
                                            React.createElement('p', { className: "font-numbers text-sm text-gray-500 dark:text-gray-400 font-bold" }, rate.code)
                                        )
                                    )
                                ),
                                React.createElement('td', { className: "py-4 px-6 text-center font-numbers font-extrabold text-green-700 dark:text-green-500 text-lg" }, 
                                    React.createElement('input', {
                                        type: "text",
                                        inputMode: "decimal",
                                        value: isDynamicPricing ? parseFloat(rate.buy).toFixed(2) : rate.buy,
                                        onChange: e => handleRateChange(rate.code, 'buy', e.target.value),
                                        onBlur: e => handleBlur(rate.code, 'buy', e.target.value),
                                        disabled: isDynamicPricing,
                                        className: "w-full text-center bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-300 rounded-md p-1 disabled:bg-transparent disabled:ring-0 disabled:cursor-not-allowed dark:text-green-500"
                                    })
                                ),
                                React.createElement('td', { className: "py-4 px-6 text-center font-numbers font-extrabold text-red-700 dark:text-red-500 text-lg" },
                                    React.createElement('input', {
                                        type: "text",
                                        inputMode: "decimal",
                                        value: isDynamicPricing ? parseFloat(rate.sell).toFixed(2) : rate.sell,
                                        onChange: e => handleRateChange(rate.code, 'sell', e.target.value),
                                        onBlur: e => handleBlur(rate.code, 'sell', e.target.value),
                                        disabled: isDynamicPricing,
                                        className: "w-full text-center bg-transparent focus:outline-none focus:ring-2 focus:ring-red-300 rounded-md p-1 disabled:bg-transparent disabled:ring-0 disabled:cursor-not-allowed dark:text-red-500"
                                    })
                                )
                            ))
                        )
                    )
                )
            )
        );
    };

    const adminViews = {
        dashboard: { title: 'لوحة القياس', component: AdminDashboard, icon: React.createElement(DashboardIcon), props: { orders, rates } },
        orders: { title: 'إدارة الطلبات', component: AdminOrders, icon: React.createElement(OrdersIcon), props: { orders, setOrders } },
        rates: { title: 'إدارة أسعار الصرف', component: AdminRates, icon: React.createElement(RatesIcon), props: { rates, setRates, onSaveChanges: handleSaveChangesFn, isDynamicPricing, setIsDynamicPricing } }
    };
    
    const NavItem = ({ title, icon, isActive, onClick }) => React.createElement('button', { onClick, className: `w-full flex items-center gap-4 p-3 rounded-lg text-md transition-colors ${isActive ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}` }, icon, React.createElement('span', { className: 'font-bold' }, title));

    const AdminSidebar = ({ currentView, setView, isOpen, setIsOpen, views, onLogout }) => (
        React.createElement(React.Fragment, null,
            React.createElement('aside', { className: `fixed inset-y-0 right-0 z-50 w-64 bg-slate-900 border-l border-slate-800 p-4 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : 'translate-x-full'}` },
                React.createElement('div', { className: "flex items-center gap-3 p-3 mb-6" }, 
                    React.createElement('span', { className: "h-8 w-8 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700" }, 
                      React.createElement(ExchangeIcon)
                    ), 
                    React.createElement('h1', { className: "text-gray-100 text-xl font-bold" }, "لوحة التحكم")
                ),
                React.createElement('nav', { className: "flex-grow" },
                    React.createElement('ul', { className: "space-y-2" },
                        Object.keys(views).map(key => React.createElement('li', { key: key }, React.createElement(NavItem, { title: views[key].title, icon: views[key].icon, isActive: currentView === key, onClick: () => { setView(key); setIsOpen(false); } })))
                    )
                ),
                React.createElement('div', { className: "mt-auto" }, 
                  React.createElement(NavItem, { title: "تسجيل الخروج", icon: React.createElement(LogoutIcon), isActive: false, onClick: onLogout })
                )
            ),
             isOpen && React.createElement('div', { className: "fixed inset-0 bg-black/40 z-40 md:hidden", onClick: () => setIsOpen(false) })
        )
    );

    const AdminHeader = ({ title, showSaveButton, onSave, onToggleSidebar, isSaveDisabled }) => (
        React.createElement('header', { className: 'bg-slate-900 p-4 border-b border-slate-800 flex justify-between items-center sticky top-0 z-30' },
            React.createElement('div', { className: 'flex items-center gap-4' },
                React.createElement('button', { onClick: onToggleSidebar, className: "p-2 text-gray-300 hover:bg-slate-800 rounded-full md:hidden" }, React.createElement(MenuIcon)),
                React.createElement('h1', { className: "text-xl md:text-2xl font-bold text-gray-100" }, title),
            ),
            showSaveButton && React.createElement('button', { onClick: onSave, disabled: isSaveDisabled, className: "px-5 py-2 rounded-lg font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed" }, "حفظ التغييرات")
        )
    );

    const CurrentView = adminViews[adminView];

    return (
        React.createElement('div', { className: "min-h-screen flex text-gray-100 bg-slate-900" },
            React.createElement(AdminSidebar, { 
                currentView: adminView, 
                setView: setAdminView, 
                isOpen: isSidebarOpen, 
                setIsOpen: setIsSidebarOpen,
                views: adminViews,
                onLogout
            }),
            React.createElement('div', { className: "flex-1 flex flex-col" },
                React.createElement(AdminHeader, { 
                    title: CurrentView.title, 
                    showSaveButton: adminView === 'rates', 
                    onSave: handleSave, 
                    onToggleSidebar: () => setIsSidebarOpen(true),
                    isSaveDisabled: isDynamicPricing
                }),
                React.createElement('main', { className: "flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8" },
                    showSaveSuccess && React.createElement('div', { className: "bg-green-900/50 text-green-300 p-4 rounded-lg mb-6 text-center font-bold" }, "تم حفظ التغييرات بنجاح!"),
                    React.createElement(CurrentView.component, CurrentView.props)
                )
            )
        )
    );
};


// --- MAIN APP COMPONENT ---
const App = () => {
    const [rates, setRates] = useState(() => JSON.parse(localStorage.getItem('myPriceNowRates') || JSON.stringify(INITIAL_RATES)));
    const [orders, setOrders] = useState(() => JSON.parse(localStorage.getItem('myPriceNowOrders') || JSON.stringify(mockOrders)));
    const [isDynamicPricing, setIsDynamicPricing] = useState(() => {
        const savedMode = localStorage.getItem('isDynamicPricing');
        return savedMode !== null ? JSON.parse(savedMode) : true;
    });
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
    const prevRatesRef = useRef([]);
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === 'light' ? 'dark' : 'light');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    useEffect(() => { localStorage.setItem('myPriceNowRates', JSON.stringify(rates)); }, [rates]);
    useEffect(() => { localStorage.setItem('myPriceNowOrders', JSON.stringify(orders)); }, [orders]);
    useEffect(() => { localStorage.setItem('isDynamicPricing', JSON.stringify(isDynamicPricing)); }, [isDynamicPricing]);

    useEffect(() => {
        if (!isDynamicPricing) return;

        const interval = setInterval(() => setRates(prev => {
            prevRatesRef.current = prev;
            return prev.map(r => ({ ...r, buy: parseFloat((r.buy * (1 + (Math.random() - 0.5) * 0.001)).toFixed(2)), sell: parseFloat((r.sell * (1 + (Math.random() - 0.5) * 0.001)).toFixed(2)) }));
        }), 3000);
        return () => clearInterval(interval);
    }, [isDynamicPricing]);

    const addOrder = (order) => setOrders(prev => [order, ...prev]);
    const handleLoginSuccess = () => { setIsAdminLoggedIn(true); setIsLoginModalOpen(false); };
    const handleLogout = () => setIsAdminLoggedIn(false);

    if (isAdminLoggedIn) {
        return React.createElement(AdminLayout, { 
            rates, 
            setRates, 
            orders,
            setOrders,
            onLogout: handleLogout,
            isDynamicPricing,
            setIsDynamicPricing
        });
    }
    
    const ExchangeIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6 text-emerald-500", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: "2" },
      React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8v1m0 10v1m0-13a9 9 0 110 18 9 9 0 010-18z' })
    );

    const ThemeToggleButton = ({ currentTheme, onToggle }) => {
        const SunIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" }));
        const MoonIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" }));

        return React.createElement('button', {
            onClick: onToggle,
            className: "p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
        },
            currentTheme === 'light' ? React.createElement(MoonIcon) : React.createElement(SunIcon)
        );
    };

    return React.createElement('div', { className: "min-h-screen flex flex-col" },
        React.createElement(Ticker, { rates: rates, prevRates: prevRatesRef.current || [] }),
        React.createElement('header', { className: "sticky top-0 z-40 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-slate-800" }, 
            React.createElement('div', { className: "max-w-7xl mx-auto flex justify-between items-center" },
                React.createElement('div', { className: "flex items-center gap-3" },
                    React.createElement('span', { className: "h-10 w-10 bg-gray-100 dark:bg-slate-800 rounded-lg flex items-center justify-center border border-gray-200 dark:border-slate-700" }, 
                      React.createElement(ExchangeIcon)
                    ),
                    React.createElement('div', { className: "flex flex-col" },
                      React.createElement('span', { className: "text-gray-900 dark:text-gray-100 text-xl font-bold leading-tight" }, BUSINESS_NAME),
                      React.createElement('span', { className: "text-gray-500 dark:text-gray-400 text-xs font-semibold hidden sm:block" }, "(موقع تحديث الأسعار اليومي والتحويلات الامنه)")
                    )
                ),
                React.createElement('div', { className: 'flex items-center gap-2 md:gap-6' },
                    React.createElement('nav', { className: "hidden md:flex gap-6 items-center font-bold" },
                        ['rates', 'transfer-routes', 'how-it-works', 'track-transfer'].map(id => React.createElement('a', { key: id, href: `#${id}`, className: "text-gray-600 dark:text-gray-300 hover:text-emerald-500 transition"}, {rates: 'الأسعار', 'transfer-routes': 'المسارات الشائعة', 'how-it-works': 'لماذا نحن؟', 'track-transfer': 'تتبع حوالتك'}[id]))
                    ),
                    React.createElement(ThemeToggleButton, { currentTheme: theme, onToggle: toggleTheme })
                )
            )
        ),
        React.createElement('main', { className: "flex-grow" },
            React.createElement('section', { id: "hero", className: "text-center pt-20 pb-24 px-4" },
                React.createElement('div', {className: "max-w-4xl mx-auto"},
                    React.createElement('h1', { className: "text-4xl md:text-5xl lg:text-6xl font-[900] text-gray-900 dark:text-white" }, "أفضل سعر صرف،", React.createElement('span', {className: "text-emerald-500"}, " الآن.")),
                    React.createElement('p', { className: "mt-4 max-w-2xl mx-auto text-md md:text-lg text-gray-600 dark:text-gray-400" }, "حوّل أموالك بأمان وسرعة فائقة. نقدم لك أفضل أسعار الصرف المحدثة لحظة بلحظة مع رسوم تحويل تنافسية. ابدأ الآن وجرّب بنفسك."),
                    React.createElement(CurrencyConverter, { rates: rates, onAddOrder: addOrder })
                )
            ),
            React.createElement('section', { id: "rates", className: "py-20" },
                React.createElement('div', { className: "max-w-7xl mx-auto px-4" },
                    React.createElement('div', { className: "text-center mb-12" },
                        React.createElement('h2', { className: "text-3xl font-[900] text-gray-900 dark:text-white" }, "أسعار الصرف اليوم"),
                        React.createElement('p', { className: "mt-3 text-md text-gray-600 dark:text-gray-400" }, "الأسعار محدثة مباشرة حسب سعر السوق الموازي.")
                    ),
                    React.createElement(ExchangeBoard, { rates: rates })
                )
            ),
            React.createElement(TransferRoutes),
            React.createElement(HowItWorks, { id: "how-it-works" }),
            React.createElement('section', { id: "track-transfer", className: "py-20 bg-gray-50 dark:bg-slate-900" },
                React.createElement('div', { className: "max-w-7xl mx-auto px-4" },
                    React.createElement('div', { className: "text-center mb-12" },
                        React.createElement('h2', { className: "text-3xl font-[900] text-gray-900 dark:text-white" }, "تتبع حالة حوالتك"),
                        React.createElement('p', { className: "mt-3 text-md text-gray-600 dark:text-gray-400" }, "أدخل كود التتبع الخاص بك لمعرفة حالة طلبك الحالية.")
                    ),
                    React.createElement(TrackTransfer, { orders: orders })
                )
            )
        ),
        React.createElement('footer', { className: "bg-gray-800 dark:bg-slate-900 text-gray-300 py-12" }, 
            React.createElement('div', { className: "max-w-7xl mx-auto px-4 text-center" },
                React.createElement('p', null, `© ${new Date().getFullYear()} ${BUSINESS_NAME}. كل الحقوق محفوظة.`),
                React.createElement('button', { onClick: () => setIsLoginModalOpen(true), className: "mt-4 text-xs text-gray-500 hover:text-emerald-500" }, "دخول المسؤول")
            )
        ),
        React.createElement(WhatsAppButton),
        React.createElement(AdminLoginModal, { isOpen: isLoginModalOpen, onClose: () => setIsLoginModalOpen(false), onLoginSuccess: handleLoginSuccess })
    );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(React.createElement(App));
