import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Gamepad2, LogIn, UserPlus, CheckCircle2, AlertCircle, Trophy, Sparkles } from 'lucide-react';
import { getSupabase } from '../lib/supabaseClient';
import { GAMES_LIST } from '../utils/gameData';
import { hasBlockedLanguage, sanitizeUserText, moderationMessage } from '../utils/contentModeration';

interface AuthScreenProps {
  onAuthSuccess: (session: any) => void;
  lang: 'ar' | 'en' | 'es' | 'fr';
}

export default function AuthScreen({ onAuthSuccess, lang }: AuthScreenProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [favGame, setFavGame] = useState('EA SPORTS FC 26');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const googleOAuthEnabled = Boolean((window as any).__TACTIC_BOSS_SUPABASE__?.googleOAuthEnabled);

  // Validation touches & states
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [displayNameTouched, setDisplayNameTouched] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email);
  const isPasswordValid = activeTab === 'signup' ? password.length >= 8 : password.length >= 6;
  const doPasswordsMatch = activeTab !== 'signup' || (confirmPassword.length > 0 && confirmPassword === password);
  const isDisplayNameValid = displayName.trim().length >= 2;

  // Localized dictionaries supporting Arabic, English, Spanish, French
  const dict = {
    ar: {
      title: "Tactic Boss AI",
      subtitle: "مدربك التكتيكي الذكي لألعاب كرة القدم",
      loginTab: "تسجيل الدخول",
      signupTab: "إنشاء حساب",
      emailLabel: "البريد الإلكتروني",
      passwordLabel: "كلمة المرور",
      confirmPasswordLabel: "تأكيد كلمة المرور",
      passwordMismatch: "كلمتا المرور غير متطابقتين",
      nameLabel: "الاسم",
      favGameLabel: "لعبتك المفضلة",
      loginBtn: "تسجيل الدخول",
      signupBtn: "إنشاء الحساب",
      googleBtn: "الدخول السريع بحساب Google",
      orConnect: "أو",
      passError: "كلمة المرور يجب ألا تقل عن 6 أحرف",
      fieldsError: "تأكد من إدخال البيانات المطلوبة بشكل صحيح",
      emailHelp: "سنستخدم بريدك لتأمين حسابك وحفظ خططك",
      displayNameHelp: "سيظهر هذا الاسم داخل حسابك وخططك",
      fbPrompt: "فيسبوك (قريباً في الموسم القادم)",
      applePrompt: "آبل (تحت الصيانة الفنية)"
    },
    en: {
      title: "Tactic Boss AI",
      subtitle: "Your smart tactical coach for football games",
      loginTab: "Sign In",
      signupTab: "Create Account",
      emailLabel: "Email Address",
      passwordLabel: "Password",
      confirmPasswordLabel: "Confirm Password",
      passwordMismatch: "Passwords do not match",
      nameLabel: "Display Name",
      favGameLabel: "Favorite Game",
      loginBtn: "Sign In",
      signupBtn: "Create Account",
      googleBtn: "Secure Google Authorization",
      orConnect: "Or",
      passError: "Password requires 6 characters minimum",
      fieldsError: "Please complete the required fields correctly",
      emailHelp: "Your email keeps your account and plans secure",
      displayNameHelp: "This name appears in your account and plans",
      fbPrompt: "Facebook (Coming Next Season)",
      applePrompt: "Apple (Under Technical Maintenance)"
    },
    es: {
      title: "Tactic Boss AI",
      subtitle: "Tu entrenador táctico inteligente para juegos de fútbol",
      loginTab: "Iniciar Sesión",
      signupTab: "Crear Cuenta",
      emailLabel: "Correo Electrónico",
      passwordLabel: "Contraseña",
      confirmPasswordLabel: "Confirmar contraseña",
      passwordMismatch: "Las contraseñas no coinciden",
      nameLabel: "Nombre visible",
      favGameLabel: "Juego favorito",
      loginBtn: "Iniciar sesión",
      signupBtn: "Crear cuenta",
      googleBtn: "Iniciar con Google",
      orConnect: "O",
      passError: "La contraseña debe tener al menos 6 caracteres",
      fieldsError: "Por favor complete todas las credenciales requeridas",
      emailHelp: "Tu correo mantiene seguras tus tácticas y tu cuenta",
      displayNameHelp: "Este nombre aparecerá en tu cuenta y planes",
      fbPrompt: "Facebook (Próximamente)",
      applePrompt: "Apple (Mantenimiento Técnico)"
    },
    fr: {
      title: "Tactic Boss AI",
      subtitle: "Votre coach tactique intelligent pour les jeux de football",
      loginTab: "Connexion",
      signupTab: "Créer un compte",
      emailLabel: "Adresse E-mail",
      passwordLabel: "Mot de passe",
      confirmPasswordLabel: "Confirmer le mot de passe",
      passwordMismatch: "Les mots de passe ne correspondent pas",
      nameLabel: "Nom affiché",
      favGameLabel: "Jeu favori",
      loginBtn: "Se connecter",
      signupBtn: "Créer le compte",
      googleBtn: "Connexion avec Google",
      orConnect: "Ou",
      passError: "Le mot de passe doit contenir au moins 6 caractères",
      fieldsError: "Veuillez remplir toutes les informations d'accès",
      emailHelp: "Votre e-mail sécurise votre compte et vos plans",
      displayNameHelp: "Ce nom apparaîtra dans votre compte et vos plans",
      fbPrompt: "Facebook (Bientôt)",
      applePrompt: "Apple (Maintenance Technique)"
    }
  };

  const activeLang = dict[lang] ? lang : 'en';
  const t = dict[activeLang];
  const msg = (ar: string, en: string, es: string, fr: string) => ({ ar, en, es, fr }[activeLang]);

  // Simulated professional soccer coaching steps to improve loading engagement
  const loadingStepsAr = [
    "جاري فحص أرضية الملعب وعشب الاستاد...",
    "جاري تحليل تكتيكات الميتا الأخيرة لخصومك...",
    "تهيئة اللوحة التكتيكية الرقمية الحرة...",
    "بناء التشكيلة واستدعاء الكشاف الذكي...",
    "جاهز تماماً! نلتقي عند صافرة الانطلاق..."
  ];

  const loadingStepsEn = [
    "Analyzing stadium outline and turf condition...",
    "Scouting active Meta patterns of rival squads...",
    "Initializing digital canvas & drawing layer...",
    "Preparing your tactical workspace...",
    "Squad is ready! Heading to the pitch..."
  ];

  const loadingStepsEs = [
    "Analizando el terreno de juego y el césped...",
    "Evaluando patrones tácticos de los rivales...",
    "Inicializando la pizarra digital de tácticas...",
    "Ensamblando vectores de alineación recomendados...",
    "¡Todo listo! Saliendo al campo..."
  ];

  const loadingStepsFr = [
    "Analyse de la pelouse et de l'état du stade...",
    "Évaluation des schémas tactiques de Meta...",
    "Initialisation du stylet et du tableau tactique...",
    "Préparation de votre espace tactique...",
    "Prêt pour le match! Coup d'envoi imminent..."
  ];

  const loadingSteps = activeLang === 'ar' ? loadingStepsAr :
                       activeLang === 'es' ? loadingStepsEs :
                       activeLang === 'fr' ? loadingStepsFr : loadingStepsEn;

  // Rotate loading step phrases when loading is active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Final checks
    if (!isEmailValid || !isPasswordValid) {
      setErrorMessage(t.fieldsError);
      return;
    }
    if (activeTab === 'signup' && (!isDisplayNameValid || !doPasswordsMatch)) {
      setErrorMessage(!doPasswordsMatch ? t.passwordMismatch : t.fieldsError);
      return;
    }
    if (activeTab === 'signup' && hasBlockedLanguage(displayName)) {
      setErrorMessage(moderationMessage(lang));
      return;
    }

    const sb = getSupabase();
    if (!sb) {
      setErrorMessage(
        msg("خدمة تسجيل الدخول غير متاحة مؤقتًا. حاول مرة أخرى بعد قليل.", "Sign-in is temporarily unavailable. Please try again shortly.", "El inicio de sesión no está disponible temporalmente. Inténtalo de nuevo.", "La connexion est temporairement indisponible. Réessayez bientôt.")
      );
      return;
    }

    setIsLoading(true);

    try {
      if (activeTab === 'login') {
        const { data, error } = await sb.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password
        });

        if (error) throw error;

        setSuccessMessage(msg("تم تسجيل دخولك بنجاح.", "Signed in successfully.", "Sesión iniciada correctamente.", "Connexion réussie."));
        setTimeout(() => {
          onAuthSuccess(data.session);
        }, 1200);
      } else {
        const { data, error } = await sb.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              display_name: sanitizeUserText(displayName, 80) || "Coach",
              favorite_game: favGame || "FC25"
            }
          }
        });

        if (error) throw error;

        if (data.session) {
          setSuccessMessage(
            msg("تم إنشاء حسابك بنجاح.", "Your account was created successfully.", "Tu cuenta se creó correctamente.", "Votre compte a été créé avec succès.")
          );
          setTimeout(() => {
            onAuthSuccess(data.session);
          }, 1500);
        } else {
          setSuccessMessage(
            msg("تم إنشاء الحساب. سجّل الدخول الآن للمتابعة.", "Account created. Please sign in now to continue.", "Cuenta creada. Inicia sesión ahora para continuar.", "Compte créé. Connectez-vous maintenant pour continuer.")
          );
          setActiveTab('login');
        }
      }
    } catch (err: any) {
      console.error("Authentication process error:", err);
      const rawMsg = err.message || "";
      let userFriendly = rawMsg;
      if (rawMsg.includes("Invalid login")) {
        userFriendly = msg("البريد الإلكتروني أو كلمة المرور غير صحيحة.", "Incorrect email or password.", "Correo o contraseña incorrectos.", "E-mail ou mot de passe incorrect.");
      } else if (rawMsg.includes("User already registered")) {
        userFriendly = msg("هذا البريد مسجل مسبقًا.", "This email is already registered.", "Este correo ya está registrado.", "Cet e-mail est déjà enregistré.");
      } else if (rawMsg.includes('network') || rawMsg.includes('fetch')) {
        userFriendly = msg("تعذر الوصول إلى خدمة الدخول حالياً. تحقق من الاتصال ثم حاول مرة أخرى.", "The sign-in service is unreachable right now. Check your connection and try again.", "El servicio de acceso no está disponible ahora. Revisa tu conexión e inténtalo de nuevo.", "Le service de connexion est indisponible pour le moment. Vérifiez votre connexion puis réessayez.");
      }
      setErrorMessage(userFriendly);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    if (!isEmailValid) {
      setErrorMessage(msg("اكتب بريدًا إلكترونيًا صحيحًا أولًا.", "Enter a valid email first.", "Introduce primero un correo válido.", "Saisissez d’abord un e-mail valide."));
      return;
    }
    const sb = getSupabase();
    if (!sb) {
      setErrorMessage(msg("خدمة استعادة الحساب غير متاحة مؤقتًا.", "Account recovery is temporarily unavailable.", "La recuperación de cuenta no está disponible temporalmente.", "La récupération du compte est temporairement indisponible."));
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
      if (error) throw error;
      setSuccessMessage(msg("أرسلنا رابط استعادة كلمة المرور إلى بريدك.", "A password reset link was sent to your email.", "Se envió un enlace para restablecer la contraseña.", "Un lien de réinitialisation a été envoyé."));
    } catch {
      setErrorMessage(msg("تعذر إرسال رابط الاستعادة. حاول مرة أخرى.", "Could not send the reset link. Try again.", "No se pudo enviar el enlace. Inténtalo de nuevo.", "Impossible d’envoyer le lien. Réessayez."));
    } finally { setIsLoading(false); }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const sb = getSupabase();
    if (!googleOAuthEnabled || !sb) {
      setErrorMessage(msg('تسجيل الدخول بجوجل غير متاح حاليًا. استخدم البريد الإلكتروني.', 'Google sign-in is not available yet. Use email sign-in.', 'Google no está disponible todavía. Usa el correo.', 'Google n’est pas encore disponible. Utilisez votre e-mail.'));
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("Google Auth error:", err);
      setErrorMessage(err.message || "Failed to initialize Google Sign-in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#05080e] flex flex-col items-center justify-center p-4 antialiased">
      
      {/* Dynamic Night Stadium CSS Animation Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        
        {/* Sky glow & atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#091515] via-[#040810] to-[#010307]" />
        
        {/* Dynamic sweeping stadium floodlights */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/5 rounded-full filter blur-3xl animate-pulse duration-5000" />
        
        {/* Realistic sweeping light beams */}
        <div className="absolute top-[-50px] left-1/4 w-[120px] h-[600px] bg-white/2 origin-top transform -rotate-12 blur-lg animate-[sweep-light_10s_infinite_alternate]" />
        <div className="absolute top-[-50px] right-1/4 w-[140px] h-[600px] bg-white/3 origin-top transform rotate-12 blur-lg animate-[sweep-right-light_14s_infinite_alternate]" />

        {/* Futuristic Tactical Grid & Field Overlay lines */}
        <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:30px_30px]" />
        
        {/* Absolute field bottom line glow */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-emerald-500/10 to-transparent" />
        
        {/* Stadium circular boundary visual sketch */}
        <div className="absolute bottom-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-[50%] border border-emerald-500/20 shadow-[inset_0_0_100px_rgba(16,185,129,0.08)]" />
        <div className="absolute bottom-[-50px] left-1/2 -translate-x-1/2 w-[400px] h-[200px] rounded-[50%] border border-dashed border-emerald-500/15" />
      </div>

      {/* Main Glassmorphic Clipboard Frame */}
      <div className="w-full max-w-md bg-slate-950/85 border-2 border-slate-800/80 rounded-[35px] p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl relative z-10 overflow-hidden space-y-6">
        
        {/* Holographic Glowing corners */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-violet-500/45 rounded-tl-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-emerald-400/45 rounded-tr-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-emerald-400/45 rounded-bl-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-violet-500/45 rounded-br-3xl pointer-events-none" />

        {/* Dynamic background light flares inside card */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Head Branding */}
        <div className="text-center space-y-3 relative z-10">
          <div className="inline-flex relative">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-violet-600 via-emerald-400 to-indigo-600 blur opacity-65 animate-pulse" />
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center shadow-2xl relative">
              <Gamepad2 size={28} className="text-emerald-400 animate-[bounce_3s_infinite]" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-violet-500 rounded-full p-1 border border-slate-950 shadow">
              <Sparkles size={8} className="text-white fill-white" />
            </div>
          </div>
          
          <div>
            <h1 className="text-2xl font-black text-white tracking-wider flex items-center justify-center gap-2 drop-shadow-[0_2px_10px_rgba(16,185,129,0.3)]">
              {t.title}
              <Trophy size={18} className="text-yellow-400 shrink-0" />
            </h1>
            <p className="text-[11px] text-slate-400 font-medium mt-1.5 max-w-[280px] mx-auto leading-relaxed">
              {t.subtitle}
            </p>
          </div>
        </div>


        {/* Tabs switcher: Sign In vs Sign Up */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-white/5 relative z-10 shadow-inner">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setConfirmPassword('');
              setErrorMessage(null);
            }}
            className={`py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === 'login'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <LogIn size={14} />
            <span>{t.loginTab}</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              setActiveTab('signup');
              setConfirmPassword('');
              setErrorMessage(null);
            }}
            className={`py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === 'signup'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <UserPlus size={14} />
            <span>{t.signupTab}</span>
          </button>
        </div>

        {/* Error message slot */}
        {errorMessage && (
          <div className={`p-3.5 rounded-2xl bg-red-950/30 border border-red-500/30 text-red-300 text-[11px] flex gap-2.5 items-start shadow-md ${lang === 'ar' ? 'text-right' : 'text-left'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed font-bold">{errorMessage}</div>
          </div>
        )}

        {/* Success message slot */}
        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-2 justify-center shadow-md">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <div className="leading-relaxed font-bold">{successMessage}</div>
          </div>
        )}

        {/* Authentication Fields Form */}
        <form onSubmit={handleSubmit} className={`space-y-4 text-slate-300 text-xs ${lang === 'ar' ? 'text-right' : 'text-left'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          
          {/* Sign Up Specific Name Field */}
          {activeTab === 'signup' && (
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 tracking-wide flex items-center gap-1">
                <span>{t.nameLabel}</span>
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className={`absolute ${lang === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-500 z-10`}>
                  <User size={15} />
                </div>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  maxLength={80}
                  placeholder={lang === 'ar' ? "الكابتن غوارديولا" : "Pep Guardiola"}
                  value={displayName}
                  onBlur={() => setDisplayNameTouched(true)}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className={`w-full bg-slate-900/60 border-2 rounded-xl py-2.5 outline-none font-bold transition-all ${
                    lang === 'ar' ? 'pr-10 pl-10' : 'pl-10 pr-10'
                  } ${
                    displayNameTouched
                      ? isDisplayNameValid
                        ? 'border-emerald-500/80 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20'
                        : 'border-red-500/80 focus:border-red-500 focus:ring-1 focus:ring-red-500/20'
                      : 'border-slate-800/80 focus:border-violet-600/80 focus:ring-1 focus:ring-violet-600/20'
                  }`}
                />
                <div className={`absolute ${lang === 'ar' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 z-10`}>
                  {displayNameTouched && (
                    isDisplayNameValid 
                      ? <CheckCircle2 size={14} className="text-emerald-400" />
                      : <AlertCircle size={14} className="text-red-400" />
                  )}
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">{t.displayNameHelp}</p>
            </div>
          )}

          {/* Email Address with validation status */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-400 tracking-wide flex items-center gap-1">
              <span>{t.emailLabel}</span>
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className={`absolute ${lang === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-500 z-10`}>
                <Mail size={15} />
              </div>
              <input
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                maxLength={254}
                placeholder="coach@tacticbossai.com"
                value={email}
                onBlur={() => setEmailTouched(true)}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                className={`w-full bg-slate-900/60 border-2 rounded-xl py-2.5 outline-none font-bold transition-all text-left ${
                  lang === 'ar' ? 'pr-10 pl-10' : 'pl-10 pr-10'
                } ${
                  emailTouched
                    ? isEmailValid
                      ? 'border-emerald-500/80 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20'
                      : 'border-red-500/80 focus:border-red-500 focus:ring-1 focus:ring-red-500/20'
                    : 'border-slate-800/80 focus:border-violet-600/80 focus:ring-1 focus:ring-violet-600/20'
                }`}
              />
              <div className={`absolute ${lang === 'ar' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 z-10`}>
                {emailTouched && (
                  isEmailValid 
                    ? <CheckCircle2 size={14} className="text-emerald-400" />
                    : <AlertCircle size={14} className="text-red-400" />
                )}
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">{t.emailHelp}</p>
          </div>

          {/* Password field with requirements indicator */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-400 tracking-wide flex items-center gap-1">
              <span>{t.passwordLabel}</span>
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className={`absolute ${lang === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-500 z-10`}>
                <Lock size={15} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
                minLength={activeTab === 'signup' ? 8 : 6}
                maxLength={128}
                placeholder="••••••••"
                value={password}
                onBlur={() => setPasswordTouched(true)}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                className={`w-full bg-slate-900/60 border-2 rounded-xl py-2.5 outline-none font-bold transition-all text-left ${
                  lang === 'ar' ? 'pr-10 pl-16' : 'pl-10 pr-16'
                } ${
                  passwordTouched
                    ? isPasswordValid
                      ? 'border-emerald-500/80 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20'
                      : 'border-red-500/80 focus:border-red-500 focus:ring-1 focus:ring-red-500/20'
                    : 'border-slate-800/80 focus:border-violet-600/80 focus:ring-1 focus:ring-violet-600/20'
                }`}
              />
              
              {/* Show / Hide Toggle icon button */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? msg('إخفاء كلمة المرور','Hide password','Ocultar contraseña','Masquer le mot de passe') : msg('إظهار كلمة المرور','Show password','Mostrar contraseña','Afficher le mot de passe')}
                className={`absolute ${lang === 'ar' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 z-20 flex items-center gap-1`}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>

              {/* Password state check icon */}
              <div className={`absolute ${lang === 'ar' ? 'left-10' : 'right-10'} top-1/2 -translate-y-1/2 z-10`}>
                {passwordTouched && (
                  isPasswordValid 
                    ? <CheckCircle2 size={13} className="text-emerald-400" />
                    : <AlertCircle size={13} className="text-red-400" />
                )}
              </div>
            </div>
            
            {/* Live visual passwords strength helper bar */}
            {password.length > 0 && (
              <div className="pt-1.5 space-y-1">
                <div className="flex gap-1 h-1">
                  <div className={`h-full rounded-full flex-grow transition-all duration-300 ${password.length >= 3 ? 'bg-amber-500' : 'bg-red-500'}`} />
                  <div className={`h-full rounded-full flex-grow transition-all duration-300 ${password.length >= 6 ? 'bg-emerald-500' : 'bg-slate-800'}`} />
                  <div className={`h-full rounded-full flex-grow transition-all duration-300 ${password.length >= 9 ? 'bg-violet-500' : 'bg-slate-800'}`} />
                </div>
                <div className="flex justify-between text-[9px] text-slate-500">
                  <span>{msg('قوة كلمة المرور','Password strength','Seguridad de la contraseña','Force du mot de passe')}</span>
                  <span className={isPasswordValid ? "text-emerald-400 font-bold" : "text-amber-400 font-medium"}>
                    {password.length >= 10 ? msg('قوية','Strong','Fuerte','Fort') : password.length >= 8 ? msg('جيدة','Good','Buena','Bon') : msg('ضعيفة','Weak','Débil','Faible')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {activeTab === 'signup' && (
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 tracking-wide flex items-center gap-1">
                <span>{t.confirmPasswordLabel}</span><span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock size={15} className={`absolute ${lang === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-500 z-10`} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  value={confirmPassword}
                  onBlur={() => setConfirmPasswordTouched(true)}
                  onChange={(e) => { setConfirmPassword(e.target.value); if (errorMessage) setErrorMessage(null); }}
                  className={`w-full bg-slate-900/60 border-2 rounded-xl py-2.5 outline-none font-bold transition-all text-left ${lang === 'ar' ? 'pr-10 pl-16' : 'pl-10 pr-16'} ${confirmPasswordTouched ? (doPasswordsMatch ? 'border-emerald-500/80' : 'border-red-500/80') : 'border-slate-800/80 focus:border-violet-600/80'}`}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? msg('إخفاء تأكيد كلمة المرور','Hide password confirmation','Ocultar confirmación','Masquer la confirmation') : msg('إظهار تأكيد كلمة المرور','Show password confirmation','Mostrar confirmación','Afficher la confirmation')} className={`absolute ${lang === 'ar' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 z-20`}>
                  {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {confirmPasswordTouched && !doPasswordsMatch && <p className="text-[10px] text-red-400 font-bold">{t.passwordMismatch}</p>}
            </div>
          )}

          {activeTab === 'login' && (
            <button type="button" onClick={handleForgotPassword} className="text-[11px] text-violet-300 hover:text-violet-200 font-bold text-start">
              {msg("نسيت كلمة المرور؟", "Forgot password?", "¿Olvidaste la contraseña?", "Mot de passe oublié ?")}
            </button>
          )}

          {/* Sign Up Specific Game preference Selection */}
          {activeTab === 'signup' && (
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 tracking-wide">{t.favGameLabel}</label>
              <select
                value={favGame}
                onChange={(e) => setFavGame(e.target.value)}
                className="w-full bg-slate-900/60 border-2 border-slate-800/80 rounded-xl py-2.5 px-4 outline-none font-bold text-slate-100 focus:border-violet-600 transition-all"
              >
                {GAMES_LIST.map((game) => <option key={game.id} value={game.name}>{game.name}</option>)}
              </select>
            </div>
          )}

          {/* Action Trigger Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !isEmailValid || !isPasswordValid || (activeTab === 'signup' && (!isDisplayNameValid || !doPasswordsMatch))}
            className="w-full relative overflow-hidden bg-gradient-to-r from-violet-600 to-emerald-500 text-white font-extrabold py-3.5 px-4 rounded-xl hover:opacity-95 transition-all duration-300 shadow-lg shadow-violet-950/20 active:scale-[0.99] disabled:opacity-50 text-xs uppercase tracking-wider select-none cursor-pointer"
          >
            <span className="flex items-center justify-center gap-2">
              <span>{activeTab === 'login' ? t.loginBtn : t.signupBtn}</span>
            </span>
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-1 items-center z-10">
          <div className="flex-grow border-t border-slate-800/60"></div>
          <span className="flex-shrink mx-4 text-slate-500 text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap">
            {t.orConnect}
          </span>
          <div className="flex-grow border-t border-slate-800/60"></div>
        </div>

        {/* Social Authentication Providers with Google and Locked Platforms */}
        <div className="space-y-2.5 relative z-10">
          {/* Active Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading || !googleOAuthEnabled}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-900 font-black py-2.5 px-4 rounded-xl border border-slate-200 transition-all text-xs shadow-md active:scale-[0.99] disabled:opacity-50 cursor-pointer select-none"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>{googleOAuthEnabled ? t.googleBtn : msg('Google — قريبًا','Google — Coming soon','Google — Próximamente','Google — Bientôt')}</span>
          </button>


        </div>



        {/* Footer info lock stamp */}
        <div className="pt-3 border-t border-slate-800/60 text-center relative z-10 space-y-2">
          <div className="flex items-center justify-center gap-3 text-[10px] font-bold">
            <a href="/privacy.html" target="_blank" rel="noreferrer" className="text-violet-300 hover:text-white">{msg('الخصوصية','Privacy','Privacidad','Confidentialité')}</a>
            <span className="text-slate-700">•</span>
            <a href="/terms.html" target="_blank" rel="noreferrer" className="text-violet-300 hover:text-white">{msg('الشروط','Terms','Términos','Conditions')}</a>
            <span className="text-slate-700">•</span>
            <a href="/delete-account.html" target="_blank" rel="noreferrer" className="text-red-300 hover:text-white">{msg('حذف الحساب','Delete account','Eliminar cuenta','Supprimer le compte')}</a>
          </div>
          <p className="text-[10px] text-slate-500 font-extrabold tracking-wide uppercase">
            {msg("Tactic Boss AI © جميع الحقوق محفوظة", "Tactic Boss AI © All rights reserved", "Tactic Boss AI © Todos los derechos reservados", "Tactic Boss AI © Tous droits réservés")}
          </p>
        </div>

      </div>

      {/* High-Tech Soccer Coaching Loading Overlay / Tactical Simulation */}
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-[#04080e]/95 flex flex-col items-center justify-center p-6 backdrop-blur-md animate-fade-in">
          
          {/* Animated football field tactical chalk simulation */}
          <div className="relative w-72 h-44 border border-emerald-500/20 bg-slate-950/80 rounded-2xl p-4 overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.15)] flex flex-col justify-between mb-8">
            
            {/* Field markers */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-emerald-500/10 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-emerald-500/10 pointer-events-none" />
            
            {/* Holographic grid scanner line */}
            <div className="absolute inset-x-0 h-[2px] bg-emerald-400/30 blur-sm shadow-emerald-400 animate-[sweep-light_2.5s_infinite_ease-in-out]" />

            {/* Tactical animated nodes representing team vectors drawing runs */}
            <div className="absolute top-1/3 left-1/4 w-3.5 h-3.5 rounded-full bg-violet-600 border border-white flex items-center justify-center text-[7px] text-white font-black animate-pulse">
              X
            </div>
            
            <div className="absolute top-2/3 right-1/4 w-3.5 h-3.5 rounded-full bg-emerald-500 border border-white flex items-center justify-center text-[7px] text-white font-black animate-ping">
              O
            </div>
            
            {/* Simulated run arrow path with glowing vector dot */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
              <path d="M 72, 70 Q 144, 30 216, 110" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="5,5" />
            </svg>
            
            <div className="absolute top-1/3 left-1/2 text-white font-mono text-[9px] bg-slate-900 border border-white/5 py-0.5 px-1.5 rounded animate-bounce">
              ⚽ TACTIC ANALYSIS
            </div>

            <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono">
              <span>{msg('تحليل مباشر','Live analysis','Análisis en vivo','Analyse en direct')}</span>
              <span>{msg('جاهز للمباراة','Match ready','Listo para el partido','Prêt pour le match')}</span>
            </div>
          </div>

          {/* Loader Spinner */}
          <div className="relative flex items-center justify-center mb-4">
            <div className="w-14 h-14 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
            <div className="absolute w-8 h-8 border-4 border-violet-500/10 border-t-violet-400 rounded-full animate-spin duration-1000" />
          </div>

          {/* Sliding slangs text rotating above */}
          <div className="text-center space-y-2 max-w-[320px]">
            <h3 className="text-sm font-black text-white tracking-wide animate-pulse">
              {msg('جاري تجهيز مساحتك التكتيكية...','Preparing your tactical workspace...','Preparando tu espacio táctico...','Préparation de votre espace tactique...')}
            </h3>
            <p className="text-xs text-slate-400 font-medium h-8 animate-fade-in">
              {loadingSteps[loadingStep]}
            </p>
          </div>
          
          {/* Bottom Progress status bar indicator */}
          <div className="w-48 bg-slate-900 border border-white/5 rounded-full h-1.5 overflow-hidden mt-6">
            <div 
              className="bg-gradient-to-r from-violet-600 to-emerald-400 h-full transition-all duration-300"
              style={{ width: `${((loadingStep + 1) / loadingSteps.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Styled inject animations to guarantee rendering perfectly in preview frames */}
      <style>{`
        @keyframes sweep-light {
          0% { transform: rotate(-25deg) translateX(-10%); opacity: 0.1; }
          100% { transform: rotate(20deg) translateX(10%); opacity: 0.3; }
        }
        @keyframes sweep-right-light {
          0% { transform: rotate(25deg) translateX(10%); opacity: 0.05; }
          100% { transform: rotate(-20deg) translateX(-10%); opacity: 0.25; }
        }
      `}</style>
    </div>
  );
}
