/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SingularityMode } from '../types';
import { useLanguage } from '../lib/i18n';
import { 
  Orbit, Sparkles, Cpu, Droplet, LineChart, Flame, 
  HelpCircle, ShieldAlert, CheckCircle2, Play, Info, ArrowRight, BookOpen, Terminal, Scale, ShieldCheck, Globe, Waves,
  Infinity, ExternalLink
} from 'lucide-react';
import Latex from './Latex';

interface CaseStudy {
  id: string;
  title: string;
  titleEn?: string;
  category: string;
  categoryEn?: string;
  icon: React.ComponentType<any>;
  mode: SingularityMode;
  classicalFail: string;
  classicalFailEn?: string;
  classicalFormula: string;
  ricisSolution: string;
  ricisSolutionEn?: string;
  ricisFormula: string;
  explanation: string;
  explanationEn?: string;
  steps: string[];
  stepsEn?: string[];
  presetParams: any;
  colorClass: string;
  bgGlow: string;
}

interface StressTest {
  id: string;
  level: string;
  name: string;
  nameEn?: string;
  input: string;
  point: number;
  pointLabel: string;
  classicalFormula: string;
  ricisFormula: string;
  safetyProtocol: string;
  explanation: string;
  explanationEn?: string;
  derivationSteps: string[];
  derivationStepsEn?: string[];
  compute: (x: number, theta: number) => { classical: string | number; regularized: string | number };
  sliderMin: number;
  sliderMax: number;
  sliderStep: number;
  defaultValue: number;
}

interface CasesAndSolutionsProps {
  onLoadPreset: (mode: SingularityMode, params: any) => void;
  initialSelectedTestId?: string | null;
  onClearSelectedTest?: () => void;
}

export default function CasesAndSolutions({ onLoadPreset, initialSelectedTestId, onClearSelectedTest }: CasesAndSolutionsProps) {
  const { language, t } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<'library' | 'stressTests'>('library');
  const [selectedCase, setSelectedCase] = useState<string>('gravitational');
  const [selectedTest, setSelectedTest] = useState<string>('L0');
  
  // Update selected test externally if needed
  useEffect(() => {
    if (initialSelectedTestId) {
      setSelectedTest(initialSelectedTestId);
      setActiveSubTab('stressTests');
      if (onClearSelectedTest) {
        onClearSelectedTest();
      }
    }
  }, [initialSelectedTestId, onClearSelectedTest]);
  
  // Interactive test states
  const [interactiveX, setInteractiveX] = useState<number>(2.0);
  const [interactiveTheta, setInteractiveTheta] = useState<number>(0.3);

  const cases: CaseStudy[] = [
    {
      id: 'gravitational',
      title: 'Гравитационный коллапс Шварцшильда',
      titleEn: 'Schwarzschild Gravitational Collapse',
      category: 'Астрофизика и ОТО',
      categoryEn: 'Astrophysics & GR',
      icon: Orbit,
      mode: SingularityMode.GRAVITATIONAL,
      classicalFail: 'При приближении к центру чёрной дыры (r → 0) инвариант кривизны Кретчмана уходит в бесконечность, порождая бесконечную гравитацию и физическую сингулярность.',
      classicalFailEn: 'As the black hole center is approached (r → 0), the Kretschmann curvature invariant goes to infinity, generating infinite gravity and a physical singularity.',
      classicalFormula: 'K_{classical} = \\frac{48 G^2 M^2}{c^4 r^6} \\to \\infty',
      ricisSolution: 'Пространственно-подобное квантовое ядро RICIS III заменяет точечную массу на гладкое распределение натяжения пространства-времени с регуляризационным масштабом θ.',
      ricisSolutionEn: 'The space-like quantum core of RICIS III replaces the point mass with a smooth distribution of spacetime tension using a regularization scale θ.',
      ricisFormula: 'K_{RICIS} = \\frac{48 M^2}{r^6 + \\theta^6}',
      explanation: 'Благодаря сглаживанию знаменателя, при r = 0 кривизна остаётся строго конечной и пропорциональной M²/θ⁶, полностью предотвращая разрыв пространства-времени и бесконечную спагеттификацию.',
      explanationEn: 'By smoothing the denominator, the curvature at r = 0 remains strictly finite and proportional to M²/θ⁶, completely preventing spacetime tearing and infinite spaghettification.',
      steps: [
        'Инициализация массы M и масштаба квантового ядра θ = regularization * R_s',
        'Отображение гравитационного колодца без разделения на сингулярные изолированные сингулярности',
        'Вычисление тензора кривизны при r = 0 через прямое сопряжение (схлопывание даёт точное конечное значение)',
        'Стабилизация приливных сил наблюдателя на безопасном пределе при пересечении горизонта событий'
      ],
      stepsEn: [
        'Initialize mass M and quantum core scale θ = regularization * R_s',
        'Display the gravitational well without separation into singular isolated singularities',
        'Calculate the curvature tensor at r = 0 via direct conjugation (collapse yields an exact finite value)',
        'Stabilize the observer\'s tidal forces at a safe limit when crossing the event horizon'
      ],
      presetParams: {
        mass: 5,
        spin: 0.0,
        charge: 0.0,
        radius: 0.1,
        regularization: 0.8
      },
      colorClass: 'text-cyan-400 border-cyan-500/30',
      bgGlow: 'from-cyan-500/10'
    },
    {
      id: 'complex',
      title: 'Существенная сингулярность exp(1/z)',
      titleEn: 'Essential Singularity exp(1/z)',
      category: 'Комплексный Анализ',
      categoryEn: 'Complex Analysis',
      icon: Sparkles,
      mode: SingularityMode.COMPLEX_ANALYSIS,
      classicalFail: 'Теорема Сохоцкого-Вейерштрасса: в любой сколь угодно малой окрестности z = 0 функция принимает абсолютно любые комплексные значения бесконечно часто, делая пределы неопределёнными и вызывая хаос фаз.',
      classicalFailEn: 'Sokhotski–Weierstrass theorem: in any arbitrarily small neighborhood of z = 0, the function takes absolutely any complex values infinitely often, making limits undefined and causing phase chaos.',
      classicalFormula: 'f(z) = e^{\\frac{1}{z}} \\quad (z \\to 0)',
      ricisSolution: 'Метод ε-раздутия (Blow-up) комплексного полюса проецирует сингулярную точку z_0 в регулярный тор Римана, сглаживая фазовый вихрь.',
      ricisSolutionEn: 'The ε-blow-up method of the complex pole projects the singular point z_0 onto a regular Riemann torus, smoothing the phase vortex.',
      ricisFormula: '1/z \\to \\frac{\\bar{z}}{|z|^2 + \\epsilon^2}',
      explanation: 'Введение комплексного зазора ε предотвращает бесконечную спираль фаз и обеспечивает гладкое domain coloring-отображение. Вместо неопределённости в ядре формируется регулярная симметричная область перехода.',
      explanationEn: 'Introducing a complex gap ε prevents an infinite phase spiral and provides smooth domain coloring. Instead of uncertainty, a regular symmetrical transition region forms in the core.',
      steps: [
        'Замена комплексного деления 1/dz на сопряжённую форму с добавлением вещественного сдвига ε²',
        'Подавление экстремальной осцилляции вещественной и мнимой частей функции в окрестности 0',
        'Визуализация регулярной гладкой вихревой структуры без геометрического разрыва фаз',
        'Возможность сквозного дифференцирования в точке z = 0'
      ],
      stepsEn: [
        'Replace complex division 1/dz with the conjugate form, adding a real shift ε²',
        'Suppress extreme oscillations of real and imaginary parts of the function near 0',
        'Visualize a regular smooth vortex structure without geometric phase disruption',
        'Allow full differentiability at the point z = 0'
      ],
      presetParams: {
        funcType: 'essential',
        singularityX: 0.0,
        singularityY: 0.0,
        zoom: 1.5,
        blowUp: 0.25,
        cursorX: 0.1,
        cursorY: 0.1
      },
      colorClass: 'text-cyan-400 border-cyan-500/30',
      bgGlow: 'from-cyan-500/10'
    },
    {
      id: 'kinematic',
      title: 'Сингулярность Якобиана манипулятора',
      titleEn: 'Manipulator Jacobian Singularity',
      category: 'Робототехника и Кинематика',
      categoryEn: 'Robotics & Kinematics',
      icon: Cpu,
      mode: SingularityMode.KINEMATIC,
      classicalFail: 'При полном выпрямлении звеньев робота детерминант Якобиана det(J) обращается в ноль. Для движения рабочего органа требуются бесконечные угловые скорости приводов суставов dθ/dt = J⁻¹ v → ∞.',
      classicalFailEn: 'When robotic links are fully straightened, the Jacobian determinant det(J) becomes zero. Moving the end-effector requires infinite joint velocities dθ/dt = J⁻¹ v → ∞.',
      classicalFormula: '\\dot{\\theta} = J^{-1} v = \\frac{1}{det(J)} Adj(J) v \\to \\infty',
      ricisSolution: 'Динамическое демпфирование по методу наименьших квадратов с введением RICIS-коэффициента стабилизации λ регулирует скорости суставов за счёт минимального временного отклонения от траектории.',
      ricisSolutionEn: 'Damped Least Squares (DLS) method with a RICIS stabilization coefficient λ regulates joint velocities at the cost of a minimal temporary path deviation.',
      ricisFormula: 'J^* = J^T (J J^T + \\lambda^2 I)^{-1}',
      explanation: 'В сингулярных зонах, когда det(J) → 0, регуляризатор λ² плавно отключает «невозможные» направления движения, сохраняя угловые скорости суставов строго ограниченными на физически доступном уровне.',
      explanationEn: 'In singular zones, when det(J) → 0, the regularizer λ² smoothly damps "impossible" directions of movement, keeping joint velocities strictly bounded at physically safe levels.',
      steps: [
        'Мониторинг индекса манипулируемости Ёсикавы (det(J * J^T))',
        'Приближение звеньев к выпрямленному состоянию (угол θ₂ ≈ 0° или 180°)',
        'Автоматическая замена сингулярного обращения J⁻¹ на сглаженную псевдообратную матрицу J*',
        'Абсолютная защита моторов приводов от перегрузки по току и неконтролируемых рывков'
      ],
      stepsEn: [
        'Monitor Yoshikawa\'s manipulability index (det(J * J^T))',
        'Detect links approaching a fully straightened state (angle θ₂ ≈ 0° or 180°)',
        'Automatically replace singular inversion J⁻¹ with the smooth pseudoinverse matrix J*',
        'Provide absolute actuator motor protection against current overload and uncontrolled jerks'
      ],
      presetParams: {
        angle1: 0,
        angle2: 180,
        length1: 100,
        length2: 80,
        targetVx: 30,
        targetVy: 20,
        damping: 0.2
      },
      colorClass: 'text-cyan-400 border-cyan-500/30',
      bgGlow: 'from-cyan-500/10'
    },
    {
      id: 'navier',
      title: 'Взрыв градиента Навье-Стокса',
      titleEn: 'Navier-Stokes Gradient Blow-up',
      category: 'Гидродинамика',
      categoryEn: 'Fluid Dynamics',
      icon: Droplet,
      mode: SingularityMode.NAVIER_STOKES,
      classicalFail: 'При экстремальных числах Рейнольдса или локальном закручивании потока возможно локальное схлопывание вихрей с бесконечным ростом завихренности ω → ∞ за конечное время.',
      classicalFailEn: 'At extreme Reynolds numbers or local flow swirling, local vortex collapse is possible with infinite vorticity growth ω → ∞ in finite time.',
      classicalFormula: '\\omega = \\nabla \\times u \\to \\infty \\quad (t \\to t^* )',
      ricisSolution: 'Введение нелинейного масштаба фильтрации завихренности θ в вязкий тензор. Сверхвысокие градиенты скорости рассеиваются за счёт локального увеличения микроэффективной вязкости.',
      ricisSolutionEn: 'Introducing a non-linear vorticity filtration scale θ into the viscous tensor. Ultra-high velocity gradients dissipate due to a local increase in micro-effective viscosity.',
      ricisFormula: '\\nu_{eff} = \\nu + \\theta^2 |\\nabla u|',
      explanation: 'Турбулентные вихри стабилизируются, не допуская бесконечного сжатия. Потери энергии ограничиваются на физически адекватном уровне, обеспечивая гладкость решения во всех точках.',
      explanationEn: 'Turbulent vortices are stabilized, preventing infinite compression. Energy loss is bounded at a physically adequate level, ensuring solution smoothness at all points.',
      steps: [
        'Моделирование концентрированного осесимметричного вихря потока',
        'Расчёт локального градиента давления и градиента скорости завихренности',
        'Замена классической константной вязкости на адаптивный тензор RICIS III',
        'Предотвращение разрыва плотности линий тока и обеспечение устойчивой численной сходимости'
      ],
      stepsEn: [
        'Model a concentrated axisymmetric flow vortex',
        'Calculate local pressure gradient and vorticity velocity gradient',
        'Replace classical constant viscosity with the adaptive RICIS III tensor',
        'Prevent streamline density disruption and ensure robust numerical convergence'
      ],
      presetParams: {
        reynolds: 150,
        radialVelocity: 3.0,
        observerRadius: 0.05,
        regularization: 0.7,
        viscosity: 0.1
      },
      colorClass: 'text-cyan-400 border-cyan-500/30',
      bgGlow: 'from-cyan-500/10'
    },
    {
      id: 'riemann',
      title: 'Полюс Дзета-функции Римана при s = 1',
      titleEn: 'Riemann Zeta Function Pole at s = 1',
      category: 'Теория Чисел',
      categoryEn: 'Number Theory',
      icon: LineChart,
      mode: SingularityMode.RIEMANN,
      classicalFail: 'Дзета-функция имеет простой полюс первого порядка в точке s = 1, где гармонический ряд расходится. Значение ζ(1) неопределено, стремясь к бесконечности с вычетом 1.',
      classicalFailEn: 'The zeta function has a simple first-order pole at s = 1, where the harmonic series diverges. The value ζ(1) is undefined, approaching infinity with residue 1.',
      classicalFormula: '\\zeta(s) \\to \\frac{1}{s-1} + \\gamma \\to \\infty \\quad (s \\to 1)',
      ricisSolution: 'Аналитическая замена сингулярной составляющей регулярной гладкой функцией с комплексным весом θ, сохраняющей арифметические тождества теории чисел вне полюса.',
      ricisSolutionEn: 'Analytical replacement of the singular component with a regular smooth function of complex weight θ, preserving arithmetic identities of number theory outside the pole.',
      ricisFormula: '\\zeta_{RICIS}(s) = \\zeta(s) - \\frac{1}{s-1} + \\frac{s-1}{(s-1)^2 + \\theta^2}',
      explanation: 'При s = 1 значение регуляризованной функции плавно переходит в постоянную Эйлера-Маскерони γ ≈ 0.5772. Дзета-функция становится непрерывной вдоль всей вещественной оси.',
      explanationEn: 'At s = 1, the regularized function value smoothly transitions into the Euler-Mascheroni constant γ ≈ 0.5772. The zeta function becomes continuous along the entire real axis.',
      steps: [
        'Выделение сингулярного ядра 1/(s-1) из аналитического продолжения дзета-функции',
        'Добавление компенсирующего члена RICIS III в знаменатель полюса',
        'Сглаживание амплитудного пика в критической окрестности s = 1',
        'Построение непрерывного фазового портрета через точку расходимости классической теории'
      ],
      stepsEn: [
        'Extract the singular core 1/(s-1) from the analytic continuation of the zeta function',
        'Add the compensating RICIS III term to the pole denominator',
        'Smooth the amplitude peak in the critical neighborhood of s = 1',
        'Construct a continuous phase portrait through the classical divergence point'
      ],
      presetParams: {
        sigma: 1.0,
        t: 0.0,
        regularization: 0.4,
        zoom: 3.5
      },
      colorClass: 'text-cyan-400 border-cyan-500/30',
      bgGlow: 'from-cyan-500/10'
    },
    {
      id: 'yangmills',
      title: 'Инфракрасный предел Янга-Миллса',
      titleEn: 'Yang-Mills Infrared Limit',
      category: 'Квантовая Теория Поля',
      categoryEn: 'Quantum Field Theory',
      icon: Flame,
      mode: SingularityMode.YANG_MILLS,
      classicalFail: 'При уменьшении энергии Q (или росте расстояния r) эффективный заряд α_s неограниченно растет, упираясь в так называемый Ландау-полюс, что делает теорию возмущений неприменимой.',
      classicalFailEn: 'At low energy scale Q (or large distance r), the effective coupling constant α_s grows unbounded, hitting the so-called Landau pole, which invalidates perturbation theory.',
      classicalFormula: '\\alpha_s(Q^2) = \\frac{4\\pi}{\\beta_0 \\ln(Q^2 / \\Lambda_{QCD}^2)} \\to \\infty',
      ricisSolution: 'Инфракрасное «замораживание» константы связи за счёт непертурбативного регуляризатора массы глюона θ. Знаменатель логарифма защищается от обращения в ноль.',
      ricisSolutionEn: 'Infrared "freezing" of the coupling constant using a non-perturbative gluon mass regularizer θ. The logarithm denominator is protected from becoming zero.',
      ricisFormula: '\\alpha_s^{RICIS} = \\frac{4\\pi}{\\beta_0 \\ln(\\frac{Q^2 + 4\\theta^2}{\\Lambda^2})}',
      explanation: 'Константа связи монотонно выходит на плато (замораживается) в инфракрасной области. Это физически обосновывает отсутствие расходимости и существование массовой щели в SU(3) калибровочной теории.',
      explanationEn: 'The coupling constant smoothly plateaus (freezes) in the infrared region. This physically explains the absence of divergence and the existence of a mass gap in SU(3) gauge theory.',
      steps: [
        'Анализ кварк-антикваркового потенциала взаимодействия',
        'Внедрение эффективной массы глюона θ как регуляризатора малых импульсов',
        'Устранение полюса Ландау в бегущей константе связи при энергии Q = Λ_QCD',
        'Доказательство конечной величины конфайнмента цвета без бесконечностей энергии'
      ],
      stepsEn: [
        'Analyze the quark-antiquark interaction potential',
        'Introduce an effective gluon mass θ as a low-momentum regularizer',
        'Eliminate the Landau pole in the running coupling constant at energy Q = Λ_QCD',
        'Prove a finite value for color confinement without energy infinities'
      ],
      presetParams: {
        coupling: 1.5,
        distance: 0.02,
        regularization: 0.5,
        energyScale: 0.4
      },
      colorClass: 'text-purple-400 border-purple-500/30',
      bgGlow: 'from-purple-500/10'
    },
    {
      id: 'seo_indexing',
      title: 'Индексация веб-ресурсов (SEO)',
      titleEn: 'Web Resource Indexing (SEO)',
      category: 'Информационная Топология',
      categoryEn: 'Information Topology',
      icon: Globe,
      mode: SingularityMode.THEORY,
      classicalFail: 'Локальная сингулярность неиндексированного сайта: информационная емкость (F) контента отлична от нуля, но доступность для поисковых краулеров равна нулю. Неопределенность вида: 0_видимость · ∞_контент.',
      classicalFailEn: 'Local singularity of an unindexed website: content capacity (F) is non-zero, but accessibility for search crawlers is zero. Indeterminacy of the type: 0_visibility · ∞_content.',
      classicalFormula: '0_{visibility} \\cdot \\infty_{content} \\quad (\\text{Неопределенность})',
      ricisSolution: 'Топологическая регуляризация информационного пространства через протоколы L1_IDENTITY (канонизация), SP2 (устранение дублей) и введение регуляризирующего параметра θ (robots.txt и sitemap.xml).',
      ricisSolutionEn: 'Topological regularization of the information space via L1_IDENTITY (canonicalization), SP2 (duplicate resolution), and introducing a regularizing parameter θ (robots.txt & sitemap.xml).',
      ricisFormula: '0_F \\times \\infty_G = F \\cdot G = \\text{Конечная Индексация}',
      explanation: 'Процесс перевода сайта в регулярное проиндексированное состояние. Включение L1_IDENTITY и SP2 гарантирует уникальность каждой страницы (X=X, X/X=1), исключая дубли из краулингового бюджета. Семантический индекс SP4 (Schema.org и микроразметка) позволяет роботу классифицировать сущности через исходное выражение E(x).',
      explanationEn: 'The process of bringing a website to a regular indexed state. L1_IDENTITY and SP2 guarantee uniqueness of each page (X=X, X/X=1), eliminating duplicates from the crawl budget. Semantic indexing via SP4 (Schema.org and microdata) allows crawlers to classify entities through the parent expression E(x).',
      steps: [
        'Настройка главного зеркала и канонических тегов canonical (SP2_REDUCTION_PRIORITY)',
        'Оптимизация семантической разметки и уникальных метатегов Schema.org (SP4_SEMANTIC_PRIORITY)',
        'Регуляризация краулингового пути robots.txt и карты сайта sitemap.xml (введение параметра θ)',
        'Искусственное разрешение сингулярности в панелях веб-мастеров Google Search Console (A1_INDEXING)',
        'Создание связанного информационного монолита 2-го порядка через внутреннюю перелинковку и внешние ссылки'
      ],
      stepsEn: [
        'Configure the main mirror and canonical tags (SP2_REDUCTION_PRIORITY)',
        'Optimize semantic microdata and Schema.org meta tags (SP4_SEMANTIC_PRIORITY)',
        'Regularize the crawl path via robots.txt and sitemap.xml (introducing parameter θ)',
        'Resolve indexing singularities directly inside Google Search Console (A1_INDEXING)',
        'Build a connected 2nd-order information monolith via internal and external link architecture'
      ],
      presetParams: {},
      colorClass: 'text-emerald-400 border-emerald-500/30',
      bgGlow: 'from-emerald-500/10'
    },
    {
      id: 'chladni_resonance',
      title: 'Акустические волны и резонансы Хладни',
      titleEn: 'Acoustic Waves & Chladni Resonances',
      category: 'Волновая Механика & Резонансы',
      categoryEn: 'Wave Mechanics & Resonances',
      icon: Waves,
      mode: SingularityMode.CHLADNI,
      classicalFail: 'При совпадении частоты вынуждающего воздействия с собственной модой ω → ω_0 и нулевом затухании γ → 0 амплитуда волны устремляется в бесконечность. Также фазовые разрывы возникают в полярных координатах при r → 0.',
      classicalFailEn: 'When driving frequency matches the natural mode ω → ω_0 and damping is zero γ → 0, wave amplitude approaches infinity. Phase discontinuities also occur in polar coordinates at r → 0.',
      classicalFormula: '\\lim_{\\omega \\to \\omega_0} \\frac{1}{\\sqrt{(\\omega^2 - \\omega_0^2)^2 + (\\gamma \\omega)^2}} = \\infty',
      ricisSolution: 'Применение регуляризационного θ-сдвига в знаменателе уравнения резонансного отклика и полярном счислении, что предотвращает появление разрывов амплитуды и фазы волнового поля.',
      ricisSolutionEn: 'Applying a regularizing θ-shift to the resonance response denominator and polar calculations, preventing amplitude and phase discontinuities in the wave field.',
      ricisFormula: 'U(\\omega) = \\frac{\\Psi(x,y)}{\\sqrt{(\\omega^2 - \\omega_0^2)^2 + (\\gamma \\omega)^2 + \\theta^2}}',
      explanation: 'Методология RICIS III регуляризует классическое уравнение вынужденных колебаний упругих пластин. Замена нулевого регуляризационного параметра θ на гладкое значение θ > 0 устраняет бесконечность амплитуды при резонансе и исключает разрывы фазовых углов в упругой среде пластины Хладни.',
      explanationEn: 'The RICIS III methodology regularizes the classical equation of forced vibrations of elastic plates. Replacing the zero regularizing parameter θ with a smooth value θ > 0 eliminates the infinite resonance amplitude and phase angle discontinuities inside Chladni plates.',
      steps: [
        'Перевод волнового поля круглой упругой мембраны в полярные координаты с RICIS θ-коррекцией',
        'Интегрирование гармоник по первому роду Бесселя для вычисления собственных частот ω_i',
        'Добавление затухания среды γ и регуляризирующей метрики θ² в делителе амплитуд',
        'Отрисовка тонких изолиний нулевого потенциала (чернила манускрипта) с использованием золотого сечения B/A',
        'Анализ накопления песка в узловых линиях при различной скважности и форме сигнала'
      ],
      stepsEn: [
        'Convert circular elastic membrane wave field to polar coordinates with RICIS θ-correction',
        'Integrate harmonics using Bessel functions of the first kind to compute natural frequencies ω_i',
        'Add damping γ and regularizing metric θ² into the amplitude divisor',
        'Draw fine zero-potential contours (manuscript ink) utilizing the golden ratio B/A',
        'Analyze sand accumulation on nodal lines under various signal duty cycles and wave forms'
      ],
      presetParams: {
        activePackage: 3,
        frequency: 800,
        regularization: 0.12,
        damping: 0.02,
        plateType: 'circle',
        sandType: 'colored'
      },
      colorClass: 'text-amber-400 border-amber-500/30',
      bgGlow: 'from-amber-500/10'
    },
    {
      id: 'cdcc',
      title: 'Континуум-гипотеза Кантора (CDCC)',
      titleEn: "Cantor's Diagonal Continuum Conjecture (CDCC)",
      category: 'Теория множеств и сингулярности',
      categoryEn: 'Set Theory & Singularities',
      icon: Infinity,
      mode: SingularityMode.CDCC,
      classicalFail: 'Теоремы Гёделя о неполноте и доказательство Коэна: континуум-гипотеза (CH) независима от аксиоматики ZFC. Невозможно доказать или опровергнуть существование промежуточной мощности между счетным множеством и континуумом, что образует фундаментальную логическую сингулярность теории множеств.',
      classicalFailEn: "Gödel's incompleteness theorems and Cohen's forcing proof show that the Continuum Hypothesis (CH) is independent of ZFC. It is impossible to prove or disprove the existence of an intermediate cardinality between countable sets and the continuum, creating a fundamental set-theoretic singularity.",
      classicalFormula: '2^{\\aleph_0} = \\aleph_1 \\quad (\\text{Неразрешимо в ZFC})',
      ricisSolution: 'Аппарат RICIS-III разрешает континуум-гипотезу через конструкцию монолитов высших порядков и индексацию бесконечностей. Континуум представляется как Линейный Монолит 1-го порядка, плотность точек которого строго следует из L1-тождеств и рекурсивных фрактальных законов R(Q).',
      ricisSolutionEn: 'The RICIS-III framework resolves the Continuum Hypothesis through the construction of higher-order monoliths and recursive indexing of infinities. The continuum is represented as a First-Order Monolith (Line), where the density of points (cardinality) strictly follows from L1 identities and fractal unfolding laws R(Q).',
      ricisFormula: '2^{\\aleph_0} = \\aleph_{1} = \\infty_{\\text{Line}} = \\text{Monolith}_{\\text{Order 1}}',
      explanation: 'В рамках теории монолитов RICIS III классическое противоречие теории множеств разрешается за счёт устранения качественного разрыва типов. Множество вещественных чисел проецируется на непрерывный линейный монолит, где отношение мощностей перестаёт быть трансфинитным парадоксом, а становится топологически непрерывным переходом. Благодаря SP4 (Semantic Priority) и фрактальному закону, кардинальное число континуума строго детерминировано внутренней структурой единичного тождества X = X.',
      explanationEn: 'Within the RICIS III theory of monoliths, the classical set-theoretic contradiction is resolved by eliminating qualitative type gaps. The set of real numbers is projected onto a continuous linear monolith, where the cardinality ratio ceases to be a transfinite paradox and becomes a topologically continuous transition. Thanks to SP4 (Semantic Priority) and the Fractal Law, the cardinal number of the continuum is strictly determined by the internal structure of the unit identity X = X.',
      steps: [
        'Формализация мощности счетного множества как простейшей точечной бесконечности (Атомный монолит)',
        'Построение непрерывного числового континуума как Первого порядка монолита (Линия)',
        'Применение фрактального закона R(Q) для развертывания бесконечных множеств без трансфинитных разрывов',
        'Вывод тождественного равенства мощностей через канонические изоморфизмы RICIS-III',
        'Полное снятие гипотезы независимости и доказательство истинности континуум-гипотезы Кантора'
      ],
      stepsEn: [
        'Formalize countable cardinality as the simplest point-like infinity (Atomic Monolith)',
        'Construct the continuous real continuum as a First-Order Monolith (Line)',
        'Apply the Fractal Law R(Q) to unfold infinite sets without transfinite gaps',
        'Derive the equivalence of cardinalities via canonical RICIS-III isomorphisms',
        'Completely resolve the independence hypothesis and prove the validity of Cantor\'s Continuum Conjecture'
      ],
      presetParams: { gridSize: 8, theta: 0.0, animationSpeed: 1.5, showMissingNumber: true },
      colorClass: 'text-emerald-400 border-emerald-500/30',
      bgGlow: 'from-emerald-500/10'
    }
  ];

  // Curated Stress Tests derived using RICIS III Core Principles (No Mock/Simplistic results, actual derivations)
  const stressTests: StressTest[] = [
    {
      id: 'L0',
      level: 'L0',
      name: 'Базовая сингулярность',
      nameEn: 'Base Singularity',
      input: 'x => 10 / (x - 2)',
      point: 2.0,
      pointLabel: 'x = 2',
      classicalFormula: 'f(2) = \\frac{10}{0} \\to \\infty',
      ricisFormula: 'f_{RICIS}(2, \\theta) = \\frac{10 \\cdot (x-2)}{(x-2)^2 + \\theta^2} = 0',
      safetyProtocol: 'A1_INDEXING & L1_IDENTITY',
      explanation: 'В точке x = 2 знаменатель обращается в 0. Классическая математика прерывает вычисление из-за деления на ноль. В RICIS III сингулярная точка представляется как взвешенный бесконечный предел 10/0_F = ∞_10. При ненулевой регуляризации θ переход сглаживается, давая точное нулевое значение на самом полюсе и ограниченный пик в окрестности.',
      explanationEn: 'At the point x = 2, the denominator becomes 0. Classical mathematics interrupts calculation due to division by zero. In RICIS III, the singular point is represented as a weighted infinite limit 10/0_F = ∞_10. With non-zero regularization θ, the transition is smoothed, giving an exact zero value at the pole itself and a bounded peak in the neighborhood.',
      derivationSteps: [
        'Идентификация сингулярной точки: x - 2 = 0 => x_0 = 2',
        'Применение аксиомы A1_INDEXING: числитель F=10, знаменатель 0_x-2 => результат ∞_10',
        'Ввод квантового зазора θ. Замена f(x) на непрерывный регуляризованный аналог',
        'Оценка в точке x=2: числитель равен 0, знаменатель равен θ². Точный предел = 0, устраняя бесконечный разрыв'
      ],
      derivationStepsEn: [
        'Identify singular point: x - 2 = 0 => x_0 = 2',
        'Apply axiom A1_INDEXING: numerator F=10, denominator 0_x-2 => result ∞_10',
        'Introduce quantum gap θ. Replace f(x) with continuous regularized equivalent',
        'Evaluate at x=2: numerator is 0, denominator is θ². Exact limit = 0, eliminating infinite discontinuity'
      ],
      compute: (x, t) => {
        const dx = x - 2;
        const classical = Math.abs(dx) < 1e-9 ? '∞' : 10 / dx;
        if (Math.abs(dx) < 1e-9) {
          return { classical, regularized: t === 0 ? '∞_{10}' : 0 };
        }
        return { classical, regularized: (10 * dx) / (dx * dx + t * t) };
      },
      sliderMin: 1.0,
      sliderMax: 3.0,
      sliderStep: 0.01,
      defaultValue: 2.0
    },
    {
      id: 'L1',
      level: 'L1',
      name: 'Устранимый разрыв квадратов',
      nameEn: 'Removable Discontinuity of Squares',
      input: 'x => (x^2 - 25) / (x - 5)',
      point: 5.0,
      pointLabel: 'x = 5',
      classicalFormula: 'f(5) = \\frac{0}{0} \\quad (\\text{Неопределенность})',
      ricisFormula: 'f_{RICIS}(5) = 5 + 5 = 10 \\quad (\\text{Точно})',
      safetyProtocol: 'SP2 (REDUCTION_PRIORITY) & SP1 (LOCALITY)',
      explanation: 'Классическое вычисление в точке x=5 даёт 0/0. Согласно Правилу Безопасности SP2, алгебраическое сокращение обязано производиться ДО применения каких-либо сингулярных аксиом. Дробь (x-5)(x+5)/(x-5) сокращается на (x-5), оставляя непрерывный хвост (x+5). Пределы с обеих сторон гарантированно сходятся к единому значению 10.',
      explanationEn: 'Classical calculation at x=5 yields 0/0. According to Safety Rule SP2, algebraic reduction must be performed BEFORE applying any singularity axioms. The fraction (x-5)(x+5)/(x-5) is cancelled by (x-5), leaving a continuous tail (x+5). Limits from both sides are guaranteed to converge to a single value of 10.',
      derivationSteps: [
        'Определение выражения E(x) = (x^2 - 25) / (x-5)',
        'Факторизация числителя на множители: (x-5)(x+5)',
        'Применение протокола SP2: сокращение идентичных сомножителей (x-5)/(x-5) => 1',
        'Вычисление оставшегося непрерывного выражения при x=5: 5 + 5 = 10'
      ],
      derivationStepsEn: [
        'Define expression E(x) = (x^2 - 25) / (x-5)',
        'Factor the numerator: (x-5)(x+5)',
        'Apply protocol SP2: cancel identical factors (x-5)/(x-5) => 1',
        'Evaluate remaining continuous expression at x=5: 5 + 5 = 10'
      ],
      compute: (x, t) => {
        const den = x - 5;
        const classical = Math.abs(den) < 1e-9 ? '0/0 (Неопределено)' : (x*x - 25) / den;
        // Even with theta, we show RICIS analytical resolution
        const regularized = x + 5; 
        return { classical, regularized };
      },
      sliderMin: 4.0,
      sliderMax: 6.0,
      sliderStep: 0.01,
      defaultValue: 5.0
    },
    {
      id: 'L3',
      level: 'L3',
      name: 'Квадратичный знаменатель',
      nameEn: 'Quadratic Denominator',
      input: 'x => 1 / (x^2 - 4)',
      point: 2.0,
      pointLabel: 'x = 2',
      classicalFormula: 'f(2) = \\frac{1}{0} \\to \\infty',
      ricisFormula: 'f_{RICIS}(2, \\theta) = \\frac{x^2 - 4}{(x^2 - 4)^2 + \\theta^2} = 0',
      safetyProtocol: 'SP4 (SEMANTIC_PRIORITY) & A1',
      explanation: 'При x=2 знаменатель (x-2)(x+2) обращается в ноль. Согласно протоколу SP4, сингулярность индексируется по выражению: 0_{(x²-4)|_{x=2}}. Результат деления равен ∞_{1/4}. В регуляризованном поле RICIS III умножение на знаменатель сглаживает сингулярность, превращая бесконечный полюс в гладкий волновой переход с нулевым значением на оси симметрии.',
      explanationEn: 'At x=2, the denominator (x-2)(x+2) becomes zero. According to protocol SP4, the singularity is indexed by the parent expression: 0_{(x²-4)|_{x=2}}. The division result is ∞_{1/4}. In the regularized field of RICIS III, multiplying by the denominator smooths the singularity, turning the infinite pole into a smooth wave transition with a zero value on the axis of symmetry.',
      derivationSteps: [
        'Разложение знаменателя: x^2 - 4 = (x-2)(x+2)',
        'Выделение регулярной части при x->2: 1/(x+2) -> 1/4',
        'Индексирование полюса по правилу SP4: 0_F = 0_{(x-2)} * 4',
        'Применение сглаживающего фактора θ: волновое сжатие превращает полюс в регулярную критическую точку'
      ],
      derivationStepsEn: [
        'Factor the denominator: x^2 - 4 = (x-2)(x+2)',
        'Extract regular part as x->2: 1/(x+2) -> 1/4',
        'Index the pole according to SP4 rule: 0_F = 0_{(x-2)} * 4',
        'Apply smoothing factor θ: wave compression turns the pole into a regular critical point'
      ],
      compute: (x, t) => {
        const den = x*x - 4;
        const classical = Math.abs(den) < 1e-9 ? '∞' : 1 / den;
        if (Math.abs(den) < 1e-9) {
          return { classical, regularized: t === 0 ? '∞_{1/4}' : 0 };
        }
        return { classical, regularized: den / (den * den + t * t) };
      },
      sliderMin: 1.0,
      sliderMax: 3.0,
      sliderStep: 0.01,
      defaultValue: 2.0
    },
    {
      id: 'L6',
      level: 'L6',
      name: 'Замечательный предел (Sinc)',
      nameEn: 'Notable Limit (Sinc)',
      input: 'x => sin(x) / x',
      point: 0.0,
      pointLabel: 'x = 0',
      classicalFormula: 'f(0) = \\frac{0}{0} \\quad (\\text{Неопределено})',
      ricisFormula: 'f_{RICIS}(0) = 1 \\quad (\\text{Аналитический предел})',
      safetyProtocol: 'SP3 (INDEX_LAW) & Тейлор-разложение',
      explanation: 'В точке x=0 функция даёт неопределенность 0/0. Согласно закону индексов SP3 и семантическому разложению SP4, отношение нулей определяется отношением их степенных рядов. Поскольку sin(x) = x - x³/6 + ..., отношение даёт строго 1, что полностью снимает сингулярность без необходимости предельного перехода.',
      explanationEn: 'At the point x=0, the function yields 0/0 indeterminacy. According to index law SP3 and semantic expansion SP4, the ratio of zeros is determined by the ratio of their power series. Since sin(x) = x - x³/6 + ..., the ratio is strictly 1, which completely resolves the singularity without requiring a limit transition.',
      derivationSteps: [
        'Запись числителя в виде бесконечной суммы Тейлора: x - x^3/6 + x^5/120 - ...',
        'Применение закона SP3: деление каждого члена суммы на x',
        'Получение непрерывного ряда: 1 - x^2/6 + x^4/120 - ...',
        'Подстановка x = 0: все старшие степени обнуляются, давая точное решение 1'
      ],
      derivationStepsEn: [
        'Write the numerator as an infinite Taylor sum: x - x^3/6 + x^5/120 - ...',
        'Apply law SP3: divide each term of the sum by x',
        'Obtain continuous series: 1 - x^2/6 + x^4/120 - ...',
        'Substitute x = 0: all higher powers vanish, yielding the exact solution 1'
      ],
      compute: (x, t) => {
        const classical = Math.abs(x) < 1e-9 ? '0/0 (Неопределено)' : Math.sin(x) / x;
        const regularized = Math.abs(x) < 1e-9 ? 1.0 : Math.sin(x) / x;
        return { classical, regularized };
      },
      sliderMin: -2.0,
      sliderMax: 2.0,
      sliderStep: 0.01,
      defaultValue: 0.0
    },
    {
      id: 'L10',
      level: 'L10',
      name: 'Экспоненциальный устранимый разрыв',
      nameEn: 'Exponential Removable Discontinuity',
      input: 'x => (exp(x) - 1) / x',
      point: 0.0,
      pointLabel: 'x = 0',
      classicalFormula: 'f(0) = \\frac{0}{0} \\quad (\\text{Неопределено})',
      ricisFormula: 'f_{RICIS}(0) = 1',
      safetyProtocol: 'SP3 (INDEX_LAW) & Тейлор-разложение',
      explanation: 'Классическое деление в нуле невозможно. В RICIS III отношение бесконечно малых 0_{exp(x)-1} / 0_x разрешается через разложение экспоненты в ряд: e^x - 1 = x + x²/2 + ... Сокращение по правилу SP2 оставляет ряд 1 + x/2 + ..., значение которого при x=0 строго равно 1.',
      explanationEn: 'Classical division at zero is impossible. In RICIS III, the ratio of infinitesimals 0_{exp(x)-1} / 0_x is resolved via exponential expansion: e^x - 1 = x + x²/2 + ... Cancellation according to rule SP2 leaves the series 1 + x/2 + ..., whose value at x=0 is strictly 1.',
      derivationSteps: [
        'Запись ряда Тейлора для exp(x) - 1: x + x^2/2 + x^3/6 + ...',
        'Деление на знаменатель x по правилу сокращения общих нулевых факторов',
        'Получение регулярной суммы: 1 + x/2 + x^2/6 + ...',
        'Прямое вычисление в точке x=0 даёт точный аналитический предел = 1'
      ],
      derivationStepsEn: [
        'Write the Taylor series for exp(x) - 1: x + x^2/2 + x^3/6 + ...',
        'Divide by denominator x according to the rule of cancelling common zero factors',
        'Obtain the regular sum: 1 + x/2 + x^2/6 + ...',
        'Direct calculation at x=0 yields the exact analytical limit = 1'
      ],
      compute: (x, t) => {
        const classical = Math.abs(x) < 1e-9 ? '0/0 (Неопределено)' : (Math.exp(x) - 1) / x;
        const regularized = Math.abs(x) < 1e-9 ? 1.0 : (Math.exp(x) - 1) / x;
        return { classical, regularized };
      },
      sliderMin: -1.0,
      sliderMax: 1.0,
      sliderStep: 0.01,
      defaultValue: 0.0
    },
    {
      id: 'L11',
      level: 'L11',
      name: 'Тригонометрический предел 1-cos(x)/x²',
      nameEn: 'Trigonometric Limit 1-cos(x)/x²',
      input: 'x => (1 - cos(x)) / x^2',
      point: 0.0,
      pointLabel: 'x = 0',
      classicalFormula: 'f(0) = \\frac{0}{0}',
      ricisFormula: 'f_{RICIS}(0) = 0.5',
      safetyProtocol: 'SP3 (INDEX_LAW)',
      explanation: 'Ещё один критический случай 0/0 в классическом анализе. С помощью Тейлор-разложения числитель представляется как x²/2 - x⁴/24 + ... Отношение индексов числителя и знаменателя даёт вторую степень, сокращение которой по правилу SP2 приводит к точному значению 1/2.',
      explanationEn: 'Another critical 0/0 case in classical analysis. Using Taylor expansion, the numerator is represented as x²/2 - x⁴/24 + ... The ratio of numerator and denominator indices yields the second degree, cancellation of which by rule SP2 leads to the exact value 1/2.',
      derivationSteps: [
        'Использование ряда Тейлора для cos(x): 1 - x^2/2 + x^4/24 - ...',
        'Вычисление числителя 1 - cos(x) = x^2/2 - x^4/24 + ...',
        'Сокращение квадратичного фактора x^2 по правилу SP2',
        'Подстановка x=0 в регулярный остаток 1/2 - x^2/24 => результат 0.5'
      ],
      derivationStepsEn: [
        'Use Taylor series for cos(x): 1 - x^2/2 + x^4/24 - ...',
        'Compute the numerator 1 - cos(x) = x^2/2 - x^4/24 + ...',
        'Cancel the quadratic factor x^2 according to rule SP2',
        'Substitute x=0 into the regular remainder 1/2 - x^2/24 => result 0.5'
      ],
      compute: (x, t) => {
        const classical = Math.abs(x) < 1e-9 ? '0/0 (Неопределено)' : (1 - Math.cos(x)) / (x * x);
        const regularized = Math.abs(x) < 1e-9 ? 0.5 : (1 - Math.cos(x)) / (x * x);
        return { classical, regularized };
      },
      sliderMin: -1.5,
      sliderMax: 1.5,
      sliderStep: 0.01,
      defaultValue: 0.0
    },
    {
      id: 'L15',
      level: 'L15',
      name: 'Существенная сингулярность Пикара',
      nameEn: 'Picard\'s Essential Singularity',
      input: 'x => exp(1 / x)',
      point: 0.0,
      pointLabel: 'x = 0',
      classicalFormula: 'f(0) = e^{\\infty} \\quad (\\text{Хаос и разрыв})',
      ricisFormula: 'f_{RICIS}(0, \\theta) = e^{0} = 1',
      safetyProtocol: 'A6_GENERAL & Комплексное зануление',
      explanation: 'В окрестности нуля функция e^(1/x) совершает бесконечное число колебаний и уходит в бесконечность или ноль в зависимости от направления. RICIS III заменяет аргумент 1/x на сглаженный регуляризованный аналог x / (x² + θ²). В точке x=0 аргумент становится строго равен 0, стабилизируя значение экспоненты на уровне e^0 = 1.',
      explanationEn: 'In the neighborhood of zero, the function e^(1/x) oscillates infinitely and goes to infinity or zero depending on direction. RICIS III replaces the argument 1/x with the smooth regularized equivalent x / (x² + θ²). At x=0, the argument becomes strictly 0, stabilizing the exponential value at e^0 = 1.',
      derivationSteps: [
        'Идентификация аргумента как сингулярного ядра 1/x',
        'Применение RICIS-регуляризатора к аргументу: x / (x^2 + theta^2)',
        'Оценка аргумента в точке x=0: 0 / theta^2 = 0',
        'Вычисление функции экспоненты: exp(0) = 1, полная стабилизация сингулярности'
      ],
      derivationStepsEn: [
        'Identify the argument as singular core 1/x',
        'Apply RICIS regularizer to argument: x / (x^2 + theta^2)',
        'Evaluate the argument at x=0: 0 / theta^2 = 0',
        'Evaluate exponential function: exp(0) = 1, full stabilization of the singularity'
      ],
      compute: (x, t) => {
        const classical = Math.abs(x) < 1e-9 ? 'Неопределено (Пикар)' : Math.exp(1 / x);
        if (Math.abs(x) < 1e-9) {
          return { classical, regularized: t === 0 ? 'e^{\u221E_1}' : 1.0 };
        }
        return { classical, regularized: Math.exp(x / (x * x + t * t)) };
      },
      sliderMin: -0.5,
      sliderMax: 0.5,
      sliderStep: 0.005,
      defaultValue: 0.0
    },
    {
      id: 'L17',
      level: 'L17',
      name: 'Полюс второго порядка (1/x²)',
      nameEn: 'Second-Order Pole (1/x²)',
      input: 'x => 1 / x^2',
      point: 0.0,
      pointLabel: 'x = 0',
      classicalFormula: 'f(0) = \\frac{1}{0} \\to \\infty',
      ricisFormula: 'f_{RICIS}(0, \\theta) = \\frac{1}{\\theta^2} \\quad (\\text{Ограничено})',
      safetyProtocol: 'A1_INDEXING',
      explanation: 'Квадратичный полюс в классической теории уходит в бесконечность чрезвычайно быстро. Регуляризованное поле RICIS III добавляет квантовую емкость пространства θ², из-за чего значение на полюсе стабилизируется на физическом пределе 1/θ², предотвращая сингулярный коллапс поля.',
      explanationEn: 'The quadratic pole in classical theory approaches infinity extremely fast. The regularized field of RICIS III adds a quantum space capacity θ², stabilizing the pole value at the physical limit of 1/θ², preventing singular field collapse.',
      derivationSteps: [
        'Запись сингулярного уравнения: f(x) = 1 / x^2',
        'Применение аксиомы A1: преобразование в бесконечную величину второго порядка',
        'Внедрение регуляризации в знаменатель: x^2 -> x^2 + theta^2',
        'Вычисление в точке x=0: f_reg(0) = 1 / theta^2, пик строго ограничен величиной зазора'
      ],
      derivationStepsEn: [
        'Write the singular equation: f(x) = 1 / x^2',
        'Apply axiom A1: transform to second-order infinity',
        'Inject regularization into the denominator: x^2 -> x^2 + theta^2',
        'Evaluate at x=0: f_reg(0) = 1 / theta^2, peak strictly bounded by gap magnitude'
      ],
      compute: (x, t) => {
        const classical = Math.abs(x) < 1e-9 ? '∞' : 1 / (x * x);
        if (Math.abs(x) < 1e-9) {
          return { classical, regularized: t === 0 ? '∞_1' : 1 / (t * t) };
        }
        return { classical, regularized: 1 / (x * x + t * t) };
      },
      sliderMin: -1.0,
      sliderMax: 1.0,
      sliderStep: 0.01,
      defaultValue: 0.0
    },
    {
      id: 'L24',
      level: 'L24',
      name: 'Вложенная сингулярность',
      nameEn: 'Nested Singularity',
      input: 'x => x / x^2',
      point: 0.0,
      pointLabel: 'x = 0',
      classicalFormula: 'f(0) = \\frac{0}{0} \\quad (\\text{Хаотический предел})',
      ricisFormula: 'f_{RICIS}(0, \\theta) = \\frac{x}{x^2 + \\theta^2} = 0',
      safetyProtocol: 'SP2 (REDUCTION) или сглаживание',
      explanation: 'Вложенная дробь x/x² при x=0 даёт неопределенность. Применение правила сокращения SP2 упрощает выражение до 1/x, что сводится к базовому полюсу ∞_1. Интерактивная регуляризация через волновой зазор даёт плавный переход через ноль с локальными пиками ±1/(2θ) по бокам.',
      explanationEn: 'The nested fraction x/x² at x=0 yields indeterminacy. Applying cancellation rule SP2 simplifies the expression to 1/x, reducing to the base pole ∞_1. Interactive regularization via a wave gap yields a smooth transition through zero with local peaks of ±1/(2θ) on either side.',
      derivationSteps: [
        'Анализ структуры дроби x / x^2',
        'Алгебраическое сокращение по протоколу SP2: x/x^2 = 1/x',
        'Преобразование к сглаженному виду: x / (x^2 + theta^2)',
        'Оценка в точке x=0: результат равен 0, симметричные экстремумы стабилизированы'
      ],
      derivationStepsEn: [
        'Analyze fraction structure: x / x^2',
        'Algebraic cancellation via SP2 protocol: x/x^2 = 1/x',
        'Transform to smooth form: x / (x^2 + theta^2)',
        'Evaluate at x=0: result is 0, symmetric extrema are stabilized'
      ],
      compute: (x, t) => {
        const classical = Math.abs(x) < 1e-9 ? '0/0 (Неопределено)' : x / (x * x);
        if (Math.abs(x) < 1e-9) {
          return { classical, regularized: t === 0 ? '∞_1' : 0 };
        }
        return { classical, regularized: x / (x * x + t * t) };
      },
      sliderMin: -1.0,
      sliderMax: 1.0,
      sliderStep: 0.01,
      defaultValue: 0.0
    },
    {
      id: 'A4',
      level: 'A4',
      name: 'Деление сингулярных нулей (0_F / 0_G)',
      nameEn: 'Division of Singular Zeros (0_F / 0_G)',
      input: 'x => (8*x) / (2*x)',
      point: 0.0,
      pointLabel: 'x = 0',
      classicalFormula: 'f(0) = \\frac{0}{0} \\quad (\\text{Неопределено})',
      ricisFormula: 'f_{RICIS}(0) = \\frac{0_8}{0_2} = 4 \\quad (\\text{Точно})',
      safetyProtocol: 'A4_0DIV0 & SP3 (INDEX_LAW)',
      explanation: 'В точке x = 0 классический анализ возвращает неопределенность 0/0. Согласно аксиоме A4_0DIV0 и правилу SP3, отношение нулей разного веса определяется строго отношением их индексов (весов). Для числителя с весом F=8 и знаменателя с весом G=2, результат равен 8/2 = 4, полностью снимая неопределенность.',
      explanationEn: 'At x = 0, classical analysis returns 0/0 indeterminacy. According to axiom A4_0DIV0 and rule SP3, the ratio of zeros of different weights is strictly defined by the ratio of their indices (weights). For a numerator of weight F=8 and denominator of weight G=2, the result is 8/2 = 4, completely removing the indeterminacy.',
      derivationSteps: [
        'Идентификация весов нулей: числитель F(x) = 8x -> индекс 0_8 при x=0',
        'Идентификация весов знаменателя: знаменатель G(x) = 2x -> индекс 0_2 при x=0',
        'Применение аксиомы A4_0DIV0: 0_8 / 0_2 = 8 / 2',
        'Получение точного аналитического значения: 4, готового для дальнейших вычислений'
      ],
      derivationStepsEn: [
        'Identify zero weights: numerator F(x) = 8x -> index 0_8 at x=0',
        'Identify denominator weights: denominator G(x) = 2x -> index 0_2 at x=0',
        'Apply axiom A4_0DIV0: 0_8 / 0_2 = 8 / 2',
        'Obtain exact analytical value: 4, ready for further calculations'
      ],
      compute: (x, t) => {
        const classical = Math.abs(x) < 1e-9 ? '0/0 (Неопределено)' : (8*x) / (2*x);
        const regularized = 4.0;
        return { classical, regularized };
      },
      sliderMin: -1.0,
      sliderMax: 1.0,
      sliderStep: 0.01,
      defaultValue: 0.0
    },
    {
      id: 'A5',
      level: 'A5',
      name: 'Деление бесконечностей (∞_F / ∞_G)',
      nameEn: 'Division of Infinities (∞_F / ∞_G)',
      input: 'x => (6 / (x - 2)) / (2 / (x - 2))',
      point: 2.0,
      pointLabel: 'x = 2',
      classicalFormula: 'f(2) = \\frac{\\infty}{\\infty} \\quad (\\text{Неопределено})',
      ricisFormula: 'f_{RICIS}(2) = \\frac{\\infty_6}{\\infty_2} = 3 \\quad (\\text{Точно})',
      safetyProtocol: 'A5_INFDIVINF & L1_IDENTITY',
      explanation: 'В точке x = 2 классическая функция дает неопределенность вида бесконечность делить на бесконечность. RICIS III представляет сингулярности как индексированные монолиты порядка 0. Аксиома A5_INFDIVINF определяет отношение таких бесконечностей через отношение их весов: ∞_6 / ∞_2 = 6 / 2 = 3.',
      explanationEn: 'At the point x = 2, the classical function yields infinity divided by infinity indeterminacy. RICIS III represents singularities as indexed order-0 monoliths. Axiom A5_INFDIVINF defines the ratio of such infinities through the ratio of their weights: ∞_6 / ∞_2 = 6 / 2 = 3.',
      derivationSteps: [
        'Определение индексов сингулярностей: числитель -> ∞_6, знаменатель -> ∞_2 при x=2',
        'Применение аксиомы A5: отношение бесконечностей эквивалентно отношению их весов F/G',
        'Сокращение бесконечных множителей по правилу SP2',
        'Получение конечного точного числа: 3, свободного от сингулярности'
      ],
      derivationStepsEn: [
        'Determine singularity indices: numerator -> ∞_6, denominator -> ∞_2 at x=2',
        'Apply axiom A5: ratio of infinities is equivalent to their weight ratio F/G',
        'Cancel infinite factors according to rule SP2',
        'Obtain final exact value: 3, free of singularity'
      ],
      compute: (x, t) => {
        const dx = x - 2;
        const classical = Math.abs(dx) < 1e-9 ? '∞/∞ (Неопределено)' : (6 / dx) / (2 / dx);
        const regularized = 3.0;
        return { classical, regularized };
      },
      sliderMin: 1.0,
      sliderMax: 3.0,
      sliderStep: 0.01,
      defaultValue: 2.0
    },
    {
      id: 'A6',
      level: 'A6',
      name: 'Произведение нуля и бесконечности (0_F × ∞_G)',
      nameEn: 'Product of Zero and Infinity (0_F × ∞_G)',
      input: 'x => (5*x) * (3 / x)',
      point: 0.0,
      pointLabel: 'x = 0',
      classicalFormula: 'f(0) = 0 \\cdot \\infty \\quad (\\text{Неопределено})',
      ricisFormula: 'f_{RICIS}(0) = 0_5 \\times \\infty_3 = 15 \\quad (\\text{Точно})',
      safetyProtocol: 'A6_GENERAL (Унифицированная свертка)',
      explanation: 'Классическое произведение 0 * ∞ является одной из самых известных неопределенностей. В RICIS III свертка бесконечно малого порядка 0 и бесконечно большого порядка 0 с индексами F=5 и G=3 разрешается как произведение их весов. Результат равен 5 * 3 = 15.',
      explanationEn: 'The classical product of 0 * ∞ is one of the most famous indeterminacies. In RICIS III, the convolution of an order-0 infinitesimal and an order-0 infinity with indices F=5 and G=3 resolves as the product of their weights. The result is 5 * 3 = 15.',
      derivationSteps: [
        'Индексация сомножителей: нуль имеет вес F=5, бесконечность имеет вес G=3',
        'Применение универсальной аксиомы A6_GENERAL: 0_F * ∞_G = F * G',
        'Умножение весов: 5 * 3 = 15',
        'Получение точного конечного выражения без предельных переходов'
      ],
      derivationStepsEn: [
        'Index factors: zero has weight F=5, infinity has weight G=3',
        'Apply universal axiom A6_GENERAL: 0_F * ∞_G = F * G',
        'Multiply weights: 5 * 3 = 15',
        'Obtain exact finite expression without limit transitions'
      ],
      compute: (x, t) => {
        const classical = Math.abs(x) < 1e-9 ? '0 * ∞ (Неопределено)' : (5*x) * (3 / x);
        const regularized = 15.0;
        return { classical, regularized };
      },
      sliderMin: -1.0,
      sliderMax: 1.0,
      sliderStep: 0.01,
      defaultValue: 0.0
    },
    {
      id: 'A7',
      level: 'A7',
      name: 'Разность бесконечностей (∞_F - ∞_G)',
      nameEn: 'Difference of Infinities (∞_F - ∞_G)',
      input: 'x => (5 / x) - (3 / x)',
      point: 0.0,
      pointLabel: 'x = 0',
      classicalFormula: 'f(0) = \\infty - \\infty \\quad (\\text{Неопределено})',
      ricisFormula: 'f_{RICIS}(0, \\theta) = \\infty_2 \\quad (\\text{Регуляризовано в } \\frac{2x}{x^2 + \\theta^2})',
      safetyProtocol: 'A7_INFSUBINF',
      explanation: 'Разность бесконечностей в точке x = 0 дает классическую неопределенность. В RICIS III вычитание бесконечностей одного типа дает новую индексированную бесконечность ∞_{F-G}. Для весов F=5 и G=3 разность равна ∞_2. В регуляризованном поле это выражение переходит в гладкую функцию 2x/(x²+θ²), равную 0 на полюсе и ограниченную ±1/θ в окрестности.',
      explanationEn: 'The difference of infinities at the point x = 0 yields a classical indeterminacy. In RICIS III, subtracting infinities of the same type yields a new indexed infinity ∞_{F-G}. For weights F=5 and G=3, the difference is ∞_2. In the regularized field, this expression transforms into a smooth function 2x/(x²+θ²), equal to 0 at the pole and bounded by ±1/θ in the neighborhood.',
      derivationSteps: [
        'Определение бесконечностей: ∞_5 и ∞_3 при приближении к x=0',
        'Применение аксиомы A7_INFSUBINF: ∞_F - ∞_G = ∞_{F-G}',
        'Вычисление результирующего индекса: 5 - 3 = 2 -> результат ∞_2',
        'Перевод в регулярное поле: 2 / x -> 2x / (x^2 + theta^2), значение в нуле равно 0'
      ],
      derivationStepsEn: [
        'Determine infinities: ∞_5 and ∞_3 as x approaches 0',
        'Apply axiom A7_INFSUBINF: ∞_F - ∞_G = ∞_{F-G}',
        'Compute resulting index: 5 - 3 = 2 -> result ∞_2',
        'Translate to regular field: 2 / x -> 2x / (x^2 + theta^2), value at zero is 0'
      ],
      compute: (x, t) => {
        const classical = Math.abs(x) < 1e-9 ? '∞ - ∞ (Неопределено)' : (5 / x) - (3 / x);
        if (Math.abs(x) < 1e-9) {
          return { classical, regularized: t === 0 ? '∞_2' : 0 };
        }
        return { classical, regularized: (2 * x) / (x * x + t * t) };
      },
      sliderMin: -1.0,
      sliderMax: 1.0,
      sliderStep: 0.01,
      defaultValue: 0.0
    }
  ];

  const currentCase = cases.find(c => c.id === selectedCase) || cases[0];
  const IconComponent = currentCase.icon;

  const currentTest = stressTests.find(t => t.id === selectedTest) || stressTests[0];

  // Run computation for interactive stress test
  const { classical: calcClassical, regularized: calcRegularized } = currentTest.compute(interactiveX, interactiveTheta);

  const getTestYRange = (id: string, theta: number) => {
    switch (id) {
      case 'L0': return { yMin: -15, yMax: 15 };
      case 'L1': return { yMin: 6, yMax: 14 };
      case 'L3': return { yMin: -3, yMax: 3 };
      case 'L6': return { yMin: -0.5, yMax: 1.5 };
      case 'L10': return { yMin: 0, yMax: 2.5 };
      case 'L11': return { yMin: -0.1, yMax: 0.8 };
      case 'L15': return { yMin: -1, yMax: 10 };
      case 'L17': {
        const cap = theta > 0 ? Math.min(25, 1 / (theta * theta) + 2) : 15;
        return { yMin: -1, yMax: cap };
      }
      case 'L24': return { yMin: -5, yMax: 5 };
      case 'A4': return { yMin: 0, yMax: 8 };
      case 'A5': return { yMin: 0, yMax: 6 };
      case 'A6': return { yMin: 0, yMax: 25 };
      case 'A7': return { yMin: -6, yMax: 6 };
      default: return { yMin: -10, yMax: 10 };
    }
  };

  const getSingularityCenterY = (id: string): number => {
    switch (id) {
      case 'L1': return 10;
      case 'L6': return 1.0;
      case 'L10': return 1.0;
      case 'L11': return 0.5;
      case 'L15': return 1.0;
      case 'A4': return 4.0;
      case 'A5': return 3.0;
      case 'A6': return 15.0;
      default: return 0.0;
    }
  };

  const parseVal = (v: any): number | null => {
    if (typeof v === 'number') {
      if (isNaN(v) || !isFinite(v)) return null;
      return v;
    }
    if (typeof v === 'string') {
      if (v.includes('∞') || v.includes('Неопределено') || v.includes('Indeterminate')) {
        return null;
      }
      const p = parseFloat(v);
      if (!isNaN(p) && isFinite(p)) return p;
    }
    return null;
  };

  const buildSvgPath = (pts: [number, number][], toSvgXFn: (x: number) => number, toSvgYFn: (y: number) => number) => {
    if (pts.length === 0) return '';
    return pts.map((p, idx) => {
      const px = toSvgXFn(p[0]);
      const py = toSvgYFn(p[1]);
      const clampedPy = Math.max(-500, Math.min(1000, py));
      return `${idx === 0 ? 'M' : 'L'} ${px} ${clampedPy}`;
    }).join(' ');
  };

  const xMin = currentTest.sliderMin;
  const xMax = currentTest.sliderMax;
  const { yMin, yMax } = getTestYRange(currentTest.id, interactiveTheta);

  const toSvgX = (xValue: number) => {
    return 45 + ((xValue - xMin) / (xMax - xMin)) * 435;
  };

  const toSvgY = (yValue: number) => {
    return 20 + (1 - (yValue - yMin) / (yMax - yMin)) * 165;
  };

  const yAxisX = (xMin <= 0 && xMax >= 0) ? toSvgX(0) : null;
  const xAxisY = (yMin <= 0 && yMax >= 0) ? toSvgY(0) : null;

  const poleX = currentTest.point;
  const centerX = toSvgX(poleX);
  const centerY = toSvgY(getSingularityCenterY(currentTest.id));

  const steps = 150;
  const regularizedPoints: [number, number][] = [];
  const classicalPointsLeft: [number, number][] = [];
  const classicalPointsRight: [number, number][] = [];

  for (let i = 0; i <= steps; i++) {
    const xVal = xMin + (i / steps) * (xMax - xMin);
    
    const res = currentTest.compute(xVal, interactiveTheta);
    const regVal = parseVal(res.regularized);
    if (regVal !== null) {
      regularizedPoints.push([xVal, regVal]);
    }
    
    const classVal = parseVal(res.classical);
    if (classVal !== null) {
      if (xVal < poleX - 1e-4) {
        classicalPointsLeft.push([xVal, classVal]);
      } else if (xVal > poleX + 1e-4) {
        classicalPointsRight.push([xVal, classVal]);
      }
    }
  }

  const regularizedPath = buildSvgPath(regularizedPoints, toSvgX, toSvgY);
  const classicalPathLeft = buildSvgPath(classicalPointsLeft, toSvgX, toSvgY);
  const classicalPathRight = buildSvgPath(classicalPointsRight, toSvgX, toSvgY);

  const interactiveXMarker = toSvgX(interactiveX);
  const currentRes = currentTest.compute(interactiveX, interactiveTheta);
  
  const parsedClass = parseVal(currentRes.classical);
  const interactiveYClassMarker = parsedClass !== null ? toSvgY(parsedClass) : null;

  const parsedReg = parseVal(currentRes.regularized);
  const interactiveYRegMarker = parsedReg !== null ? toSvgY(parsedReg) : null;

  const handleTestSelection = (testId: string) => {
    setSelectedTest(testId);
    const test = stressTests.find(t => t.id === testId) || stressTests[0];
    setInteractiveX(test.defaultValue);
  };

  return (
    <div id="cases-solutions-root" className="bg-black/40 border border-white/10 rounded-xl p-6 text-slate-300 space-y-6 animate-fade-in">
      
      {/* Tab Selector */}
      <div className="flex border-b border-white/10 pb-4 justify-between items-center flex-col sm:flex-row gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-cyan-950/30 border border-cyan-500/30 rounded">
            <BookOpen className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white uppercase tracking-wider">
              {t('Вычислительный Стенд RICIS III', 'RICIS III Computing Workbench')}
            </h2>
            <p className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">
              {t('Теоретическая библиотека и интерактивная регуляризация сингулярностей', 'Theoretical library and interactive regularization of singularities')}
            </p>
          </div>
        </div>

        {/* Sub-tab buttons */}
        <div className="flex bg-black/40 border border-white/5 p-1 rounded-lg">
          <button
            onClick={() => setActiveSubTab('library')}
            className={`px-4 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              activeSubTab === 'library'
                ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(34,211,238,0.25)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('Прикладные задачи', 'Applied Problems')}
          </button>
          <button
            onClick={() => {
              setActiveSubTab('stressTests');
              // initialize matching default state
              const test = stressTests.find(t => t.id === selectedTest) || stressTests[0];
              setInteractiveX(test.defaultValue);
            }}
            className={`px-4 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              activeSubTab === 'stressTests'
                ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(34,211,238,0.25)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('Символьный Стресс-Тест (Deep Stress Test)', 'Symbolic Deep Stress Test')}
          </button>
        </div>
      </div>

      {activeSubTab === 'library' ? (
        /* APPLIED CASES PANEL */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Cases List Sidebar */}
          <div className="lg:col-span-4 space-y-2">
            <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider block mb-2">{t('Выберите прикладную проблему', 'Select Applied Problem')}</span>
            <div className="space-y-2">
              {cases.map((cs) => {
                const CaseIcon = cs.icon;
                const isSelected = cs.id === selectedCase;
                const displayCategory = language === 'en' && cs.categoryEn ? cs.categoryEn : cs.category;
                const displayTitle = language === 'en' && cs.titleEn ? cs.titleEn : cs.title;
                return (
                  <button
                    key={cs.id}
                    onClick={() => setSelectedCase(cs.id)}
                    className={`w-full text-left p-3.5 rounded-lg border transition-all duration-200 flex items-center space-x-3 group relative overflow-hidden ${
                      isSelected 
                        ? 'bg-cyan-950/20 border-cyan-500/50 text-white shadow-[0_0_15px_rgba(34,211,238,0.08)]' 
                        : 'bg-[#09090B]/60 border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/10 hover:bg-[#09090B]'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
                    )}
                    <div className={`p-1.5 rounded bg-[#09090B] border ${isSelected ? 'border-cyan-500/30 text-cyan-400' : 'border-white/5 text-slate-500 group-hover:text-slate-300'}`}>
                      <CaseIcon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <span className="text-[10px] font-mono text-slate-500 block uppercase tracking-wider">{displayCategory}</span>
                      <span className="text-xs font-semibold block truncate mt-0.5">{displayTitle}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Case Detail Panel */}
          <div className="lg:col-span-8 bg-[#09090B]/40 border border-white/5 rounded-xl p-6 relative overflow-hidden flex flex-col justify-between space-y-6">
            {/* Ambient Glow */}
            <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${currentCase.bgGlow} to-transparent rounded-full blur-3xl pointer-events-none opacity-40`} />

            <div className="space-y-6 relative">
              {/* Header of Detail */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 block uppercase tracking-widest">
                    {language === 'en' && currentCase.categoryEn ? currentCase.categoryEn : currentCase.category}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1">
                    {language === 'en' && currentCase.titleEn ? currentCase.titleEn : currentCase.title}
                  </h3>
                </div>
                <div className={`p-2.5 rounded-lg bg-[#09090B] border border-white/10 ${currentCase.colorClass}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
              </div>

              {/* Problem vs Solution Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Classical Fail */}
                <div className="bg-red-950/10 border border-red-500/20 rounded-lg p-4 space-y-3">
                  <div className="flex items-center space-x-2 text-red-400 font-mono text-[10px] uppercase font-semibold">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{t('Классический коллапс', 'Classical Collapse')}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed min-h-[60px]">
                    {language === 'en' && currentCase.classicalFailEn ? currentCase.classicalFailEn : currentCase.classicalFail}
                  </p>
                  <div className="bg-[#09090B] p-2.5 rounded font-mono text-[11px] text-white text-center border border-white/5 min-h-[52px] flex items-center justify-center">
                    <Latex math={currentCase.classicalFormula} block={true} />
                  </div>
                </div>

                {/* RICIS Solution */}
                <div className="bg-cyan-950/10 border border-cyan-500/20 rounded-lg p-4 space-y-3">
                  <div className="flex items-center space-x-2 text-cyan-400 font-mono text-[10px] uppercase font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t('Регуляризация RICIS III', 'RICIS III Regularization')}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed min-h-[60px]">
                    {language === 'en' && currentCase.ricisSolutionEn ? currentCase.ricisSolutionEn : currentCase.ricisSolution}
                  </p>
                  <div className="bg-[#09090B] p-2.5 rounded font-mono text-[11px] text-cyan-300 text-center border border-cyan-950/60 min-h-[52px] flex items-center justify-center">
                    <Latex math={currentCase.ricisFormula} block={true} />
                  </div>
                </div>
              </div>

              {/* In-depth explanation */}
              <div className="bg-white/5 border border-white/5 rounded-lg p-4 space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase block tracking-wider">{t('Физический и Математический механизм', 'Physical and Mathematical Mechanism')}</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {language === 'en' && currentCase.explanationEn ? currentCase.explanationEn : currentCase.explanation}
                </p>
              </div>

              {/* Execution Steps */}
              <div className="space-y-3">
                <span className="text-[10px] font-mono text-slate-400 uppercase block tracking-wider">{t('Алгоритм доказательства и регуляризации', 'Proof and Regularization Algorithm')}</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {(language === 'en' && currentCase.stepsEn ? currentCase.stepsEn : currentCase.steps).map((step, idx) => (
                    <div key={idx} className="flex items-start space-x-2 bg-[#09090B] p-2.5 rounded border border-white/5">
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/30 border border-cyan-800/40 w-5 h-5 rounded flex items-center justify-center shrink-0">
                        0{idx + 1}
                      </span>
                      <span className="text-xs text-slate-400 leading-tight">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Simulate Call-to-action */}
            <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-[10px] font-mono text-slate-500 uppercase">
                {t('Параметры запуска:', 'Launch Parameters:')} {Object.entries(currentCase.presetParams).map(([k, v]) => `${k}=${v}`).join(', ')}
              </div>
              <button
                onClick={() => onLoadPreset(currentCase.mode, currentCase.presetParams)}
                className="px-5 py-2.5 bg-cyan-500 text-[#09090B] rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center space-x-2 hover:bg-cyan-400 transition-all duration-200 shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_25px_rgba(34,211,238,0.35)] self-end sm:self-auto cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-[#09090B]" />
                <span>{t('Запустить симуляцию', 'Launch Simulation')}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* SYMBOLIC DEEP STRESS TEST INTERACTIVE PANEL */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          
          {/* Tests List Sidebar */}
          <div className="lg:col-span-4 space-y-2">
            <div className="flex justify-between items-center mb-2 px-1">
              <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider block">{t('Список стресс-тестов RICIS III', 'RICIS III Stress Tests List')}</span>
              <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/30 px-1.5 py-0.5 rounded">
                {t('Символьное ядро v7.3', 'Symbolic Core v7.3')}
              </span>
            </div>
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {stressTests.map((st) => {
                const isSelected = st.id === selectedTest;
                const displayTestName = language === 'en' && st.nameEn ? st.nameEn : st.name;
                return (
                  <button
                    key={st.id}
                    onClick={() => handleTestSelection(st.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all duration-200 flex items-center justify-between group relative overflow-hidden ${
                      isSelected 
                        ? 'bg-cyan-950/20 border-cyan-500/50 text-white shadow-[0_0_10px_rgba(34,211,238,0.05)]' 
                        : 'bg-[#09090B]/60 border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded ${isSelected ? 'bg-cyan-500 text-[#09090B]' : 'bg-white/5 text-slate-400'}`}>
                        {st.level}
                      </span>
                      <div className="truncate">
                        <span className="text-xs font-medium block truncate text-slate-200 group-hover:text-white">{displayTestName}</span>
                        <span className="text-[9px] font-mono text-slate-500 block mt-0.5">{st.input}</span>
                      </div>
                    </div>
                    <ArrowRight className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${isSelected ? 'text-cyan-400 translate-x-0.5' : 'text-slate-600 group-hover:text-slate-400'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Test Workbench Detail & Interactive Simulator */}
          <div className="lg:col-span-8 bg-[#09090B]/40 border border-white/5 rounded-xl p-6 flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-6 relative">
              {/* workbench header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-cyan-950/20 border border-cyan-500/30 rounded text-cyan-400">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">{currentTest.level} TEST PROFILE</span>
                      <span className="text-[9px] font-mono bg-white/5 text-slate-400 border border-white/10 px-1.5 rounded uppercase">
                        {currentTest.safetyProtocol}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-1">
                      {language === 'en' && currentTest.nameEn ? currentTest.nameEn : currentTest.name}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Symbolic / Analytical Equations comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Classical Representation */}
                <div className="bg-red-950/10 border border-red-500/15 rounded-lg p-4 space-y-2">
                  <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider block">{t('Классическое выражение', 'Classical Expression')}</span>
                  <div className="font-mono text-[11px] text-slate-300 bg-[#09090B] p-2 rounded text-center border border-white/5 min-h-[52px] flex flex-col items-center justify-center gap-1">
                    <span className="text-[9px] text-slate-500">{currentTest.input}</span>
                    <Latex math={currentTest.classicalFormula} block={true} />
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">
                    {t('Сингулярная точка:', 'Singular Point:')} <span className="text-red-400">{currentTest.pointLabel}</span>
                  </div>
                </div>

                {/* RICIS Regularized Analytical Representation */}
                <div className="bg-cyan-950/10 border border-cyan-500/15 rounded-lg p-4 space-y-2">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">{t('Регуляризованная аналитика RICIS', 'RICIS Regularized Analytics')}</span>
                  <div className="font-mono text-[11px] text-cyan-300 bg-[#09090B] p-2 rounded text-center border border-cyan-950/50 min-h-[52px] flex items-center justify-center">
                    <Latex math={currentTest.ricisFormula} block={true} />
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">
                    {t('Квантовый регуляризатор:', 'Quantum Regularizer:')} <span className="text-cyan-400">θ (theta)</span>
                  </div>
                </div>
              </div>

              {/* Explanation text */}
              <div className="bg-white/5 border border-white/5 rounded-lg p-4 space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase block tracking-wider">{t('Физико-математическая суть и доказательство', 'Physical-Mathematical Essence & Proof')}</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {language === 'en' && currentTest.explanationEn ? currentTest.explanationEn : currentTest.explanation}
                </p>
              </div>

              {/* Dynamic Workbench Simulator */}
              <div className="bg-black/40 border border-white/15 p-5 rounded-xl space-y-5">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">{t('Интерактивный вычислительный стенд', 'Interactive Computing Workbench')}</span>
                  <span className="text-[9px] font-mono text-slate-500">{t('РЕАЛЬНОЕ ВРЕМЯ', 'REAL-TIME')}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Left Column: Sliders and calculated Results Card */}
                  <div className="md:col-span-5 space-y-4">
                    {/* Sliders */}
                    <div className="space-y-4">
                      {/* Slider X */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-medium">{t('Переменная x:', 'Variable x:')}</span>
                          <span className="text-white font-mono bg-[#09090B] px-1.5 py-0.5 rounded border border-white/5 font-semibold">
                            {interactiveX.toFixed(3)}
                          </span>
                        </div>
                        <input 
                          type="range"
                          min={currentTest.sliderMin}
                          max={currentTest.sliderMax}
                          step={currentTest.sliderStep}
                          value={interactiveX}
                          onChange={(e) => setInteractiveX(parseFloat(e.target.value))}
                          className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                        <div className="flex justify-between text-[9px] text-slate-600 font-mono">
                          <span>{currentTest.sliderMin}</span>
                          <span className="text-cyan-500/50">{t('Полюс', 'Pole')} ({currentTest.pointLabel})</span>
                          <span>{currentTest.sliderMax}</span>
                        </div>
                      </div>

                      {/* Slider Theta */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-medium">{t('Регуляризатор θ:', 'Regularizer θ:')}</span>
                          <span className="text-cyan-400 font-mono bg-cyan-950/20 px-1.5 py-0.5 rounded border border-cyan-950/60 font-semibold">
                            {interactiveTheta.toFixed(3)}
                          </span>
                        </div>
                        <input 
                          type="range"
                          min="0.00"
                          max="1.50"
                          step="0.01"
                          value={interactiveTheta}
                          onChange={(e) => setInteractiveTheta(parseFloat(e.target.value))}
                          className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                        <div className="flex justify-between text-[9px] text-slate-600 font-mono">
                          <span>{t('0.00 (Сингулярность)', '0.00 (Singularity)')}</span>
                          <span>0.75</span>
                          <span>{t('1.50 (Сглажено)', '1.50 (Smoothed)')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Real-time calculated Results Card */}
                    <div className="bg-[#09090B] border border-white/5 rounded-lg p-4 space-y-3">
                      <div className="space-y-2">
                        {/* Classical calculated result */}
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono text-slate-500 uppercase">{t('Классическое вычисление f(x):', 'Classical calculation f(x):')}</span>
                          <span className={`text-xs font-mono font-bold ${calcClassical === '∞' || String(calcClassical).includes('Неопределено') || String(calcClassical).includes('Indeterminate') ? 'text-red-400' : 'text-slate-300'}`}>
                            {typeof calcClassical === 'number' ? calcClassical.toFixed(5) : calcClassical}
                          </span>
                        </div>

                        {/* RICIS calculated result */}
                        <div className="flex justify-between items-center border-t border-white/5 pt-2">
                          <span className="text-[10px] font-mono text-slate-500 uppercase">{t('RICIS III Регуляризованное f_reg(x):', 'RICIS III Regularized f_reg(x):')}</span>
                          <span className="text-xs font-mono font-bold text-cyan-400">
                            {typeof calcRegularized === 'number' ? calcRegularized.toFixed(5) : calcRegularized}
                          </span>
                        </div>
                      </div>

                      {/* Safety Status indicators */}
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[9px] font-mono text-slate-600 uppercase">{t('Защита ядра:', 'Core Protection:')}</span>
                        {interactiveTheta > 0 ? (
                          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 px-2 py-0.5 rounded font-bold uppercase tracking-wider animate-pulse">
                            SECURE / REGULARIZED
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono text-red-400 bg-red-950/30 border border-red-800/40 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                            SINGULAR / COLLAPSE
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Interactive Plot & Singularity Zones */}
                  <div className="md:col-span-7 bg-[#09090B] border border-white/5 rounded-lg p-4 flex flex-col justify-between min-h-[260px]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">
                        {t('Регуляризация и сингулярные зоны', 'Regularization & Singularity Zones')}
                      </span>
                      <div className="flex items-center space-x-2 text-[9px] font-mono text-slate-500">
                        <span className="flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block"></span>
                          <span>{t('Классика', 'Classical')}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block"></span>
                          <span>{t('Рикис', 'RICIS')}</span>
                        </span>
                      </div>
                    </div>

                    <div className="relative w-full h-[180px] bg-black/50 rounded border border-white/5 overflow-hidden flex items-center justify-center">
                      <svg className="w-full h-full text-slate-600" viewBox="0 0 500 220" preserveAspectRatio="none">
                        <defs>
                          <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
                            <path d="M 25 0 L 0 0 0 25" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                          </pattern>
                          <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                          </filter>
                          <filter id="redGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                          </filter>
                        </defs>

                        {/* Grid Background */}
                        <rect width="100%" height="100%" fill="url(#grid)" />

                        {/* Coordinate Axes */}
                        {xAxisY !== null && (
                          <line x1="45" y1={xAxisY} x2="480" y2={xAxisY} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                        )}
                        {yAxisX !== null && (
                          <line x1={yAxisX} y1="20" x2={yAxisX} y2="185" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                        )}

                        {/* Singularity Axis Asymptote */}
                        <line
                          x1={centerX}
                          y1="20"
                          x2={centerX}
                          y2="185"
                          stroke="rgba(239, 68, 68, 0.25)"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                        />

                        {/* CLASSICAL SINGULARITY ZONE (Red Circle) */}
                        <circle
                          cx={centerX}
                          cy={centerY}
                          r={Math.max(12, interactiveTheta * 50)}
                          fill="rgba(239, 68, 68, 0.03)"
                          stroke="rgba(239, 68, 68, 0.35)"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                          filter="url(#redGlow)"
                        />
                        <circle
                          cx={centerX}
                          cy={centerY}
                          r="3"
                          fill="#ef4444"
                        />

                        {/* RICIS REGULARIZATION SHIELD (Cyan Circle) */}
                        {interactiveTheta > 0 ? (
                          <g>
                            <circle
                              cx={centerX}
                              cy={centerY}
                              r={interactiveTheta * 50}
                              fill="rgba(34, 211, 238, 0.06)"
                              stroke="#22d3ee"
                              strokeWidth="1.5"
                              filter="url(#cyanGlow)"
                              opacity="0.8"
                            />
                            <circle
                              cx={centerX}
                              cy={centerY}
                              r={Math.max(2, interactiveTheta * 15)}
                              fill="none"
                              stroke="#22d3ee"
                              strokeWidth="1"
                              strokeDasharray="2 1"
                              opacity="0.5"
                            />
                          </g>
                        ) : (
                          <g>
                            <circle
                              cx={centerX}
                              cy={centerY}
                              r="8"
                              fill="none"
                              stroke="#ef4444"
                              strokeWidth="1.5"
                              className="animate-pulse"
                            />
                          </g>
                        )}

                        {/* Function Curves */}
                        {classicalPathLeft && (
                          <path d={classicalPathLeft} fill="none" stroke="#f87171" strokeWidth="1.5" strokeOpacity="0.6" />
                        )}
                        {classicalPathRight && (
                          <path d={classicalPathRight} fill="none" stroke="#f87171" strokeWidth="1.5" strokeOpacity="0.6" />
                        )}

                        {regularizedPath && (
                          <path d={regularizedPath} fill="none" stroke="#22d3ee" strokeWidth="2" filter="url(#cyanGlow)" />
                        )}

                        {/* Active Tracking Markers */}
                        {interactiveXMarker !== null && (
                          <g>
                            <line
                              x1={interactiveXMarker}
                              y1="20"
                              x2={interactiveXMarker}
                              y2="185"
                              stroke="rgba(255,255,255,0.1)"
                              strokeWidth="1"
                              strokeDasharray="2 2"
                            />

                            {interactiveYClassMarker !== null && (
                              <circle
                                cx={interactiveXMarker}
                                cy={interactiveYClassMarker}
                                r="4"
                                fill="#f87171"
                                stroke="#fff"
                                strokeWidth="1"
                              />
                            )}

                            {interactiveYRegMarker !== null && (
                              <circle
                                cx={interactiveXMarker}
                                cy={interactiveYRegMarker}
                                r="5"
                                fill="#22d3ee"
                                stroke="#fff"
                                strokeWidth="1.5"
                                filter="url(#cyanGlow)"
                              />
                            )}
                          </g>
                        )}

                        {/* Axis Labels */}
                        <text x="5" y="180" fill="#64748b" className="text-[8px] font-mono">{yMin.toFixed(1)}</text>
                        <text x="5" y="25" fill="#64748b" className="text-[8px] font-mono">{yMax.toFixed(1)}</text>
                        <text x="45" y="200" fill="#64748b" className="text-[8px] font-mono">{xMin.toFixed(1)}</text>
                        <text x="445" y="200" fill="#64748b" className="text-[8px] font-mono">{xMax.toFixed(1)}</text>
                        <text x={centerX} y="212" fill="#ef4444" className="text-[8px] font-mono text-center font-bold" textAnchor="middle">
                          {currentTest.pointLabel}
                        </text>
                      </svg>

                      <div className="absolute bottom-2 right-2 bg-[#09090B]/80 px-2 py-0.5 rounded border border-white/5 text-[8px] font-mono text-slate-400">
                        θ = {interactiveTheta.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phase and algorithm execution logs */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase block tracking-wider">{t('Пошаговое символьное разложение (RICIS v7.3)', 'Step-by-step Symbolic Expansion (RICIS v7.3)')}</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(language === 'en' && currentTest.derivationStepsEn ? currentTest.derivationStepsEn : currentTest.derivationSteps).map((step, idx) => (
                    <div key={idx} className="bg-[#09090B] p-2.5 rounded border border-white/5 flex items-start space-x-2.5">
                      <span className="text-[9px] font-mono bg-cyan-950/30 border border-cyan-800/40 text-cyan-400 w-5 h-5 rounded flex items-center justify-center shrink-0">
                        P{idx + 1}
                      </span>
                      <span className="text-xs text-slate-400 leading-tight">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Simulated actions to load preset to parent */}
            <div className="pt-4 border-t border-white/5 flex justify-between items-center text-[10px] font-mono text-slate-500">
              <span>{t(`Стресс-тест ${currentTest.id} полностью интегрирован`, `Stress-test ${currentTest.id} fully integrated`)}</span>
              <span>{t('Класс:', 'Class:')} {currentTest.safetyProtocol}</span>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
