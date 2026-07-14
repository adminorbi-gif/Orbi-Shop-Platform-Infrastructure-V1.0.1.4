import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps';
import {
  User,
  Mail,
  Phone,
  Lock,
  Calendar,
  BadgeCheck,
  Building2,
  Factory,
  MapPin,
  Upload,
  X,
  Plus,
  ChevronDown,
  Check,
  Users,
  Truck,
  Eye,
  EyeOff,
  Save,
  ArrowRight,
  ShieldAlert,
  Loader,
  Percent,
  Compass,
  Globe,
  CheckCircle2,
  Landmark,
  CreditCard,
  Smartphone,
} from 'lucide-react';
import AboutUsPage from '../../pages/AboutUsPage';

// ─── Google Maps Configuration ──────────────────────────────────────
const GOOGLE_MAPS_API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_ROUTES_API_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

// ─── Validation Schemas ─────────────────────────────────────────────

const BaseUserSchemaObject = z.object({
  fullName: z.string().min(3, { message: 'Jina Kamili linapaswa kuwa na herufi zisizopungua 3 / Full name must be at least 3 characters' }),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, { message: 'Weka namba sahihi ya simu (mf. +255...) / Enter a valid phone number (e.g., +255712345678)' }),
  email: z.string().min(1, { message: 'Barua pepe inahitajika / Email address is required' }).email({ message: 'Barua pepe sio sahihi / Enter a valid email address' }),
  password: z.string().min(8, { message: 'Nenosiri lazima liwe na herufi zisizopungua 8 / Password must be at least 8 characters' }),
  confirmPassword: z.string(),
  nationalId: z.string().optional(),
  dob: z.string().min(1, { message: 'Tarehe ya kuzaliwa inahitajika / Date of birth is required' }),
  role: z.enum(['PRODUCER', 'INDUSTRIAL', 'WAKALA']),
});

// Producer specific fields
const ProducerSchema = z.object({
  farmName: z.string().min(2, { message: 'Jina la Shamba/Kiwanda linahitajika / Farm or factory name is required' }),
  productionCategory: z.string().min(1, { message: 'Chagua kundi la uzalishaji / Please select a production category' }),
  primaryProducts: z.string().min(2, { message: 'Taja bidhaa zako kuu / Specify primary products' }),
  capacity: z.number().min(1, { message: 'Weka kiwango cha uzalishaji / Capacity is required' }),
  capacityUnit: z.string().min(1, { message: 'Chagua kipimo / Capacity unit is required' }),
  location: z.string().min(3, { message: 'Weka eneo lilipo / Location is required' }),
  gpsLat: z.string().optional(),
  gpsLng: z.string().optional(),
  harvestSchedule: z.string().optional(),
  certifications: z.string().optional(),
  bankAccount: z.string().min(5, { message: 'Weka namba ya akaunti ya benki / Bank account is required' }),
});

// Industrial specific fields
const IndustrialSchema = z.object({
  legalName: z.string().min(2, { message: 'Jina rasmi la kampuni linahitajika / Company legal name is required' }),
  tradingName: z.string().optional(),
  industrySector: z.string().min(1, { message: 'Chagua sekta ya viwanda / Please select an industry sector' }),
  registrationNo: z.string().min(3, { message: 'Namba ya BRELA inahitajika / BRELA registration number is required' }),
  tinNumber: z.string().min(9, { message: 'TIN lazima iwe na tarakimu 9 / TIN must be exactly 9 digits' }),
  vrnNumber: z.string().optional(),
  physicalAddress: z.string().min(3, { message: 'Anwani ya ofisi inahitajika / HQ Physical address is required' }),
  billingAddress: z.string().min(3, { message: 'Anwani ya malipo inahitajika / Billing address is required' }),
  procurementContact: z.string().min(2, { message: 'Jina la msimamizi wa manunuzi linahitajika / Procurement contact name is required' }),
  procurementPhone: z.string().min(10, { message: 'Weka namba sahihi ya simu / Enter a valid phone number' }),
  paymentTerms: z.string().min(1, { message: 'Chagua masharti ya malipo / Please select payment terms' }),
  companyBankAccount: z.string().min(5, { message: 'Weka namba ya akaunti ya benki / Company bank account is required' }),
});

// Wakala specific fields
const WakalaSchema = z.object({
  agencyName: z.string().min(2, { message: 'Jina la wakala linahitajika / Agency or broker name is required' }),
  specialties: z.string().min(2, { message: 'Weka maeneo ya utaalamu / Areas of specialty are required' }),
  operatingZones: z.string().min(2, { message: 'Weka maeneo unayofanyia kazi / Operating zones are required' }),
  commissionRate: z.number().min(0.5, { message: 'Kamisheni chini kabisa ni 0.5% / Minimum commission rate is 0.5%' }).max(10, { message: 'Kamisheni haipaswi kuzidi 10% / Maximum commission is 10%' }),
  languages: z.string().min(2, { message: 'Taja lugha unazozungumza / Spoken languages are required' }),
  yearsExperience: z.number().min(0).optional(),
  profileBio: z.string().min(10, { message: 'Eleza kwa kifupi wasifu wako / Profile bio must be at least 10 characters' }),
  references: z.string().optional(),
});

// Combined validation schema with password refinement
const FormSchema = BaseUserSchemaObject
  .and(ProducerSchema.partial())
  .and(IndustrialSchema.partial())
  .and(WakalaSchema.partial())
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Nenosiri halilingani / Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof FormSchema>;

// ─── Constants ──────────────────────────────────────────────────────

const ROLES = [
  { value: 'PRODUCER', label: 'Producer', labelSw: 'Mzalishaji', icon: Factory, desc: 'Farmers, artisans, manufacturers', descSw: 'Wakulima, mafundi, na wasindikaji wadogo' },
  { value: 'INDUSTRIAL', label: 'Industrial', labelSw: 'Kiwanda/B2B', icon: Building2, desc: 'Importers, wholesalers, large processors', descSw: 'Waagizaji, wauzaji wa jumla na viwanda' },
  { value: 'WAKALA', label: 'Wakala (Broker)', labelSw: 'Wakala / Dalali', icon: Users, desc: 'Agents connecting buyers & sellers', descSw: 'Makatibu na mawakala wa masoko na mauzo' },
];

const PRODUCTION_CATEGORIES = ['Agriculture (Crops)', 'Agriculture (Livestock)', 'Fisheries', 'Manufacturing', 'Handicrafts', 'Mining', 'Processing', 'Other'];
const CAPACITY_UNITS = ['KG/Month', 'KG/Harvest', 'Tons/Month', 'Tons/Harvest', 'Pieces/Month', 'Liters/Month', 'Units/Day'];
const INDUSTRY_SECTORS = ['FMCG', 'Construction', 'Pharmaceuticals', 'Agriculture (Processing)', 'Automotive', 'Electronics', 'Textiles', 'Energy', 'Mining', 'Hospitality', 'Education', 'Healthcare', 'Logistics', 'Other'];
const PAYMENT_TERMS = ['Cash', '30 Days Credit', '60 Days Credit', 'Escrow', 'Letter of Credit', 'Prepayment'];

interface BusinessRegistrationFormProps {
  onClose?: () => void;
  lang?: 'sw' | 'en';
}

export const BusinessRegistrationForm: React.FC<BusinessRegistrationFormProps> = ({
  onClose,
  lang: initialLang = 'sw',
}) => {
  const [lang, setLang] = useState<'sw' | 'en'>(initialLang);
  const [showAboutPage, setShowAboutPage] = useState(false);
  const [aboutPageTab, setAboutPageTab] = useState('about');
  const [activeStep, setActiveStep] = useState<number>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // TRA / BRELA Verification Simulation
  const [isVerifyingTRA, setIsVerifyingTRA] = useState(false);
  const [traVerified, setTraVerified] = useState(false);
  const [traError, setTraError] = useState<string | null>(null);

  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});

  // ─── React Hook Form ─────────────────────────────────────────────

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      role: 'PRODUCER',
      capacity: 100,
      capacityUnit: 'KG/Month',
      productionCategory: 'Agriculture (Crops)',
      industrySector: 'FMCG',
      paymentTerms: 'Cash',
      commissionRate: 3.0,
      yearsExperience: 1,
    },
  });

  const watchRole = watch('role');

  const t = (sw: string, en: string) => (lang === 'sw' ? sw : en);

  // ─── Verification Simulation ──────────────────────────────────────

  const handleTRAVerify = async () => {
    const tinValue = watch('tinNumber');
    if (!tinValue || tinValue.length < 9) {
      setTraError(t('Tafadhali weka namba sahihi ya TIN (tarakimu 9) kwanza.', 'Please enter a valid 9-digit TIN number first.'));
      return;
    }

    setIsVerifyingTRA(true);
    setTraError(null);
    setTraVerified(false);

    // Simulate TRA API integration call
    await new Promise((resolve) => setTimeout(resolve, 2500));

    setIsVerifyingTRA(false);
    setTraVerified(true);
  };

  // ─── Document File Name Tracking ──────────────────────────────────

  const handleLocalFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFiles(prev => ({
        ...prev,
        [fieldName]: file.name
      }));
      // In a real production app we would upload the file to cloud storage (R2/S3) here.
      setValue(fieldName as any, file.name);
    }
  };

  // ─── Step Navigation ──────────────────────────────────────────────

  const handleNextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (activeStep === 1) {
      fieldsToValidate = ['fullName', 'phone', 'email', 'password', 'confirmPassword', 'nationalId', 'dob', 'role'];
    } else if (activeStep === 2) {
      if (watchRole === 'PRODUCER') {
        fieldsToValidate = ['farmName', 'productionCategory', 'primaryProducts', 'capacity', 'capacityUnit', 'location', 'bankAccount'];
      } else if (watchRole === 'INDUSTRIAL') {
        fieldsToValidate = ['legalName', 'industrySector', 'registrationNo', 'tinNumber', 'physicalAddress', 'billingAddress', 'procurementContact', 'procurementPhone', 'paymentTerms', 'companyBankAccount'];
      } else if (watchRole === 'WAKALA') {
        fieldsToValidate = ['agencyName', 'specialties', 'operatingZones', 'commissionRate', 'languages', 'profileBio'];
      }
    }

    const isValid = await trigger(fieldsToValidate as any);
    if (isValid) {
      setActiveStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevStep = () => {
    setActiveStep(prev => Math.max(1, prev - 1));
    window.scrollTo(0, 0);
  };

  // ─── Form Submission ──────────────────────────────────────────────

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Direct integration into our upgraded server-side sign up endpoint
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          email: data.email,
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || t('Usajili umeshindwa, tafadhali jaribu tena baadae.', 'Registration failed, please try again later.'));
      }

      setSubmitSuccess(true);
      // Auto-reload to load Dashboard or redirect back
      setTimeout(() => {
        if (onClose) {
          onClose();
        } else {
          window.location.href = "/sellers/login";
        }
      }, 3500);

    } catch (err: any) {
      console.error('[Registration submit error]:', err);
      setErrorMessage(err.message || t('Hitilafu ilitokea wakati wa usajili.', 'An error occurred during registration.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} version="weekly">
      <div id="orbi-registration-outer" className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
      {/* Header Controls */}
      <div className="max-w-4xl mx-auto flex justify-between items-center mb-8">
        <button
          id="btn-back-to-shop"
          onClick={() => {
            if (onClose) onClose();
            else window.location.href = "/";
          }}
          className="text-xs bg-white text-slate-700 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 hover:text-slate-900 transition shadow-sm font-semibold cursor-pointer"
        >
          ← {t('Rudi Nyuma', 'Back to Shop')}
        </button>

        {/* Language Switcher */}
        <div id="language-switcher-container" className="flex bg-slate-200/60 rounded-xl p-1 border border-slate-200/30">
          <button
            id="lang-sw-btn"
            type="button"
            onClick={() => setLang('sw')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              lang === 'sw' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kiswahili
          </button>
          <button
            id="lang-en-btn"
            type="button"
            onClick={() => setLang('en')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              lang === 'en' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* Main Registration Board */}
      <div id="orbi-registration-card" className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 sm:p-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-[3px] ml-0 mr-0 pr-0">
            <img
              src="https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png"
              alt="Orbi Logo"
              className="object-contain w-[98.9px] h-[53px]"
            />
          </div>
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 border border-indigo-100 px-4 py-1.5 rounded-full text-[11px] font-black tracking-widest uppercase mb-4">
            <BadgeCheck size={14} />
            {t('ORBI SHOP FOR BUSINESS', 'ORBI SHOP FOR BUSINESS')}
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {t('Jiunge na Orbi Shop For Business', 'Join Orbi Shop For Business')}
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-lg mx-auto">
            {t(
              'Unda profaili thabiti kulingana na kundi la biashara yako na uanze kufanya biashara salama Tanzania.',
              'Create a professional identity tailored to your operational role and engage in protected corporate trade across East Africa.'
            )}
          </p>
        </div>

        {/* Progress Tracker Steps */}
        <div className="relative mb-10">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-100 -z-10 rounded-full" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 -z-10 rounded-full transition-all duration-300"
            style={{ width: `${((activeStep - 1) / 2) * 100}%` }}
          />

          <div className="flex justify-between">
            {[
              { step: 1, title: t('Utambulisho', 'Identity') },
              { step: 2, title: t('Maelezo ya Kazi', 'Role Details') },
              { step: 3, title: t('Uthibitisho', 'Verification') },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center">
                <span
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border transition text-sm ${
                    activeStep >= s.step
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/15'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  {activeStep > s.step ? <Check size={18} /> : s.step}
                </span>
                <span
                  className={`text-xs mt-2 font-bold tracking-wide transition-colors ${
                    activeStep >= s.step ? 'text-indigo-600' : 'text-slate-400'
                  }`}
                >
                  {s.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* ─── STEP 1: BASE IDENTITY & ROLE SELECTION ────────────────── */}
          {activeStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-800 border-b border-slate-150 pb-2 mb-4">
                  {t('1. Chagua kundi Lako la Biashara/Kazi', '1. Select Your Business/Role Category')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {ROLES.map((r) => {
                    const IconComp = r.icon;
                    const isSelected = watchRole === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setValue('role', r.value as any)}
                        className={`p-5 rounded-2xl border-2 text-left transition flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50/50 border-indigo-500 text-slate-900 shadow-md shadow-indigo-100'
                            : 'bg-slate-50/40 border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="flex justify-between items-start w-full mb-4">
                          <span
                            className={`p-3 rounded-xl transition ${
                              isSelected ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            <IconComp size={20} />
                          </span>
                          {isSelected && (
                            <span className="bg-indigo-600 text-white rounded-full p-1 shadow-sm">
                              <Check size={12} />
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-base text-slate-900">{t(r.labelSw, r.label)}</h4>
                          <p className="text-xs text-slate-500 mt-1">{t(r.descSw, r.desc)}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-800 border-b border-slate-150 pb-2 mb-4">
                  {t('2. Taarifa Binafsi (Human Identity)', '2. Base Identity')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      {t('Jina Kamili (Kisheria)', 'Full Legal Name')}
                    </label>
                    <input
                      {...register('fullName')}
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition"
                      placeholder="e.g. Ally Hamisi"
                    />
                    {errors.fullName && <p className="text-xs text-rose-500 mt-1">{errors.fullName.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      {t('Namba ya Simu', 'Phone Number')}
                    </label>
                    <input
                      {...register('phone')}
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition"
                      placeholder="e.g. +255712345678"
                    />
                    {errors.phone && <p className="text-xs text-rose-500 mt-1">{errors.phone.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      {t('Barua Pepe (Lazima)', 'Email Address (Required)')} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      {...register('email')}
                      type="email"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition"
                      placeholder="e.g. ally@company.com"
                    />
                    {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      {t('Namba ya NIDA (Unaweza kujaza baadaye)', 'National ID (NIDA) (You may fill latter)')}
                    </label>
                    <input
                      {...register('nationalId')}
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition"
                      placeholder="e.g. 19900214-XXXXX-XXXXX-XX"
                    />
                    {errors.nationalId && <p className="text-xs text-rose-500 mt-1">{errors.nationalId.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      {t('Tarehe ya Kuzaliwa', 'Date of Birth')}
                    </label>
                    <input
                      {...register('dob')}
                      type="date"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition"
                    />
                    {errors.dob && <p className="text-xs text-rose-500 mt-1">{errors.dob.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      {t('Nenosiri', 'Password')}
                    </label>
                    <div className="relative">
                      <input
                        {...register('password')}
                        type={showPassword ? 'text' : 'password'}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-11 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-rose-500 mt-1">{errors.password.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      {t('Thibitisha Nenosiri', 'Confirm Password')}
                    </label>
                    <div className="relative">
                      <input
                        {...register('confirmPassword')}
                        type={showConfirm ? 'text' : 'password'}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-11 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-rose-500 mt-1">{errors.confirmPassword.message}</p>}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  id="step1-continue-btn"
                  type="button"
                  onClick={handleNextStep}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/10 active:scale-[0.98] transition cursor-pointer"
                >
                  {t('Endelea', 'Continue')} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 2: ROLE-SPECIFIC FIELD WIZARD ────────────────────── */}
          {activeStep === 2 && (
            <div className="space-y-6">

              {/* A. PRODUCER FIELDS */}
              {watchRole === 'PRODUCER' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-black text-slate-800 border-b border-slate-150 pb-2 mb-4 flex items-center gap-2">
                    <Factory className="text-indigo-600" size={20} />
                    {t('Wasifu wa Mzalishaji', 'Producer Specifications')}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        {t('Jina la Shamba / Warsha / Kiwanda', 'Farm / Workshop / Production Unit Name')}
                      </label>
                      <input
                        {...register('farmName')}
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition"
                        placeholder="e.g. Mbeya Organic Coffee Shamba"
                      />
                      {errors.farmName && <p className="text-xs text-rose-500 mt-1">{errors.farmName.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        {t('Kundi la Uzalishaji', 'Production Category')}
                      </label>
                      <select
                        {...register('productionCategory')}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition"
                      >
                        {PRODUCTION_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        {t('Uwezo wa Uzalishaji', 'Production Capacity')}
                      </label>
                      <div className="flex gap-2">
                        <input
                          {...register('capacity', { valueAsNumber: true })}
                          type="number"
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition"
                          placeholder="500"
                        />
                        <select
                          {...register('capacityUnit')}
                          className="w-32 bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition"
                        >
                          {CAPACITY_UNITS.map(unit => (
                            <option key={unit} value={unit}>{unit}</option>
                          ))}
                        </select>
                      </div>
                      {errors.capacity && <p className="text-xs text-rose-500 mt-1">{errors.capacity.message}</p>}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        {t('Bidhaa Kuu (Tenganisha kwa mkato)', 'Primary Products (Comma separated)')}
                      </label>
                      <input
                        {...register('primaryProducts')}
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition"
                        placeholder="e.g. Kahawa ya Kiarabu, Mahindi ya Lishe"
                      />
                      {errors.primaryProducts && <p className="text-xs text-rose-500 mt-1">{errors.primaryProducts.message}</p>}
                    </div>

                    <LocationInputWithAutocomplete
                      register={register}
                      setValue={setValue}
                      errors={errors}
                      t={t}
                    />

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        {t('Kipindi cha Mavuno (Mwezi - Mwezi)', 'Harvest Schedule')}
                      </label>
                      <input
                        {...register('harvestSchedule')}
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition"
                        placeholder="e.g. June - August"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        {t('Vyeti vya Ubora (Hiari)', 'Certifications (Optional)')}
                      </label>
                      <input
                        {...register('certifications')}
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition"
                        placeholder="e.g. TBS, Fairtrade, Organic"
                      />
                    </div>

                    <SettlementAccountField
                      label={t('Akaunti ya Benki (Kwa Malipo)', 'Settlement Bank Account')}
                      fieldName="bankAccount"
                      register={register}
                      setValue={setValue}
                      errors={errors}
                      t={t}
                    />
                  </div>
                </div>
              )}

              {/* B. INDUSTRIAL B2B FIELDS */}
              {watchRole === 'INDUSTRIAL' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-black text-slate-800 border-b border-slate-150 pb-2 mb-4 flex items-center gap-2">
                    <Building2 className="text-emerald-600" size={20} />
                    {t('Wasifu wa Kiwanda na Ushuru', 'Industrial Enterprise Profile')}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        {t('Jina Rasmi la Kampuni', 'Company Legal Name')}
                      </label>
                      <input
                        {...register('legalName')}
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition"
                        placeholder="As per BRELA registration"
                      />
                      {errors.legalName && <p className="text-xs text-rose-500 mt-1">{errors.legalName.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        {t('Sekta ya Viwanda', 'Industry Sector')}
                      </label>
                      <select
                        {...register('industrySector')}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition"
                      >
                        {INDUSTRY_SECTORS.map(sec => (
                          <option key={sec} value={sec}>{sec}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        {t('Namba ya Usajili BRELA', 'BRELA Registration Number')}
                      </label>
                      <input
                        {...register('registrationNo')}
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition"
                        placeholder="e.g. 120-XXXXXX"
                      />
                      {errors.registrationNo && <p className="text-xs text-rose-500 mt-1">{errors.registrationNo.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        {t('Namba ya Ushuru (TIN)', 'Tax Identification Number (TIN)')}
                      </label>
                      <div className="flex gap-2">
                        <input
                          {...register('tinNumber')}
                          type="text"
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition"
                          placeholder="e.g. 109-876-543"
                        />
                        <button
                          id="btn-verify-tin"
                          type="button"
                          onClick={handleTRAVerify}
                          disabled={isVerifyingTRA || traVerified}
                          className={`px-4 py-3 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                            traVerified
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {isVerifyingTRA ? (
                            <>
                              <Loader size={12} className="animate-spin" />
                              {t('Kuhakiki...', 'Verifying...')}
                            </>
                          ) : traVerified ? (
                            <>
                              <Check size={12} />
                              {t('Imethibitishwa', 'TRA Verified')}
                            </>
                          ) : (
                            t('Thibitisha TIN', 'Verify with TRA')
                          )}
                        </button>
                      </div>
                      {errors.tinNumber && <p className="text-xs text-rose-500 mt-1">{errors.tinNumber.message}</p>}
                      {traError && <p className="text-xs text-rose-500 mt-1">{traError}</p>}
                      {traVerified && (
                        <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-bold">
                          ✓ {t('TIN imehakikiwa kwenye TRA Database. Jina: Allied Merchant Co.', 'TIN verified on TRA Database. Registered name: Allied Merchant Co.')}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        {t('Namba ya VAT (VRN - Kama ipo)', 'VAT Registration Number (VRN - Optional)')}
                      </label>
                      <input
                        {...register('vrnNumber')}
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition"
                        placeholder="e.g. 40-XXXXXX"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        {t('Anwani ya HQ / Ofisi Kuu', 'HQ Physical Address')}
                      </label>
                      <input
                        {...register('physicalAddress')}
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition"
                        placeholder="Plot No, Street, City (e.g. Kinondoni, Dar es Salaam)"
                      />
                      {errors.physicalAddress && <p className="text-xs text-rose-500 mt-1">{errors.physicalAddress.message}</p>}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        {t('Anwani ya Ankara (Billing Address)', 'Billing Address')}
                      </label>
                      <input
                        {...register('billingAddress')}
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition"
                        placeholder="e.g. P.O. Box 7750, Dar es Salaam"
                      />
                      {errors.billingAddress && <p className="text-xs text-rose-500 mt-1">{errors.billingAddress.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        {t('Msimamizi wa Manunuzi', 'Procurement Contact Person')}
                      </label>
                      <input
                        {...register('procurementContact')}
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition"
                        placeholder="e.g. Sarah Ally"
                      />
                      {errors.procurementContact && <p className="text-xs text-rose-500 mt-1">{errors.procurementContact.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        {t('Simu ya Msimamizi', 'Procurement Phone Number')}
                      </label>
                      <input
                        {...register('procurementPhone')}
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition"
                        placeholder="e.g. +255764XXXXXX"
                      />
                      {errors.procurementPhone && <p className="text-xs text-rose-500 mt-1">{errors.procurementPhone.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        {t('Masharti ya Malipo', 'Preferred Payment Terms')}
                      </label>
                      <select
                        {...register('paymentTerms')}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition"
                      >
                        {PAYMENT_TERMS.map(term => (
                          <option key={term} value={term}>{term}</option>
                        ))}
                      </select>
                    </div>

                    <SettlementAccountField
                      label={t('Akaunti ya Benki ya Kampuni', 'Company Settlement Bank Account')}
                      fieldName="companyBankAccount"
                      register={register}
                      setValue={setValue}
                      errors={errors}
                      t={t}
                    />
                  </div>
                </div>
              )}

              {/* C. WAKALA FIELDS */}
              {watchRole === 'WAKALA' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-black text-slate-800 border-b border-slate-150 pb-2 mb-4 flex items-center gap-2">
                    <Users className="text-amber-600" size={20} />
                    {t('Wasifu wa Wakala / Dalali', 'Broker Agency Profile')}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        {t('Jina la Wakala / Agency', 'Agency / Broker Trading Name')}
                      </label>
                      <input
                        {...register('agencyName')}
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition"
                        placeholder="e.g. Maize Connect Tanzania Brokerage"
                      />
                      {errors.agencyName && <p className="text-xs text-rose-500 mt-1">{errors.agencyName.message}</p>}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        {t('Matawi / Bidhaa Kuu unazohudumia', 'Areas of Specialty')}
                      </label>
                      <input
                        {...register('specialties')}
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition"
                        placeholder="e.g. Kahawa, Mahindi, Bidhaa za Viwandani, Nafaka"
                      />
                      {errors.specialties && <p className="text-xs text-rose-500 mt-1">{errors.specialties.message}</p>}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        {t('Mikoa Unayofanyia Kazi', 'Operating Zones (Multi-Region Support)')}
                      </label>
                      <input
                        {...register('operatingZones')}
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition"
                        placeholder="e.g. Dar es Salaam, Arusha, Mbeya, Dodoma"
                      />
                      {errors.operatingZones && <p className="text-xs text-rose-500 mt-1">{errors.operatingZones.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        {t('Kiwango cha Kamisheni Kilichopendekezwa (%)', 'Target Commission Rate (%)')}
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          {...register('commissionRate', { valueAsNumber: true })}
                          type="range"
                          min="0.5"
                          max="10"
                          step="0.5"
                          className="flex-1 accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                        />
                        <span className="font-mono text-base font-black text-indigo-600 shrink-0 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                          {watch('commissionRate') || 3.0}%
                        </span>
                      </div>
                      {errors.commissionRate && <p className="text-xs text-rose-500 mt-1">{errors.commissionRate.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        {t('Lugha Unazozungumza', 'Languages Spoken')}
                      </label>
                      <input
                        {...register('languages')}
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition"
                        placeholder="e.g. Swahili, English"
                      />
                      {errors.languages && <p className="text-xs text-rose-500 mt-1">{errors.languages.message}</p>}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        {t('Maelezo ya Wasifu / Wasifu wako kwa kifupi', 'Profile Biography (Max 250 chars)')}
                      </label>
                      <textarea
                        {...register('profileBio')}
                        rows={3}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition resize-none"
                        placeholder="e.g. Nawaunganisha wakulima wa kahawa moja kwa moja na wanunuzi wakubwa wa viwandani..."
                      />
                      {errors.profileBio && <p className="text-xs text-rose-500 mt-1">{errors.profileBio.message}</p>}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        {t('Marekebisho / Marejeo (References - Hiari)', 'Business References (Optional)')}
                      </label>
                      <textarea
                        {...register('references')}
                        rows={2}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition resize-none"
                        placeholder="Majina na namba za simu za washirika wawili wa awali / Contact names of 2 previous business partners"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button
                  id="btn-step2-prev"
                  type="button"
                  onClick={handlePrevStep}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold transition cursor-pointer"
                >
                  {t('Nyuma', 'Previous')}
                </button>
                <button
                  id="btn-step2-continue"
                  type="button"
                  onClick={handleNextStep}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/10 active:scale-[0.98] transition cursor-pointer"
                >
                  {t('Endelea', 'Continue')} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 3: DOCUMENT UPLOAD & CONFIRMATION ────────────────── */}
          {activeStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-800 border-b border-slate-150 pb-2 mb-4 flex items-center gap-2">
                  <Compass className="text-indigo-600" size={20} />
                  {t('Pakia Nyaraka za Uhakiki (KYC / KYB)', 'KYB Documentation Upload')}
                </h3>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  {t(
                    'Tafadhali pakia picha au faili za PDF zenye muonekano mzuri. Hii inasaidia kuharakisha zoezi la uhakiki wa akaunti yako na Orbi Compliance team.',
                    'Please upload high-quality images or PDF files to prevent delay in your identity/business verification. Max file size: 5MB.'
                  )}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Dynamic inputs depending on the role selected */}
                  {watchRole === 'PRODUCER' && (
                    <>
                      <DocumentField
                        label={t('Hati ya Usajili wa Shamba / Kikundi (Kama ipo)', 'Farm Registration Certificate (If available)')}
                        name="docBusinessReg"
                        uploadedName={uploadedFiles['docBusinessReg']}
                        onChange={(e) => handleLocalFileChange(e, 'docBusinessReg')}
                        optional
                      />
                      <DocumentField
                        label={t('Kitambulisho cha NIDA - Mbele', 'National ID (NIDA) - Front')}
                        name="docNidaFront"
                        uploadedName={uploadedFiles['docNidaFront']}
                        onChange={(e) => handleLocalFileChange(e, 'docNidaFront')}
                        optional
                      />
                      <DocumentField
                        label={t('Kitambulisho cha NIDA - Nyuma', 'National ID (NIDA) - Back')}
                        name="docNidaBack"
                        uploadedName={uploadedFiles['docNidaBack']}
                        onChange={(e) => handleLocalFileChange(e, 'docNidaBack')}
                        optional
                      />
                      <DocumentField
                        label={t('Picha ya Passport size', 'Passport Photo')}
                        name="docPassport"
                        uploadedName={uploadedFiles['docPassport']}
                        onChange={(e) => handleLocalFileChange(e, 'docPassport')}
                      />
                    </>
                  )}

                  {watchRole === 'INDUSTRIAL' && (
                    <>
                      <DocumentField
                        label={t('Hati ya Kusajiliwa (BRELA Certificate)', 'Certificate of Incorporation (BRELA)')}
                        name="docIncorporation"
                        uploadedName={uploadedFiles['docIncorporation']}
                        onChange={(e) => handleLocalFileChange(e, 'docIncorporation')}
                      />
                      <DocumentField
                        label={t('Hati ya TIN (TRA Certificate)', 'TIN Tax Certificate (TRA)')}
                        name="docTin"
                        uploadedName={uploadedFiles['docTin']}
                        onChange={(e) => handleLocalFileChange(e, 'docTin')}
                      />
                      <DocumentField
                        label={t('Hati ya VRN (VAT Certificate - Kama ipo)', 'VRN VAT Certificate (Optional)')}
                        name="docVrn"
                        uploadedName={uploadedFiles['docVrn']}
                        onChange={(e) => handleLocalFileChange(e, 'docVrn')}
                        optional
                      />
                      <DocumentField
                        label={t('Leseni ya Biashara', 'Business License')}
                        name="docBusinessLicense"
                        uploadedName={uploadedFiles['docBusinessLicense']}
                        onChange={(e) => handleLocalFileChange(e, 'docBusinessLicense')}
                      />
                    </>
                  )}

                  {watchRole === 'WAKALA' && (
                    <>
                      <DocumentField
                        label={t('Kitambulisho cha NIDA - Mbele', 'National ID (NIDA) - Front')}
                        name="docNidaFront"
                        uploadedName={uploadedFiles['docNidaFront']}
                        onChange={(e) => handleLocalFileChange(e, 'docNidaFront')}
                        optional
                      />
                      <DocumentField
                        label={t('Kitambulisho cha NIDA - Nyuma', 'National ID (NIDA) - Back')}
                        name="docNidaBack"
                        uploadedName={uploadedFiles['docNidaBack']}
                        onChange={(e) => handleLocalFileChange(e, 'docNidaBack')}
                        optional
                      />
                      <DocumentField
                        label={t('Picha ya Passport size', 'Passport Photo')}
                        name="docPassport"
                        uploadedName={uploadedFiles['docPassport']}
                        onChange={(e) => handleLocalFileChange(e, 'docPassport')}
                      />
                      <DocumentField
                        label={t('Cheti cha Polisi cha Tabia Njema', 'Police Clearance Certificate')}
                        name="docPoliceClearance"
                        uploadedName={uploadedFiles['docPoliceClearance']}
                        onChange={(e) => handleLocalFileChange(e, 'docPoliceClearance')}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Error messages and Feedback */}
              {errorMessage && (
                <div id="error-alert-box" className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-start gap-3">
                  <ShieldAlert size={20} className="shrink-0 mt-0.5 text-rose-600" />
                  <div>
                    <h5 className="font-bold">{t('Usajili Umeshindwa / Registration Error', 'Registration Failed')}</h5>
                    <p className="text-xs mt-1 leading-relaxed">{errorMessage}</p>
                  </div>
                </div>
              )}

              {submitSuccess && (
                <div id="success-alert-box" className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-5 rounded-xl text-center space-y-2 animate-pulse">
                  <CheckCircle2 size={36} className="mx-auto text-emerald-600" />
                  <h4 className="font-extrabold text-base">{t('Ombi Lako Limetumwa Kikamilifu!', 'Registration Submitted Successfully!')}</h4>
                  <p className="text-xs max-w-md mx-auto text-emerald-700">
                    {t(
                      'Profaili na utambulisho wako umehifadhiwa. Timu yetu inafanyia kazi nyaraka ulizopakia na utapokea ujumbe wa uthibitisho hivi punde.',
                      'Your professional identity and credentials have been securely stored. Our compliance board will review your documents shortly.'
                    )}
                  </p>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button
                  id="btn-step3-prev"
                  type="button"
                  disabled={isSubmitting || submitSuccess}
                  onClick={handlePrevStep}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold transition disabled:opacity-50 cursor-pointer"
                >
                  {t('Nyuma', 'Previous')}
                </button>
                
                <button
                  id="btn-submit-registration"
                  type="submit"
                  disabled={isSubmitting || submitSuccess}
                  className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white px-8 py-3 rounded-xl font-extrabold flex items-center gap-2 shadow-lg shadow-indigo-600/10 active:scale-[0.98] transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      {t('Tafadhali subiri...', 'Saving Credentials...')}
                    </>
                  ) : submitSuccess ? (
                    t('Usajili Umekamilika', 'Registered!')
                  ) : (
                    <>
                      <Save size={16} />
                      {t('Kamilisha Usajili', 'Complete Registration')}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Footer Credit */}
        <div className="mt-12 pt-6 border-t border-slate-100 text-slate-400 text-xs flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="text-slate-400 text-center sm:text-left">
            <p>© {new Date().getFullYear()} Orbi Financial Technologies Ltd. Tanzania.</p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-slate-500 font-semibold">
            <button
              type="button"
              onClick={() => {
                setAboutPageTab('terms');
                setShowAboutPage(true);
              }}
              className="hover:text-indigo-600 transition cursor-pointer outline-none"
            >
              {t('Vigezo na Masharti', 'Terms & Conditions')}
            </button>
            <button
              type="button"
              onClick={() => {
                setAboutPageTab('escrow');
                setShowAboutPage(true);
              }}
              className="hover:text-indigo-600 transition cursor-pointer outline-none"
            >
              {t('Malipo & Escrow', 'Payment & Escrow')}
            </button>
            <button
              type="button"
              onClick={() => {
                setAboutPageTab('privacy');
                setShowAboutPage(true);
              }}
              className="hover:text-indigo-600 transition cursor-pointer outline-none"
            >
              {t('Sera ya Faragha', 'Privacy Policy')}
            </button>
            <button
              type="button"
              onClick={() => {
                setAboutPageTab('contact');
                setShowAboutPage(true);
              }}
              className="hover:text-indigo-600 transition cursor-pointer outline-none"
            >
              {t('Wasiliana Nasi', 'Contact Us')}
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400 font-medium shrink-0">
            <span>Powered by</span>
            <img
              src="https://media-stock.orbifinancial.com/ORBI_LOGO_Blue.png"
              alt="ORBI Financial Technologies"
              title="ORBI Financial Technologies"
              className="h-8 w-auto object-contain opacity-80 hover:opacity-100 transition"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

      </div>

      {showAboutPage && (
        <div className="fixed inset-0 z-[999999] bg-white overflow-y-auto">
          <AboutUsPage
            lang={lang}
            onClose={() => setShowAboutPage(false)}
            initialPage={aboutPageTab}
          />
        </div>
      )}
    </div>
    </APIProvider>
  );
};

// ─── Document Upload Auxiliary Component ──────────────────────────────

interface DocumentFieldProps {
  label: string;
  name: string;
  uploadedName?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  optional?: boolean;
}

const DocumentField: React.FC<DocumentFieldProps> = ({
  label,
  name,
  uploadedName,
  onChange,
  optional = false,
}) => {
  return (
    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
      <label className="block text-xs font-bold text-slate-700 mb-2">
        {label} {optional && <span className="text-[10px] text-slate-400 font-normal lowercase">(optional)</span>}
      </label>
      <div className="relative">
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={onChange}
          className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
        />
        <div className="h-14 w-full bg-white border border-slate-200 rounded-xl px-4 flex items-center justify-between hover:border-indigo-500 transition">
          <span className="text-xs text-slate-400 truncate max-w-[200px]">
            {uploadedName || 'Gusa ili upakie faili...'}
          </span>
          <span className="p-2 bg-slate-50 border border-slate-200 text-slate-500 rounded-lg">
            <Upload size={14} />
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Location Autocomplete Field Component ──────────────────────────

interface LocationInputWithAutocompleteProps {
  register: any;
  setValue: any;
  errors: any;
  t: (sw: string, en: string) => string;
}

const LocationInputWithAutocomplete: React.FC<LocationInputWithAutocompleteProps> = ({
  register,
  setValue,
  errors,
  t,
}) => {
  const placesLib = useMapsLibrary('places');
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const registered = register('location');

  useEffect(() => {
    if (!placesLib || !inputRef.current) return;

    const autocomplete = new placesLib.Autocomplete(inputRef.current, {
      fields: ['formatted_address', 'geometry', 'name'],
      componentRestrictions: { country: ['tz'] },
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.formatted_address) {
        setValue('location', place.formatted_address, { shouldValidate: true });
      } else if (place.name) {
        setValue('location', place.name, { shouldValidate: true });
      }
    });

    autocompleteRef.current = autocomplete;

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [placesLib, setValue]);

  return (
    <div className="sm:col-span-2">
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
        {t('Mahali Shamba/Kiwanda Kilipo (Mkoa, Wilaya)', 'Farm/Factory Location')}
      </label>
      <div className="relative">
        <input
          {...registered}
          ref={(e) => {
            registered.ref(e);
            inputRef.current = e;
          }}
          type="text"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition"
          placeholder={t('Tafuta eneo kwa usahihi...', 'Search location for precise location...')}
        />
        <div className="absolute right-3.5 top-3.5 text-slate-400 pointer-events-none">
          <MapPin size={16} />
        </div>
      </div>
      <p className="text-[10px] text-indigo-600 mt-1 font-semibold">
        {t('Tafuta eneo kwa usahihi / Search location for precise location', 'Search location for precise location')}
      </p>
      {errors.location && <p className="text-xs text-rose-500 mt-1">{errors.location.message}</p>}
    </div>
  );
};

// ─── Settlement Account Component ───────────────────────────────────

interface SettlementAccountFieldProps {
  label: string;
  fieldName: 'bankAccount' | 'companyBankAccount';
  register: any;
  setValue: any;
  errors: any;
  t: (sw: string, en: string) => string;
}

const SettlementAccountField: React.FC<SettlementAccountFieldProps> = ({
  label,
  fieldName,
  register,
  setValue,
  errors,
  t,
}) => {
  const [method, setMethod] = useState<'Orbi' | 'Bank Account' | 'Card' | 'Mobile'>('Bank Account');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const methods = [
    {
      id: 'Orbi' as const,
      name: t('Orbi Pay', 'Orbi Pay'),
      desc: t('Malipo kupitia Akaunti/Simu ya Orbi', 'Instant settlement via Orbi'),
      logo: 'https://media-stock.orbifinancial.com/ORBI_LOGO_Blue.png',
    },
    {
      id: 'Bank Account' as const,
      name: t('Akaunti ya Benki', 'Bank Account'),
      desc: t('CRDB, NMB, NBC na nyinginezo', 'CRDB, NMB, NBC & local banks'),
      icon: <Landmark className="text-indigo-600" size={16} />,
      iconBg: 'bg-indigo-50 border border-indigo-100',
    },
    {
      id: 'Card' as const,
      name: t('Kadi (Card)', 'Card'),
      desc: t('Visa, Mastercard, n.k.', 'Visa, Mastercard credit/debit cards'),
      icon: <CreditCard className="text-blue-600" size={16} />,
      iconBg: 'bg-blue-50 border border-blue-100',
    },
    {
      id: 'Mobile' as const,
      name: t('Mtandao wa Simu', 'Mobile Money'),
      desc: t('M-Pesa, Tigo Pesa, Airtel Money', 'M-Pesa, Tigo Pesa, Airtel, Halopesa'),
      icon: <Smartphone className="text-teal-600" size={16} />,
      iconBg: 'bg-teal-50 border border-teal-100',
    },
  ];

  const currentMethodObj = methods.find((m) => m.id === method) || methods[1];

  const getInstructions = () => {
    switch (method) {
      case 'Orbi':
        return {
          label: t('Namba ya Simu au ID ya Mtumiaji wa Orbi', 'Orbi User Phone number or Orbi User ID'),
          placeholder: t('e.g. +2557XXXXXXXX au OB-12345', 'e.g. +2557XXXXXXXX or OB-12345'),
          hint: t('Tafadhali weka namba yako ya simu ya Orbi au ID ya mtumiaji wa Orbi kufanikisha malipo ya moja kwa moja.', 'Please enter your Orbi User Phone number or Orbi User ID to process direct settlement payments.'),
        };
      case 'Bank Account':
        return {
          label: t('Jina la Benki na Namba ya Akaunti', 'Bank Name & Account Number'),
          placeholder: t('e.g. CRDB Bank - 0152XXXXXX', 'e.g. CRDB Bank - 0152XXXXXX'),
          hint: t('Weka jina la benki likifuatiwa na namba yako ya akaunti ya malipo.', 'Enter bank name followed by your settlement account number.'),
        };
      case 'Card':
        return {
          label: t('Jina la Mmiliki na Namba ya Kadi', 'Cardholder Name & Card Number'),
          placeholder: t('e.g. John Doe - Visa 4000...', 'e.g. John Doe - Visa 4000...'),
          hint: t('Weka jina lililo kwenye kadi na namba ya kadi ya kupokelea malipo.', 'Enter the name on the card and the card number to receive payments.'),
        };
      case 'Mobile':
        return {
          label: t('Namba ya Simu na Mtandao wa Simu', 'Mobile Money Number & Network'),
          placeholder: t('e.g. M-Pesa - 07XXXXXXXX', 'e.g. M-Pesa - 07XXXXXXXX'),
          hint: t('Weka mtandao wa simu (Tigo Pesa, M-Pesa, Airtel Money, Halopesa) na namba yako.', 'Enter mobile network (Tigo Pesa, M-Pesa, Airtel Money, Halopesa) and your phone number.'),
        };
    }
  };

  const inst = getInstructions();

  return (
    <div className="sm:col-span-2 space-y-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs relative">
      <div className="flex justify-between items-center">
        <label className="block text-xs font-black text-indigo-950 uppercase tracking-wider">
          {label}
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Modern Method Dropdown Selector */}
        <div className="relative" ref={dropdownRef}>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">
            {t('Njia ya Malipo', 'Payment Method')}
          </label>
          
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 hover:border-indigo-500 rounded-xl px-3 py-2.5 text-left text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-indigo-100"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {currentMethodObj.logo ? (
                currentMethodObj.id === 'Orbi' ? (
                  <div className="h-8 flex items-center shrink-0 pr-1">
                    <img
                      src={currentMethodObj.logo}
                      alt={currentMethodObj.name}
                      className="h-7 w-auto object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 border border-slate-200 overflow-hidden p-1 shrink-0">
                    <img
                      src={currentMethodObj.logo}
                      alt={currentMethodObj.name}
                      className="h-full w-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )
              ) : (
                <div className={`h-8 w-8 flex items-center justify-center rounded-lg shrink-0 ${currentMethodObj.iconBg}`}>
                  {currentMethodObj.icon}
                </div>
              )}
              <div className="truncate min-w-0">
                <span className="block font-black text-xs text-slate-900 leading-tight">
                  {currentMethodObj.name}
                </span>
                <span className="block text-[9px] text-slate-400 truncate max-w-[120px]">
                  {currentMethodObj.desc}
                </span>
              </div>
            </div>
            <ChevronDown size={14} className={`text-slate-400 shrink-0 ml-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-150 rounded-xl shadow-xl z-30 py-1 max-h-[280px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
              {methods.map((m) => {
                const isSelected = m.id === method;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setMethod(m.id);
                      setIsOpen(false);
                      setValue(fieldName, '', { shouldValidate: false });
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition hover:bg-slate-50 ${
                      isSelected ? 'bg-indigo-50/50 font-medium' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {m.logo ? (
                        m.id === 'Orbi' ? (
                          <div className="h-8 flex items-center shrink-0 pr-1">
                            <img
                              src={m.logo}
                              alt={m.name}
                              className="h-7 w-auto object-contain"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : (
                          <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 overflow-hidden p-1 shrink-0">
                            <img
                              src={m.logo}
                              alt={m.name}
                              className="h-full w-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )
                      ) : (
                        <div className={`h-8 w-8 flex items-center justify-center rounded-lg shrink-0 ${m.iconBg}`}>
                          {m.icon}
                        </div>
                      )}
                      <div className="truncate min-w-0">
                        <span className="block font-bold text-slate-900 leading-tight">
                          {m.name}
                        </span>
                        <span className="block text-[10px] text-slate-500 truncate max-w-[150px]">
                          {m.desc}
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check size={14} className="text-indigo-600 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Input Details */}
        <div className="md:col-span-2">
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">
            {inst.label}
          </label>
          <input
            {...register(fieldName)}
            type="text"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition"
            placeholder={inst.placeholder}
          />
        </div>
      </div>

      <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
        <div className="mt-0.5 shrink-0">
          {method === 'Orbi' ? (
            <img
              src="https://media-stock.orbifinancial.com/ORBI_LOGO_Blue.png"
              alt="Orbi logo"
              className="h-3.5 object-contain"
              referrerPolicy="no-referrer"
            />
          ) : (
            currentMethodObj.icon || <Landmark size={14} className="text-slate-400" />
          )}
        </div>
        <p className="text-[11px] text-slate-600 leading-tight">
          {inst.hint}
        </p>
      </div>

      {errors[fieldName] && (
        <p className="text-xs text-rose-500 mt-1">{errors[fieldName]?.message}</p>
      )}
    </div>
  );
};

export default BusinessRegistrationForm;
