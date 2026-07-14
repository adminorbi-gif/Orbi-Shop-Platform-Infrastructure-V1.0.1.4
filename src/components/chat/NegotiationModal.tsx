import React, { useState } from 'react';
import { X, Send, Bot, User, CheckCircle, Package } from 'lucide-react';
import { Product } from '../../types';

interface NegotiationModalProps {
  product: Product;
  onClose: () => void;
  lang: 'sw' | 'en';
  onAddCart: (product: Product, quantity: number, negotiatedPrice: number) => void;
}

export const NegotiationModal = ({ product, onClose, lang, onAddCart }: NegotiationModalProps) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'agent', text: string }[]>([
    {
      role: 'agent',
      text: lang === 'sw' 
        ? `Habari! Mimi ni AI Agent wa muuzaji. Ungependa kujadili bei ya ${product.name}? Bei ya sasa ni TZS ${product.price.toLocaleString()}.` 
        : `Hi! I'm the seller's AI Agent. Would you like to negotiate the price for ${product.name}? The current price is TZS ${product.price.toLocaleString()}.`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreedPrice, setAgreedPrice] = useState<number | null>(null);
  const [requestedQty, setRequestedQty] = useState(1);

  const sendMessage = async () => {
    if (!input.trim() || loading || agreedPrice !== null) return;
    
    const newMsgs = [...messages, { role: 'user' as const, text: input }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/v1/ai/negotiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          walkAwayPrice: product.walkAwayPrice || product.price,
          currentPrice: product.price,
          productName: product.name,
          userMessage: input,
          quantity: requestedQty,
          history: newMsgs
        })
      });
      
      const data = await res.json();
      setMessages([...newMsgs, { role: 'agent', text: data.reply }]);
      
      if (data.agreedPrice) {
        setAgreedPrice(data.agreedPrice);
      }
    } catch (e) {
      setMessages([...newMsgs, { role: 'agent', text: lang === 'sw' ? 'Samahani, mtandao unasumbua.' : 'Sorry, connection error.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shadow-sm border border-indigo-200">
              <Bot size={22} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg leading-tight">
                {lang === 'sw' ? 'Jadili Bei na AI' : 'Negotiate with AI'}
              </h3>
              <p className="text-xs font-bold text-indigo-600 flex items-center gap-1 mt-0.5">
                <Package size={12} /> {product.name}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center transition border border-slate-200 shadow-sm"
          >
            <X size={16} strokeWidth={3} />
          </button>
        </div>

        {/* Quantity Selection */}
        {!agreedPrice && (
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">{lang === 'sw' ? 'Idadi ya Bidhaa' : 'Purchase Quantity'}</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setRequestedQty(Math.max(1, requestedQty - 1))}
                className="w-7 h-7 bg-white rounded border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold"
              >-</button>
              <span className="font-black text-sm w-8 text-center">{requestedQty}</span>
              <button 
                onClick={() => setRequestedQty(requestedQty + 1)}
                className="w-7 h-7 bg-white rounded border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold"
              >+</button>
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                m.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-none shadow-sm shadow-indigo-600/20' 
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 text-slate-500 rounded-2xl rounded-bl-none px-4 py-3 text-sm flex gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
              </div>
            </div>
          )}
          {agreedPrice !== null && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-center shadow-sm">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h4 className="font-black text-emerald-900 text-lg mb-1">
                {lang === 'sw' ? 'Tumekubaliana!' : 'Deal Agreed!'}
              </h4>
              <p className="text-sm text-emerald-700 font-medium mb-4">
                {lang === 'sw' ? `Bei mpya ni TZS ${agreedPrice.toLocaleString()} kwa kila moja.` : `The new price is TZS ${agreedPrice.toLocaleString()} each.`}
              </p>
              <button
                onClick={() => {
                  onAddCart(product, requestedQty, agreedPrice);
                  onClose();
                }}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20"
              >
                <Package size={18} />
                {lang === 'sw' ? 'Ongeza kwenye Kikapu' : 'Add to Cart at this Price'}
              </button>
            </div>
          )}
        </div>

        {/* Input Area */}
        {!agreedPrice && (
          <div className="p-3 bg-white border-t border-slate-100">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder={lang === 'sw' ? "Andika ofa yako hapa..." : "Type your offer here..."}
                className="flex-1 px-4 py-3 bg-slate-100 text-sm rounded-full outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition border border-transparent focus:border-indigo-200"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-indigo-600/20"
              >
                <Send size={18} className="ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
