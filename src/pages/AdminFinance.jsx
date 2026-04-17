import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle, XCircle, FileText, Calendar, CreditCard, QrCode, Loader2, X, Download, Copy, ExternalLink } from 'lucide-react';
import { functions, databases, DATABASE_ID } from '../lib/appwrite';
import { Client as AppwriteClient, Functions as AppwriteFunctions, Databases as AppwriteDatabases, ID as AppwriteID, Query as AppwriteQuery } from 'appwrite';
import html2pdf from 'html2pdf.js';

const orchestratorClient = new AppwriteClient()
    .setEndpoint('https://sfo.cloud.appwrite.io/v1')
    .setProject('69c600d700288be4f750');

const orchestratorFunctions = new AppwriteFunctions(orchestratorClient);
const orchestratorDb = new AppwriteDatabases(orchestratorClient);

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
        // Busca pagamentos já realizados no Orquestrador
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
            // Polling para verificar se o pagamento foi aprovado
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
                        const dateNow = new Date().toLocaleString('pt-BR');
                        const paidAmount = Number(selectedMonth.val.replace('R$', '').trim().replace(',', '.')) || 150;
                        
                        // --- Gravação no Orquestrador ---
                        try {
                            const payloadSub = {
                                system_id: 'boutique',
                                month_year: `${selectedMonth.month}/2026`,
                                amount: paidAmount,
                                status: 'pago',
                                payment_method: `PIX::${txId}`.substring(0, 48)
                            };
                            console.log("Registrando no banco do orquestrador...", payloadSub);
                            await orchestratorDb.createDocument('admin_billing_db', 'subscriptions', AppwriteID.unique(), payloadSub);
                        } catch (err) {
                            console.warn("Erro ao registrar no Orquestrador Central:", err);
                        }

                        // --- Lógica de Desbloqueio (Teste de Integração) ---
                        try {
                            await databases.updateDocument(DATABASE_ID, 'settings', 'system_blocked', { value: 'false' });
                        } catch (err) { console.warn("Erro ao desbloquear sistema localmente:", err); }

                        // Atualiza o estado local das mensalidades
                        setMonths(prev => prev.map(m => {
                            if(m.id === selectedMonth.id) {
                                return { 
                                    ...m, 
                                    status: 'pago', 
                                    method: 'PIX Institucional',
                                    transactionId: statusData.id || statusData.payment_id || realPixData.id,
                                    paymentDate: new Date().toLocaleString('pt-BR'),
                                    institution: 'Mercado Pago'
                                };
                            }
                            return m;
                        }));

                        // Fecha o modal após 3 segundos de sucesso
                        setTimeout(() => {
                            setPixModalOpen(false);
                            setSelectedMonth(null);
                            setRealPixData(null);
                        }, 3000);
                    }
                } catch (e) {
                    console.error("Erro ao verificar status do PIX:", e);
                }
            }, 4000); // Verifica a cada 4 segundos
        }
        return () => clearInterval(interval);
    }, [realPixData, pixModalOpen, paymentSuccess, selectedMonth]);



    const handlePayment = async () => {
        setIsSimulatingPayment(true);
        
        try {
            // Normaliza o valor para envio: tira R$, troca vírgula por ponto.
            const amountCleanStr = selectedMonth.val.replace('R$', '').trim().replace(',', '.');
            const numericAmount = Number(amountCleanStr) || 150;

            const payload = JSON.stringify({
                system_id: 'boutique',
                amount: numericAmount,
                description: `Mensalidade SaaS - ${selectedMonth.month}`,
                payer_email: 'admin@boutique3r.com.br',
                payer_name: 'Boutique Admin'
            });

            // Chama a Function do Appwrite no Orquestrador para gerar o PIX no Mercado Pago
            const res = await orchestratorFunctions.createExecution('generate_pix_fn', payload, false, '/', 'POST', { 'Content-Type': 'application/json' });
            
            let data;
            try { 
                data = JSON.parse(res.responseBody); 
            } catch(e) { 
                data = { success: false, message: 'Resposta inválida do servidor' }; 
            }

            if (res.status === 'completed' && data.success) {
                setRealPixData({
                    id: data.payment_id || data.id,
                    qr_code_base64: data.qr_code_base64,
                    qr_code: data.qr_code,
                    ticket_url: data.ticket_url
                });
                setIsSimulatingPayment(false);
                return;
            } else {
                console.warn("Function generate_pix_fn retornou erro ou não integrada:", data);
                alert(`Erro MP: ${data.message || 'Falha desconhecida'}`);
                setIsSimulatingPayment(false);
            }
        } catch (error) {
            console.error("Falha técnica ao chamar generate_pix_fn:", error);
            alert("Erro ao conectar com o serviço PIX (Mercado Pago). Verifique o console.");
            setIsSimulatingPayment(false);
        }
    };

    const handleDownloadPDF = () => {
        const element = document.getElementById('receipt-content');
        if (!element) return;

        const opt = {
            margin:       [10, 10, 10, 10],
            filename:     `Recibo_Boutique_${selectedReceipt?.month}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, logging: false },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        const clone = element.cloneNode(true);
        clone.style.backgroundColor = '#ffffff';
        clone.style.padding = '40px';
        clone.style.margin = '0px';
        clone.style.borderRadius = '0px';

        const wrapper = document.createElement('div');
        wrapper.appendChild(clone);
        document.body.appendChild(wrapper);

        html2pdf().from(wrapper).set(opt).save().then(() => {
            document.body.removeChild(wrapper);
        });
    };

    return (
        <div style={{ padding: '20px', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '2rem', color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                Financeiro & Faturamento
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
                            boxShadow: isHighlighted ? '0 0 20px rgba(239, 68, 68, 0.39)' : 'none',
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#888', fontSize: '0.85rem', flexShrink: 0 }}>
                                        <Calendar size={14} /> Vencimento
                                    </div>
                                    <span style={{ color: '#ccc', fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'right', wordBreak: 'break-word', minWidth: 0 }}>{m.dueDate}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#888', fontSize: '0.85rem', flexShrink: 0 }}>
                                        <CreditCard size={14} /> Pagamento
                                    </div>
                                    {m.status === 'pago' ? (
                                        <span style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'right', wordBreak: 'break-word', minWidth: 0, lineHeight: 1.2 }}>{m.method}</span>
                                    ) : (
                                        <span style={{ color: '#666', fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'right', minWidth: 0 }}>N/A</span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                                    <span style={{ color: '#888', fontSize: '0.85rem' }}>Valor Mensal</span>
                                    {m.status === 'pago' ? (
                                        <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.2rem' }}>{m.val}</span>
                                    ) : (
                                        <input
                                            type="text"
                                            value={m.val}
                                            onChange={(e) => {
                                                const newVal = e.target.value;
                                                setMonths(prev => prev.map(month => month.id === m.id ? { ...month, val: newVal } : month));
                                            }}
                                            style={{ backgroundColor: '#0a0a0a', color: '#fff', border: '1px dashed #555', borderRadius: '6px', padding: '4px 8px', width: '110px', fontSize: '1.1rem', fontWeight: 'bold', textAlign: 'right', outline: 'none' }}
                                            title="Editar valor para testes"
                                        />
                                    )}
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
                                {realPixData && realPixData.qr_code_base64 && (
                                    <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '20px', display: 'inline-block', marginBottom: '30px' }}>
                                        <img src={`data:image/jpeg;base64,${realPixData.qr_code_base64}`} alt="QR Code PIX Mercado Pago" style={{ width: '200px', height: '200px', borderRadius: '10px' }} />
                                    </div>
                                )}
                                
                                {realPixData && realPixData.qr_code && (
                                    <div style={{ marginBottom: '25px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <p style={{ color: '#aaa', fontSize: '0.8rem', fontWeight: 'bold' }}>PIX Copia e Cola:</p>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <input 
                                                readOnly 
                                                value={realPixData.qr_code} 
                                                style={{ flex: 1, backgroundColor: '#0a0a0a', border: '1px solid #333', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '0.8rem' }}
                                            />
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(realPixData.qr_code);
                                                    alert("PIX copiado!");
                                                }}
                                                style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                title="Copiar PIX"
                                            >
                                                <Copy size={16} />
                                            </button>
                                        </div>
                                        {realPixData.ticket_url && (
                                            <a 
                                                href={realPixData.ticket_url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                style={{ alignSelf: 'center', marginTop: '10px', color: '#3b82f6', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none' }}
                                            >
                                                <ExternalLink size={16} /> Ver no Mercado Pago
                                            </a>
                                        )}
                                    </div>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {realPixData ? (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#888', fontSize: '0.9rem', padding: '10px', border: '1px solid #333', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                                            <Loader2 size={16} className="animate-spin text-blue-500" />
                                            Verificando recebimento automaticamente...
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={handlePayment}
                                            disabled={isSimulatingPayment}
                                            style={{ width: '100%', padding: '15px', borderRadius: '12px', backgroundColor: '#22c55e', color: '#fff', fontWeight: 'bold', border: 'none', cursor: isSimulatingPayment ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '1rem', transition: 'all 0.3s' }}
                                        >
                                            {isSimulatingPayment ? <Loader2 size={18} className="animate-spin" /> : <QrCode size={18} />}
                                            {isSimulatingPayment ? 'Processando transação...' : 'Gerar Pagamento PIX'}
                                        </button>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                    <CheckCircle size={48} />
                                </div>
                                <h2 style={{ fontSize: '1.4rem', color: '#22c55e', fontWeight: 'bold', marginBottom: '10px' }}>Pagamento Confirmado!</h2>
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
                        
                        <div id="receipt-content" style={{ padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#fff', margin: '20px', borderRadius: '15px' }}>
                            <div style={{ width: '100%', textAlign: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px', marginBottom: '15px' }}>
                                <h4 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1f2937', margin: '0 0 5px 0' }}>Base App</h4>
                                <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0 }}>Recibo de Pagamento Oficial</p>
                            </div>
                            
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', fontWeight: 'bold', color: '#374151' }}>
                                {selectedReceipt.transactionId && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>
                                        <span style={{ color: '#6b7280' }}>Autenticação:</span>
                                        <span style={{ fontSize: '0.8rem', color: '#4b5563', fontFamily: 'monospace' }}>{selectedReceipt.transactionId}</span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#6b7280' }}>Referência:</span>
                                    <span>{selectedReceipt.month} / 2026</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#6b7280' }}>Data Compensação:</span>
                                    <span>{selectedReceipt.paymentDate || selectedReceipt.dueDate}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#6b7280' }}>Operador Financeiro:</span>
                                    <span style={{ color: selectedReceipt.institution ? '#0ea5e9' : '#374151' }}>
                                        {selectedReceipt.institution || selectedReceipt.method}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '15px', marginTop: '5px', borderTop: '1px solid #e5e7eb', fontSize: '1.2rem', color: '#000', fontWeight: 900 }}>
                                    <span>Valor Recebido:</span>
                                    <span style={{ color: '#16a34a' }}>{selectedReceipt.val}</span>
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
                                onClick={handleDownloadPDF}
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

export default AdminFinance;
