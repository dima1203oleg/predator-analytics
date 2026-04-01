/**
 * 💳 Stripe Integration Component
 * 
 * Інтеграція зі Stripe для обробки платежів, підписок та % від економії.
 * Підтримка українських платіжних методів.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
  DollarSign,
  TrendingUp,
  Calendar,
  FileText,
  Download,
  Eye,
  Settings,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  Zap,
  Crown,
  Building,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Types
interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'sepa_debit';
  brand?: string;
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  createdAt: string;
  status: 'active' | 'inactive' | 'failed';
}

interface Subscription {
  id: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  plan: {
    id: string;
    name: string;
    amount: number;
    currency: 'UAH' | 'USD' | 'EUR';
    interval: 'month' | 'year';
  };
  metadata?: {
    tenantId: string;
    userId: string;
  };
}

interface Invoice {
  id: string;
  number: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  amount: number;
  currency: 'UAH' | 'USD' | 'EUR';
  dueDate?: string;
  paidAt?: string;
  pdfUrl?: string;
  hostedInvoiceUrl?: string;
}

interface SavingsPayment {
  id: string;
  scenarioId: string;
  scenarioName: string;
  savingsAmount: number;
  commissionRate: number;
  commissionAmount: number;
  currency: 'UAH' | 'USD';
  status: 'pending' | 'verified' | 'paid' | 'disputed';
  verifiedAt?: string;
  paidAt?: string;
  evidence: {
    invoiceUrl?: string;
    contractUrl?: string;
    documents: string[];
  };
}

// Mock data
const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'pm_001',
    type: 'card',
    brand: 'visa',
    last4: '4242',
    expiryMonth: 12,
    expiryYear: 2025,
    isDefault: true,
    createdAt: '2024-01-15',
    status: 'active',
  },
  {
    id: 'pm_002',
    type: 'card',
    brand: 'mastercard',
    last4: '5555',
    expiryMonth: 9,
    expiryYear: 2024,
    isDefault: false,
    createdAt: '2024-02-20',
    status: 'active',
  },
];

const MOCK_SUBSCRIPTION: Subscription = {
  id: 'sub_001',
  status: 'active',
  currentPeriodStart: '2024-03-01',
  currentPeriodEnd: '2024-04-01',
  cancelAtPeriodEnd: false,
  plan: {
    id: 'price_pro_month',
    name: 'Pro Plan',
    amount: 12499,
    currency: 'UAH',
    interval: 'month',
  },
  metadata: {
    tenantId: 'tenant_001',
    userId: 'user_001',
  },
};

const MOCK_INVOICES: Invoice[] = [
  {
    id: 'in_001',
    number: 'INV-2024-001',
    status: 'paid',
    amount: 12499,
    currency: 'UAH',
    dueDate: '2024-03-15',
    paidAt: '2024-03-14',
    pdfUrl: 'https://stripe.com/invoice/pdf/in_001',
    hostedInvoiceUrl: 'https://stripe.com/invoice/hosted/in_001',
  },
  {
    id: 'in_002',
    number: 'INV-2024-002',
    status: 'open',
    amount: 12499,
    currency: 'UAH',
    dueDate: '2024-04-15',
    pdfUrl: 'https://stripe.com/invoice/pdf/in_002',
    hostedInvoiceUrl: 'https://stripe.com/invoice/hosted/in_002',
  },
];

const MOCK_SAVINGS_PAYMENTS: SavingsPayment[] = [
  {
    id: 'sav_pay_001',
    scenarioId: 'scenario_001',
    scenarioName: 'Оптимізація закупівель електрогенераторів',
    savingsAmount: 250000,
    commissionRate: 5,
    commissionAmount: 12500,
    currency: 'UAH',
    status: 'verified',
    verifiedAt: '2024-03-20',
    evidence: {
      invoiceUrl: 'https://example.com/invoice.pdf',
      documents: ['contract.pdf', 'delivery_note.pdf'],
    },
  },
  {
    id: 'sav_pay_002',
    scenarioId: 'scenario_002',
    scenarioName: 'Перевірка постачальника TechCorp',
    savingsAmount: 180000,
    commissionRate: 5,
    commissionAmount: 9000,
    currency: 'UAH',
    status: 'pending',
    evidence: {
      documents: [],
    },
  },
];

// Components
const PaymentMethodCard: React.FC<{
  method: PaymentMethod;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}> = ({ method, onSetDefault, onDelete, onEdit }) => (
  <Card className="bg-slate-900/50 border-slate-800">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800 rounded-lg">
            <CreditCard className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-white capitalize">
                {method.brand} •••• {method.last4}
              </span>
              {method.isDefault && (
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                  За замовчуванням
                </Badge>
              )}
            </div>
            {method.expiryMonth && method.expiryYear && (
              <div className="text-sm text-slate-400">
                Закінчується {method.expiryMonth}/{method.expiryYear}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            method.status === 'active' ? 'bg-emerald-400' : 'bg-red-400'
          }`} />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(method.id)}
            className="text-slate-400 hover:text-white"
          >
            <Edit className="w-4 h-4" />
          </Button>
          {!method.isDefault && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(method.id)}
              className="text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

const SubscriptionCard: React.FC<{
  subscription: Subscription;
  onCancel: () => void;
  onReactivate: () => void;
}> = ({ subscription, onCancel, onReactivate }) => {
  const daysUntilRenewal = Math.ceil(
    (new Date(subscription.currentPeriodEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-white mb-1">{subscription.plan.name}</h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-cyan-400">
                {subscription.plan.amount.toLocaleString('uk-UA')} {subscription.plan.currency}
              </span>
              <span className="text-slate-400">/{subscription.plan.interval === 'month' ? 'міс' : 'рік'}</span>
            </div>
          </div>
          <Badge className={
            subscription.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
            subscription.status === 'trialing' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
            subscription.status === 'past_due' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
            'bg-slate-500/20 text-slate-300 border-slate-500/30'
          }>
            {subscription.status === 'active' ? 'Активна' :
             subscription.status === 'trialing' ? 'Trial' :
             subscription.status === 'past_due' ? 'Прострочено' :
             subscription.status === 'canceled' ? 'Скасовано' : 'Неоплачено'}
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Період:</span>
            <span className="text-white">
              {new Date(subscription.currentPeriodStart).toLocaleDateString('uk-UA')} - {' '}
              {new Date(subscription.currentPeriodEnd).toLocaleDateString('uk-UA')}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Наступне оновлення:</span>
            <span className="text-white">
              {daysUntilRenewal} днів ({new Date(subscription.currentPeriodEnd).toLocaleDateString('uk-UA')})
            </span>
          </div>
          {subscription.cancelAtPeriodEnd && (
            <Alert className="bg-amber-500/10 border-amber-500/30">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <AlertDescription className="text-amber-200">
                Підписку буде скасовано в кінці поточного періоду
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
            <Button variant="outline" onClick={onCancel} className="border-slate-700 text-slate-300">
              Скасувати підписку
            </Button>
          )}
          {subscription.status === 'canceled' && (
            <Button onClick={onReactivate} className="bg-cyan-500 hover:bg-cyan-600 text-white">
              Відновити підписку
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const SavingsPaymentCard: React.FC<{
  payment: SavingsPayment;
  onVerify: (id: string) => void;
  onUploadEvidence: (id: string) => void;
}> = ({ payment, onVerify, onUploadEvidence }) => (
  <Card className="bg-slate-900/50 border-slate-800">
    <CardContent className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-white mb-1">{payment.scenarioName}</h4>
          <div className="text-sm text-slate-400">
            Економія: {payment.savingsAmount.toLocaleString('uk-UA')} {payment.currency}
          </div>
        </div>
        <Badge className={
          payment.status === 'paid' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
          payment.status === 'verified' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' :
          payment.status === 'pending' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
          'bg-red-500/20 text-red-300 border-red-500/30'
        }>
          {payment.status === 'paid' ? 'Сплачено' :
           payment.status === 'verified' ? 'Верифіковано' :
           payment.status === 'pending' ? 'Очікує' : 'Спір'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <div className="text-sm text-slate-400">Комісія</div>
          <div className="font-medium text-white">
            {payment.commissionRate}% = {payment.commissionAmount.toLocaleString('uk-UA')} {payment.currency}
          </div>
        </div>
        <div>
          <div className="text-sm text-slate-400">Статус</div>
          <div className="font-medium text-white">
            {payment.verifiedAt ? `Верифіковано: ${new Date(payment.verifiedAt).toLocaleDateString('uk-UA')}` : 'Очікує верифікації'}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {payment.status === 'pending' && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUploadEvidence(payment.id)}
              className="border-slate-700 text-slate-300"
            >
              <FileText className="w-4 h-4 mr-1" />
              Завантажити документи
            </Button>
            <Button
              size="sm"
              onClick={() => onVerify(payment.id)}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Верифікувати
            </Button>
          </>
        )}
        {payment.status === 'verified' && (
          <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
            <Eye className="w-4 h-4 mr-1" />
            Переглянути докази
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
);

// Main Component
export const StripeIntegration: React.FC = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(MOCK_PAYMENT_METHODS);
  const [subscription, setSubscription] = useState<Subscription>(MOCK_SUBSCRIPTION);
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES);
  const [savingsPayments, setSavingsPayments] = useState<SavingsPayment[]>(MOCK_SAVINGS_PAYMENTS);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddPaymentDialog, setShowAddPaymentDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSetDefaultPayment = (id: string) => {
    setPaymentMethods(prev => prev.map(method => ({
      ...method,
      isDefault: method.id === id
    })));
  };

  const handleDeletePayment = (id: string) => {
    setPaymentMethods(prev => prev.filter(method => method.id !== id));
  };

  const handleEditPayment = (id: string) => {
    console.log('Edit payment method:', id);
  };

  const handleCancelSubscription = () => {
    setSubscription(prev => ({ ...prev, cancelAtPeriodEnd: true }));
  };

  const handleReactivateSubscription = () => {
    setSubscription(prev => ({ ...prev, cancelAtPeriodEnd: false, status: 'active' as const }));
  };

  const handleVerifySavings = (id: string) => {
    setSavingsPayments(prev => prev.map(payment =>
      payment.id === id
        ? { ...payment, status: 'verified' as const, verifiedAt: new Date().toISOString() }
        : payment
    ));
  };

  const handleUploadEvidence = (id: string) => {
    console.log('Upload evidence for payment:', id);
  };

  const handleAddPaymentMethod = async () => {
    setIsLoading(true);
    // Simulate Stripe integration
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    setShowAddPaymentDialog(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">💳 Платежі та білінг</h1>
            <p className="text-slate-400">
              Управління підписками, платіжними методами та комісіями від економії
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <span className="text-sm text-emerald-400">PCI DSS Certified</span>
          </div>
        </div>

        {/* Alert */}
        <Alert className="bg-cyan-500/10 border-cyan-500/30 mb-6">
          <Shield className="w-4 h-4 text-cyan-400" />
          <AlertDescription className="text-cyan-200">
            <strong>Безпечні платежі:</strong> Усі транзакції обробляються через Stripe з PCI DSS сертифікацією. 
            Підтримуються українські платіжні системи та методи оплати.
          </AlertDescription>
        </Alert>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="overview" className="data-[state=active]:bg-slate-800">
              Огляд
            </TabsTrigger>
            <TabsTrigger value="subscription" className="data-[state=active]:bg-slate-800">
              Підписка
            </TabsTrigger>
            <TabsTrigger value="payment-methods" className="data-[state=active]:bg-slate-800">
              Платіжні методи
            </TabsTrigger>
            <TabsTrigger value="invoices" className="data-[state=active]:bg-slate-800">
              Рахунки
            </TabsTrigger>
            <TabsTrigger value="savings" className="data-[state=active]:bg-slate-800">
              Комісії від економії
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-cyan-500/20 rounded-lg">
                      <Crown className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-sm text-slate-400">Поточна підписка</div>
                      <div className="text-xl font-bold text-white">{subscription.plan.name}</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-cyan-400">
                    {subscription.plan.amount.toLocaleString('uk-UA')} {subscription.plan.currency}/міс
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-sm text-slate-400">Економія цього місяця</div>
                      <div className="text-xl font-bold text-white">
                        {savingsPayments.reduce((sum, p) => sum + p.savingsAmount, 0).toLocaleString('uk-UA')} ₴
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-emerald-400">
                    {savingsPayments.reduce((sum, p) => sum + p.commissionAmount, 0).toLocaleString('uk-UA')} ₴
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-violet-500/20 rounded-lg">
                      <CreditCard className="w-6 h-6 text-violet-400" />
                    </div>
                    <div>
                      <div className="text-sm text-slate-400">Платіжні методи</div>
                      <div className="text-xl font-bold text-white">{paymentMethods.length}</div>
                    </div>
                  </div>
                  <div className="text-sm text-violet-400">
                    {paymentMethods.filter(m => m.isDefault).length} за замовчуванням
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="subscription" className="space-y-4">
            <SubscriptionCard
              subscription={subscription}
              onCancel={handleCancelSubscription}
              onReactivate={handleReactivateSubscription}
            />
          </TabsContent>

          <TabsContent value="payment-methods" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Платіжні методи</h3>
              <Button onClick={() => setShowAddPaymentDialog(true)} className="bg-cyan-500 hover:bg-cyan-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Додати метод
              </Button>
            </div>
            <div className="space-y-3">
              {paymentMethods.map(method => (
                <PaymentMethodCard
                  key={method.id}
                  method={method}
                  onSetDefault={handleSetDefaultPayment}
                  onDelete={handleDeletePayment}
                  onEdit={handleEditPayment}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            <div className="space-y-3">
              {invoices.map(invoice => (
                <Card key={invoice.id} className="bg-slate-900/50 border-slate-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-white">{invoice.number}</h4>
                          <Badge className={
                            invoice.status === 'paid' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                            invoice.status === 'open' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                            'bg-slate-500/20 text-slate-300 border-slate-500/30'
                          }>
                            {invoice.status === 'paid' ? 'Сплачено' :
                             invoice.status === 'open' ? 'Очікує оплати' :
                             invoice.status === 'draft' ? 'Чернетка' : 'Скасовано'}
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-400">
                          {invoice.amount.toLocaleString('uk-UA')} {invoice.currency}
                          {invoice.dueDate && ` • Термін: ${new Date(invoice.dueDate).toLocaleDateString('uk-UA')}`}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {invoice.pdfUrl && (
                          <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
                            <Download className="w-4 h-4 mr-1" />
                            PDF
                          </Button>
                        )}
                        {invoice.hostedInvoiceUrl && (
                          <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
                            <Eye className="w-4 h-4 mr-1" />
                            Переглянути
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="savings" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Комісії від економії</h3>
              <div className="text-sm text-slate-400">
                Ставка: 5% від підтвердженої економії
              </div>
            </div>
            <div className="space-y-3">
              {savingsPayments.map(payment => (
                <SavingsPaymentCard
                  key={payment.id}
                  payment={payment}
                  onVerify={handleVerifySavings}
                  onUploadEvidence={handleUploadEvidence}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Payment Method Dialog */}
        <Dialog open={showAddPaymentDialog} onOpenChange={setShowAddPaymentDialog}>
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-200">
            <DialogHeader>
              <DialogTitle className="text-white">Додати платіжний метод</DialogTitle>
              <DialogDescription className="text-slate-400">
                Безпечне додавання платіжної картки через Stripe
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Alert className="bg-cyan-500/10 border-cyan-500/30">
                <Shield className="w-4 h-4 text-cyan-400" />
                <AlertDescription className="text-cyan-200">
                  Ваша платіжна інформація обробляється безпечно через Stripe. Ми не зберігаємо дані карток.
                </AlertDescription>
              </Alert>
              
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-2">Stripe Elements буде тут</div>
                <div className="h-10 bg-slate-700 rounded border border-slate-600"></div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddPaymentDialog(false)} className="border-slate-700 text-slate-300">
                Скасувати
              </Button>
              <Button 
                onClick={handleAddPaymentMethod}
                disabled={isLoading}
                className="bg-cyan-500 hover:bg-cyan-600 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Обробка...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Додати метод
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default StripeIntegration;
