import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle, XCircle, FileText, Calendar, CreditCard, QrCode, Loader2, X, Download, Copy, ExternalLink, ShieldCheck, DollarSign, Wallet, ArrowRight, CheckCircle2, AlertTriangle, TrendingUp, Landmark, Clock } from 'lucide-react';
import { databases, DATABASE_ID } from '../lib/appwrite';
import { Client as AppwriteClient, Functions as AppwriteFunctions, Databases as AppwriteDatabases, ID as AppwriteID, Query as AppwriteQuery } from 'appwrite';
import html2pdf from 'html2pdf.js';
import { motion, AnimatePresence } from 'framer-motion';

const orchestratorClient = new AppwriteClient()
    .setEndpoint('https://sfo.cloud.appwrite.io/v1')
    .setProject('69c600d700288be4f750');

const orchestratorFunctions = new AppwriteFunctions(orchestratorClient);
const orchestratorDb = new AppwriteDatabases(orchestratorClient);

const initialMockMonths = [
    { id: 1, month: 'Janeiro', status: 'pago', dueDate: '05/01/2026', method: 'PIX', val: 'R$ 200,00' },
    { id: 2, month: 'Fevereiro', status: 'pago', dueDate: '05/02/2026', method: 'PIX', val: 'R$ 200,00' },
    { id: 3, month: 'Março', status: 'pendente', dueDate: '05/03/2026', method: '-', val: 'R$ 200,00' },
    { id: 4, month: 'Abril', status: 'pendente', dueDate: '05/04/2026', method: '-', val: 'R$ 200,00' },
    { id: 5, month: 'Maio', status: 'pendente', dueDate: '05/05/2026', method: '-', val: 'R$ 200,00' },
    { id: 6, month: 'Junho', status: 'pendente', dueDate: '05/06/2026', method: '-', val: 'R$ 200,00' },
    { id: 7, month: 'Julho', status: 'pendente', dueDate: '05/07/2026', method: '-', val: 'R$ 200,00' },
    { id: 8, month: 'Agosto', status: 'pendente', dueDate: '05/08/2026', method: '-', val: 'R$ 200,00' },
    { id: 9, month: 'Setembro', status: 'pendente', dueDate: '05/09/2026', method: '-', val: 'R$ 200,00' },
    { id: 10, month: 'Outubro', status: 'pendente', dueDate: '05/10/2026', method: '-', val: 'R$ 200,00' },
    { id: 11, month: 'Novembro', status: 'pendente', dueDate: '05/11/2026', method: '-', val: 'R$ 200,00' },
    { id: 12, month: 'Dezembro', status: 'pendente', dueDate: '05/12/2026', method: '-', val: 'R$ 200,00' },
];

const AdminFinance = () => {
    const location = useLocation();
    const [months, setMonths] = useState(initialMockMonths);
    const [pixModalOpen, setPixModalOpen] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [highlightedId, setHighlightedId] = useState(null);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [realPixData, setRealPixData] = useState(null);

    useEffect(() => {
        orchestratorDb.listDocuments('admin_billing_db', 'subscriptions', [AppwriteQuery.equal('system_id', 'boutique')])
            .then(res => {
                if (res.documents.length > 0) {
                    setMonths(prev => prev.map(m => {
                        const dbMatch = res.documents.find(doc => doc.month_year.includes(m.month));
                        if(dbMatch && dbMatch.status === 'pago') {
                            const [methodName, txId] = (dbMatch.payment_method || '').split('::');
                            return {
                                ...m,
                                status: 'pago',
                                method: 'PIX Institucional',
                                val: `R$ ${Number(dbMatch.amount).toFixed(2).replace('.', ',')}`,
                                transactionId: txId || dbMatch.$id,
                                paymentDate: new Date(dbMatch.$createdAt).toLocaleString('pt-BR'),
                                institution: 'Mercado Pago'
                            };
                        }
                        return m;
                    }));
                }
            })
            .catch(err => console.warn("Erro ao puxar histórico de pagamentos:", err));

        const params = new URLSearchParams(location.search);
        if (params.get('highlight') === 'true') {
            const firstPending = months.find(m => m.status === 'pendente');
            if (firstPending) {
                setHighlightedId(firstPending.id);
            }
        } else {
            setHighlightedId(null);
        }
    }, [location.search, months]);

    const openPix = (month) => {
        setSelectedMonth(month);
        setPixModalOpen(true);
        setIsSimulatingPayment(false);
        setPaymentSuccess(false);
        setRealPixData(null);
    };

    useEffect(() => {
        let interval;
        if (realPixData?.id && pixModalOpen && !paymentSuccess) {
            interval = setInterval(async () => {
                try {
                    const res = await orchestratorFunctions.createExecution('check_pix_status_fn', JSON.stringify({ 
                        payment_id: String(realPixData.id),
                        system_id: 'boutique' 
                    }));
                    
                    const statusData = JSON.parse(res.responseBody);
                    
                    if (statusData.status === 'approved' || statusData.status === 'pago') {
                        clearInterval(interval);
                        setPaymentSuccess(true);
                        
                        const txId = statusData.id || statusData.payment_id || realPixData.id;
                        const paidAmount = Number(selectedMonth.val.replace('R$', '').trim().replace(',', '.')) || 200;
                        
                        try {
                            const payloadSub = {
                                system_id: 'boutique',
                                month_year: `${selectedMonth.month}/2026`,
                                amount: paidAmount,
                                status: 'pago',
                                payment_method: `PIX::${txId}`.substring(0, 48)
                            };
                            await orchestratorDb.createDocument('admin_billing_db', 'subscriptions', AppwriteID.unique(), payloadSub);
                        } catch (err) {
                            console.warn("Erro ao registrar no Orquestrador Central:", err);
                        }

                        try {
                            await databases.updateDocument(DATABASE_ID, 'settings', 'system_blocked', { value: 'false' });
                        } catch (err) { console.warn("Erro ao desbloquear sistema localmente:", err); }

                        setMonths(prev => prev.map(m => {
                            if(m.id === selectedMonth.id) {
                                return { 
                                    ...m, 
                                    status: 'pago', 
                                    method: 'PIX Institucional',
                                    transactionId: txId,
                                    paymentDate: new Date().toLocaleString('pt-BR'),
                                    institution: 'Mercado Pago'
                                };
                            }
                            return m;
                        }));

                        setTimeout(() => {
                            setPixModalOpen(false);
                            setSelectedMonth(null);
                            setRealPixData(null);
                        }, 3000);
                    }
                } catch (e) {
                    console.error("Erro ao verificar status do PIX:", e);
                }
            }, 4000);
        }
        return () => clearInterval(interval);
    }, [realPixData, pixModalOpen, paymentSuccess, selectedMonth]);

    const handlePayment = async () => {
        setIsSimulatingPayment(true);
        try {
            const amountCleanStr = selectedMonth.val.replace('R$', '').trim().replace(',', '.');
            const numericAmount = Number(amountCleanStr) || 200;

            const payload = JSON.stringify({
                system_id: 'boutique',
                amount: numericAmount,
                description: `Mensalidade SaaS - ${selectedMonth.month}`,
                payer_email: 'admin@boutique3r.com.br',
                payer_name: 'Boutique Admin'
            });

            const res = await orchestratorFunctions.createExecution('generate_pix_fn', payload, false, '/', 'POST', { 'Content-Type': 'application/json' });
            
            let data;
            try { data = JSON.parse(res.responseBody); } catch(e) { data = { success: false, message: 'Resposta inválida' }; }

            if (res.status === 'completed' && data.success) {
                setRealPixData({
                    id: data.payment_id || data.id,
                    qr_code_base64: data.qr_code_base64,
                    qr_code: data.qr_code,
                    ticket_url: data.ticket_url
                });
            } else {
                alert(`Erro MP: ${data.message || 'Falha desconhecida'}`);
            }
        } catch (error) {
            console.error("Falha técnica:", error);
        } finally {
            setIsSimulatingPayment(false);
        }
    };

    const handleDownloadPDF = () => {
        const element = document.getElementById('receipt-content');
        if (!element) return;

        const opt = {
            margin: [10, 10, 10, 10],
            filename: `Recibo_BaseApp_${selectedReceipt?.month}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        const clone = element.cloneNode(true);
        clone.style.backgroundColor = '#ffffff';
        clone.style.padding = '40px';
        clone.style.borderRadius = '0px';

        const wrapper = document.createElement('div');
        wrapper.appendChild(clone);
        document.body.appendChild(wrapper);

        html2pdf().from(wrapper).set(opt).save().then(() => {
            document.body.removeChild(wrapper);
        });
    };

    return (
        <div style={{ padding: '40px', maxWidth: '1600px', margin: '0 auto' }}>

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ 
                    background: 'rgba(255,255,255,0.03)', 
                    padding: '40px', 
                    borderRadius: '30px', 
                    border: '1px solid rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37' }}>
                            <TrendingUp size={24} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Histórico de Mensalidades</h3>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '12px', fontSize: '0.9rem', color: '#888', fontWeight: 600 }}>
                        Ano Base: <span style={{ color: '#fff' }}>2026</span>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' }}>
                    {months.map((m, index) => {
                        const isHighlighted = highlightedId === m.id;
                        const isPaid = m.status === 'pago';
                        
                        return (
                            <motion.div 
                                key={m.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ y: -5 }}
                                style={{ 
                                    backgroundColor: isPaid ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.2)', 
                                    border: isHighlighted ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.05)', 
                                    borderRadius: '24px', 
                                    padding: '25px', 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    boxShadow: isHighlighted ? '0 0 30px rgba(239, 68, 68, 0.2)' : 'none',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                {isHighlighted && (
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#ef4444' }} />
                                )}
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', margin: 0 }}>{m.month}</h4>
                                    <div style={{ 
                                        padding: '8px', 
                                        borderRadius: '12px', 
                                        backgroundColor: isPaid ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.05)', 
                                        color: isPaid ? '#22c55e' : '#666' 
                                    }}>
                                        {isPaid ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '0.85rem', fontWeight: 700 }}>
                                            <Calendar size={14} /> VENCIMENTO
                                        </div>
                                        <span style={{ color: '#aaa', fontWeight: 700, fontSize: '0.9rem' }}>{m.dueDate}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '0.85rem', fontWeight: 700 }}>
                                            <Landmark size={14} /> MÉTODO
                                        </div>
                                        <span style={{ color: isPaid ? '#22c55e' : '#444', fontWeight: 700, fontSize: '0.9rem' }}>{isPaid ? m.method : '-'}</span>
                                    </div>
                                    <div style={{ marginTop: '5px', padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#666', fontSize: '0.8rem', fontWeight: 800 }}>VALOR</span>
                                        <span style={{ color: '#fff', fontWeight: 900, fontSize: '1.3rem' }}>{m.val}</span>
                                    </div>
                                </div>

                                <div style={{ marginTop: 'auto' }}>
                                    {isPaid ? (
                                        <button 
                                            onClick={() => setSelectedReceipt(m)}
                                            style={{ 
                                                width: '100%', 
                                                padding: '14px', 
                                                borderRadius: '16px', 
                                                backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                                                color: '#3b82f6', 
                                                border: '1px solid rgba(59, 130, 246, 0.2)', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                gap: '10px', 
                                                cursor: 'pointer', 
                                                fontWeight: 800, 
                                                fontSize: '0.9rem',
                                                transition: 'all 0.3s'
                                            }}
                                        >
                                            <FileText size={18} /> VER RECIBO
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => openPix(m)}
                                            style={{ 
                                                width: '100%', 
                                                padding: '14px', 
                                                borderRadius: '16px', 
                                                backgroundColor: isHighlighted ? '#ef4444' : 'rgba(34, 197, 94, 0.1)', 
                                                color: isHighlighted ? '#fff' : '#22c55e', 
                                                border: isHighlighted ? 'none' : '1px solid rgba(34, 197, 94, 0.2)', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                gap: '10px', 
                                                cursor: 'pointer', 
                                                fontWeight: 900, 
                                                fontSize: '0.9rem',
                                                boxShadow: isHighlighted ? '0 10px 20px rgba(239, 68, 68, 0.2)' : 'none',
                                                transition: 'all 0.3s'
                                            }}
                                        >
                                            <QrCode size={18} /> PAGAR AGORA
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>

            {/* PIX Modal */}
            <AnimatePresence>
                {pixModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', padding: '20px' }}>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            style={{ backgroundColor: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '30px', padding: '40px', maxWidth: '450px', width: '100%', textAlign: 'center', boxShadow: '0 40px 100px rgba(0,0,0,0.8)', position: 'relative' }}
                        >
                            <button 
                                onClick={() => { if(!isSimulatingPayment) setPixModalOpen(false) }} 
                                style={{ position: 'absolute', top: '25px', right: '25px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#666', cursor: 'pointer', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <X size={24} />
                            </button>
                            
                            <div style={{ marginBottom: '25px', color: '#22c55e', display: 'flex', justifyContent: 'center' }}>
                                <div style={{ padding: '20px', borderRadius: '25px', background: 'rgba(34, 197, 94, 0.1)' }}>
                                    <QrCode size={48} />
                                </div>
                            </div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', marginBottom: '10px' }}>Checkout PIX</h2>
                            <p style={{ color: '#888', fontSize: '1rem', marginBottom: '30px', lineHeight: 1.5 }}>
                                Escaneie ou copie o código para realizar o pagamento de <strong style={{ color: '#fff' }}>{selectedMonth.val}</strong> referente ao mês de {selectedMonth.month}.
                            </p>

                            {!paymentSuccess ? (
                                <>
                                    {realPixData && realPixData.qr_code_base64 && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '24px', display: 'inline-block', marginBottom: '30px', boxShadow: '0 10px 30px rgba(255,255,255,0.1)' }}
                                        >
                                            <img src={`data:image/jpeg;base64,${realPixData.qr_code_base64}`} alt="QR Code" style={{ width: '220px', height: '220px' }} />
                                        </motion.div>
                                    )}
                                    
                                    {realPixData && realPixData.qr_code && (
                                        <div style={{ marginBottom: '30px', textAlign: 'left' }}>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <input 
                                                    readOnly 
                                                    value={realPixData.qr_code} 
                                                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#aaa', padding: '15px', borderRadius: '14px', fontSize: '0.85rem', outline: 'none' }}
                                                />
                                                <button 
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(realPixData.qr_code);
                                                        alert("Copiado!");
                                                    }}
                                                    style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '14px', cursor: 'pointer' }}
                                                >
                                                    <Copy size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        {realPixData ? (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', color: '#22c55e', fontSize: '0.95rem', padding: '15px', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '16px', backgroundColor: 'rgba(34, 197, 94, 0.05)', fontWeight: 700 }}>
                                                <Loader2 size={18} className="animate-spin" />
                                                AGUARDANDO PAGAMENTO...
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={handlePayment}
                                                disabled={isSimulatingPayment}
                                                style={{ width: '100%', padding: '18px', borderRadius: '16px', backgroundColor: '#22c55e', color: '#000', fontWeight: 900, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontSize: '1.1rem' }}
                                            >
                                                {isSimulatingPayment ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle2 size={24} />}
                                                {isSimulatingPayment ? 'PROCESSANDO...' : 'GERAR QR CODE'}
                                            </button>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    style={{ padding: '40px 0' }}
                                >
                                    <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 25px' }}>
                                        <CheckCircle2 size={60} />
                                    </div>
                                    <h2 style={{ fontSize: '1.8rem', color: '#22c55e', fontWeight: 900, marginBottom: '10px' }}>PAGO COM SUCESSO!</h2>
                                    <p style={{ color: '#888', fontSize: '1.1rem' }}>Seu acesso foi renovado automaticamente.</p>
                                </motion.div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Receipt Modal */}
            <AnimatePresence>
                {selectedReceipt && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', padding: '20px' }}>
                        <motion.div 
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            style={{ backgroundColor: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '30px', width: '100%', maxWidth: '450px', overflow: 'hidden', boxShadow: '0 50px 120px rgba(0,0,0,0.8)' }}
                        >
                            <div style={{ padding: '30px 40px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                                        <FileText size={24} />
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Recibo Digital</h3>
                                </div>
                                <button onClick={() => setSelectedReceipt(null)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}><X size={24} /></button>
                            </div>
                            
                            <div style={{ padding: '40px' }}>
                                <div id="receipt-content" style={{ padding: '40px', backgroundColor: '#fff', borderRadius: '24px', color: '#000' }}>
                                    <div style={{ textAlign: 'center', borderBottom: '2px solid #f0f0f0', paddingBottom: '25px', marginBottom: '30px' }}>
                                        <h4 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: '#000', letterSpacing: '-1px' }}>Wilson Distribuidora</h4>
                                        <p style={{ margin: '5px 0 0 0', color: '#888', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase' }}>COMPROVANTE DE LICENCIAMENTO</p>
                                    </div>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f5f5f5', paddingBottom: '10px' }}>
                                            <span style={{ color: '#999', fontSize: '0.85rem', fontWeight: 700 }}>REFERÊNCIA</span>
                                            <span style={{ fontWeight: 800 }}>{selectedReceipt.month} / 2026</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f5f5f5', paddingBottom: '10px' }}>
                                            <span style={{ color: '#999', fontSize: '0.85rem', fontWeight: 700 }}>DATA</span>
                                            <span style={{ fontWeight: 800 }}>{selectedReceipt.paymentDate}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f5f5f5', paddingBottom: '10px' }}>
                                            <span style={{ color: '#999', fontSize: '0.85rem', fontWeight: 700 }}>MÉTODO</span>
                                            <span style={{ fontWeight: 800, color: '#22c55e' }}>{selectedReceipt.institution}</span>
                                        </div>
                                        <div style={{ marginTop: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: '#000', fontWeight: 900, fontSize: '1rem' }}>TOTAL PAGO</span>
                                            <span style={{ color: '#000', fontWeight: 900, fontSize: '1.8rem' }}>{selectedReceipt.val}</span>
                                        </div>
                                        <div style={{ marginTop: '10px', textAlign: 'center' }}>
                                            <span style={{ fontSize: '0.65rem', color: '#ccc', fontFamily: 'monospace', wordBreak: 'break-all' }}>AUTH: {selectedReceipt.transactionId}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '0 40px 40px', display: 'flex', gap: '15px' }}>
                                <button 
                                    onClick={handleDownloadPDF}
                                    style={{ flex: 1, padding: '18px', borderRadius: '18px', backgroundColor: '#3b82f6', color: '#fff', fontWeight: 900, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 10px 20px rgba(59, 130, 246, 0.2)' }}
                                >
                                    <Download size={20} /> PDF
                                </button>
                                <button 
                                    onClick={() => setSelectedReceipt(null)}
                                    style={{ flex: 1, padding: '18px', borderRadius: '18px', backgroundColor: 'rgba(255,255,255,0.05)', color: '#888', fontWeight: 800, border: 'none', cursor: 'pointer' }}
                                >
                                    FECHAR
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            
            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); box-shadow: 0 4px 15px rgba(34, 197, 94, 0.4); }
                    50% { transform: scale(1.02); box-shadow: 0 4px 25px rgba(34, 197, 94, 0.6); }
                    100% { transform: scale(1); box-shadow: 0 4px 15px rgba(34, 197, 94, 0.4); }
                }
            `}</style>
        </div>
    );
};

export default AdminFinance;
