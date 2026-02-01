// FIX: Corrected the invalid syntax in the React import statement.
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
        const buyColorClass = buyChange === 'up' ? 'text-teal-400' : buyChange === 'down' ? 'text-rose-400' : 'text-slate-300';
        const animationKey = `${rate.code}-${rate.buy}`;

        return React.createElement('div', { key: animationKey, className: "ticker-item text-sm" },
            React.createElement('span', { className: `font-bold text-slate-100 mr-2` }, `${rate.code}/SDG`),
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
    if (!isOpen) return null;

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
    const CheckIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5 text-teal-600", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 3 }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 13l4 4L19 7" }));
    const WhatsAppIcon = () => React.createElement('svg', { className: "w-5 h-5", fill: "currentColor", viewBox: "0 0 24 24" }, React.createElement('path', { d: "M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.487 5.235 3.487 8.413 0 6.557-5.338 11.892-11.894 11.892-1.99 0-3.902-.539-5.587-1.528l-6.191 1.645v-.001zM7.59 17.556c.227.357.656.556 1.054.619.41.064.819.096 1.24.096 4.83 0 8.758-3.928 8.758-8.758 0-4.829-3.928-8.758-8.758-8.758-4.829 0-8.758 3.929-8.758 8.758.001 1.95.633 3.822 1.745 5.333l.25.374-1.143 4.156 4.25-1.119.355.233z" }));

    return React.createElement('div', { className: "fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 fade-in", onClick: onClose },
        React.createElement('div', { className: "bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-2xl", onClick: e => e.stopPropagation() },
            React.createElement('h2', { className: "text-2xl font-[900] text-gray-800 dark:text-gray-50 text-center" }, "مراجعة تفاصيل الحوالة"),
            React.createElement('p', { className: "text-center text-gray-500 dark:text-gray-400 mt-1 mb-6" }, "يرجى التأكد من صحة البيانات قبل الإرسال."),
            React.createElement('div', { className: "space-y-3 text-sm p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-800" },
                React.createElement('div', { className: "flex justify-between items-center" }, React.createElement('span', { className: "text-gray-500 dark:text-gray-400" }, "أنت ترسل:"), React.createElement('span', { className: "font-bold font-numbers text-gray-800 dark:text-gray-200 text-base" }, `${order.amount.toLocaleString()} ${order.fromCurrency}`)),
                React.createElement('div', { className: "flex justify-between items-center" }, React.createElement('span', { className: "text-gray-500 dark:text-gray-400" }, "سيستلمون:"), React.createElement('span', { className: "font-bold font-numbers text-teal-600 dark:text-teal-500 text-base" }, `${convertedAmount.toLocaleString()} ${order.toCurrency}`)),
                React.createElement('div', { className: "border-t border-gray-200 dark:border-gray-800 my-3" }),
                React.createElement('div', { className: "flex justify-between items-center" }, React.createElement('span', { className: "text-gray-500 dark:text-gray-400" }, "رسوم التحويل:"), React.createElement('span', { className: "font-bold text-teal-600" }, "0 (عرض خاص!)")),
                React.createElement('div', { className: "flex justify-between items-center" }, React.createElement('span', { className: "text-gray-500 dark:text-gray-400" }, "الوقت المتوقع للوصول:"), React.createElement('span', { className: "font-bold text-gray-800 dark:text-gray-200" }, "5 - 15 دقيقة")),
                 React.createElement('div', { className: "flex justify-between items-center" }, 
                    React.createElement('span', { className: "text-gray-500 dark:text-gray-400" }, "كود التتبع:"),
                    React.createElement('div', { className: "flex items-center gap-2 p-1 pr-3 bg-gray-200 dark:bg-gray-800 rounded-full" },
                        React.createElement('span', { className: "font-bold font-numbers text-gray-800 dark:text-gray-200" }, order.id),
                        React.createElement('button', { 
                            onClick: handleCopyCode, title: "نسخ الكود",
                            className: "p-1 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                        }, isCopied ? React.createElement(CheckIcon) : React.createElement(CopyIcon))
                    )
                )
            ),
            React.createElement('div', { className: "mt-6 grid grid-cols-2 gap-3" },
                React.createElement('button', { type: "button", onClick: onClose, className: `w-full px-4 py-3 bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200 font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors` }, 'إلغاء'),
                React.createElement('button', { onClick: handleConfirm, className: "w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 transition-colors" }, React.createElement(WhatsAppIcon), 'تأكيد وإرسال')
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
    const [countdown, setCountdown] = useState(300);
    const [isPriceLocked, setIsPriceLocked] = useState(false);

    const convertedAmount = useMemo(() => {
        if (!amount || isNaN(amount)) return 0;
        let sdgValue = fromCurrency === 'SDG' ? parseFloat(amount) : parseFloat(amount) * fromRate.buy;
        let finalAmount = toCurrency === 'SDG' ? sdgValue : sdgValue / toRate.sell;
        return parseFloat(finalAmount.toFixed(2));
    }, [amount, fromCurrency, toCurrency, rates]);
    
    const exchangeRate = useMemo(() => {
        if (!fromRate || !toRate || toRate.sell === 0) return 0;
        return fromRate.buy / toRate.sell;
    }, [fromRate, toRate]);

    useEffect(() => {
        let timer;
        if (isPriceLocked) {
            timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) { clearInterval(timer); setIsPriceLocked(false); return 300; }
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
            id: `MS-${Date.now().toString().slice(-4)}`, customerName: 'عميل جديد', 
            amount: parseFloat(amount), fromCurrency, toCurrency, 
            status: 'pending', date: new Date().toISOString().split('T')[0] 
        };
        setFinalOrder(newOrder); setIsSummaryModalOpen(true);
    };

    const handleConfirmTransfer = (confirmedOrder) => { onAddOrder(confirmedOrder); };
    
    const SwapIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth:2 }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" }));
    const ArrowRightIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5 ml-2", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M13 7l5 5m0 0l-5 5m5-5H6" }));
    const formatTime = (seconds) => `${(Math.floor(seconds / 60)).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

    const CurrencyInput = ({ label, amount, onAmountChange, currency, onCurrencyChange, rates, isReadOnly = false, isRecipient = false }) => {
        const selectedRate = rates.find(r => r.code === currency);
        const options = rates.map(rate => React.createElement('option', { className: "bg-gray-800 text-white font-bold", key: rate.code, value: rate.code }, rate.name));

        return React.createElement('div', { className: `w-full bg-white/70 dark:bg-gray-900/50 rounded-2xl p-5 transition-all duration-300 focus-within:ring-2 ${isRecipient ? 'focus-within:ring-teal-500/50' : 'focus-within:ring-violet-500/50'}` },
            React.createElement('label', { className: "block text-sm font-bold text-gray-600 dark:text-gray-300" }, label),
            React.createElement('div', { className: "mt-2 flex items-center gap-4" },
                React.createElement('div', { className: "flex-grow" },
                    React.createElement('input', {
                        type: isReadOnly ? "text" : "number",
                        value: isReadOnly ? amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : amount,
                        readOnly: isReadOnly,
                        onChange: onAmountChange,
                        className: `w-full bg-transparent text-3xl md:text-4xl font-bold font-numbers ${isRecipient ? 'text-teal-600 dark:text-teal-400' : 'text-gray-900 dark:text-gray-50'} focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600`,
                        placeholder: "0.00"
                    })
                ),
                React.createElement('div', { className: "flex-shrink-0 border-l-2 border-gray-200 dark:border-gray-700 pl-4" },
                    React.createElement('div', { className: "relative group" },
                        React.createElement('div', { className: "flex items-center gap-2 cursor-pointer" },
                            selectedRate && React.createElement('span', { className: `flag-icon flag-icon-${selectedRate.flagCode} !w-7 !h-7` }),
                            React.createElement('span', { className: "text-gray-800 dark:text-gray-200 font-bold text-lg" }, currency),
                            React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4 text-gray-500 transition-transform group-hover:rotate-180", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 3 },
                                React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 9l-7 7-7-7" })
                            )
                        ),
                        React.createElement('select', {
                            value: currency,
                            onChange: onCurrencyChange,
                            className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        }, options)
                    )
                )
            )
        );
    };

    return React.createElement(React.Fragment, null,
        React.createElement('div', { className: "p-4 md:p-6 mt-12 card glass-card" },
            React.createElement('div', { className: "flex flex-col items-center gap-2" },
                React.createElement(CurrencyInput, {
                    label: "أنت ترسل",
                    amount: amount,
                    onAmountChange: handleAmountChange,
                    currency: fromCurrency,
                    onCurrencyChange: e => setFromCurrency(e.target.value),
                    rates: allRates
                }),
                React.createElement('div', { className: "flex items-center justify-center w-full" },
                    React.createElement('div', { className: "flex-grow h-px bg-gray-200 dark:bg-gray-700" }),
                    React.createElement('button', { onClick: handleSwapCurrencies, title: "تبديل العملات", className: "z-10 mx-4 flex-shrink-0 p-3 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-transform hover:rotate-180 duration-300" }, React.createElement(SwapIcon)),
                    React.createElement('div', { className: "flex-grow h-px bg-gray-200 dark:bg-gray-700" })
                ),
                React.createElement(CurrencyInput, {
                    label: "هم يستلمون",
                    amount: convertedAmount,
                    currency: toCurrency,
                    onCurrencyChange: e => setToCurrency(e.target.value),
                    rates: allRates,
                    isReadOnly: true,
                    isRecipient: true
                })
            ),
            React.createElement('div', { className: "mt-6 text-center space-y-2" },
                React.createElement('div', { className: "inline-block bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 font-bold font-numbers py-2 px-4 rounded-full text-sm" },
                    `1 ${fromRate.code} ≈ ${exchangeRate.toFixed(4)} ${toRate.code}`
                ),
                isPriceLocked && amount > 0 && React.createElement('p', { className: 'text-center text-sm font-bold text-gray-700 dark:text-gray-300 fade-in' }, `السعر مضمون لمدة: ${formatTime(countdown)}`)
            ),
             React.createElement('button', { onClick: handleStartTransfer, className: `mt-6 w-full flex items-center justify-center text-center bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-4 rounded-xl text-lg transition-all transform hover:scale-105 hover:shadow-2xl hover:shadow-teal-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100`, disabled: !amount || amount <= 0 },
                "اطلب الان",
                React.createElement(ArrowRightIcon)
            )
        ),
        React.createElement(OrderSummaryModal, { isOpen: isSummaryModalOpen, onClose: () => setIsSummaryModalOpen(false), order: finalOrder, convertedAmount: convertedAmount, onConfirm: handleConfirmTransfer })
    );
};


const ExchangeBoard = ({ rates, prevRates }) => {
    const tableHeader = ["العملة", "نشتري (مقابل SDG)", "نبيع (مقابل SDG)"];
    
    return React.createElement('div', { className: "card overflow-hidden !bg-white/70 dark:!bg-gray-900/70 glass-card" },
        React.createElement('div', { className: "hidden md:block" },
            React.createElement('table', { className: "min-w-full text-sm text-right" },
                React.createElement('thead', { className: "bg-gray-100 dark:bg-gray-800" },
                    React.createElement('tr', null, tableHeader.map(h => 
                        React.createElement('th', { key:h, scope:"col", className: `py-4 px-6 text-xs font-bold tracking-wider text-gray-600 dark:text-gray-300 uppercase ${h !== 'العملة' && 'text-center'}` }, h)
                    ))
                ),
                React.createElement('tbody', { className:"divide-y divide-gray-200 dark:divide-gray-800" }, rates.map(rate => {
                    const prevRate = (prevRates || []).find(p => p.code === rate.code) || rate;
                    const buyChange = rate.buy > prevRate.buy ? 'up' : (rate.buy < prevRate.buy ? 'down' : 'same');
                    const sellChange = rate.sell > prevRate.sell ? 'up' : (rate.sell < prevRate.sell ? 'down' : 'same');
                    const buyClass = buyChange === 'up' ? 'animate-flash-green' : buyChange === 'down' ? 'animate-flash-red' : '';
                    const sellClass = sellChange === 'up' ? 'animate-flash-green' : sellChange === 'down' ? 'animate-flash-red' : '';
                    
                    return React.createElement('tr', { key: rate.code, className: "hover:bg-teal-50/50 dark:hover:bg-gray-800/50 transition-colors duration-150" },
                        React.createElement('td', { className: "py-4 px-6" },
                            React.createElement('div', { className: "flex items-center gap-4" },
                                React.createElement('span', { className: `flag-icon flag-icon-${rate.flagCode} !w-9 !h-9` }),
                                React.createElement('div', null,
                                    React.createElement('p', { className: "font-bold text-base text-gray-800 dark:text-gray-50" }, rate.name),
                                    React.createElement('p', { className: "font-numbers text-sm text-gray-500 dark:text-gray-400 font-bold" }, rate.code)
                                )
                            )
                        ),
                        React.createElement('td', { key: `${rate.code}-buy-${rate.buy}`, className: `py-4 px-6 text-center font-numbers font-extrabold text-teal-700 dark:text-teal-500 text-lg ${buyClass}` }, rate.buy.toFixed(2)),
                        React.createElement('td', { key: `${rate.code}-sell-${rate.sell}`, className: `py-4 px-6 text-center font-numbers font-extrabold text-rose-700 dark:text-rose-500 text-lg ${sellClass}` }, rate.sell.toFixed(2))
                    );
                }))
            )
        ),
        React.createElement('div', { className: "md:hidden divide-y divide-gray-200 dark:divide-gray-800" }, rates.map(rate => {
            const prevRate = (prevRates || []).find(p => p.code === rate.code) || rate;
            const buyChange = rate.buy > prevRate.buy ? 'up' : (rate.buy < prevRate.buy ? 'down' : 'same');
            const sellChange = rate.sell > prevRate.sell ? 'up' : (rate.sell < prevRate.sell ? 'down' : 'same');
            const buyClass = buyChange === 'up' ? 'animate-flash-green' : buyChange === 'down' ? 'animate-flash-red' : '';
            const sellClass = sellChange === 'up' ? 'animate-flash-green' : sellChange === 'down' ? 'animate-flash-red' : '';

            return React.createElement('div', { key: rate.code, className: "p-4 grid grid-cols-[1.5fr,1fr,1fr] gap-3 items-center" },
                React.createElement('div', { className: "flex items-center gap-2" },
                    React.createElement('span', { className: `flag-icon flag-icon-${rate.flagCode} !w-9 !h-9 flex-shrink-0` }),
                    React.createElement('div', null,
                        React.createElement('p', { className: "font-bold text-gray-800 dark:text-gray-50 text-sm" }, rate.name),
                        React.createElement('p', { className: "text-xs text-gray-500 dark:text-gray-400 font-bold font-numbers" }, rate.code)
                    )
                ),
                React.createElement('div', { key: `${rate.code}-buy-mobile-${rate.buy}`, className: `text-center rounded-md ${buyClass}` },
                    React.createElement('p', { className: "text-xs text-gray-500 dark:text-gray-400" }, 'شراء'),
                    React.createElement('p', { className: "font-numbers font-bold text-teal-700 dark:text-teal-500 text-base" }, rate.buy.toFixed(2))
                ),
                React.createElement('div', { key: `${rate.code}-sell-mobile-${rate.sell}`, className: `text-center rounded-md ${sellClass}` },
                    React.createElement('p', { className: "text-xs text-gray-500 dark:text-gray-400" }, 'بيع'),
                    React.createElement('p', { className: "font-numbers font-bold text-rose-700 dark:text-rose-500 text-base" }, rate.sell.toFixed(2))
                )
            );
        }))
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

    const ProgressTracker = ({ status }) => {
        const steps = [
            { id: 'pending', label: 'تم استلام الطلب' },
            { id: 'processing', label: 'قيد التنفيذ' },
            { id: 'completed', label: 'اكتمل التحويل' },
        ];
        const currentStepIndex = steps.findIndex(step => step.id === status);

        const CheckIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 3 }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 13l4 4L19 7" }));

        return React.createElement('div', { className: "w-full pt-4" },
            React.createElement('div', { className: "relative" },
                React.createElement('div', { className: "absolute top-5 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700", 'aria-hidden': "true" }),
                React.createElement('div', {
                    className: "absolute top-5 left-0 h-1 bg-teal-600 transition-all duration-700 ease-out",
                    style: { width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }
                }),
                React.createElement('div', { className: "flex justify-between items-start" },
                    steps.map((step, index) => {
                        const isCompleted = index < currentStepIndex;
                        const isCurrent = index === currentStepIndex;

                        const nodeClass = isCompleted || isCurrent ? 'bg-teal-600 text-white' : 'bg-gray-200 dark:bg-gray-700';
                        const labelClass = isCompleted || isCurrent ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500';

                        return React.createElement('div', { key: step.id, className: "flex-1 flex flex-col items-center text-center z-10" },
                            React.createElement('div', { className: `w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-500 ${nodeClass}` },
                                isCompleted ? React.createElement(CheckIcon) : React.createElement('span', null, index + 1)
                            ),
                            React.createElement('p', { className: `mt-2 text-xs font-bold transition-colors duration-500 ${labelClass}` }, step.label)
                        );
                    })
                )
            )
        );
    };

    const SearchIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }));

    return React.createElement('div', { className: "max-w-2xl mx-auto card p-8 shadow-2xl" },
        React.createElement('div', { className: "flex flex-col sm:flex-row gap-3" },
            React.createElement('input', { type: "text", value: trackingCode, onChange: (e) => setTrackingCode(e.target.value), className: "w-full p-4 text-lg text-center font-bold font-numbers bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-transparent focus:border-teal-500 focus:ring-2 focus:ring-teal-500/50 placeholder-gray-400 transition-colors", placeholder: "أدخل كود التتبع هنا (e.g., MS-1024)" }),
            React.createElement('button', { onClick: handleTrack, className: "px-8 py-4 rounded-lg font-bold bg-gray-800 text-white hover:bg-black dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2" }, React.createElement(SearchIcon), "تتبع")
        ),
        error && React.createElement('p', { className: "mt-4 text-center text-red-500 font-bold" }, error),
        foundOrder && React.createElement('div', { className: "mt-6 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg fade-in" },
            React.createElement(ProgressTracker, { status: foundOrder.status }),
            React.createElement('div', { className: "border-t border-gray-200 dark:border-gray-700 pt-4 mt-6 space-y-2" },
                React.createElement('div', { className: "flex justify-between items-center" }, React.createElement('p', { className: "text-gray-500 dark:text-gray-400" }, "المبلغ:"), React.createElement('p', { className: "font-bold font-numbers text-gray-800 dark:text-gray-200 text-lg" }, `${foundOrder.amount.toLocaleString()} ${foundOrder.fromCurrency}`)),
                React.createElement('div', { className: "flex justify-between items-center" }, React.createElement('p', { className: "text-gray-500 dark:text-gray-400" }, "بتاريخ:"), React.createElement('p', { className: "font-bold font-numbers text-gray-800 dark:text-gray-200" }, foundOrder.date))
            )
        )
    );
};


const TransferRoutes = ({ id }) => {
    // --- SVG Currency Icons ---
    const CurrencyIcon = ({ children, className = '' }) => (
        React.createElement('div', { className: `w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}` },
            React.createElement('span', { className: "font-numbers font-bold text-lg text-gray-700 dark:text-gray-200" }, children)
        )
    );
    const SdgIcon = () => (
        React.createElement(CurrencyIcon, { className: 'border-2 border-teal-500' }, 
            React.createElement('span', {className: 'text-teal-600 dark:text-teal-400'}, 'SDG')
        )
    );
    const RightArrowIcon = () => (
        React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6 text-gray-400 dark:text-gray-500", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 },
            React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M13 7l5 5m0 0l-5 5m5-5H6" })
        )
    );
    
    const routes = useMemo(() => [
        { from: 'USD', name: 'دولار أمريكي', icon: React.createElement(CurrencyIcon, null, '$') },
        { from: 'EUR', name: 'يورو', icon: React.createElement(CurrencyIcon, null, '€') },
        { from: 'TRY', name: 'ليرة تركية', icon: React.createElement(CurrencyIcon, null, '₺') },
        { from: 'SAR', name: 'ريال سعودي', icon: React.createElement(CurrencyIcon, null, 'ر.س') },
        { from: 'AED', name: 'درهم إماراتي', icon: React.createElement(CurrencyIcon, null, 'د.إ') },
        { from: 'EGP', name: 'جنيه مصري', icon: React.createElement(CurrencyIcon, null, 'ج.م') },
    ], []);
    
    const RouteCard = ({ route }) => {
        const message = `مرحباً ${BUSINESS_NAME}، أرغب في بدء تحويل من ${route.name} إلى جنيه سوداني.`;
        const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
        
        return React.createElement('a', {
            href: whatsappLink,
            target: "_blank",
            rel: "noopener noreferrer",
            className: "flex-shrink-0 w-72 bg-white/70 dark:bg-gray-900/70 glass-card p-6 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-in-out flex flex-col items-center text-center"
        },
            React.createElement('div', { className: "flex items-center justify-center gap-4 mb-4" },
                route.icon,
                React.createElement(RightArrowIcon),
                React.createElement(SdgIcon)
            ),
            React.createElement('h3', { className: "text-lg font-bold text-gray-800 dark:text-gray-100" }, `من ${route.name}`),
            React.createElement('p', { className: "text-sm text-gray-500 dark:text-gray-400 mb-5" }, "إلى الجنيه السوداني"),
            React.createElement('span', { className: "mt-auto w-full block text-center bg-teal-600 text-white font-bold py-3 px-4 rounded-lg text-sm transition-colors hover:bg-teal-700" }, "اطلب التحويل الآن")
        );
    };

    return React.createElement('section', { id: id, className: "py-20" },
        React.createElement('div', { className: "max-w-7xl mx-auto px-4" },
            React.createElement('div', { className: "text-center mb-12" },
                React.createElement('h2', { className: "text-3xl font-[900] text-gray-900 dark:text-gray-50" }, "مسارات التحويل السريعة"),
                React.createElement('p', { className: "mt-3 text-lg text-gray-600 dark:text-gray-400" }, "اختر أحد المسارات الأكثر شيوعاً لبدء تحويلك فوراً.")
            ),
            React.createElement('div', { className: "flex gap-8 pb-4 -mx-4 px-4 overflow-x-auto" },
                routes.map(route => React.createElement(RouteCard, { key: route.from, route: route }))
            )
        )
    );
};

const HowItWorks = ({ id }) => {
    const Step = ({ icon, title, description }) => React.createElement('div', { className: "bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 ease-in-out text-center border-t-4 border-transparent hover:border-teal-500" },
        React.createElement('div', { className: "w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-gradient-to-br from-teal-400 to-cyan-500 text-white rounded-xl shadow-lg shadow-teal-500/30" },
             React.cloneElement(icon, { className: "h-8 w-8" })
        ),
        React.createElement('h3', { className: "text-xl font-bold text-gray-900 dark:text-gray-50 mb-3" }, title),
        React.createElement('p', { className: "text-gray-600 dark:text-gray-400 leading-relaxed" }, description)
    );

    const LightningIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-8 w-8", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor"}, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13 10V3L4 14h7v7l9-11h-7z" }));
    const TrackIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-8 w-8", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor"}, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" }), React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 11a3 3 0 11-6 0 3 3 0 016 0z" }));
    const PercentIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-8 w-8", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor"}, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"}));

    const features = [
        { icon: React.createElement(LightningIcon), title: "وصول فوري للأموال", description: "تصل حوالتك للمستلم في دقائق معدودة." },
        { icon: React.createElement(TrackIcon), title: "نظام تتبع حديث وشفاف", description: "تابع حالة حوالتك خطوة بخطوة من الإرسال حتى الاستلام." },
        { icon: React.createElement(PercentIcon), title: "أفضل سعر في السوق الآن", description: "نراقب الأسعار لنقدم لك أفضل صفقة ممكنة." }
    ];
    return React.createElement('section', { id: id, className: "py-28 bg-gray-100 dark:bg-gray-950" },
        React.createElement('div', { className: "max-w-7xl mx-auto px-4" },
            React.createElement('div', { className: "text-center mb-16" },
                React.createElement('h2', { className: "text-3xl font-[900] text-gray-900 dark:text-gray-50" }, `لماذا ${BUSINESS_NAME}؟`),
                React.createElement('p', { className: "mt-3 text-lg text-gray-600 dark:text-gray-400" }, "لأننا نجمع بين السرعة، الأمان، وأفضل الأسعار.")
            ),
            React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-3 gap-8" },
                features.map((feature) => React.createElement(Step, { key: feature.title, ...feature }))
            )
        )
    );
};

const WhatsAppButton = () => {
    const message = `مرحباً ${BUSINESS_NAME}، أرغب في الاستفسار عن خدمة الصرافة.`;
    const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    return React.createElement('a', { 
        href: whatsappLink, target: "_blank", rel: "noopener noreferrer", title: "تواصل معنا عبر واتساب",
        className: "fixed bottom-6 left-6 z-50 bg-teal-600 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-2xl shadow-teal-500/40 animate-fab-pulse transition-transform duration-200 ease-in-out hover:scale-110" 
    },
        React.createElement('svg', { className: "w-9 h-9", fill: "currentColor", viewBox: "0 0 24 24" }, React.createElement('path', { d: "M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.487 5.235 3.487 8.413 0 6.557-5.338 11.892-11.894 11.892-1.99 0-3.902-.539-5.587-1.528l-6.191 1.645v-.001zM7.59 17.556c.227.357.656.556 1.054.619.41.064.819.096 1.24.096 4.83 0 8.758-3.928 8.758-8.758 0-4.829-3.928-8.758-8.758-8.758-4.829 0-8.758 3.929-8.758 8.758.001 1.95.633 3.822 1.745 5.333l.25.374-1.143 4.156 4.25-1.119.355.233z" }))
    );
};

const ScrollToTopButton = ({ isVisible }) => {
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const UpArrowIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 3 }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 15l7-7 7 7" }));

    return React.createElement('button', {
        onClick: scrollToTop,
        title: "العودة للأعلى",
        'aria-label': "Scroll to top",
        className: `fixed bottom-24 left-6 z-50 bg-gray-800 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ease-in-out hover:bg-gray-700 hover:scale-110 dark:bg-gray-700 dark:hover:bg-gray-600 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`
    },
        React.createElement(UpArrowIcon)
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
            setError('');
            setPassword('');
        } else {
            setError('كلمة المرور غير صحيحة.');
        }
    };

    return React.createElement('div', { className: "fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 fade-in", onClick: onClose },
        React.createElement('div', { className: "bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm p-8 shadow-2xl", onClick: e => e.stopPropagation() },
            React.createElement('h2', { className: "text-2xl font-bold text-center text-gray-800 dark:text-gray-50 mb-6" }, "دخول المسؤول"),
            React.createElement('form', { onSubmit: handleSubmit },
                React.createElement('div', { className: "mb-4" },
                    React.createElement('label', { htmlFor: "admin-password", className: "block text-gray-600 dark:text-gray-300 mb-2" }, "كلمة المرور"),
                    React.createElement('input', { id: "admin-password", type: "password", value: password, onChange: e => setPassword(e.target.value), className: "w-full p-3 font-numbers bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 focus:border-teal-500 text-gray-800 dark:text-gray-200" })
                ),
                error && React.createElement('p', { className: "text-red-500 text-center mb-4" }, error),
                React.createElement('button', { type: "submit", className: "w-full bg-gray-800 dark:bg-gray-700 text-white font-bold py-3 rounded-lg hover:bg-gray-900 dark:hover:bg-gray-600" }, "دخول")
            )
        )
    );
};

const AdminSection = ({ title, children }) => (
    React.createElement('div', { className: "bg-gray-900 border border-gray-800 rounded-2xl" },
        React.createElement('div', { className: "p-6 border-b border-gray-800" },
            React.createElement('h2', { className: "text-xl font-bold text-white" }, title)
        ),
        React.createElement('div', { className: "p-6" }, children)
    )
);

const AdminCard = ({ children, className }) => (
    React.createElement('div', { className: `bg-gray-900 border border-gray-800 rounded-2xl ${className}` }, children)
);

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
        React.createElement(AdminCard, { className: "p-6 flex items-center gap-6" },
            React.createElement('div', { className: "flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center bg-gray-800" },
                 React.cloneElement(icon, { className: `w-8 h-8 ${colorClass}` })
            ),
            React.createElement('div', null,
                React.createElement('p', { className: "text-md font-bold text-gray-400" }, title),
                React.createElement('p', { className: "text-3xl font-extrabold text-white font-numbers mt-1" }, format ? format(value) : value)
            )
        )
    );
    
    const StatusBadge = ({ status }) => {
        const statusStyles = {
            pending: 'bg-yellow-500/10 text-yellow-400',
            processing: 'bg-blue-500/10 text-blue-400',
            completed: 'bg-teal-500/10 text-teal-400',
        };
        const statusText = { pending: 'قيد الانتظار', processing: 'قيد التنفيذ', completed: 'مكتمل' };
        return React.createElement('span', { className: `px-3 py-1 text-xs font-bold rounded-full ${statusStyles[status]}`}, statusText[status]);
    };
    
    // Icons
    const OrdersIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth:2 }, React.createElement('path', { strokeLinecap:"round", strokeLinejoin:"round", d:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"}));
    const RatesIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth:2 }, React.createElement('path', { strokeLinecap:"round", strokeLinejoin:"round", d:"M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8v1m0 10v1m0-13a9 9 0 110 18 9 9 0 010-18z"}));
    const PendingIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth:2 }, React.createElement('path', { strokeLinecap:"round", strokeLinejoin:"round", d:"M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"}));

    return React.createElement('div', { className: "space-y-8" },
        React.createElement('div', null, 
            React.createElement('h1', { className: "text-3xl font-bold text-white mb-2" }, "لوحة القياس"),
            React.createElement('p', { className: "text-gray-400" }, "نظرة عامة على نشاطك.")
        ),
        React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" },
            React.createElement(StatCard, { title: "إجمالي التحويلات", value: metrics.totalTransfers, icon: React.createElement(OrdersIcon), colorClass: 'text-teal-400' }),
            React.createElement(StatCard, { title: "الحجم اليومي (SDG)", value: metrics.dailyVolume, icon: React.createElement(RatesIcon), format: v => v.toLocaleString(undefined, { minimumFractionDigits: 0 }), colorClass: 'text-violet-400' }),
            React.createElement(StatCard, { title: "طلبات قيد الانتظار", value: metrics.pendingTransfers, icon: React.createElement(PendingIcon), colorClass: 'text-amber-400' })
        ),
        React.createElement(AdminCard, { className: "overflow-hidden" },
            React.createElement('div', { className: "p-6 border-b border-gray-800" },
                React.createElement('h2', { className: "text-xl font-bold text-white" }, "أحدث النشاطات")
            ),
            React.createElement('div', { className: "overflow-x-auto" },
                React.createElement('table', { className: "min-w-full text-sm text-right" },
                    React.createElement('thead', { className: "bg-gray-800/50" }, React.createElement('tr', null, ['كود الطلب', 'المبلغ', 'التاريخ', 'الحالة'].map(h => React.createElement('th', { key: h, scope: "col", className: "py-3 px-6 text-xs font-bold tracking-wider text-gray-400 uppercase" }, h)))),
                    React.createElement('tbody', null,
                        recentOrders.map(order => React.createElement('tr', { key: order.id, className: "border-b border-gray-800 last:border-b-0" },
                            React.createElement('td', { className: "py-4 px-6 font-numbers text-teal-400 whitespace-nowrap" }, order.id),
                            React.createElement('td', { className: "py-4 px-6 font-numbers font-bold text-gray-200 whitespace-nowrap" }, `${order.amount.toLocaleString()} ${order.fromCurrency}`),
                            React.createElement('td', { className: "py-4 px-6 font-numbers text-gray-400 whitespace-nowrap" }, order.date),
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
        if (newStatus === 'completed' && order?.status !== 'completed') {
            setOrderToConfirm({ id: orderId, newStatus: newStatus });
            setIsConfirmModalOpen(true);
        } else {
            setOrders(prevOrders => prevOrders.map(o => (o.id === orderId ? { ...o, status: newStatus } : o)));
        }
    };

    const handleConfirmCompletion = () => {
        if (!orderToConfirm) return;
        setOrders(prevOrders => prevOrders.map(o => (o.id === orderToConfirm.id ? { ...o, status: orderToConfirm.newStatus } : o)));
        setSuccessNotification(`تم تحديث حالة الطلب ${orderToConfirm.id} إلى "مكتمل".`);
        setTimeout(() => setSuccessNotification(''), 3000);
        setIsConfirmModalOpen(false); 
        setOrderToConfirm(null);
    };

    const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children }) => {
        if (!isOpen) return null;
        return React.createElement('div', { className: "fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 fade-in", onClick: onClose },
            React.createElement('div', { className: "bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-8 shadow-2xl", onClick: e => e.stopPropagation() },
                React.createElement('h3', { className: "text-xl font-bold text-gray-50" }, title),
                React.createElement('div', { className: "mt-2 text-sm text-gray-400" }, children),
                React.createElement('div', { className: "mt-6 flex justify-end gap-3" },
                    React.createElement('button', { onClick: onClose, className: "px-5 py-2 rounded-lg font-bold bg-gray-800 text-gray-200 hover:bg-gray-700" }, "إلغاء"),
                    React.createElement('button', { onClick: onConfirm, className: "px-5 py-2 rounded-lg font-bold bg-teal-600 text-white hover:bg-teal-700" }, "تأكيد")
                )
            )
        );
    };
    
    return React.createElement('div', { className: "space-y-8" },
        React.createElement('div', null,
            React.createElement('h1', { className: "text-3xl font-bold text-white" }, "إدارة الطلبات"),
            React.createElement('p', { className: "text-gray-400 mt-2" }, "عرض وتحديث حالة جميع طلبات التحويل.")
        ),
        successNotification && React.createElement('div', { className: "bg-green-500/10 text-green-400 p-4 rounded-lg text-center font-bold fade-in" }, successNotification),
        React.createElement(AdminCard, { className: "overflow-hidden" },
            React.createElement('div', { className: "overflow-x-auto" },
                React.createElement('table', { className: "min-w-full text-sm text-right text-gray-200" },
                    React.createElement('thead', { className: "bg-gray-800/50" }, React.createElement('tr', null, ['كود الطلب', 'العميل', 'المبلغ', 'التاريخ', 'الحالة'].map(h => React.createElement('th', { key: h, scope: "col", className: "py-3 px-6 text-xs font-bold tracking-wider text-gray-400 uppercase" }, h)))),
                    React.createElement('tbody', null,
                        orders.map(order => React.createElement('tr', { key: order.id, className: "border-b border-gray-800 last:border-b-0" },
                            React.createElement('td', { className: "py-4 px-6 font-numbers text-teal-400 font-semibold whitespace-nowrap" }, order.id),
                            React.createElement('td', { className: "py-4 px-6 whitespace-nowrap" }, order.customerName),
                            React.createElement('td', { className: "py-4 px-6 font-numbers font-bold whitespace-nowrap" }, `${order.amount.toLocaleString()} ${order.fromCurrency}`),
                            React.createElement('td', { className: "py-4 px-6 font-numbers text-gray-400 whitespace-nowrap" }, order.date),
                            React.createElement('td', { className: "py-4 px-6" }, React.createElement('select', { value: order.status, onChange: (e) => handleStatusChange(order.id, e.target.value), className: "bg-gray-800 border-gray-700 text-gray-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-teal-500" }, ['pending', 'processing', 'completed'].map(s => React.createElement('option', { key: s, value: s }, { pending: 'قيد الانتظار', processing: 'قيد التنفيذ', completed: 'مكتمل' }[s]))))
                        ))
                    )
                )
            )
        ),
        React.createElement(ConfirmationModal, { isOpen: isConfirmModalOpen, onClose: () => setIsConfirmModalOpen(false), onConfirm: handleConfirmCompletion, title: "تأكيد إكمال الطلب" }, React.createElement('p', null, "هل أنت متأكد من أنك تريد تمييز الطلب رقم ", React.createElement('strong', { className: 'font-numbers text-teal-400' }, orderToConfirm?.id), " كمكتمل؟ لا يمكن التراجع عن هذا الإجراء."))
    );
};

const AdminRates = ({ rates, setRates, isDynamicPricing, setIsDynamicPricing }) => {
    const [editableRates, setEditableRates] = useState([]);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);

    useEffect(() => {
        // FIX: Add guard against non-numeric values to prevent crashes.
        setEditableRates(rates.map(r => ({ ...r, buy: (r.buy || 0).toFixed(2), sell: (r.sell || 0).toFixed(2) })));
    }, [rates]);

    const handleRateChange = (code, field, value) => {
        if (value === "" || /^\d*\.?\d*$/.test(value)) {
            setEditableRates(currentRates => currentRates.map(rate => rate.code === code ? { ...rate, [field]: value } : rate));
        }
    };

    const handleBlur = (code, field, value) => {
        const parsedValue = parseFloat(value);
        // FIX: Ensure value is a valid number before formatting.
        const finalValue = (isNaN(parsedValue) ? 0 : parsedValue).toFixed(2);
        setEditableRates(currentRates => currentRates.map(rate => rate.code === code ? { ...rate, [field]: finalValue } : rate));
    };

    const handleSave = () => {
        const sanitizedRates = editableRates.map(rate => ({ ...rate, buy: parseFloat(rate.buy) || 0, sell: parseFloat(rate.sell) || 0 }));
        setRates(sanitizedRates);
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 3000);
    };
    
    const PricingToggle = ({ isDynamic, onChange }) => (
        React.createElement('div', { className: "flex items-center gap-4" },
            React.createElement('span', { className: `font-bold transition-colors ${!isDynamic ? 'text-white' : 'text-gray-400'}` }, "تعديل يدوي"),
            React.createElement('label', { htmlFor: "pricing-toggle", className: "relative inline-flex items-center cursor-pointer" },
                React.createElement('input', { type: "checkbox", checked: isDynamic, onChange: onChange, id: "pricing-toggle", className: "sr-only peer" }),
                React.createElement('div', { className: "w-14 h-7 bg-gray-700 rounded-full peer peer-focus:ring-4 peer-focus:ring-teal-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-600 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-teal-600" })
            ),
            React.createElement('span', { className: `font-bold transition-colors ${isDynamic ? 'text-teal-400' : 'text-gray-400'}` }, "تحديث تلقائي")
        )
    );
    
    const inputBaseClasses = "w-full text-center font-numbers text-lg bg-gray-800 border-2 border-gray-700 rounded-lg p-2 transition-all duration-200 ease-in-out focus:outline-none focus:bg-gray-900 disabled:bg-transparent disabled:border-gray-800 disabled:cursor-not-allowed";

    return React.createElement('div', { className: "space-y-8" },
        React.createElement('div', null,
            React.createElement('h1', { className: "text-3xl font-bold text-white" }, "إدارة أسعار الصرف"),
            React.createElement('p', { className: "text-gray-400 mt-2" }, "التحكم في أسعار الصرف إما يدوياً أو تلقائياً.")
        ),
        showSaveSuccess && React.createElement('div', { className: "bg-green-500/10 text-green-400 p-4 rounded-lg text-center font-bold fade-in" }, "تم حفظ التغييرات بنجاح!"),
        React.createElement(AdminCard, { className: "p-6 flex flex-col md:flex-row justify-between items-center gap-4" },
             React.createElement('div', null,
                React.createElement('h3', { className: "text-lg font-bold text-white" }, "وضع التسعير"),
                React.createElement('p', { className: "text-sm text-gray-400" }, "اختر بين التحديث التلقائي للأسعار أو التعديل اليدوي.")
            ),
            React.createElement(PricingToggle, { isDynamic: isDynamicPricing, onChange: () => setIsDynamicPricing(prev => !prev) })
        ),
        React.createElement(AdminCard, { className: "overflow-hidden" },
            React.createElement('div', { className: "p-6 flex justify-between items-center border-b border-gray-800" },
                React.createElement('h2', { className: "text-xl font-bold text-white" }, "أسعار العملات"),
                React.createElement('button', { onClick: handleSave, disabled: isDynamicPricing, className: "px-5 py-2 rounded-lg font-bold bg-teal-600 text-white hover:bg-teal-700 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed" }, "حفظ التغييرات")
            ),
            React.createElement('div', { className: "overflow-x-auto" },
                React.createElement('table', { className: "min-w-full text-sm text-right" },
                    React.createElement('thead', { className: "bg-gray-800/50" }, React.createElement('tr', null, ['العملة', 'نشتري (مقابل SDG)', 'نبيع (مقابل SDG)'].map(h => React.createElement('th', { key: h, scope: "col", className: "py-3 px-6 text-xs font-bold tracking-wider text-gray-400 uppercase text-center" }, h)))),
                    React.createElement('tbody', null,
                        editableRates.map(rate => React.createElement('tr', { key: rate.code, className: "border-b border-gray-800 last:border-b-0" },
                            React.createElement('td', { className: "py-4 px-6" }, React.createElement('div', { className: "flex items-center gap-4" }, React.createElement('span', { className: `flag-icon flag-icon-${rate.flagCode} !w-8 !h-8` }), React.createElement('div', null, React.createElement('p', { className: "font-bold text-base text-gray-200" }, rate.name), React.createElement('p', { className: "font-numbers text-sm text-gray-400 font-bold" }, rate.code)))),
                            React.createElement('td', { className: "py-4 px-6 text-center font-numbers text-lg" }, React.createElement('input', { type: "text", inputMode: "decimal", value: rate.buy, onChange: e => handleRateChange(rate.code, 'buy', e.target.value), onBlur: e => handleBlur(rate.code, 'buy', e.target.value), disabled: isDynamicPricing, className: `${inputBaseClasses} text-teal-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/50` })),
                            React.createElement('td', { className: "py-4 px-6 text-center font-numbers text-lg" }, React.createElement('input', { type: "text", inputMode: "decimal", value: rate.sell, onChange: e => handleRateChange(rate.code, 'sell', e.target.value), onBlur: e => handleBlur(rate.code, 'sell', e.target.value), disabled: isDynamicPricing, className: `${inputBaseClasses} text-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/50` }))
                        ))
                    )
                )
            )
        )
    );
};

// --- ADMIN LAYOUT & STABLE HELPER COMPONENTS ---

// SVG Icons (defined once at top-level for stability)
const DashboardIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth:2 }, React.createElement('path', { strokeLinecap:"round", strokeLinejoin:"round", d:"M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"}));
const OrdersIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth:2 }, React.createElement('path', { strokeLinecap:"round", strokeLinejoin:"round", d:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"}));
const RatesIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth:2 }, React.createElement('path', { strokeLinecap:"round", strokeLinejoin:"round", d:"M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8v1m0 10v1m0-13a9 9 0 110 18 9 9 0 010-18z"}));
const LogoutIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth:2 }, React.createElement('path', { strokeLinecap:"round", strokeLinejoin:"round", d:"M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"}));
const MenuIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor"}, React.createElement('path', { strokeLinecap:"round", strokeLinejoin:"round", strokeWidth:2, d:"M4 6h16M4 12h16M4 18h16"}));
const ExchangeIconAdmin = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6 text-teal-500", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 }, React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' }));

const NavItem = ({ title, icon, isActive, onClick }) => React.createElement('button', { 
    onClick, 
    className: `w-full flex items-center gap-4 p-3 rounded-lg text-md transition-colors ${isActive ? 'bg-teal-500/10 text-teal-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}` 
}, icon, React.createElement('span', { className: 'font-bold' }, title));

const AdminSidebar = ({ currentView, setView, isOpen, setIsOpen, views, onLogout }) => {
    const handleLogout = () => {
        setIsOpen(false); // Ensure sidebar closes on mobile
        onLogout();
    };

    return React.createElement(React.Fragment, null,
        React.createElement('aside', { className: `fixed inset-y-0 right-0 z-50 w-64 bg-gray-900 border-l border-gray-800 p-4 flex flex-col transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : 'translate-x-full'}` },
            React.createElement('div', { className: "flex items-center gap-3 p-3 mb-6" }, 
                React.createElement('span', { className: "h-10 w-10 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700" }, React.createElement(ExchangeIconAdmin)), 
                React.createElement('h1', { className: "text-white text-xl font-bold" }, BUSINESS_NAME)
            ),
            React.createElement('nav', { className: "flex-grow" }, 
                React.createElement('ul', { className: "space-y-2" }, 
                    Object.keys(views).map(key => React.createElement('li', { key: key }, 
                        React.createElement(NavItem, { 
                            title: views[key].title, 
                            icon: views[key].icon, 
                            isActive: currentView === key, 
                            onClick: () => { setView(key); setIsOpen(false); } 
                        })
                    ))
                )
            ),
            React.createElement('div', { className: "mt-auto" }, 
                React.createElement(NavItem, { 
                    title: "تسجيل الخروج", 
                    icon: React.createElement(LogoutIcon), 
                    isActive: false, 
                    onClick: handleLogout 
                })
            )
        ),
        isOpen && React.createElement('div', { className: "fixed inset-0 bg-black/60 z-40 md:hidden", onClick: () => setIsOpen(false) })
    );
};

const AdminLayout = ({ rates, orders, setOrders, setRates, onLogout, isDynamicPricing, setIsDynamicPricing }) => {
    const [adminView, setAdminView] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const adminViews = {
        dashboard: { title: 'لوحة القياس', component: AdminDashboard, icon: React.createElement(DashboardIcon), props: { orders, rates } },
        orders: { title: 'إدارة الطلبات', component: AdminOrders, icon: React.createElement(OrdersIcon), props: { orders, setOrders } },
        rates: { title: 'إدارة أسعار الصرف', component: AdminRates, icon: React.createElement(RatesIcon), props: { rates, setRates, isDynamicPricing, setIsDynamicPricing } }
    };
    
    const CurrentViewComponent = adminViews[adminView].component;
    const currentViewProps = adminViews[adminView].props;

    return (
        React.createElement('div', { className: "min-h-screen flex text-gray-50 bg-gray-950" },
            React.createElement(AdminSidebar, { currentView: adminView, setView: setAdminView, isOpen: isSidebarOpen, setIsOpen: setIsSidebarOpen, views: adminViews, onLogout: onLogout }),
            React.createElement('div', { className: "flex-1 flex flex-col md:mr-64" },
                 React.createElement('header', { className: 'p-4 md:hidden sticky top-0 z-30 bg-gray-950/80 backdrop-blur-sm border-b border-gray-800 flex items-center justify-end' },
                    React.createElement('button', { onClick: () => setIsSidebarOpen(true), className: "p-2 text-gray-300 hover:bg-gray-800 rounded-lg" }, React.createElement(MenuIcon))
                ),
                React.createElement('main', { className: "flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8" },
                    React.createElement(CurrentViewComponent, currentViewProps)
                )
            )
        )
    );
};


// --- MAIN APP COMPONENT ---
const App = () => {
    const [rates, setRates] = useState(() => {
        try {
            const storedRates = localStorage.getItem('myPriceNowRates');
            return storedRates ? JSON.parse(storedRates) : INITIAL_RATES;
        } catch (error) {
            console.error("Failed to parse rates from localStorage", error);
            return INITIAL_RATES;
        }
    });
    const [orders, setOrders] = useState(() => {
        try {
            const storedOrders = localStorage.getItem('myPriceNowOrders');
            return storedOrders ? JSON.parse(storedOrders) : mockOrders;
        } catch (error) {
            console.error("Failed to parse orders from localStorage", error);
            return mockOrders;
        }
    });
    const [isDynamicPricing, setIsDynamicPricing] = useState(() => {
        const savedMode = localStorage.getItem('isDynamicPricing');
        return savedMode !== null ? JSON.parse(savedMode) : true;
    });
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
    const prevRatesRef = useRef([]);
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('hero');
    const [isScrollButtonVisible, setIsScrollButtonVisible] = useState(false);
    
    const navLinks = [
        { id: 'rates', title: 'الأسعار' }, { id: 'transfer-routes', title: 'المسارات الشائعة' }, 
        { id: 'how-it-works', title: 'لماذا نحن؟' }, { id: 'track-transfer', title: 'تتبع حوالتك' }
    ];

    const handleNavClick = (e, sectionId) => {
        e.preventDefault();
        setMobileMenuOpen(false);
        const section = document.getElementById(sectionId);
        if (section) {
            const headerEl = document.querySelector('header');
            const headerOffset = headerEl ? headerEl.offsetHeight : 80;
            const elementPosition = section.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        const sectionIds = ['hero', ...navLinks.map(l => l.id)];
        const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);

        if (sections.length === 0) return;

        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            { rootMargin: `-80px 0px -60% 0px` }
        );

        sections.forEach(section => observer.observe(section));
        return () => sections.forEach(section => { if(section) observer.unobserve(section); });
    }, []);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsScrollButtonVisible(true);
            } else {
                setIsScrollButtonVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);

        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') { root.classList.add('dark'); } else { root.classList.remove('dark'); }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => { setTheme(theme === 'light' ? 'dark' : 'light'); };

    useEffect(() => { localStorage.setItem('myPriceNowRates', JSON.stringify(rates)); }, [rates]);
    useEffect(() => { localStorage.setItem('myPriceNowOrders', JSON.stringify(orders)); }, [orders]);
    useEffect(() => { localStorage.setItem('isDynamicPricing', JSON.stringify(isDynamicPricing)); }, [isDynamicPricing]);

    useEffect(() => {
        if (!isDynamicPricing || isAdminLoggedIn) return;
        const interval = setInterval(() => setRates(prev => {
            prevRatesRef.current = prev;
            return prev.map(r => ({ ...r, buy: parseFloat((r.buy * (1 + (Math.random() - 0.5) * 0.001)).toFixed(2)), sell: parseFloat((r.sell * (1 + (Math.random() - 0.5) * 0.001)).toFixed(2)) }));
        }), 3000);
        return () => clearInterval(interval);
    }, [isDynamicPricing, isAdminLoggedIn]);

    const addOrder = (order) => setOrders(prev => [order, ...prev]);
    const handleLoginSuccess = () => { setIsAdminLoggedIn(true); setIsLoginModalOpen(false); };
    const handleLogout = () => setIsAdminLoggedIn(false);

    if (isAdminLoggedIn) {
        return React.createElement(AdminLayout, { rates, setRates, orders, setOrders, onLogout: handleLogout, isDynamicPricing, setIsDynamicPricing });
    }
    
    const ExchangeIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 }, React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' }));
    const SunIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" }));
    const MoonIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" }));

    const getNavLinkClass = (id) => {
        const base = "transition-colors hover:text-teal-500";
        const active = "text-teal-500 dark:text-teal-500 font-extrabold";
        const inactive = "text-gray-600 dark:text-gray-300";
        return `${base} ${activeSection === id && id !== 'hero' ? active : inactive}`;
    };

    return React.createElement('div', { className: "min-h-screen flex flex-col" },
        React.createElement(Ticker, { rates: rates, prevRates: prevRatesRef.current || [] }),
        React.createElement('header', { className: "sticky top-0 z-40 p-4 bg-white/70 dark:bg-gray-950/70 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-800" }, 
            React.createElement('div', { className: "max-w-7xl mx-auto flex justify-between items-center" },
                React.createElement('a', { href:"#hero", className: "flex items-center gap-3" },
                    React.createElement('span', { className: "h-10 w-10 bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 rounded-lg flex items-center justify-center border border-teal-200 dark:border-teal-800" }, React.createElement(ExchangeIcon)),
                    React.createElement('span', { className: "text-gray-900 dark:text-gray-50 text-xl font-bold" }, BUSINESS_NAME)
                ),
                React.createElement('div', { className: 'flex items-center gap-2' },
                    React.createElement('nav', { className: "hidden md:flex gap-6 items-center font-bold" },
                        navLinks.map(link => React.createElement('a', { key: link.id, href: `#${link.id}`, className: getNavLinkClass(link.id), onClick: e => handleNavClick(e, link.id)}, link.title))
                    ),
                    React.createElement('button', { onClick: toggleTheme, 'aria-label': "Toggle theme", className: "p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800" }, theme === 'light' ? React.createElement(MoonIcon) : React.createElement(SunIcon)),
                    React.createElement('button', { onClick: () => setMobileMenuOpen(!isMobileMenuOpen), className: `md:hidden p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 ${isMobileMenuOpen ? 'hamburger-active' : ''}` }, 
                        React.createElement('div', { className: "w-5 h-4 flex flex-col justify-between" }, 
                          React.createElement('span', {className: "hamburger-line line-1"}), React.createElement('span', {className: "hamburger-line line-2"}), React.createElement('span', {className: "hamburger-line line-3"})
                        )
                    )
                )
            ),
             isMobileMenuOpen && React.createElement('div', { className: "md:hidden mt-4 p-4 bg-white dark:bg-gray-900 rounded-lg shadow-lg" },
                React.createElement('nav', { className: "flex flex-col gap-4" },
                    navLinks.map(link => React.createElement('a', { key: link.id, href: `#${link.id}`, onClick: e => handleNavClick(e, link.id), className: `${getNavLinkClass(link.id)} font-bold p-2 rounded-md` }, link.title))
                )
             )
        ),
        React.createElement('main', { className: "flex-grow" },
            React.createElement('section', { id: "hero", className: "text-center pt-20 pb-24 px-4" },
                React.createElement('div', {className: "max-w-4xl mx-auto"},
                    React.createElement('h1', { className: "text-4xl md:text-5xl lg:text-6xl font-[900] text-gray-900 dark:text-gray-50 leading-tight" }, "أفضل سعر صرف،", React.createElement('span', {className: "text-gradient"}, " الآن.")),
                    React.createElement('p', { className: "mt-4 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400" }, "حوّل أموالك بأمان وسرعة فائقة. نقدم لك أفضل أسعار الصرف المحدثة لحظة بلحظة مع رسوم تحويل تنافسية."),
                    React.createElement(CurrencyConverter, { rates: rates, onAddOrder: addOrder })
                )
            ),
            React.createElement('section', { id: "rates", className: "py-20 bg-gray-100 dark:bg-gray-950" },
                React.createElement('div', { className: "max-w-7xl mx-auto px-4" },
                    React.createElement('div', { className: "text-center mb-12" },
                        React.createElement('h2', { className: "inline-block text-3xl font-[900] text-gray-900 dark:text-gray-50 pb-2 border-b-4 border-teal-500" }, "أسعار الصرف اليوم"),
                        React.createElement('p', { className: "mt-4 text-lg text-gray-600 dark:text-gray-400" }, "الأسعار محدثة مباشرة حسب سعر السوق الموازي.")
                    ),
                    React.createElement(ExchangeBoard, { rates: rates, prevRates: prevRatesRef.current })
                )
            ),
            React.createElement(TransferRoutes, { id: 'transfer-routes' }),
            React.createElement(HowItWorks, { id: "how-it-works" }),
            React.createElement('section', { id: "track-transfer", className: "py-20 bg-gray-100 dark:bg-gray-950" },
                React.createElement('div', { className: "max-w-7xl mx-auto px-4" },
                    React.createElement('div', { className: "text-center mb-12" },
                        React.createElement('h2', { className: "text-3xl font-[900] text-gray-900 dark:text-gray-50" }, "تتبع حالة حوالتك"),
                        React.createElement('p', { className: "mt-3 text-lg text-gray-600 dark:text-gray-400" }, "أدخل كود التتبع الخاص بك لمعرفة حالة طلبك الحالية.")
                    ),
                    React.createElement(TrackTransfer, { orders: orders })
                )
            )
        ),
        React.createElement('footer', { className: "bg-gray-900 dark:bg-gray-950 text-gray-400 py-12" }, 
            React.createElement('div', { className: "max-w-7xl mx-auto px-4 text-center" },
                React.createElement('p', null, `© ${new Date().getFullYear()} ${BUSINESS_NAME}. كل الحقوق محفوظة.`),
                React.createElement('button', { onClick: () => setIsLoginModalOpen(true), className: "mt-4 text-xs text-gray-500 hover:text-teal-500" }, "دخول المسؤول")
            )
        ),
        React.createElement(WhatsAppButton),
        React.createElement(ScrollToTopButton, { isVisible: isScrollButtonVisible }),
        React.createElement(AdminLoginModal, { isOpen: isLoginModalOpen, onClose: () => setIsLoginModalOpen(false), onLoginSuccess: handleLoginSuccess })
    );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(React.createElement(App));
