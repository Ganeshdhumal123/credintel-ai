import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createApplication } from '../services/api';
import { useToast } from '../components/Toast';

const PRESETS = {
  prime: {
    name: 'Prime Applicant (Low Risk)',
    data: {
      credit_amount: 3000,
      duration_in_month: 18,
      installment_rate: '3',
      purpose: 'A43',
      status_of_existing_checking_account: 'A13', // >= 200 DM
      savings_account_bonds: 'A64', // >= 1000 DM
      credit_history: 'A32', // Existing credits paid duly
      present_employment_since: 'A75', // >= 7 years
      personal_status_and_sex: 'A93', // Male single
      age_in_years: 38,
      job: 'A173', // Skilled employee
      property: 'A121', // Real estate
      housing: 'A152', // Own
      other_installment_plans: 'A143', // None
      other_debtors_guarantors: 'A101', // None
      present_residence_since: '4',
      number_of_existing_credits: '1',
      number_of_liable_people: '1',
      telephone: 'A192', // Registered
      foreign_worker: 'A201',
    },
  },
  moderate: {
    name: 'Standard Applicant (Moderate)',
    data: {
      credit_amount: 6000,
      duration_in_month: 36,
      installment_rate: '2',
      purpose: 'A40', // Car (new)
      status_of_existing_checking_account: 'A12', // 0-200 DM
      savings_account_bonds: 'A62', // 100-500 DM
      credit_history: 'A32',
      present_employment_since: 'A73', // 1-4 years
      personal_status_and_sex: 'A92', // Female
      age_in_years: 29,
      job: 'A173',
      property: 'A123', // Car/other
      housing: 'A151', // Rent
      other_installment_plans: 'A141', // Bank
      other_debtors_guarantors: 'A102', // Co-applicant
      present_residence_since: '2',
      number_of_existing_credits: '2',
      number_of_liable_people: '1',
      telephone: 'A191',
      foreign_worker: 'A201',
    },
  },
  elevated: {
    name: 'High Debt Applicant (Elevated Risk)',
    data: {
      credit_amount: 12000,
      duration_in_month: 48,
      installment_rate: '1', // >= 35% income
      purpose: 'A49', // Business
      status_of_existing_checking_account: 'A11', // < 0 DM
      savings_account_bonds: 'A61', // < 100 DM
      credit_history: 'A34', // Critical account
      present_employment_since: 'A72', // < 1 year
      personal_status_and_sex: 'A91', // Divorced
      age_in_years: 23,
      job: 'A172', // Unskilled resident
      property: 'A124', // No property
      housing: 'A151', // Rent
      other_installment_plans: 'A142', // Stores
      other_debtors_guarantors: 'A101',
      present_residence_since: '1',
      number_of_existing_credits: '3',
      number_of_liable_people: '2',
      telephone: 'A191',
      foreign_worker: 'A201',
    },
  },
};

const INITIAL_FORM = {
  credit_amount: '4000',
  duration_in_month: '24',
  installment_rate: '2',
  purpose: 'A43',
  status_of_existing_checking_account: 'A12',
  savings_account_bonds: 'A62',
  credit_history: 'A32',
  present_employment_since: 'A73',
  personal_status_and_sex: 'A93',
  age_in_years: '32',
  job: 'A173',
  property: 'A122',
  housing: 'A152',
  other_installment_plans: 'A143',
  other_debtors_guarantors: 'A101',
  present_residence_since: '2',
  number_of_existing_credits: '1',
  number_of_liable_people: '1',
  telephone: 'A191',
  foreign_worker: 'A201',
};

const STEPS = [
  { id: 1, label: 'Loan Terms', icon: '💰', desc: 'Amount & Duration' },
  { id: 2, label: 'Banking & History', icon: '🏦', desc: 'Accounts & Credit' },
  { id: 3, label: 'Borrower Profile', icon: '👤', desc: 'Job & Employment' },
  { id: 4, label: 'Assets & Collateral', icon: '🛡️', desc: 'Property & Housing' },
];

const inputCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 shadow-sm transition-all hover:border-gray-300 dark:hover:border-slate-600';

const labelCls = 'block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5';

const NewApplication = () => {
  const navigate = useNavigate();
  const { addToast, ToastContainer } = useToast();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const applyPreset = (presetKey) => {
    const preset = PRESETS[presetKey];
    if (preset) {
      setForm({
        ...preset.data,
        credit_amount: String(preset.data.credit_amount),
        duration_in_month: String(preset.data.duration_in_month),
        age_in_years: String(preset.data.age_in_years),
      });
      setErrors({});
      addToast(`Loaded preset: ${preset.name}`, 'info');
    }
  };

  // Calculations for live interactive loan summary
  const metrics = useMemo(() => {
    const amount = Number(form.credit_amount) || 0;
    const duration = Number(form.duration_in_month) || 1;
    const monthlyPrincipal = duration > 0 ? Math.round(amount / duration) : 0;
    const estimatedInterestRate = form.status_of_existing_checking_account === 'A13' ? 5.5 : 7.2;
    const monthlyWithInterest = Math.round(monthlyPrincipal * (1 + estimatedInterestRate / 100 / 12));

    // Client-side completeness score
    const totalFields = Object.keys(INITIAL_FORM).length;
    const filledFields = Object.values(form).filter((v) => v !== '' && v !== undefined).length;
    const progressPct = Math.round((filledFields / totalFields) * 100);

    // Preliminary readiness band
    let score = 50;
    if (form.status_of_existing_checking_account === 'A13') score += 20;
    else if (form.status_of_existing_checking_account === 'A11') score -= 20;

    if (form.savings_account_bonds === 'A64') score += 15;
    else if (form.savings_account_bonds === 'A61') score -= 10;

    if (form.credit_history === 'A32' || form.credit_history === 'A31') score += 15;
    else if (form.credit_history === 'A34') score -= 15;

    if (amount > 10000) score -= 10;
    score = Math.max(10, Math.min(95, score));

    return {
      amount,
      duration,
      monthlyWithInterest,
      progressPct,
      readinessScore: score,
    };
  }, [form]);

  const validate = () => {
    const errs = {};
    const creditAmount = Number(form.credit_amount);
    if (!form.credit_amount) errs.credit_amount = 'Credit amount is required.';
    else if (creditAmount < 500 || creditAmount > 200000)
      errs.credit_amount = 'Must be between 500 and 200,000 DM.';

    const duration = Number(form.duration_in_month);
    if (!form.duration_in_month) errs.duration_in_month = 'Duration is required.';
    else if (duration < 1 || duration > 72)
      errs.duration_in_month = 'Must be between 1 and 72 months.';

    const age = Number(form.age_in_years);
    if (!form.age_in_years) errs.age_in_years = 'Age is required.';
    else if (age < 18 || age > 100)
      errs.age_in_years = 'Age must be between 18 and 100.';

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // Switch to step with error
      if (errs.credit_amount || errs.duration_in_month) setCurrentStep(1);
      else if (errs.age_in_years) setCurrentStep(3);
      return;
    }

    setSubmitting(true);
    try {
      const applicantData = {
        ...form,
        credit_amount: Number(form.credit_amount),
        duration_in_month: Number(form.duration_in_month),
        installment_rate: Number(form.installment_rate),
        age_in_years: Number(form.age_in_years),
        present_residence_since: Number(form.present_residence_since),
        number_of_existing_credits: Number(form.number_of_existing_credits),
        number_of_liable_people: Number(form.number_of_liable_people),
      };

      const res = await createApplication({ applicant_data: applicantData });
      addToast('Application registered successfully!', 'success');
      const appId = res.data?.application_id;
      setTimeout(() => {
        if (appId) navigate(`/analysis/${appId}`);
        else navigate('/history');
      }, 700);
    } catch (err) {
      setSubmitError(err.friendlyMessage || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <ToastContainer />

      {/* Header with Quick Presets */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <span className="p-2 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-xl text-2xl border border-teal-100 dark:border-teal-800">
              📝
            </span>
            New Loan Application
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Interactive credit underwriting intake portal · All 20 attributes mapped
          </p>
        </div>

        {/* Quick Presets Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">
            Presets:
          </span>
          <button
            type="button"
            onClick={() => applyPreset('prime')}
            className="text-xs px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Prime Tier
          </button>
          <button
            type="button"
            onClick={() => applyPreset('moderate')}
            className="text-xs px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-blue-500"></span> Standard
          </button>
          <button
            type="button"
            onClick={() => applyPreset('elevated')}
            className="text-xs px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-medium hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Elevated Debt
          </button>
        </div>
      </div>

      {submitError && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-6 flex items-center gap-3 text-sm">
          <span>ℹ️</span>
          <span>{submitError}</span>
        </div>
      )}

      {/* Main Form Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form Area (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Stepper Tabs Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-3 grid grid-cols-2 md:grid-cols-4 gap-2 transition-colors">
            {STEPS.map((s) => {
              const isActive = currentStep === s.id;
              const isPast = currentStep > s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setCurrentStep(s.id)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl text-left transition-all ${
                    isActive
                      ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 shadow-sm text-gray-900 dark:text-white'
                      : isPast
                      ? 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                      : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                      isActive
                        ? 'bg-teal-500 text-white shadow-sm'
                        : isPast
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {isPast ? '✓' : s.id}
                  </div>
                  <div className="overflow-hidden">
                    <p className={`text-xs font-bold truncate ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                      {s.label}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">{s.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Step Panel */}
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-7 space-y-6 transition-colors">
            {/* STEP 1: Loan & Financial Terms */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-gray-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <span>💰</span> Step 1: Loan Terms & Purpose
                  </h2>
                  <span className="text-xs bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full font-semibold border border-teal-100">
                    Step 1 of 4
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Credit Amount with Interactive Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className={labelCls}>Credit Amount (DM)</label>
                      <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
                        {Number(form.credit_amount || 0).toLocaleString()} DM
                      </span>
                    </div>
                    <input
                      type="number"
                      name="credit_amount"
                      value={form.credit_amount}
                      onChange={handleChange}
                      min={500}
                      max={200000}
                      placeholder="e.g. 5000"
                      className={inputCls}
                    />
                    <input
                      type="range"
                      min="500"
                      max="30000"
                      step="500"
                      value={Math.min(30000, Number(form.credit_amount) || 500)}
                      onChange={(e) => setForm((prev) => ({ ...prev, credit_amount: e.target.value }))}
                      className="w-full accent-teal-500 cursor-pointer"
                    />
                    {errors.credit_amount && (
                      <p className="text-red-500 text-xs">{errors.credit_amount}</p>
                    )}
                  </div>

                  {/* Duration with Interactive Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className={labelCls}>Duration (Months)</label>
                      <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
                        {form.duration_in_month} Mos ({Math.round((Number(form.duration_in_month) / 12) * 10) / 10} Yrs)
                      </span>
                    </div>
                    <input
                      type="number"
                      name="duration_in_month"
                      value={form.duration_in_month}
                      onChange={handleChange}
                      min={1}
                      max={72}
                      placeholder="e.g. 24"
                      className={inputCls}
                    />
                    <input
                      type="range"
                      min="6"
                      max="72"
                      step="6"
                      value={Number(form.duration_in_month) || 12}
                      onChange={(e) => setForm((prev) => ({ ...prev, duration_in_month: e.target.value }))}
                      className="w-full accent-teal-500 cursor-pointer"
                    />
                    {errors.duration_in_month && (
                      <p className="text-red-500 text-xs">{errors.duration_in_month}</p>
                    )}
                  </div>

                  {/* Installment Rate */}
                  <div>
                    <label className={labelCls}>Installment Rate (% of Income)</label>
                    <select
                      name="installment_rate"
                      value={form.installment_rate}
                      onChange={handleChange}
                      className={inputCls}
                    >
                      <option value="1">1 — High Burden (≥ 35% of income)</option>
                      <option value="2">2 — Moderate (25% to 35%)</option>
                      <option value="3">3 — Standard (20% to 25%)</option>
                      <option value="4">4 — Low Burden (&lt; 20% of income)</option>
                    </select>
                  </div>

                  {/* Purpose */}
                  <div>
                    <label className={labelCls}>Purpose of Credit</label>
                    <select
                      name="purpose"
                      value={form.purpose}
                      onChange={handleChange}
                      className={inputCls}
                    >
                      <option value="A40">A40 — New Automobile</option>
                      <option value="A41">A41 — Used Automobile</option>
                      <option value="A42">A42 — Furniture & Appliances</option>
                      <option value="A43">A43 — Electronics & Audio/Video</option>
                      <option value="A44">A44 — Domestic Equipment</option>
                      <option value="A45">A45 — Property Repairs</option>
                      <option value="A46">A46 — Education & Tuition</option>
                      <option value="A48">A48 — Retraining Program</option>
                      <option value="A49">A49 — Commercial / Business</option>
                      <option value="A410">A410 — Other Miscellaneous</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Banking & Credit History */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span>🏦</span> Step 2: Account Balances & Credit History
                  </h2>
                  <span className="text-xs bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full font-semibold border border-teal-100">
                    Step 2 of 4
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Checking Account */}
                  <div>
                    <label className={labelCls}>Status of Checking Account</label>
                    <select
                      name="status_of_existing_checking_account"
                      value={form.status_of_existing_checking_account}
                      onChange={handleChange}
                      className={inputCls}
                    >
                      <option value="A11">A11 — Negative / Overdrawn (&lt; 0 DM)</option>
                      <option value="A12">A12 — Moderate Balance (0 to 200 DM)</option>
                      <option value="A13">A13 — High Balance (≥ 200 DM / Prime)</option>
                      <option value="A14">A14 — No Checking Account</option>
                    </select>
                  </div>

                  {/* Savings Account */}
                  <div>
                    <label className={labelCls}>Savings Account / Bonds Tier</label>
                    <select
                      name="savings_account_bonds"
                      value={form.savings_account_bonds}
                      onChange={handleChange}
                      className={inputCls}
                    >
                      <option value="A61">A61 — Minimal (&lt; 100 DM)</option>
                      <option value="A62">A62 — Modest (100 to 500 DM)</option>
                      <option value="A63">A63 — Substantial (500 to 1000 DM)</option>
                      <option value="A64">A64 — Prime Reserve (≥ 1000 DM)</option>
                      <option value="A65">A65 — Unknown / No Savings</option>
                    </select>
                  </div>

                  {/* Credit History (full span) */}
                  <div className="md:col-span-2">
                    <label className={labelCls}>Credit History Record</label>
                    <select
                      name="credit_history"
                      value={form.credit_history}
                      onChange={handleChange}
                      className={inputCls}
                    >
                      <option value="A30">A30 — No prior credits / all paid duly</option>
                      <option value="A31">A31 — All credits at this bank duly serviced</option>
                      <option value="A32">A32 — Existing credits active & in good standing</option>
                      <option value="A33">A33 — Historical delays in past repayments</option>
                      <option value="A34">A34 — Critical account / restructured credit</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Borrower Profile */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span>👤</span> Step 3: Employment & Demographics
                  </h2>
                  <span className="text-xs bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full font-semibold border border-teal-100">
                    Step 3 of 4
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Present Employment */}
                  <div>
                    <label className={labelCls}>Present Employment Duration</label>
                    <select
                      name="present_employment_since"
                      value={form.present_employment_since}
                      onChange={handleChange}
                      className={inputCls}
                    >
                      <option value="A71">A71 — Unemployed</option>
                      <option value="A72">A72 — Less than 1 Year</option>
                      <option value="A73">A73 — 1 to 4 Years</option>
                      <option value="A74">A74 — 4 to 7 Years</option>
                      <option value="A75">A75 — 7+ Years (Established)</option>
                    </select>
                  </div>

                  {/* Job Type */}
                  <div>
                    <label className={labelCls}>Job Classification</label>
                    <select
                      name="job"
                      value={form.job}
                      onChange={handleChange}
                      className={inputCls}
                    >
                      <option value="A171">A171 — Unskilled / Non-resident</option>
                      <option value="A172">A172 — Unskilled Resident</option>
                      <option value="A173">A173 — Skilled Employee / Official</option>
                      <option value="A174">A174 — Management / Professional / Self-Employed</option>
                    </select>
                  </div>

                  {/* Age */}
                  <div>
                    <label className={labelCls}>Applicant Age (Years)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        name="age_in_years"
                        value={form.age_in_years}
                        onChange={handleChange}
                        min={18}
                        max={100}
                        placeholder="e.g. 35"
                        className={inputCls}
                      />
                      <div className="flex gap-1 flex-shrink-0">
                        {['25', '35', '48'].map((age) => (
                          <button
                            key={age}
                            type="button"
                            onClick={() => setForm((p) => ({ ...p, age_in_years: age }))}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg font-medium transition-colors"
                          >
                            {age}
                          </button>
                        ))}
                      </div>
                    </div>
                    {errors.age_in_years && (
                      <p className="text-red-500 text-xs mt-1">{errors.age_in_years}</p>
                    )}
                  </div>

                  {/* Personal Status & Sex */}
                  <div>
                    <label className={labelCls}>Personal Status</label>
                    <select
                      name="personal_status_and_sex"
                      value={form.personal_status_and_sex}
                      onChange={handleChange}
                      className={inputCls}
                    >
                      <option value="A91">A91 — Male: Divorced / Separated</option>
                      <option value="A92">A92 — Female: Divorced / Married</option>
                      <option value="A93">A93 — Male: Single</option>
                      <option value="A94">A94 — Male: Married / Widowed</option>
                      <option value="A95">A95 — Female: Single</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Assets & Collateral */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span>🛡️</span> Step 4: Assets, Housing & Guarantors
                  </h2>
                  <span className="text-xs bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full font-semibold border border-teal-100">
                    Step 4 of 4
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Property */}
                  <div>
                    <label className={labelCls}>Property / Real Estate</label>
                    <select name="property" value={form.property} onChange={handleChange} className={inputCls}>
                      <option value="A121">A121 — Real Estate Property</option>
                      <option value="A122">A122 — Building Society / Life Insurance</option>
                      <option value="A123">A123 — Automobile or Other Asset</option>
                      <option value="A124">A124 — No Property Asset</option>
                    </select>
                  </div>

                  {/* Housing */}
                  <div>
                    <label className={labelCls}>Housing Situation</label>
                    <select name="housing" value={form.housing} onChange={handleChange} className={inputCls}>
                      <option value="A151">A151 — Rental Housing</option>
                      <option value="A152">A152 — Owner Occupied</option>
                      <option value="A153">A153 — Free Housing</option>
                    </select>
                  </div>

                  {/* Other Installment Plans */}
                  <div>
                    <label className={labelCls}>Other Financing Plans</label>
                    <select name="other_installment_plans" value={form.other_installment_plans} onChange={handleChange} className={inputCls}>
                      <option value="A141">A141 — Bank Loan Active</option>
                      <option value="A142">A142 — Store Credit Active</option>
                      <option value="A143">A143 — None (No other plans)</option>
                    </select>
                  </div>

                  {/* Guarantors */}
                  <div>
                    <label className={labelCls}>Co-Signers / Guarantors</label>
                    <select name="other_debtors_guarantors" value={form.other_debtors_guarantors} onChange={handleChange} className={inputCls}>
                      <option value="A101">A101 — None</option>
                      <option value="A102">A102 — Co-Applicant Pledged</option>
                      <option value="A103">A103 — Solvent Guarantor</option>
                    </select>
                  </div>

                  {/* Present Residence Since */}
                  <div>
                    <label className={labelCls}>Present Residence Since</label>
                    <select name="present_residence_since" value={form.present_residence_since} onChange={handleChange} className={inputCls}>
                      <option value="1">1 Year or Less</option>
                      <option value="2">2 Years</option>
                      <option value="3">3 Years</option>
                      <option value="4">4+ Years (Stable)</option>
                    </select>
                  </div>

                  {/* Existing Credits */}
                  <div>
                    <label className={labelCls}>Existing Bank Credits</label>
                    <select name="number_of_existing_credits" value={form.number_of_existing_credits} onChange={handleChange} className={inputCls}>
                      <option value="1">1 Existing Credit</option>
                      <option value="2">2 Existing Credits</option>
                      <option value="3">3 Existing Credits</option>
                      <option value="4">4+ Existing Credits</option>
                    </select>
                  </div>

                  {/* Number of Liable People */}
                  <div>
                    <label className={labelCls}>Dependents / Maintenance</label>
                    <select name="number_of_liable_people" value={form.number_of_liable_people} onChange={handleChange} className={inputCls}>
                      <option value="1">0 to 1 Dependent</option>
                      <option value="2">2 or More Dependents</option>
                    </select>
                  </div>

                  {/* Telephone & Foreign Worker */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Telephone</label>
                      <select name="telephone" value={form.telephone} onChange={handleChange} className={inputCls}>
                        <option value="A191">None</option>
                        <option value="A192">Registered</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Foreign Worker</label>
                      <select name="foreign_worker" value={form.foreign_worker} onChange={handleChange} className={inputCls}>
                        <option value="A201">Yes</option>
                        <option value="A202">No</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between pt-5 border-t border-gray-100 dark:border-slate-800">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((p) => Math.max(1, p - 1))}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-200 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  ← Back to Step {currentStep - 1}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 text-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}

              <div className="flex items-center gap-3">
                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((p) => Math.min(4, p + 1))}
                    className="px-6 py-2.5 rounded-xl font-bold text-sm text-gray-900 transition-all hover:scale-105 shadow-sm"
                    style={{ backgroundColor: '#64FFDA' }}
                  >
                    Continue to Step {currentStep + 1} →
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-3 rounded-xl text-gray-900 font-extrabold text-sm transition-all hover:scale-105 disabled:opacity-60 shadow-lg flex items-center gap-2"
                    style={{ backgroundColor: '#64FFDA' }}
                  >
                    {submitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></span>
                        Evaluating Model…
                      </>
                    ) : (
                      '⚡ Submit & Run Risk Analysis'
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Live Interactive Loan Simulation Card (4 cols) */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-md p-6 space-y-5 transition-colors">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">Live Loan Simulator</h3>
                <p className="text-xs text-gray-400">Dynamic terms calculation</p>
              </div>
              <span className="text-xl">💳</span>
            </div>

            {/* Estimated Payment Box */}
            <div className="p-4 rounded-xl bg-slate-900 dark:bg-slate-950 text-white space-y-1 border border-slate-800">
              <p className="text-[11px] uppercase tracking-wider text-teal-400 font-semibold">
                Est. Monthly Installment
              </p>
              <p className="text-3xl font-extrabold text-white">
                ~{metrics.monthlyWithInterest.toLocaleString()}{' '}
                <span className="text-sm font-normal text-gray-400">DM / mo</span>
              </p>
              <p className="text-[11px] text-gray-400 pt-1">
                Based on {metrics.amount.toLocaleString()} DM over {metrics.duration} months
              </p>
            </div>

            {/* Readiness Gauge */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-gray-600 dark:text-gray-400">Preliminary Readiness Indicator</span>
                <span className="font-bold text-teal-600 dark:text-teal-400">{metrics.readinessScore}%</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${metrics.readinessScore}%`,
                    backgroundColor: metrics.readinessScore >= 70 ? '#10b981' : metrics.readinessScore >= 50 ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {metrics.readinessScore >= 70
                  ? 'Strong applicant profile. High approval likelihood.'
                  : metrics.readinessScore >= 50
                  ? 'Balanced profile. Model will review compensating assets.'
                  : 'High debt burden. May require guarantor or collateral.'}
              </p>
            </div>

            {/* Application Summary Items */}
            <div className="border-t border-gray-100 dark:border-slate-800 pt-4 space-y-2.5 text-xs">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Requested Amount</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{metrics.amount.toLocaleString()} DM</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Repayment Horizon</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{metrics.duration} Months</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Checking Balance Tier</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{form.status_of_existing_checking_account}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Employment Horizon</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{form.present_employment_since}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Applicant Age</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{form.age_in_years || '—'} Years</span>
              </div>
            </div>

            {/* Underwriting Guarantee Badge */}
            <div className="p-3 bg-teal-50 dark:bg-teal-950/50 border border-teal-100 dark:border-teal-800 rounded-xl text-[11px] text-teal-800 dark:text-teal-300 flex items-center gap-2">
              <span>⚡</span>
              <span>
                <strong>Instant Underwriting:</strong> Results evaluated in &lt;100ms via Random Forest pipeline.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewApplication;
