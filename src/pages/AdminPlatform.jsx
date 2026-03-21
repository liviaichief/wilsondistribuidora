import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle, XCircle, FileText, Calendar, CreditCard, QrCode, Loader2, X, Download } from 'lucide-react';

const initialMockMonths = [
    { id: 1, month: 'Janeiro', status: 'pago', dueDate: '05/01/2026', method: 'PIX', val: 'R$ 150,00' },
    { id: 2, month: 'Fevereiro', status: 'pago', dueDate: '05/02/2026', method: 'PIX', val: 'R$ 150,00' },
    { id: 3, month: 'Março', status: 'pendente', dueDate: '05/03/2026', method: '-', val: 'R$ 150,00' },
    { id: 4, month: 'Abril', status: 'pendente', dueDate: '05/04/2026', method: '-', val: 'R$ 150,00' },
    { id: 5, month: 'Maio', status: 'pendente', dueDate: '05/05/2026', method: '-', val: 'R$ 150,00' },
    { id: 6, month: 'Junho', status: 'pendente', dueDate: '05/06/2026', method: '-', val: 'R$ 150,00' },
    { id: 7, month: 'Julho', status: 'pendente', dueDate: '05/07/2026', method: '-', val: 'R$ 150,00' },
    { id: 8, month: 'Agosto', status: 'pendente', dueDate: '05/08/2026', method: '-', val: 'R$ 150,00' },
    { id: 9, month: 'Setembro', status: 'pendente', dueDate: '05/09/2026', method: '-', val: 'R$ 150,00' },
    { id: 10, month: 'Outubro', status: 'pendente', dueDate: '05/10/2026', method: '-', val: 'R$ 150,00' },
    { id: 11, month: 'Novembro', status: 'pendente', dueDate: '05/11/2026', method: '-', val: 'R$ 150,00' },
    { id: 12, month: 'Dezembro', status: 'pendente', dueDate: '05/12/2026', method: '-', val: 'R$ 150,00' },
];

const AdminPlatform = () => {
    const location = useLocation();
    const [months, setMonths] = useState(initialMockMonths);
    const [pixModalOpen, setPixModalOpen] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [highlightedId, setHighlightedId] = useState(null);
    const [selectedReceipt, setSelectedReceipt] = useState(null);

    useEffect(() => {
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
    };

    const simulatePayment = () => {
        setIsSimulatingPayment(true);
        // Simula o tempo de transação e callback do Banco/MercadoPago
        setTimeout(() => {
            setIsSimulatingPayment(false);
            setPaymentSuccess(true);
            
            // Atualiza os dados locais para exibir o mês como pago
            setMonths(prev => prev.map(m => {
                if(m.id === selectedMonth.id) {
                    return { ...m, status: 'pago', method: 'PIX' };
                }
                return m;
            }));

            // Fecha automaticamente o modal após um sucesso
            setTimeout(() => {
                setPixModalOpen(false);
                setSelectedMonth(null);
            }, 2000);

        }, 3000);
    };

    return (
        <div style={{ padding: '20px', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '2rem', color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                Plataforma & Faturamento
            </h2>

            <div style={{ backgroundColor: '#141414', border: '1px solid #222', borderRadius: '20px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px', flexGrow: 1 }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '20px' }}>
                    <div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>Histórico de Mensalidades (PWA)</h3>
                        <p style={{ color: '#888', fontSize: '0.9rem', marginTop: '5px' }}>Ano Base: 2026</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {months.map((m) => {
                        const isHighlighted = highlightedId === m.id;
                        return (
                        <div key={m.id} style={{ 
                            backgroundColor: '#0a0a0a', 
                            border: isHighlighted ? '2px solid #ef4444' : '1px solid #333', 
                            borderRadius: '15px', 
                            padding: '20px', 
                            display: 'flex', 
                            flexDirection: 'column',
                            boxShadow: isHighlighted ? '0 0 20px rgba(239, 68, 68, 0.3)' : 'none',
                            transform: isHighlighted ? 'scale(1.02)' : 'scale(1)',
                            transition: 'all 0.3s ease'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #222' }}>
                                <h4 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>{m.month}</h4>
                                {m.status === 'pago' ? (
                                    <div style={{ width: '35px', height: '35px', borderRadius: '10px', backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <CheckCircle size={20} />
                                    </div>
                                ) : (
                                    <div style={{ width: '35px', height: '35px', borderRadius: '10px', backgroundColor: '#222', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <XCircle size={20} />
                                    </div>
                                )}
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', flexGrow: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#888', fontSize: '0.85rem' }}>
                                        <Calendar size={14} /> Vencimento
                                    </div>
                                    <span style={{ color: '#ccc', fontWeight: 'bold', fontSize: '0.9rem' }}>{m.dueDate}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#888', fontSize: '0.85rem' }}>
                                        <CreditCard size={14} /> Pagamento
                                    </div>
                                    {m.status === 'pago' ? (
                                        <span style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '0.9rem' }}>{m.method}</span>
                                    ) : (
                                        <span style={{ color: '#666', fontWeight: 'bold', fontSize: '0.9rem' }}>N/A</span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                                    <span style={{ color: '#888', fontSize: '0.85rem' }}>Valor Mensal</span>
                                    <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.2rem' }}>{m.val}</span>
                                </div>
                            </div>

                            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {m.status === 'pago' ? (
                                    <button 
                                        onClick={() => setSelectedReceipt(m)}
                                        style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                                    >
                                        <FileText size={16} /> Ver Recibo
                                    </button>
                                ) : (
                                    <>
                                        <button disabled style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#222', color: '#666', border: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'not-allowed', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                            Aguardando
                                        </button>
                                        <button 
                                            onClick={() => openPix(m)}
                                            style={{ 
                                                width: '100%', 
                                                padding: '12px', 
                                                borderRadius: '10px', 
                                                backgroundColor: isHighlighted ? '#22c55e' : 'rgba(34,197,94,0.1)', 
                                                color: isHighlighted ? '#fff' : '#22c55e', 
                                                border: isHighlighted ? 'none' : '1px solid rgba(34,197,94,0.2)', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                gap: '8px', 
                                                cursor: 'pointer', 
                                                fontWeight: 'bold', 
                                                fontSize: '0.85rem',
                                                animation: isHighlighted ? 'pulse 1.5s infinite' : 'none',
                                                boxShadow: isHighlighted ? '0 4px 15px rgba(34, 197, 94, 0.4)' : 'none'
                                            }}
                                        >
                                            <QrCode size={16} /> Ver Chave PIX
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )})}
                </div>
            </div>

            {/* Modal de Pagamento PIX */}
            {pixModalOpen && selectedMonth && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', padding: '20px' }}>
                    <div style={{ backgroundColor: '#141414', border: '1px solid #333', borderRadius: '25px', padding: '40px', maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', position: 'relative' }}>
                        <button 
                            onClick={() => { if(!isSimulatingPayment) setPixModalOpen(false) }} 
                            style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}
                        >
                            <XCircle size={24} />
                        </button>
                        
                        <div style={{ marginBottom: '20px', color: '#22c55e', display: 'flex', justifyContent: 'center' }}>
                            <QrCode size={48} />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', marginBottom: '10px' }}>Pagar Fatura - {selectedMonth.month}</h2>
                        <p style={{ color: '#888', fontSize: '0.95rem', marginBottom: '25px' }}>
                            Escaneie o QR Code abaixo pelo aplicativo do seu banco para quitar a parcela de {selectedMonth.val}.
                        </p>

                        {!paymentSuccess ? (
                            <>
                                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '20px', display: 'inline-block', marginBottom: '30px' }}>
                                    {/* Um QRCode Falso Estilizado */}
                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=mercado_pago_invoice_${selectedMonth.id}`} alt="QR Code PIX" style={{ width: '200px', height: '200px', borderRadius: '10px' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <button 
                                        onClick={simulatePayment}
                                        disabled={isSimulatingPayment}
                                        style={{ width: '100%', padding: '15px', borderRadius: '12px', backgroundColor: '#22c55e', color: '#fff', fontWeight: 'bold', border: 'none', cursor: isSimulatingPayment ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '1rem', transition: 'all 0.3s' }}
                                    >
                                        {isSimulatingPayment ? <Loader2 size={18} className="animate-spin" /> : <QrCode size={18} />}
                                        {isSimulatingPayment ? 'Processando transação...' : 'Simular Pagamento API'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                    <CheckCircle size={48} />
                                </div>
                                <h3 style={{ fontSize: '1.4rem', color: '#22c55e', fontWeight: 'bold', marginBottom: '10px' }}>Pagamento Confirmado!</h3>
                                <p style={{ color: '#888', fontSize: '0.9rem' }}>O recibo já está anexado à fatura.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Receipt Modal */}
            {selectedReceipt && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', padding: '20px' }}>
                    <div style={{ backgroundColor: '#141414', border: '1px solid #333', borderRadius: '25px', width: '100%', maxWidth: '400px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 25px', borderBottom: '1px solid #222' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                                <FileText size={20} style={{ color: '#3b82f6' }} />
                                Recibo - {selectedReceipt.month}
                            </h3>
                            <button 
                                onClick={() => setSelectedReceipt(null)}
                                style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}
                            >
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#fff', margin: '20px', borderRadius: '15px' }}>
                            <div style={{ width: '100%', textAlign: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px', marginBottom: '15px' }}>
                                <h4 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1f2937', margin: '0 0 5px 0' }}>Boutique de Carne</h4>
                                <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0 }}>Recibo de Pagamento</p>
                            </div>
                            
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', fontWeight: 'bold', color: '#374151' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#6b7280' }}>Referência:</span>
                                    <span>{selectedReceipt.month} / 2026</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#6b7280' }}>Data:</span>
                                    <span>{selectedReceipt.dueDate}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#6b7280' }}>Método:</span>
                                    <span>{selectedReceipt.method}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '15px', marginTop: '5px', borderTop: '1px solid #e5e7eb', fontSize: '1.2rem', color: '#000', fontWeight: 900 }}>
                                    <span>Total:</span>
                                    <span>{selectedReceipt.val}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '20px', backgroundColor: '#0a0a0a', borderTop: '1px solid #222', display: 'flex', gap: '15px' }}>
                            <button 
                                onClick={() => setSelectedReceipt(null)}
                                style={{ flex: 1, padding: '15px', borderRadius: '12px', backgroundColor: '#222', color: '#aaa', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.8rem', border: 'none', cursor: 'pointer' }}
                            >
                                Fechar
                            </button>
                            <button 
                                onClick={() => alert('Download do recibo em PDF iniciado...')}
                                style={{ flex: 1, padding: '15px', borderRadius: '12px', backgroundColor: '#2563eb', color: '#fff', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.8rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                <Download size={16} /> Baixar PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPlatform;
